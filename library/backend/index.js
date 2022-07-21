const busboy = require('busboy');
const cors = require('cors');
const express = require('express');
const Block = require('multiformats/block');
const dagPb = require('@ipld/dag-pb');
const { sha256 } = require('multiformats/hashes/sha2');
const { base64url } = require('multiformats/bases/base64');

const app = express();
app.use(cors());

app.post('/', (req, res) => {
  const bodyParser = busboy({ headers: req.headers });

  bodyParser.on('field', (name, val, info) => {
    console.log(`Field [${name}]: value: ${val}`);
  });

  bodyParser.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    let fileSize = 0;
    let whateva = '';

    file.on('data', (data) => {
      whateva += data;
      fileSize += data.length;
    }).on('close', async () => {
      console.log(`File [${name}][${filename}] done. Size ${fileSize}`);

      const bytes = base64url.baseDecode(whateva);
      const block = await Block.decode({ bytes: bytes, codec: dagPb, hasher: sha256 });
      console.log(filename, block.cid);
    });
  });

  bodyParser.on('close', () => {
    console.log('Done!');
    return res.sendStatus(200);
  });

  req.pipe(bodyParser);
});

app.listen(3000, () => {
  console.log('server listening on port 3000');
});