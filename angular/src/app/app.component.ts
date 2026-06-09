import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import maplibregl from 'maplibre-gl'

import {HeaderComponent} from './header/header.component'
import {FooterComponent} from './footer/footer.component'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'posh';

  constructor() {
    maplibregl.setRTLTextPlugin(
      'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',
      true) }
}
