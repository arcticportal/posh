import {
  Component, effect, ElementRef, inject, NgZone, signal,
  viewChild } from '@angular/core';
import {Router} from '@angular/router'

import maplibregl from 'maplibre-gl'

import {Obj} from '../types'
import {ModelService} from '../model.service'
import {style} from '../positron'

@Component({
  selector: 'app-home-globe',
  imports: [],
  templateUrl: './home-globe.component.html',
  styleUrl: './home-globe.component.css'
})
export class HomeGlobeComponent {
  private router = inject(Router)
  private ngZone = inject(NgZone)
  private model = inject(ModelService)
  private globe?: maplibregl.Map
  private globeReady = signal(false)
  private popup = new maplibregl.Popup(
    {className: 'globe-popup', closeButton: false, closeOnClick: true })
  private globeContainer = viewChild<ElementRef<HTMLDivElement>>(
    'globeContainer')

  constructor() {
    effect(onCleanup => {
      var e = this.globeContainer()?.nativeElement
      if (!e) return
      onCleanup(() => {
	if (!this.globe) return
	this.globe.remove()
	this.globeReady.set(false)
	this.globe = undefined })
      if (!this.globe) {
	this.globe = new maplibregl.Map({
	  container: e, style, center: [-40, 65], zoom: 1,
	  pitch: 0, fadeDuration: 0})
	this.globe.addControl(new maplibregl.NavigationControl(
	  {showCompass: false})) }
      this.globeReady.set(true) })
    effect(() => {
      if (!this.globeReady() || !this.model.feature()) return
      if (this.globe!.isStyleLoaded()) this.updateGlobe()
      else this.globe!.once('load', () => this.updateGlobe()) }) }

  updateGlobe() {
    var g = this.globe as maplibregl.Map, src = g.getSource(
      'globe') as maplibregl.GeoJSONSource | undefined
    if (src) { src.setData(this.model.feature()); return }
    g.addSource('globe', {
      type: 'geojson', data: this.model.feature(),
      cluster: true, clusterMaxZoom: 5, clusterRadius: 30})
    g.addLayer({
      id: 'clusters', type: 'circle', source: 'globe',
      filter: ['has', 'point_count'], paint: {
	'circle-color': [
	  'interpolate', ['linear'], ['get', 'point_count'],
	  2, 'rgba(127,0,255,0.6)', 20, 'rgba(0,0,255,0.6)',
	  200, 'rgba(0,255,0,0.6)', 1000, 'rgba(255,255,0,0.6)',
	  5000, 'rgba(255,127,0,0.6)', 20000, 'rgba(255,0,0,0.6)'],
	'circle-radius': [
	  'interpolate', ['linear'], ['get', 'point_count'],
	  2, 10, 20, 20, 200, 30, 1000, 40, 5000, 50, 20000, 60]}})
    g.addLayer({
      id: 'cluster-count', type: 'symbol', source: 'globe',
      filter: ['has', 'point_count'], layout: {
	'text-field': '{point_count_abbreviated}',
	'text-font': ['Noto Sans Regular'], 'text-size': 12},
      paint: {
	'text-color': [
	  'step', ['get', 'point_count'],
	  'white', 100, 'black', 5000, 'white'],
	'text-halo-color': 'rgba(0,0,0,0.3)', 'text-halo-width': 1}})
    g.addLayer({
      id: 'points', type: 'circle', source: 'globe',
      filter: ['!', ['has', 'point_count']], paint: {
	'circle-color': 'rgba(127,0,255,0.2)',
	'circle-stroke-color': 'rgba(127,0,255,1)',
	'circle-stroke-width': 1, 'circle-radius': 5}})
    g.on('mouseenter', 'clusters', () => {
      g.getCanvas().style.cursor = 'pointer' })
    g.on('mouseleave', 'clusters', () => {
      g.getCanvas().style.cursor = '' })
    g.on('mouseenter', 'points', () => {
      g.getCanvas().style.cursor = 'pointer'
      /*var feat = (e.features![0] as Obj)
      this.popup.setLngLat(
	feat['geometry'].coordinates.slice()).setHTML(
	 `<strong>${feat['properties'].name}</strong>`).addTo(g)*/
    })
    g.on('mouseleave', 'points', () => {
      g.getCanvas().style.cursor = ''
      //this.popup.remove()
    })
    g.on('click', 'clusters', async e => {
      // Click a cluster to zoom in
      var feat: Obj = g.queryRenderedFeatures(
	e.point, {layers: ['clusters']})[0]
      g.easeTo({
	center: feat['geometry'].coordinates,
	zoom: 1 + await (g.getSource('globe') as Obj)[
	  'getClusterExpansionZoom'](feat['properties'].cluster_id)}) })
    g.on('click', 'points', e => {
      // Ensure features exist
      if (!e.features || !e.features.length) {
	// If popup already open, close it
	if (this.popup.isOpen()) this.popup.remove()
	return }
      this.popup.setLngLat(
	(e.features[0].geometry as Obj)['coordinates'].slice())
      this.popup.setHTML(e.features.map(f => {
	var p = f.properties, l = p['logo'], n = p['networks'],
	    w = l.includes('deims') ? 90 : l.includes('interact') ? 60 :
		l.includes('sios') ? 40 : l.includes('AOV') ? 170 : 100,
	    r = `
	<div>
	  <a href="/sites/${p['id']}"
	     target="_blank"><strong>${p['name']}</strong></a>
	</div>
	<div><img src="${l}" style="width: ${w}px" /></div>`
	if (n) r += `<div><strong>Networks:</strong> ${n}</div>`
	return r }).join('<hr />'))
      if (this.popup.isOpen()) setTimeout(() => { this.popup.addTo(g) })
      else this.popup.addTo(g) }) }
}
