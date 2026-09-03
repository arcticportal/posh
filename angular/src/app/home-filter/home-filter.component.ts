import {
  Component, effect, EventEmitter, inject, Output,
  signal } from '@angular/core';
import {NgClass, NgStyle} from '@angular/common'
import {RouterLink} from '@angular/router'

import {Obj} from '../types'
import {ApiService} from '../api.service'
import {match, ModelService} from '../model.service'

function sortedIntersect(a: string[], b: string[]): string[] {
  var r = [], n = a.length, m = b.length, i = 0, j = 0
  while (i < n && j < m)
    if (a[i] < b[j]) ++i
    else if (a[i] > b[j]) ++j
    else { r.push(a[i]); ++i; ++j }
  return r }

@Component({
  selector: 'app-home-filter',
  imports: [NgClass, NgStyle, RouterLink],
  templateUrl: './home-filter.component.html',
  styleUrl: './home-filter.component.css'
})
export class HomeFilterComponent {
  @Output() mobileExpandedChange = new EventEmitter<boolean>()
  private api = inject(ApiService)
  model = inject(ModelService)
  show = false
  window = window
  viewReady = signal<boolean>(false)

  filters: Obj = {
    catalog: {show: false, label: 'Source Catalog'},
    country: {show: false, label: 'Country'},
    network: {show: false, label: 'Network'}}

  private searchNarrowed = new Set<string>()
  private searchMatched = signal<string[]>([])

  constructor() {
    effect(() => {
      if (!this.api.catalog().length || !this.viewReady()) return
      ;(new (window as any).bootstrap.Collapse(
	document.getElementById('collapsecatalog'),
	{toggle: false})).show() })
    effect(() => {
      var s = this.model.search()
      this.searchMatched.set(s ? this.api.lstSorted().filter(
	k => match(this.api.dict[k], s)) : [])
	/*this.searchNarrowed.clear()
      for (var d of this.api.lst()) if (match(d, s))
	this.searchNarrowed.add(d['POSDT ID'])*/ }) }

  ngAfterViewInit() {
    this.viewReady.set(true)
    new (window as any).bootstrap.Popover(document.querySelector(
	'app-home-filter [data-bs-toggle="popover"]')) }

  filterSignal(k: string) { return (this.api as Obj)[k] }

  count2(k: string, v: string) {
    return this.api.filters[k][v].size || 0 }

  count3(k: string, v: string) {
    var s = this.api.filters[k][v], m = this.model as Obj
    for (var t of ['catalog', 'country', 'network'])
      if (t != k && m[t]())
	s = s.intersection(this.api.filters[t][m[t]()])
    t = this.model.search()
    if (t) s = s.intersection(this.searchNarrowed)
    return s.size }

  count(k: string, v: string) {
    var a = this.api.filters[k][v], m = this.model as Obj
    for (var t of ['catalog', 'country', 'network'])
      if (t != k && m[t]())
	a = sortedIntersect(a, this.api.filters[t][m[t]()])
    if (this.searchMatched().length)
      a = sortedIntersect(a, this.searchMatched())
    return a.length }

  /*caret(k: string) {
    return 'bi-caret-' +
      (this.filters[k].show ? 'down' : 'right') + '-fill' }*/

  toggleMobile() {
    this.show = !this.show
    this.mobileExpandedChange.emit(this.show) }

  stylGroup(k: string) {
    return !this.model.getFilter(k) ? {} : {
      'font-weight': 'var(--posdt-bold)'} }

  stylRadio(k: string, v: string) {
    return 'bi-record' + (this.model.getFilter(k) == v ? '2' : '') }
}
