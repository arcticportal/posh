import { effect, inject, Injectable, signal } from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router'
import {toSignal} from '@angular/core/rxjs-interop'

import {Obj} from './types'
import {ApiService, deepEqual} from './api.service'

export function match(d: Obj, s: string): boolean {
  var r = RegExp(s, 'i')
  function f(d: Obj): boolean {
    var v
    for (var k in d) {
      v = d[k]
      if (typeof v == 'number') v = v.toString()
      if (typeof v == 'string') {
	if (v.search(r) >= 0) return true }
      else if (typeof v == 'object' && f(v)) return true }
    return false }
  return f(d) }

/*export function formatUrl(s: string | null): string {
  return !s ? '' : s.replace(
    /^https?:\/\/(www\.)?|\/(index\.(html?|php))?$/gi, '') }*/

@Injectable({
  providedIn: 'root'
})
export class ModelService {
  private route = inject(ActivatedRoute)
  private api = inject(ApiService)
  lst = signal<any[]>([])
  slice = signal<any[]>([], {equal: deepEqual})
  catalog = signal<string>('')
  country = signal<string>('')
  network = signal<string>('')
  search = signal<string>('')
  mode = signal<'list' | 'map'>('map')
  page = signal<number>(1)
  limit = signal<number>(50)
  feature = signal<any>(null)

  constructor() {
    ;(window as any)._lst = this.lst
    ;(window as any)._feat = this.feature
    effect(() => {
      var lst: any[] = [], k, a
      for (var d of this.api.lst()) {
	k = this.catalog()
	if (k && d['Source Catalog'] != k) continue
	k = this.country(); a = d['Country']
	if (k && !(a && a.includes(k))) continue
	k = this.network(); a = d['Networks']
	if (k && !(a && a.includes(k))) continue
	k = this.search()
	if (k && !match(d, k)) continue
	lst.push(d) }
      this.feature.set({type: 'FeatureCollection', features: lst.filter(
	d => 'Point' in d).map(d => ({
	  type: 'Feature', id: d['POSDT ID'], geometry: d['Point'],
	  properties: {
	    name: d['Site Name'] || d['POSDT ID'],
	    logo: d['Source Catalog Logo URL'],
	    networks: (d['Networks'] || []).join(', '),
	    id: d['POSDT ID']}}))})
      this.lst.set(lst) })
    effect(() => {
      var p = this.page(), l = this.limit()
      this.slice.set(this.lst().slice((p - 1) * l, p * l)) })
    var q = toSignal(this.route.queryParams)
    effect(() => {
      var r = q()
      if (!r) return
      this.catalog.set(r['catalog'] || '')
      this.country.set(r['country'] || '')
      this.network.set(r['network'] || '')
      this.search.set(r['search'] || '')
      this.mode.set(r['mode'] == 'list' ? 'list' : 'map')
      this.page.set(parseInt(r['page']) || 1)
      this.limit.set(parseInt(r['limit']) || 50) }) }

  query(p: Params, k: string, v: string) {
    var r: Params = {}
    for (var s in p) r[s] = p[s]
    if (v) r[k] = v
    else delete r[k]
    return r }

  setMode(v: 'list' | 'map') {
    var r = this.route.snapshot.queryParams
    return v == this.mode() ? r : this.query(
      r, 'mode', v == 'list' ? 'list' : '') }

  setPage(v: number) {
    var r = this.route.snapshot.queryParams
    return v == this.page() ? r : this.query(
      r, 'page', v < 2 ? '' : String(v)) }

  setSearch(v: string | null) {
    return v == this.search() ? this.route.snapshot.queryParams :
      this.query(this.setPage(1), 'search', v || '') }

  setLimit(v: number) {
    return v == this.limit() ? this.route.snapshot.queryParams :
      this.query(this.setPage(1), 'limit', v == 50 ? '' : String(v)) }

  getFilter(k: string) { return (this as Obj)[k]() }

  setFilter(k: string, v: string) {
    return this.query(this.setPage(
      1), k, v == this.getFilter(k) ? '' : v) }

  clearFilters() {
    var r = this.route.snapshot.queryParams, untouched = true
    for (var k of ['catalog', 'country', 'network']) {
      if (!this.getFilter(k)) continue
      if (untouched) { r = this.setPage(1); untouched = false }
      r = this.query(r, k, '') }
    return r }
}
