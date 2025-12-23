import { Component, inject, signal } from '@angular/core';
import {merge} from 'rxjs'

import {JsonSeqService} from '../json-seq.service'

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private jseq = inject(JsonSeqService)
  lst = signal<any[]>([])

  ngOnInit(): void {
    merge(this.jseq.stream('/sios.json-seq'),
	  this.jseq.stream('/deims.json-seq')).subscribe({
      next: x => { this.lst.set([...this.lst(), x]) }}) }
}
