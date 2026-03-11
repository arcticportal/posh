import {
  inject, Injectable, signal, WritableSignal } from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router'
import {merge} from 'rxjs'

import {JsonSeqService} from './json-seq.service'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private jseq = inject(JsonSeqService)
  private lst = signal<any[]>([])
  private empty = true
  total = 1691

  constructor() { }

  get(): WritableSignal<any[]> {
    if (this.empty) {
      this.empty = false
      merge(this.jseq.stream('/sios.json-seq'),
	    this.jseq.stream('/deims.json-seq')).subscribe({
	next: x => { this.lst.set([...this.lst(), x]) }}) }
    return this.lst }

  changedQuery(route: ActivatedRoute, k: string, v: string): Params {
    var r: Params = {}, p = route.snapshot.queryParams
    for (var s in p) r[s] = p[s]
    if (!v || k != 'search' && r[k] == v) delete r[k]
    else r[k] = v
    return r }

  formatUrl(s: string | null): string {
    return !s ? '' : s.replace(
      /^https?:\/\/(www\.)?|\/(index\.(html?|php))?$/gi, '') }
}
