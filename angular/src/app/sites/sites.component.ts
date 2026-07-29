import {
  afterNextRender, Component, effect, ElementRef, HostBinding, inject,
  signal, viewChild } from '@angular/core';
import {
  Location, NgOptimizedImage, ViewportScroller} from '@angular/common'
import {ActivatedRoute, RouterLink} from '@angular/router'
import {toSignal} from '@angular/core/rxjs-interop'
import {Title} from '@angular/platform-browser'

import maplibregl from 'maplibre-gl'

import {MapOpts, Obj} from '../types'
import {ApiService} from '../api.service'
import {style} from '../positron'

@Component({
  selector: 'app-sites',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './sites.component.html',
  styleUrl: './sites.component.css'
})
export class SitesComponent {
  @HostBinding('class.container') container = true
  private route = inject(ActivatedRoute)
  private scroller = inject(ViewportScroller)
  private api = inject(ApiService)
  private map?: maplibregl.Map
  private mapReady = signal(false)
  private title = inject(Title)
  location = inject(Location)
  host = window.location.host
  mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer')
  d = signal<Obj>({})

  constructor() {
    var p = toSignal(this.route.params)
    effect(onCleanup => {
      var id = p()?.['posdt_id']
      if (!id) return
      var d = this.api.lst().find(d => d['POSDT ID'] == id)
      if (!d) return
      this.d.set(d)
      this.title.setTitle((d['Site Name'] || d['POSDT ID']) + ' | POSH')
      if (!('Geometry' in d)) return
      var e = this.mapContainer()?.nativeElement
      if (!e) return
      onCleanup(() => {
	if (!this.map) return
	this.map.remove()
	this.mapReady.set(false)
	this.map = undefined })
      var opts = {padding: 50, maxZoom: 1}
      if (this.map) this.map.fitBounds(d['BBox'], opts)
      else this.map = new maplibregl.Map({
	container: e, style, bounds: d['BBox'],
	fitBoundsOptions: opts})
      this.mapReady.set(true) })
    effect(() => {
      if (!this.mapReady()) return
      if (this.map!.isStyleLoaded()) this.updateMap()
      else this.map!.once('load', () => this.updateMap()) })
    afterNextRender(() => { this.scroller.scrollToPosition([0, 0]) }) }

  updateMap() {
    var id = this.d()['POSDT ID'], g = this.d()['Geometry'],
	opts: any = {type: 'Feature', geometry: g}, paint,
	src = this.map?.getSource(
	  id) as maplibregl.GeoJSONSource | undefined
    if (src) src.setData(opts)
    else this.map!.addSource(id, {type: 'geojson', data: opts})
    switch (g.type) {
      case 'Point':
	paint = {
	  'circle-color': 'rgba(127,0,255,0.5)', 'circle-radius': 5,
	  'circle-stroke-color': 'rgba(127,0,255,1)',
	  'circle-stroke-width': 1}
    	break
      case 'LineString':
	paint = {
	  'line-color': 'rgba(127,0,255,0.5)', 'line-width': 5}
    	break
      case 'Polygon':
	paint = {
	  'fill-color': 'rgba(127,0,255,0.5)',
	  'fill-outline-color': 'rgba(127,0,255,1)'}
    	break
      default: new Error('Unsupported geometry type') }
    this.map!.addLayer({
      id, paint, source: id,
      type: g.type == 'Point' ? 'circle' :
	    g.type == 'LineString' ? 'line' : 'fill'}) }

  formatUrl(s: string | null): string {
    return !s ? '' : s.replace(
      /^https?:\/\/(www\.)?|\/(index\.(html?|php))?$/gi, '') }

  catalogStyle() {
    var s = this.d()['Source Catalog Logo URL']
    return !s ? {} : {width: (
      s.includes('deims') ? 100 : s.includes('interact') ? 90 :
      s.includes('sios') ? 60 : s.includes('AOV') ? 220 : 200) + 'px'} }
}
