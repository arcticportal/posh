import {
  Component, computed, HostListener, inject,
  signal, Signal } from '@angular/core';
import {ActivatedRoute, Params, RouterLink} from '@angular/router'
import {toSignal} from '@angular/core/rxjs-interop';

import {ApiService} from '../api.service'

function matchSearch(d: Params, s: string): boolean {
  var k, v
  s = s.toLowerCase()
  function f(d: Params): boolean {
    for (k in d) {
      v = d[k]
      if (typeof v == 'number') v = v.toString()
      if (typeof v == 'string') {
        if (v.toLowerCase().search(s) >= 0) return true }
      else if (typeof v == 'object' && f(v)) return true }
    return false }
  return f(d) }

function match(d: Params, k: string, v: any): boolean {
  return k == 'search' ? matchSearch(d, v) :
    typeof d[k] == 'object' ? d[k].includes(v) : d[k] == v }

function filtered(a: any[], p: Params): any[] {
  var k
  return a.filter(d => {
    for (k in p)
      if (k == 'search') { if (!matchSearch(d, p[k])) return false }
      else if (!match(d, k, p[k])) return false
    return true }) }

@Component({
  selector: 'app-home-result',
  imports: [RouterLink],
  templateUrl: './home-result.component.html',
  styleUrl: './home-result.component.css'
})
export class HomeResultComponent {
  private route = inject(ActivatedRoute)
  private api = inject(ApiService)
  private all: Signal<any[]> = signal<any[]>([])
  private params = toSignal(this.route.queryParams) as Signal<Params>
  lst: Signal<any[]> = signal<any[]>([])
  private resizeTimeout: any
  width = window.outerWidth
  formatUrl = this.api.formatUrl

  ngOnInit(): void {
    var sorted: any[] = []
    this.all = computed(() => {
      var a = this.api.get()()
      if (a.length < this.api.total) return a
      if (!sorted.length) sorted = (a as any).toSorted(
	(a: any, b: any) => {
	  var s = a['Site Name'].toLowerCase(),
	      t = b['Site Name'].toLowerCase()
	  return s < t ? -1 : s > t ? 1 : 0 })
      return sorted }) as Signal<any[]>
    ;(window as any)._params = this.params()
    this.lst = computed(() => {
      (window as any)._all = this.all()
      return Object.keys(this.params()).length ?
	filtered(this.all(), this.params()) : this.all() }) }

  count(): string {
    var t = this.all().length
    if (!t) return ''
    var r = [], n = this.lst().length
    if (n != t) r.push(n, 'found in')
    r.push(t, 'total')
    return r.join(' ') }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(
      (() => { this.width = window.outerWidth }).bind(this), 100) }
}
