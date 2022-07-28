const busboy = require('busboy');
const cors = require('cors');
const express = require('express');
const { CarBlockIterator } = require('@ipld/car');

const app = express();
app.use(cors());

app.post('/', (req, res, next) => {
  const context = {};
  const bodyParser = busboy({ headers: req.headers });

  bodyParser.on('field', (name, val, info) => {
    console.log(`Field [${name}]: value: ${val}`);

    if (name === 'target') {
      context.target = val;
      // example short-circuit if target is not a tenant
      if (val !== 'did:janky:bob') {
        req.unpipe(bodyParser);
        next(new Error('kaka'));
      }
    } else if (name === 'message') {
      context.message = JSON.parse(val);
    }
  });

  bodyParser.on('file', async (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(filename, encoding, mimeType);

    // uncomment this if we want to start integrity checking from the root of the DAG
    // for await (const block of unpackStream(file)) {
    //   console.log(block);
    // }

    // blocks come in out of order.
    const itr = await CarBlockIterator.fromIterable(file);
    for await (let block of itr) {
      // console.log(block);
    }
  });

  bodyParser.on('close', () => {
    console.log('Done!');
    return res.sendStatus(200);
  });

  req.pipe(bodyParser);
});

app.use((err, req, res, next) => {
  // this error handler will get triggered when we unpipe from busboy if we short-circuit
  res.status(401);
  // MUST call next with the error otherwise the request will hang-a-lang.
  next(err);
});

app.listen(3000, () => {
  console.log('server listening on port 3000');
});