import {
  Component, effect, EventEmitter, inject, Output,
  signal } from '@angular/core';
import {NgClass, NgStyle} from '@angular/common'
import {RouterLink} from '@angular/router'

import {Obj} from '../types'
import {ApiService} from '../api.service'
import {match, ModelService} from '../model.service'

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

  constructor() {
    effect(() => {
      if (!this.api.catalog().length || !this.viewReady()) return
      ;(new (window as any).bootstrap.Collapse(
	document.getElementById('collapsecatalog'),
	{toggle: false})).show() })
    effect(() => {
      var s = this.model.search()
      if (!s) return
      this.searchNarrowed.clear()
      for (var d of this.api.lst()) if (match(d, s))
	this.searchNarrowed.add(d['POSDT ID']) }) }

  ngAfterViewInit() { this.viewReady.set(true) }

  filterSignal(k: string) { return (this.api as Obj)[k] }

  count2(k: string, v: string) {
    return this.api.filters[k][v].size || 0 }

  count(k: string, v: string) {
    var s = this.api.filters[k][v], m = this.model as Obj
    for (var t of ['catalog', 'country', 'network'])
      if (t != k && m[t]())
	s = s.intersection(this.api.filters[t][m[t]()])
    t = this.model.search()
    if (t) s = s.intersection(this.searchNarrowed)
    return s.size }

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
