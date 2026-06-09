#!/usr/bin/python3
# Parse JSON metadata from various sources and write as json-seq.

import datetime
import html
import json
import re
from hashlib import md5
from pathlib import Path
from uuid import UUID


urlPattern = re.compile(
    r'^https?://'                                  # Scheme
    r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+' # Domain name
    r'[a-z]{2,6}'                                  # Top-Level Domain
    r'(?::\d+)?'                                   # Optional port
    r'(?:/?|[/?]\S+)$',                            # Optional path/qs
    re.IGNORECASE)


## Functions ###########################################################
def md5uuid(s):
    'Generate a UUID based on the MD5 hash of a string.'
    return str(UUID(md5(s.encode('utf-8')).hexdigest()))


def numerify(s):
    '''Convert a string to a number if possible, else return the
    original string.'''
    if type(s) is not str: return s
    s = s.strip()
    try: return int(s)
    except ValueError:
        try: return float(s)
        except ValueError: return s


def today():
    'Return the current date in YYYY-MM-DD format.'
    return datetime.date.today().isoformat()


def now():
    'Return the current date and time in ISO 8601 format.'
    s = datetime.datetime.now(datetime.timezone.utc).strftime(
          '%Y-%m-%dT%H:%M:%S%z')
    return s[:-2] + ':' + s[-2:]


def datestamp(s):
    'Convert a date string or year to ISO 8601 format'
    if type(s) is int: s = f'{s}-01-01'
    return s + 'T00:00:00+00:00'


def paragraph(s):
    'Wrap a string in HTML paragraph tags.'
    return f'<p>{html.escape(s)}</p>'


def get(d, *ks, f=None):
    '''Recursively lookup nested dictionary keys, returning [] if any
    key is not found, else the final value, applying a function if
    provided.'''
    for k in ks:
        if not (d and k in d): return []
        d = d[k]
    d = numerify(d)
    return [] if d is None or d == '' else f(d) if f else d


def append(d, k, *vs):
    '''Append distinct values to a list in a dictionary, creating the
    list if needed.'''
    a = d.get(k, [])
    for v in vs:
        v = numerify(v)
        if not (v is None or v == '' or v == [] or v in a): a.append(v)
    if a: d[k] = a


def assign(d, k, v):
    'Set a value in a dictionary if the value is not None.'
    v = numerify(v)
    if v is not None and v != '' and v != []: d[k] = v


def validUrls(*a):
    'Return a list of valid URLs from a list of strings.'
    r = []
    for s in a:
        if type(s) is not str: continue
        if not s.startswith('http'): s = 'https://' + s
        if urlPattern.match(s): r.append(s)
    return r


## Parsers #############################################################
def parse(name, d, r):
    if name == 'aov':      return parseAov(d, r)
    if name == 'deims':    return parseDeims(d, r)
    if name == 'interact': return parseInteract(d, r)
    if name == 'isaaffik': return parseIsaaffik(d, r)
    if name == 'oscar':    return parseOscar(d, r)
    if name == 'sios':     return parseSios(d, r)
    assert False


