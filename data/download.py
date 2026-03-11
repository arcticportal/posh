#!/usr/bin/python3
# Download JSON data from various sources and save it to files.

import json
from datetime import date
from pathlib import Path
from urllib import request


## Functions ###########################################################
def getJson(url):
    'Read JSON data from a URL and return its content.'
    with request.urlopen(url) as f:
        return json.load(f)


def now():
    'Return the current date in YYYY-MM-DD format.'
    return date.today().isoformat()


## Getters #############################################################
def getAov():
    url = 'https://services7.arcgis.com/ajJK0gHOQuH68xkx/ArcGIS/rest/services/AOV/FeatureServer/0/query?where=1%3D1&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&outDistance=&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&returnAggIds=false&outStatistics=&having=&resultOffset={}&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token='
    r, offset = {}, 0
    while True:
        d = getJson(url.format(offset))
        a = d.get('features', [])
        if not a: break
        offset += len(a)
        if r: r['features'].extend(a)
        else: r = d
    with open(f'download/{now()}/aov.json', 'w', encoding='utf-8') as f:
        json.dump(r, f, indent=1, ensure_ascii=False)
        f.write('\n')


def getDeims():
    url = 'https://deims.org/api/sites'
    p = f'download/{now()}/deims'
    request.urlretrieve(url, f'{p}.json')
    # FIXME: if same as previous download, skip
    Path(p).mkdir(parents=True, exist_ok=True)
    with open(f'{p}.json') as f: a = json.load(f)
    for d in a:
        s = d['id']['suffix']
        # FIXME: if same as previous download, skip
        request.urlretrieve(f'{url}/{s}', f'{p}/{s}.json')


def getInteract():
    request.urlretrieve(
        'https://interact-gis.org/api/external/stationinformation?content-type=application/json',
        f'download/{now()}/interact.json')


def getIsaaffik():
    url, r, page = 'https://isaaffik.org', {}, 1
    lst = url + '/api/infrastructures?itemsPerPage=50&page={}'
    p = f'download/{now()}/isaaffik'
    while True:
        d = getJson(lst.format(page))
        a = d.get('member', [])
        if not a: break
        page += 1
        if r: r['member'].extend(a)
        else: r = d
    with open(f'{p}.json', 'w', encoding='utf-8') as f:
        json.dump(r, f, indent=1, ensure_ascii=False)
        f.write('\n')
    # FIXME: if same as previous download, skip
    Path(p).mkdir(parents=True, exist_ok=True)
    with open(f'{p}.json') as f:
        a = json.load(f)['member']
    for d in a:
        # FIXME: if older than last download, use that
        d = getJson(url + d['@id'])
        # print('got ' + url + d['@id'])
        for k in ('organisation', 'country'):
            v = d[k]
            if v:
                d[k] = getJson(url + v)
                # print('got ' + k + ' ' + url + v)
        t = d['types']
        for i in range(len(t)):
            # k = t[i]
            t[i] = getJson(url + t[i])
            # print('got type ' + url + k)
        with open(f'{p}/{Path(d["@id"]).name}.json',
                  'w', encoding='utf-8') as f:
            json.dump(d, f, indent=1, ensure_ascii=False)
            f.write('\n')


def getOscar():
    url = 'https://oscar.wmo.int/surface/rest/api'
    p, a = f'download/{now()}/oscar', []
    for k in ('latitudeMin=50', 'latitudeMax=-50'):
        with request.urlopen(f'{url}/search/station?{k}') as f:
            a.extend(json.load(f)['stationSearchResults'])
    with open(f'{p}.json', 'w', encoding='utf-8') as f:
        json.dump(a, f, indent=1, ensure_ascii=False)
        f.write('\n')
    # FIXME: if same as previous download, skip
    Path(p).mkdir(parents=True, exist_ok=True)
    for d in a:
        # FIXME: if older than last download, use that
        s = d['id']
        request.urlretrieve(
            f'{url}/stations/station/{s}/stationReport',
            f'{p}/{s}.json')


def getSios():
    request.urlretrieve(
        'https://sios-svalbard.org/sios-ri-catalogue/rest/sios-ri-catalogue.json',
        f'download/{now()}/sios.json')


## Run #################################################################
if __name__ == '__main__':
    Path(f'download/{now()}').mkdir(parents=True, exist_ok=True)
    getInteract(); print('INTERACT done')
    getSios();     print('SIOS done')
    getIsaaffik(); print('ISAAFFIK done')
    getDeims();    print('DEIMS done')
    getAov();      print('AOV done')
    # getOscar();    print('OSCAR done')
