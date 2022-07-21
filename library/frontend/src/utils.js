import * as Block from 'multiformats/block';
import { importer } from 'ipfs-unixfs-importer';
import { MemoryBlockstore } from 'blockstore-core';
import * as dagPb from '@ipld/dag-pb';
import { sha256 } from 'multiformats/hashes/sha2';
import { walk } from 'multiformats/traversal';
import { base64url } from 'multiformats/bases/base64';

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

export async function sendRequest(target, theThings = []) {
  const boundary = `${Date.now()}`;

  let data = `--${boundary}\r\n`;
  data += `content-disposition: form-data; name='target'\r\n`;
  data += `\r\n`;
  data += `${target}\r\n`;


  for (let thing of theThings) {
    const { message, data: messageData } = thing;

    data += `--${boundary}\r\n`;
    data += `content-disposition: form-data; name='message'\r\n`;
    data += `\r\n`;
    data += `${JSON.stringify(message)}\r\n`;

    const blockstore = new MemoryBlockstore();

    const chunker = importer([{ content: toBytes(messageData) }], blockstore, { cidVersion: 1 });

    let root;
    for await (root of chunker);

    const load = async (cid) => {
      const bytes = await blockstore.get(cid);

      data += `--${boundary}\r\n`;
      data += `content-disposition: form-data; name='message-data'; filename='${cid}'\r\n`;
      data += `Content-Type: 'application/octet-stream'\r\n`
      data += '\r\n';

      data += `${base64url.baseEncode(bytes)}\r\n`;


      const block = await Block.decode({ bytes, codec: dagPb, hasher: sha256 });
      return block;
    };

    await walk({ cid: root.cid, load });
  }

  data += `--${boundary}--`;

  const xhr = new XMLHttpRequest();

  xhr.addEventListener('load', function (event) {
    console.log('response status', this.status);
  });

  xhr.addEventListener('error', event => {
    console.log('ruh roh. error', event);
  });

  xhr.open('POST', 'http://localhost:3000/')
  xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
  xhr.send(data);
}

export async function sleep(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration);
  })
}