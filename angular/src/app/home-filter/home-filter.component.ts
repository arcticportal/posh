import {
  Component, effect, EventEmitter, inject,
  Output } from '@angular/core';
import {NgClass, NgStyle} from '@angular/common'
import {RouterLink} from '@angular/router'

import {Obj} from '../types'
import {ApiService} from '../api.service'
import {ModelService} from '../model.service'

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

  filters: Obj = {
    catalog: {show: false, label: 'Source Catalog'},
    country: {show: false, label: 'Country'},
    network: {show: false, label: 'Network'}}

  constructor() {
    effect(() => {
      if (!this.api.catalog().length) return
      ;(new (window as any).bootstrap.Collapse(
	document.getElementById('collapsecatalog'),
	{toggle: false})).show() }) }

  filterSignal(k: string) { return (this.api as Obj)[k] }

  count(k: string, v: string) {
    return (this.api as Obj)[k + 'Count'][v] || 0 }

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
