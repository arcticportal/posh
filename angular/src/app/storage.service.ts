import { Injectable, inject } from '@angular/core';
import {HttpClient} from '@angular/common/http'
import {firstValueFrom} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient)
  private dbPromise: Promise<IDBDatabase>

  constructor() { this.dbPromise = this.initDb() }

  private async initDb() {
    var request = indexedDB.open('posdt', (await firstValueFrom(
      this.http.get<{version: number}>('/db_version.json'))).version)
    request.onupgradeneeded = () => {
      var db = request.result
      if (!db.objectStoreNames.contains('posdt'))
	db.createObjectStore('posdt', {keyPath: 'id'}) }
    return new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error) }) }

  async getItem(id: string) {
    var tx = (await this.dbPromise).transaction('posdt', 'readonly')
    return new Promise(resolve => {
      var request = tx.objectStore('posdt').get(id)
      request.onsuccess = () => resolve(request.result?.data) }) }

  async setItem(id: string, data: any) {
    ;(await this.dbPromise).transaction(
      'posdt', 'readwrite').objectStore('posdt').put({id, data}) }
}
