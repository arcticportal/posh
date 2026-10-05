import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {filter} from 'rxjs/operators'

import maplibregl from 'maplibre-gl'

import {HeaderComponent} from './header/header.component'
import {FooterComponent} from './footer/footer.component'

declare let gtag: Function

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'posh';
  private router = inject(Router)

  constructor() {
    maplibregl.setRTLTextPlugin(
      'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',
      true) }

  ngOnInit() {
    this.router.events.pipe(filter(e =>
      e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
	gtag('config', 'G-60YK6GPRQJ', {
	  page_path: e.urlAfterRedirects }) }) }
}
