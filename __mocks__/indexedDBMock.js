/**
 * Comprehensive IndexedDB mock for testing
 */

class MockIDBIndex {
  constructor(name, keyPath, objectStore) {
    this.name = name;
    this.keyPath = keyPath;
    this.objectStore = objectStore;
  }

  get(key) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        const data = this.objectStore._data || [];
        const result = data.find(item => {
          const value = this.keyPath.split('.').reduce((obj, prop) => obj?.[prop], item);
          return value === key || (typeof value === 'string' && value.toLowerCase() === key.toLowerCase());
        });
        
        request.result = result || null;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  getAll(query, count) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        const data = this.objectStore._data || [];
        let results = data;
        
        if (query !== undefined) {
          results = data.filter(item => {
            const value = this.keyPath.split('.').reduce((obj, prop) => obj?.[prop], item);
            return value === query;
          });
        }
        
        if (count !== undefined) {
          results = results.slice(0, count);
        }
        
        request.result = results;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }
}

class MockIDBObjectStore {
  constructor(name, options = {}) {
    this.name = name;
    this.keyPath = options.keyPath;
    this.autoIncrement = options.autoIncrement || false;
    this._data = [];
    this._indexes = new Map();
  }

  createIndex(name, keyPath, options = {}) {
    const index = new MockIDBIndex(name, keyPath, this);
    this._indexes.set(name, index);
    return index;
  }

  index(name) {
    const index = this._indexes.get(name);
    if (!index) {
      throw new Error(`Index '${name}' does not exist`);
    }
    return index;
  }

  get indexNames() {
    return {
      contains: (name) => this._indexes.has(name)
    };
  }

  add(data) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        this._data.push({ ...data });
        request.result = data[this.keyPath];
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  put(data) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        const existingIndex = this._data.findIndex(item => 
          item[this.keyPath] === data[this.keyPath]
        );
        
        if (existingIndex >= 0) {
          this._data[existingIndex] = { ...data };
        } else {
          this._data.push({ ...data });
        }
        
        request.result = data[this.keyPath];
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  get(key) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        const result = this._data.find(item => item[this.keyPath] === key);
        request.result = result || null;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  getAll() {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        request.result = [...this._data];
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  count() {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        request.result = this._data.length;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  delete(key) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        const index = this._data.findIndex(item => item[this.keyPath] === key);
        if (index >= 0) {
          this._data.splice(index, 1);
        }
        request.result = undefined;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }

  clear() {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        this._data = [];
        request.result = undefined;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }
}

class MockIDBTransaction {
  constructor(storeNames, mode, db) {
    this.objectStoreNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.mode = mode;
    this.db = db;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
  }

  objectStore(name) {
    if (!this.objectStoreNames.includes(name)) {
      throw new Error(`Object store '${name}' not found in transaction`);
    }
    return this.db._stores.get(name);
  }

  abort() {
    setTimeout(() => {
      if (this.onabort) this.onabort();
    }, 0);
  }
}

class MockIDBDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this._stores = new Map();
    this.objectStoreNames = {
      contains: (name) => this._stores.has(name)
    };
  }

  createObjectStore(name, options = {}) {
    const store = new MockIDBObjectStore(name, options);
    this._stores.set(name, store);
    return store;
  }

  deleteObjectStore(name) {
    this._stores.delete(name);
  }

  transaction(storeNames, mode = 'readonly') {
    const transaction = new MockIDBTransaction(storeNames, mode, this);
    
    // Auto-complete transaction after a short delay
    setTimeout(() => {
      if (transaction.oncomplete) transaction.oncomplete();
    }, 10);
    
    return transaction;
  }

  close() {
    // Mock close operation
  }
}

class MockIDBRequest {
  constructor() {
    this.result = null;
    this.error = null;
    this.onsuccess = null;
    this.onerror = null;
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  constructor() {
    super();
    this.onupgradeneeded = null;
    this.onblocked = null;
  }
}

// Mock IndexedDB implementation
const mockIndexedDB = {
  _databases: new Map(),
  
  open(name, version) {
    const request = new MockIDBOpenDBRequest();
    
    setTimeout(() => {
      try {
        const existingDB = this._databases.get(name);
        const oldVersion = existingDB ? existingDB.version : 0;
        
        if (!existingDB || version > oldVersion) {
          // Create new database or upgrade
          const db = new MockIDBDatabase(name, version);
          this._databases.set(name, db);
          
          if (version > oldVersion && request.onupgradeneeded) {
            const event = {
              target: { result: db },
              oldVersion,
              newVersion: version
            };
            request.onupgradeneeded(event);
          }
          
          request.result = db;
          if (request.onsuccess) request.onsuccess({ target: { result: db } });
        } else {
          request.result = existingDB;
          if (request.onsuccess) request.onsuccess({ target: { result: existingDB } });
        }
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  },

  deleteDatabase(name) {
    const request = new MockIDBRequest();
    
    setTimeout(() => {
      try {
        this._databases.delete(name);
        request.result = undefined;
        if (request.onsuccess) request.onsuccess();
      } catch (error) {
        request.error = error;
        if (request.onerror) request.onerror();
      }
    }, 0);
    
    return request;
  }
};

// Setup global mock
global.indexedDB = mockIndexedDB;
global.IDBDatabase = MockIDBDatabase;
global.IDBObjectStore = MockIDBObjectStore;
global.IDBTransaction = MockIDBTransaction;
global.IDBRequest = MockIDBRequest;

module.exports = mockIndexedDB;