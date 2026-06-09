import {MapOptions} from 'maplibre-gl'

export type Coords = [number, number]

export type Counter = {[index: string]: number}

export type Geojson = {
  type: 'Point' | 'LineString' | 'Polygon'
  coordinates: Coords | Coords[] | Coords[][]}

export type MapOpts = MapOptions & {projection?: any}

export type Obj = {[index: string]: any}
