import { Level } from 'level';

// `level` works in Node.js 12+ and Electron 5+ on Linux, Mac OS, Windows and
// FreeBSD, including any future Node.js and Electron release thanks to Node-API, including ARM
// platforms like Raspberry Pi and Android, as well as in Chrome, Firefox, Edge, Safari, iOS Safari
//  and Chrome for Android.
export class BlockstoreLevel {

  /**
   * @param location - must be a directory path (relative or absolute) where LevelDB will store its
   * files, or in browsers, the name of
   * the {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase}
   * to be opened.
   */
  constructor(location) {
    this.db = new Level(location, { keyEncoding: 'utf8', valueEncoding: 'binary' });
  }

  async open() {
    while (this.db.status === 'opening' || this.db.status === 'closing') {
      await sleep(200);
    }

    if (this.db.status === 'open') {
      return;
    }

    // db.open() is automatically called by the database constructor. We're calling it explicitly
    // in order to explicitly catch an error that would otherwise not surface
    // until another method like db.get() is called. Once open() has then been called,
    // any read & write operations will again be queued internally
    // until opening has finished.
    return this.db.open();
  }

  /**
   * releases all file handles and locks held by the underlying db.
   */
  async close() {
    while (this.db.status === 'opening' || this.db.status === 'closing') {
      await sleep(200);
    }

    if (this.db.status === 'closed') {
      return;
    }

    return this.db.close();
  }

  put(key, val, _ctx) {
    return this.db.put(key.toString(), val);
  }

  async get(key, _ctx) {
    try {
      const val = await this.db.get(key.toString());
      return val;
    } catch (e) {
      // level throws an error if the key is not present. Return undefined in this case
      if (e.code === 'LEVEL_NOT_FOUND') {
        return undefined;
      } else {
        throw e;
      }
    }
  }

  async has(key, _ctx) {
    return !! await this.get(key);
  }

  delete(key, _ctx) {
    return this.db.del(key.toString());
  }

  async * putMany(source, _ctx) {
    for await (const entry of source) {
      await this.put(entry.key, entry.value, _ctx);

      yield entry;
    }
  }

  async * getMany(source, _ctx) {
    for await (const key of source) {
      yield this.get(key);
    }
  }

  async * deleteMany(source, _ctx) {
    for await (const key of source) {
      await this.delete(key, _ctx);

      yield key;
    }
  }

  /**
   * deletes all entries
   */
  clear() {
    return this.db.clear();
  }

  batch() {
    throw new Error('not implemented');
  }

  query(_query, _ctx) {
    throw new Error('not implemented');
  }

  queryKeys(_query, _ctx) {
    throw new Error('not implemented');
  }
}

/**
 * sleeps for the desired duration
 * @param durationMillis the desired amount of sleep time
 * @returns when the provided duration has passed
 */
function sleep(durationMillis) {
  return new Promise(resolve => setTimeout(resolve, durationMillis));
}