import { importer } from 'ipfs-unixfs-importer';
import { packToBlob } from 'ipfs-car/pack/blob';
import { MemoryBlockStore } from 'ipfs-car/blockstore/memory'; // You can also use the `level-blockstore` module

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