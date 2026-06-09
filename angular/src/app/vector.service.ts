import { Injectable } from '@angular/core';

import {Coords, Geojson} from './types'

@Injectable({
  providedIn: 'root'
})
export class VectorService {

  constructor() { }

  wktToGeojson(s: string): Geojson {
    s = s.replace(/^SRID=\d+;/i, '').replace(/\s+/g, ' ').replace(
      / ?([(),]) ?/g, '$1').trim().toUpperCase()
    // Parse WKT
    if (s.startsWith('POINT')) return {
      type: 'Point', coordinates: JSON.parse(s.replace(
	/^.+\((.+) (.+)\)$/, '[$1,$2]')) as Coords}
    if (s.startsWith('LINESTRING')) return {
      type: 'LineString', coordinates: JSON.parse(
	'[' + s.slice(11, -1).replace(
	  /([^ ,]+) ([^ ,]+)/g, '[$1,$2]') + ']') as Coords[]}
    if (!s.startsWith('POLYGON'))
      throw new Error('Unsupported WKT type')
    var r: any[] = s.slice(9, -2).split('),(')
    for (var a, last, i = r.length - 1; i >= 0; --i) {
      a = JSON.parse(
	'[' + r[i].replace(/([^ ,]+) ([^ ,]+)/g, '[$1,$2]') + ']')
      last = a[a.length - 1]
      if (a[0][0] != last[0] || a[0][1] != last[1]) a.push([...a[0]])
      r[i] = a }
    return {type: 'Polygon', coordinates: r as Coords[][]} }

  boundingBox(d: Geojson): [number, number, number, number] {
    var c = (
	  d.type == 'Point' ? [d.coordinates] :
	  d.type == 'LineString' ? d.coordinates :
	  d.type == 'Polygon' ? d.coordinates.flat() : []) as Coords[],
	lngs = c.map(c => c[0]), lats = c.map(c => c[1])
    return [Math.min(...lngs), Math.min(...lats),    // SW
	    Math.max(...lngs), Math.max(...lats)] }  // NE
}
