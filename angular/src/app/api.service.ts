import { inject, Injectable, signal } from '@angular/core';
import {
  buffer, from, Observable, Observer, of, Subject, Subscription,
  tap} from 'rxjs'
import {
  bufferCount, concatMap, defaultIfEmpty,
  switchMap} from 'rxjs/operators'

import {Obj} from './types'
import {StorageService} from './storage.service'
import {JsonSeqService} from './json-seq.service'
import {VectorService} from './vector.service'

export function deepEqual(x: any, y: any): boolean {
  if (x === y) return true
  var t = typeof x
  if (t != typeof y || t != 'object') return false
  var a = Object.keys(x)
  if (a.length != Object.keys(y).length) return false
  for (var k of a)
    if (!(k in y && deepEqual(x[k], y[k]))) return false
  return true }

/**
 * Merges multiple sorted observables into a single sorted observable.
 * Assumes source observables are already sorted.
 * Buffers values from fast streams while waiting for slow streams to
 * provide a comparison candidate.
 */
function mergeSorted<T>(
  sources: Observable<T>[], keyFunc: (x: T) => string): Observable<T> {
  return new Observable((observer: Observer<T>) => {
    var subscriptions: Subscription[] = [], n = sources.length,
	// State for each source: a queue of values & a completion flag
	streams = sources.map(() => ({
	  buffer: [] as {k: string; v: T}[], completed: false}))
    function emit() {
      var smallestIndex, canDecide, stream, i, k = ''
      while (true) {
	smallestIndex = -1; canDecide = true
	for (i = 0; i < n; ++i) {
	  stream = streams[i]
	  // If a stream is empty and NOT completed, we cannot safely
	  // pick a winner yet (the next value could be the smallest).
	  if (!stream.buffer.length) {
	    // If it's empty AND completed, we just skip it.
	    if (stream.completed) continue
	    canDecide = false; break }
	  // Compare current buffer head to our current best candidate.
	  if (smallestIndex < 0 || stream.buffer[0].k < k) {
	    smallestIndex = i; k = stream.buffer[0].k } }
	// If can't decide yet or everyone is empty/done, break the loop
	if (!canDecide || smallestIndex < 0) break
	// We have a winner! Emit and remove from its buffer.
	observer.next(streams[smallestIndex].buffer.shift()!.v) }
      // Final completion check
      if (streams.every(s => s.completed && !s.buffer.length))
	observer.complete() }
    sources.forEach((source, index) => {
      subscriptions.push(source.subscribe({
	next: val => {
	  streams[index].buffer.push({k: keyFunc(val), v: val})
	  emit() },
	complete: () => { streams[index].completed = true; emit() },
	error: err => observer.error(err) })) })
    return () => subscriptions.forEach(s => s.unsubscribe()) }) }

function key(x: Obj) {
  return `${x['Site Name'] || ''}ſ${x['POSDT ID']}`.toLowerCase() }

