import * as Block from 'multiformats/block';
import * as dagPB from '@ipld/dag-pb';
import { importer } from 'ipfs-unixfs-importer';
import { exporter } from 'ipfs-unixfs-exporter';
import { packToBlob } from 'ipfs-car/pack/blob';
import { MemoryBlockStore } from 'ipfs-car/blockstore/memory'; // You can also use the `level-blockstore` module
import { MessageStoreLevel } from '../../common/src/message-store-level';
import { sha256 } from 'multiformats/hashes/sha2';
import { UnixFS } from 'ipfs-unixfs'

export function toBytes(data) {
  const { encode } = new TextEncoder();

  if (data instanceof Uint8Array) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else if (typeof data === 'object') {
    const stringifiedData = JSON.stringify(data);
    return new TextEncoder().encode(stringifiedData);
  } else {
    return encode(data.toString());
  }
}

export async function getDagCid(data) {
  const dataBytes = toBytes(data);
  const chunk = importer([{ content: dataBytes }], undefined, { onlyHash: true, cidVersion: 1 });
  let root;

  for await (root of chunk);

  return root.cid;
}

/**
 * 
 * @param {*} message 
 * @param {*} messageData 
 * @param {MessageStoreLevel} messageStore 
 * @param {*} context 
 */
export async function store(message, messageData, messageStore, context) {
  await messageStore.put(message, { author: context.author, tenant: context.tenant });

  const chunk = importer([{ content: toBytes(messageData) }], messageStore.db, { cidVersion: 1 });
  let root;

  for await (root of chunk);
}

export async function inflateData(cid, messageStore) {
  // const rootBytes = await messageStore.db.get(cid);
  // const rootBlock = await Block.decode({ bytes: rootBytes, codec: dagPB, hasher: sha256 });

  // const fileUnixFs = UnixFS.unmarshal(rootBlock.bytes);
  // const dataBytes = new Uint8Array(fileUnixFs.fileSize());

  const rootUnixFsEntry = await exporter(cid, messageStore.db);

  const size = rootUnixFsEntry.unixfs.fileSize();
  const dataBytes = new Uint8Array(size);
  let offset = 0;

  for await (const buf of rootUnixFsEntry.content()) {
    dataBytes.set(buf, offset)
    offset += buf.length
  }

  return dataBytes;
}

export function bytesToJson(bytes) {
  const str = new TextDecoder().decode(bytes);
  return JSON.parse(str);
}

export async function sendRequest(target, theThings = []) {
  const formData = new FormData();
  formData.append('target', target);

  for (let thing of theThings) {
    const { message, data: messageData } = thing;
    formData.append('message', JSON.stringify(message));

    const tempBlockstore = new MemoryBlockStore();

    const { root, car } = await packToBlob({
      input: [toBytes(messageData)],
      wrapWithDirectory: false,
      rawLeaves: false,
      blockstore: tempBlockstore
    });

    formData.append('message-data', car, root.toString());
  }

  return await fetch('http://localhost:3000/', { method: 'POST', body: formData });
}

export async function sleep(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}