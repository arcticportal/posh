import { Injectable, inject, NgZone } from '@angular/core';
import {Observable, Subscriber} from 'rxjs'

function cleanObjectArrays(x: any): any {
  if (typeof x != 'object' || x == null) return x
  var r: any = {}, v
  for (var k in x) {
    v = x[k]
    if (!Array.isArray(v)) { r[k] = v; continue }
    r[k] = v.filter((e: any) => e != null && e !== '') }
  return r }

@Injectable({
  providedIn: 'root'
})
export class JsonSeqService {
  private ngZone = inject(NgZone)
  private decoder = new TextDecoder()

  constructor() { }

  emit(part: string, observer: Subscriber<any>): void {
    part = part.trim()
    if (!part) return
    try {
      var x = cleanObjectArrays(JSON.parse(part))
      this.ngZone.run(() => { observer.next(x) }) }
    catch (e) { console.warn('Skipping invalid JSON record:', part) } }

  /**
   * Connects to a JSON-seq endpoint and streams parsed objects.
   * @param url      The endpoint URL
   * @param options  Fetch options (headers, method, etc.)
   */
  stream(url: string, options: RequestInit = {}): Observable<any> {
    return new Observable<any>(observer => {
      var controller = new AbortController()
      // Execute fetch logic
      this.ngZone.runOutsideAngular(async () => {
	try {
	  var resp = await fetch(
	    url, {...options, signal: controller.signal})
	  if (!resp.ok) {
	    this.ngZone.run(() => {
	      observer.error(`${resp.status} ${resp.statusText}`) })
	    return }
	  var typ = resp.headers.get('Content-Type'), buffer = ''
	  if (!typ || !typ.startsWith('application/json-seq'))
	    console.warn('Unexpected Content-Type:', typ)
	  if (resp.body) {
	    var reader = resp.body.getReader(), r, parts, part
	    while (true) {
	      r = await reader.read()
	      if (r.done) break
	      // Decode the chunk and append it to the buffer
	      buffer += this.decoder.decode(r.value, {stream: true})
	      // Split the buffer into parts using RS as the delimiter
	      parts = buffer.split('\x1e')
	      // Keep the last part in the buffer (it may be incomplete)
	      buffer = parts.pop() || ''
	      for (part of parts) this.emit(part, observer) }
	    // Process any remaining data in the buffer
	    this.emit(buffer, observer) }
	  this.ngZone.run(() => { observer.complete() }) }
	catch (e) { if ((e as Error).name != 'AbortError')
	  this.ngZone.run(() => { observer.error(e) }) } })
      // Cleanup logic when the consumer unsubscribes
      return () => { controller.abort() } }) }
}