def parseAov(d, r):
    'Parse AOV JSON data and augment a dictionary.'
    def g(*ks, f=None): return get(d['attributes'], *ks, f=f)
    lat = g('Site_Lat')
    if type(lat) is float and (-50 < lat < 50): return  # skip nonarctic
    id = md5uuid(f'aov{g("OBJECTID")}')
    if id not in r: r[id] = {
        # Harvesting Fields
        'Source Catalog': 'Arctic Observing Viewer (AOV)',
        'Date Metadata Harvested': now(),
        'POSDT ID': id,
        'Source Catalog URL': 'https://arcticobservingviewer.org/',
        'Source Catalog Logo URL':
        'https://images.squarespace-cdn.com/content/v1/5273e59ae4b070db6e37803a/be85cc19-f00b-4a60-835d-12cb146be6f1/AOV_Logo_with_observation_sites.png'}
    r = r[id]
    def s(k, v): assign(r, k, v)
    def a(k, *vs): append(r, k, *vs)
    # General
    s('Site Name', g('Site_Name'))
    #a('Web Links', g('Proj_Page_Link'), g('Proj_Metadata_Link'),
    #  g('Data_Page_Link1'), g('Data_Page_Link2'),
    #  g('Data_Metadata_Link'))
    a('Web Links', *validUrls(
        g('Proj_Page_Link'), g('Proj_Metadata_Link'),
        g('Data_Page_Link1'), g('Data_Page_Link2'),
        g('Data_Metadata_Link')))
    a('Site IDs', g('Site_ID_AOV'),
      g('Site_ID_Alt1'), g('Site_ID_Alt2'))
    s('Metadata Created', g('db_Date_Created', f=datestamp))
    s('Metadata Updated', g('db_Date_Modified', f=datestamp))
    # Contact
    a('Contact Name', g('Proj_Contact_Name'))
    a('Contact Email', g('Proj_Contact_Email'))
    a('Organization', g('Proj_Institution'))
    a('Funding Agency', g('Proj_Funding_Agency'))
    a('Metadata Creator', g('db_Metadata_Wrangler'))
    # Geographic
    a('Country', g('Site_Country'))
    a('Related Locations', g('Site_Place'))
    s('Elevation', g('Site_Elevation'))
    lon = g('Site_Long')
    if type(lon) is float and type(lat) is float:
        s('Coordinates', f'POINT ({lon} {lat})')
    # Observed Properties
    a('Observed Properties', g('Site_GCMD_Science'),
      g('Site_GCMD_Platform'), g('Site_GCMD_Instrument'), g('Site_ECV'))
    # Network/Project/RI Affiliation
    a('Networks', g('Proj_Initiative'))
    a('Projects', g('Proj_Title'))
    a('Project IDs', g('Proj_Award'))
    # Status and History
    s('Start Year', g('Site_Start_Year'))
    # Type, Design and Scale
    a('Site Type', g('Site_Type'))


def parseDeims(d, r):
    'Parse DEIMS JSON data and augment a dictionary.'
    def g(*ks, f=None): return get(d, *ks, f=f)
    lat = float(re.search(
        r'POINT\s*\(\s*[-\d.]+\s+([-\d.]+)\s*\)',
        g('attributes', 'geographic', 'coordinates')).group(1))
    if (-50 < lat < 50): return  # skip nonarctic
    id = g('id', 'suffix')
    if id not in r: r[id] = {
        # Harvesting Fields
        'Source Catalog': 'DEIMS-SDR',
        'Date Metadata Harvested': now(),
        'POSDT ID': id,
        'Source Catalog URL': 'https://deims.org/search/sites',
        'Source Catalog Logo URL':
        'https://deims.org/docs/_images/logo_title_inline_height50.png'}
    r = r[id]
    def s(k, v): assign(r, k, v)
    def a(k, *vs): append(r, k, *vs)
    # General
    s('Site Name', g('attributes', 'general', 'siteName'))
    #a('Web Links', g('id', 'prefix') + id,
    #  *[u['value'] for u in g('attributes', 'contact', 'siteUrl')])
    a('Web Links', *validUrls(g('id', 'prefix') + id, *[
        u['value'] for u in g('attributes', 'contact', 'siteUrl')]))
    a('Site IDs', g('attributes', 'general', 'shortName'),
      g('id', 'prefix') + id,
      *g('attributes', 'general', 'relatedIdentifiers'))
    s('Site Description', g('attributes', 'general', 'abstract'))
    a('Images', *[i['url'] for i in g(
        'attributes', 'general', 'images')])
    s('Metadata Created', g('created'))
    s('Metadata Updated', g('changed'))
    # Contact
    a('Contact Name', *[m['name'] for m in g(
        'attributes', 'contact', 'siteManager')])
    a('Contact Email', *[m['email'] for m in g(
        'attributes', 'contact', 'siteManager')])
    a('Organization', *[m['name'] for m in g(
        'attributes', 'contact', 'operatingOrganisation')])
    a('Funding Agency',
      *g('attributes', 'contact', 'fundingAgency', 'name'))
    a('Metadata Creator', *[p['name'] for p in g(
        'attributes', 'contact', 'metadataProvider')])
    # Geographic
    a('Country', *g('attributes', 'geographic', 'country'))
    a('Related Locations', *[l['title'] for l in g(
        'attributes', 'geographic', 'relatedLocations')])
    s('Elevation', g('attributes', 'geographic', 'elevation', 'avg'))
    s('Coordinates', g('attributes', 'geographic', 'coordinates'))
    # Observed Properties
    a('Observed Properties', *[p['label'] for p in g(
        'attributes', 'focusDesignScale', 'observedProperties')])
    # Network/Project/RI Affiliation
    a('Networks', *[n['network']['name'] for n in g(
        'attributes', 'affiliation', 'networks')])
    a('Projects', *[p['label'] for p in g(
        'attributes', 'affiliation', 'projects')])
    # Status and History
    s('Operating Status', g('attributes', 'general', 'status', 'label'))
    s('Start Year', g('attributes', 'general', 'yearEstablished'))
    # Type, Design and Scale
    a('Site Type', g('attributes', 'general', 'siteType'))


