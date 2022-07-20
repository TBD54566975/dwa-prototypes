import { importer } from 'ipfs-unixfs-importer';

export function toBytes(data) {
  const { encode } = new TextEncoder();

  if (data instanceof Uint8Array) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else if (typeof data === 'object') {
    const stringifiedData = JSON.stringify(data);
    console.log(stringifiedData);
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