function cmp(a: Obj, b: Obj) {
  var s = a['POSDT ID'], t = b['POSDT ID']
  return s < t ? -1 : s > t ? 1 : 0 }

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private sch = (globalThis as any).scheduler?.yield ? (
    globalThis as any).scheduler : {yield: async () => { }}
  private store = inject(StorageService)
  private jseq = inject(JsonSeqService)
  private vec = inject(VectorService)
  private self: Obj = this
  private stored = false
  lst = signal<Obj[]>([], {equal: deepEqual})
  lstSorted = signal<string[]>([], {equal: deepEqual})
  dict: Obj = {}
  filters: Obj = {catalog: {}, country: {}, network: {}}
  catalog = signal<string[]>([], {equal: deepEqual})
  country = signal<string[]>([], {equal: deepEqual})
  network = signal<string[]>([], {equal: deepEqual})
  done = signal<boolean>(false)

  constructor() {
    from((async () => {
      try {
	var r = await this.store.getItem('lst')
	if (!r) return []
	await this.sch.yield()
	this.stored = true
	return JSON.parse(r as string) as Obj[] }
      catch (_) { return [] } })()
    ).pipe(
      concatMap(a => a), defaultIfEmpty(null),
      switchMap(d => d !== null ? of(d) : mergeSorted([
	this.jseq.stream('/interact.json-seq'),
	this.jseq.stream('/sios.json-seq'),
	this.jseq.stream('/deims.json-seq'),
	this.jseq.stream('/aov.json-seq')], key)),
      bufferCount(1000), concatMap(async b => {
	for (var n = b.length, i = 0; i < n; ++i) {
	  if (!(i % 50)) await this.sch.yield()
	  this.register(b[i]) }
	await this.sch.yield()
	this.lst.update(a => [...a, ...b])
	return true })
    ).subscribe({next: _ => { }, complete: async () => {
      this.lstSorted.set(this.lst().map(d => d['POSDT ID']).sort())
      var a, s
      for (var k of ['catalog', 'country', 'network']) {
	a = Object.keys(this.filters[k]).sort()
	for (s of a) this.filters[k][s] = [...this.filters[k][s]].sort()
	this.self[k].set(a) }
      if (!this.stored) {
	await this.sch.yield()
	this.store.setItem('lst', JSON.stringify(this.lst()))
	this.stored = true }
      this.done.set(true) }}) }

  filterAdd(f: string, k: string, v: string) {
    var d = this.filters[f]
    if (!(k in d)) d[k] = new Set<string>()
    d[k].add(v) }

  register(d: Obj) {
    var s, k = d['POSDT ID']
    this.dict[k] = d
    if ('Source Catalog' in d)
      this.filterAdd('catalog', d['Source Catalog'], k)
    if ('Country' in d) for (s of d['Country'])
      this.filterAdd('country', s, k)
    if ('Networks' in d) for (s of d['Networks'])
      this.filterAdd('network', s, k)
    if (this.stored || !('Coordinates' in d)) return
    d['Geometry'] = this.vec.wktToGeojson(d['Coordinates'])
    var box = d['BBox'] = this.vec.boundingBox(d['Geometry'])
    d['Point'] = d['Geometry'].type == 'Point' ? d['Geometry'] :
      {type: 'Point', coordinates: [
	(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]} }

  /*constructor2() {
    var flushTrigger = new Subject<void>(), count = -1, limit = 1000
    from((async () => {
      try {
	var r = await this.store.getItem('lst')
	if (!r) return []
	await this.sch.yield()
	this.stored = true
	limit = 60000
	return JSON.parse(r as string) as Obj[] }
      catch (_) { return [] } })()
    ).pipe(
      concatMap(a => a), defaultIfEmpty(null),
      switchMap(d => d !== null ? of(d) : mergeSorted([
	this.jseq.stream('/interact.json-seq'),
	this.jseq.stream('/sios.json-seq'),
	this.jseq.stream('/deims.json-seq'),
	this.jseq.stream('/aov.json-seq')], key)),
      tap(() => {
	++count
	if (count < limit) return
	count = 0
	flushTrigger.next() }),
      buffer(flushTrigger),
      concatMap(async b => {
	for (var d, s, box, n = b.length, i = 0; i < n; ++i) {
	  if (!(i % 50)) await this.sch.yield()
	  d = b[i]
	  if ('Source Catalog' in d)
	    inc(this.catalogCount, d['Source Catalog'])
	  if ('Country' in d)
	    for (s of d['Country']) inc(this.countryCount, s)
	  if ('Networks' in d)
	    for (s of d['Networks']) inc(this.networkCount, s)
	  if (this.stored || !('Coordinates' in d)) continue
	  d['Geometry'] = this.vec.wktToGeojson(d['Coordinates'])
	  d['BBox'] = box = this.vec.boundingBox(d['Geometry'])
	  d['Point'] = d['Geometry'].type == 'Point' ? d['Geometry'] :
	    {type: 'Point', coordinates: [
	      (box[0] + box[2]) / 2, (box[1] + box[3]) / 2]} }
	await this.sch.yield()
	this.lst.update(a => [...a, ...b])
	return true })
    ).subscribe({next: _ => { }, complete: async () => {
      for (var k of ['catalog', 'country', 'network'])
	this.self[k].set(Object.keys(this.self[k + 'Count']).sort())
      if (this.stored) return
      await this.sch.yield()
      this.store.setItem('lst', JSON.stringify(this.lst()))
      this.stored = true }}) }

  constructor3() {
    mergeSorted([
      this.jseq.stream('/interact.json-seq'),
      this.jseq.stream('/sios.json-seq'),
      this.jseq.stream('/deims.json-seq'),
      this.jseq.stream('/aov.json-seq')
    ], key).pipe(bufferCount(1000), concatMap(async b => {
      for (var d, s, box, n = b.length, i = 0; i < n; ++i) {
	if (!(i % 50)) await this.sch.yield()
	d = b[i]
	if ('Source Catalog' in d)
	  inc(this.catalogCount, d['Source Catalog'])
	if ('Country' in d)
	  for (s of d['Country']) inc(this.countryCount, s)
	if ('Networks' in d)
	  for (s of d['Networks']) inc(this.networkCount, s)
	if (!('Coordinates' in d)) continue
	d['Geometry'] = this.vec.wktToGeojson(d['Coordinates'])
	d['BBox'] = box = this.vec.boundingBox(d['Geometry'])
	d['Point'] = d['Geometry'].type == 'Point' ? d['Geometry'] :
	  {type: 'Point', coordinates: [
	    (box[0] + box[2]) / 2, (box[1] + box[3]) / 2]} }
      await this.sch.yield()
      this.lst.update(a => [...a, ...b])
      return true })
    ).subscribe({next: _ => { }, complete: () => {
      for (var k of ['catalog', 'country', 'network'])
	this.self[k].set(Object.keys(
	  this.self[k + 'Count']).sort()) }}) }*/
}