def parseInteract(d, r):
    'Parse INTERACT JSON data and augment a dictionary.'
    def g(*ks, f=None): return get(d['Information'], *ks, f=f)
    lat = g('Latitude')
    if type(lat) is float and (-50 < lat < 50): return  # skip nonarctic
    sid = d['StationId']
    id = md5uuid(f'interact{sid}')
    if id not in r: r[id] = {
        # Harvesting Fields
        'Source Catalog': 'INTERACT',
        'Date Metadata Harvested': now(),
        'POSDT ID': id,
        'Source Catalog URL': 'https://interact-gis.org/Home/Stations',
        'Source Catalog Logo URL':
        'https://eu-interact.org/app/uploads/2024/11/logo_INPA_BLU_transparent.png',
        # Type, Design and Scale
        'Site Type': ['Research Station']}
    r = r[id]
    def s(k, v): assign(r, k, v)
    def a(k, *vs): append(r, k, *vs)
    # General
    s('Site Name', g('StationName'))
    #a('Web Links', g('Website'),
    #  f'https://interact-gis.org/Home/Station/{sid}')
    a('Web Links', *validUrls(
        g('Website'), f'https://interact-gis.org/Home/Station/{sid}'))
    a('Site IDs', g('Acronym'), sid)
    desc = []
    for k in ('LocationInfo', 'HistoryInfo', 'GeneralResearchInfo'):
        v = g(k, f=paragraph)
        if v: desc.append(v)
    s('Site Description', ''.join(desc))
    s('Metadata Updated',
      g('LastUpdated', f=lambda s: s[:-1] + '+00:00'))
    # Contact
    a('Contact Name', g('ContactManager'))
    a('Organization', g('FacilityOwner'), g('ManagingInstitution'))
    # Geographic
    a('Country', g('Country'))  # FIXME: Some are not countries
    a('Related Locations', g('NearestTown'))
    s('Elevation',
      g('FacilityAltitude', f=lambda s: numerify(s[:s.find(' ')])))
    lon = g('Longitude')
    if type(lon) is float and type(lat) is float:
        s('Coordinates', f'POINT ({lon} {lat})')
    # Network/Project/RI Affiliation
    a('Networks', *g('Organizations').split(', '))
    # Status and History
    s('Operating Status', g('FacilityStatus'))
    s('Start Year', g('OpeningYear'))


def parseIsaaffik(d, r): pass


def parseOscar(d, r): pass


