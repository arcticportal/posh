import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbPromise: Promise<IDBDatabase>

  constructor() { this.dbPromise = new Promise((resolve, reject) => {
    var request = indexedDB.open('posdt', 4) // increment w/ data update
    request.onupgradeneeded = () => {
      var db = request.result
      if (!db.objectStoreNames.contains('posdt'))
	db.createObjectStore('posdt', {keyPath: 'id'}) }
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
