import { Component, HostListener, inject } from '@angular/core';
import {RouterLink} from '@angular/router'

import {ModelService} from '../model.service'

@Component({
  selector: 'app-home-result',
  imports: [RouterLink],
  templateUrl: './home-result.component.html',
  styleUrl: './home-result.component.css'
})
export class HomeResultComponent {
  private resizeTimeout: any
  model = inject(ModelService)
  width = window.outerWidth

  numPages() {
    var m = this.model
    return Math.ceil(m.lst().length / m.limit()) }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(
      (() => { this.width = window.outerWidth }).bind(this), 100) }
}