def parseSios(d, r):
    'Parse SIOS JSON data and augment a dictionary.'
    def g(*ks, f=None): return get(d, *ks, f=f)
    url = g('OF-SIOS-URL')
    id = md5uuid(url)
    if id not in r: r[id] = {
        # Harvesting Fields
        'Source Catalog': 'SIOS Observation Facility Catalogue',
        'Date Metadata Harvested': now(),
        'POSDT ID': id,
        'Source Catalog URL':
        'https://sios-svalbard.org/sios-ri-catalogue',
        'Source Catalog Logo URL':
        'https://sios-svalbard.org/system/files/common/Logo-SIOS-ORIGINAL-rgb-simple_trimmed_small.png',
        # Geographic
        'Country': ['Norway'],
        # Network/Project/RI Affiliation
        'Networks': ['SIOS']}
    r = r[id]
    def s(k, v): assign(r, k, v)
    def a(k, *vs): append(r, k, *vs)
    # General
    s('Site Name', g('title'))
    #a('Web Links', url, g('OF-Landing-Page'),
    #  *g('Dataset-Landing-Page'))
    a('Web Links', *validUrls(
        url, g('OF-Landing-Page'), *g('Dataset-Landing-Page')))
    a('Site IDs', int(url[url.rfind('/') + 1:]))
    s('Site Description', g('Site-Information'))
    s('Metadata Created',
      g('Release-Date', f=lambda s: s[:-1] + '+00:00'))
    s('Metadata Updated',
      g('Last-Modified', f=lambda s: s[:-1] + '+00:00'))
    # Contact
    a('Contact Name', g('Full-Contact-Name'))
    a('Contact Email', g('email'))
    a('Organization', g('institution'))
    # Geographic
    a('Related Locations', g('Observatory'))
    s('Elevation', g('OF-Height'))
    if 'Coordinates' not in d or d['Coordinates'][:5] != 'POINT':
        s('Coordinates', g('OF-Coordinates'))
    # Observed Properties
    a('Observed Properties', g('Observed-Variable', f=html.unescape))
    # Network/Project/RI Affiliation
    a('Projects', g('Part-of-SIOS-Project'))
    a('Project IDs', *g('Ris-id'))
    # Status and History
    s('Operating Status', g('OF-Status'))
    s('Start Year', g('Start-Date', f=lambda s: int(s[:4])))
    # Type, Design and Scale
    a('Site Type', g('OF-Type'))


## Sequencers ##########################################################
def sequenceMany(name):
    'Parse multiple JSON files in a directory and write as json-seq.'
    r = {}
    for p in Path(f'download/latest/{name}').glob('*.json'):
        with open(p) as f: d = json.load(f)
        parse(name, d, r)
    writeJsonSeq(name, r)


def sequenceOne(name, key=None):
    'Parse a single JSON file and write as json-seq.'
    r = {}
    with open(f'download/latest/{name}.json') as f: a = json.load(f)
    for d in (a[key] if key else a): parse(name, d, r)
    writeJsonSeq(name, r)


def writeJsonSeq(name, r):
    'Write a dictionary of records to a json-seq file.'
    def keyFunc(k):
        d = r[k]
        return f"{d.get('Site Name', '')}ſ{d['POSDT ID']}".lower()
    first, a = True, sorted(r.keys(), key=keyFunc)
    with open(f'sequence/{today()}/{name}.json-seq',
              'w', encoding='utf-8') as f:
        for k in a:
            if first: first = False
            else: f.write('\n\x1e')
            json.dump(r[k], f, indent=1, ensure_ascii=False)
        f.write('\n')


## Run #################################################################
if __name__ == '__main__':
    Path(f'sequence/{today()}').mkdir(parents=True, exist_ok=True)
    sequenceOne('interact');        print('INTERACT done')
    sequenceOne('sios');            print('SIOS done')
    # sequenceMany('isaaffik');       print('ISAFFIK done')
    sequenceMany('deims');          print('DEIMS done')
    sequenceOne('aov', 'features'); print('AOV done')
    # sequenceMany('oscar');          print('OSCAR done')
