import { BlockstoreLevel } from './blockstore-level';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';

import * as cbor from '@ipld/dag-cbor';
import * as block from 'multiformats/block';

import _ from 'lodash';
import searchIndex from 'search-index';

/**
 * A simple implementation of {@link MessageStore} that works in both the browser and server-side.
 * Leverages LevelDB under the hood.
 */
export class MessageStoreLevel {
  // levelDB doesn't natively provide the querying capabilities needed for DWN. To accommodate, we're leveraging
  // a level-backed inverted index

  /**
   * @param {MessageStoreLevelConfig} config
   * @param {string} config.blockstoreLocation - must be a directory path (relative or absolute) where
   *  LevelDB will store its files, or in browsers, the name of the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} to be opened.
   * @param {string} config.indexLocation - same as config.blockstoreLocation
   */
  constructor(config = {}) {
    this.config = {
      blockstoreLocation: 'BLOCKSTORE',
      indexLocation: 'INDEX',
      ...config
    };

    this.db = new BlockstoreLevel(this.config.blockstoreLocation);
  }

  async open() {
    if (!this.db) {
      this.db = new BlockstoreLevel(this.config.blockstoreLocation);
    }

    await this.db.open();

    // TODO: look into using the same level we're using for blockstore
    // TODO: parameterize `name`
    // calling `searchIndex` twice causes the process to hang, so check to see if the index
    // has already been "opened" before opening it again.
    if (!this.index) {
      this.index = await searchIndex({ name: this.config.indexLocation });
    }
  }

  async close() {
    await this.db.close();
  }

  async get(cid, ctx) {
    const bytes = await this.db.get(cid, ctx);

    if (!bytes) {
      return;
    }

    const decodedBlock = await block.decode({ bytes, codec: cbor, hasher: sha256 });
    const messageJson = decodedBlock.value;

    return messageJson;
  }

  async query(query, ctx) {
    const messages = [];

    // parse query into a query that is compatible with the index we're using
    const indexQueryTerms = MessageStoreLevel.buildIndexQueryTerms(query);
    const { RESULT: indexResults } = await this.index.QUERY({ AND: indexQueryTerms });

    for (const result of indexResults) {
      const cid = CID.parse(result._id);
      const message = await this.get(cid, ctx);

      messages.push(message);
    }

    return messages;
  }


  async delete(cid, ctx) {
    await this.db.delete(cid, ctx);
    await this.index.DELETE(cid.toString());

    return;
  }

  async put(message, ctx) {
    const encodedBlock = await block.encode({ value: message, codec: cbor, hasher: sha256 });

    await this.db.put(encodedBlock.cid, encodedBlock.bytes);

    const indexDocument = {
      ...message.descriptor,
      _id: encodedBlock.cid.toString(),
      author: ctx.author,
      tenant: ctx.tenant
    };

    // tokenSplitRegex is used to tokenize values. By default, ':' is not indexed but we need
    // it to be because DIDs include `:`. Override default regex to include ':'.
    await this.index.PUT([indexDocument], { tokenSplitRegex: /[\p{L}\d:]+/gu });
  }

  /**
   * deletes everything in the underlying datastore and indices.
   */
  async clear() {
    await this.db.clear();
    await this.index.FLUSH();
  }

  /**
   * recursively parses a query object into a list of flattened terms that can be used to query the search
   * index
   * @example
   * buildIndexQueryTerms({
   *    ability : {
   *      method : 'CollectionsQuery',
   *      schema : 'https://schema.org/MusicPlaylist'
   *    }
   * })
   * // returns ['ability.method:CollectionsQuery', 'ability.schema:https://schema.org/MusicPlaylist' ]
   * @param query - the query to parse
   * @param terms - internally used to collect terms
   * @param prefix - internally used to pass parent properties into recursive calls
   * @returns the list of terms
   */
  static buildIndexQueryTerms(query, terms = [], prefix = '') {
    for (const property in query) {
      const val = query[property];

      if (_.isPlainObject(val)) {
        MessageStoreLevel.buildIndexQueryTerms(val, terms, `${prefix}${property}.`);
      } else {
        terms.push(`${prefix}${property}:${val}`);
      }
    }

    return terms;
  }
}