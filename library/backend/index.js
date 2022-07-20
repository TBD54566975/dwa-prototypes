const busboy = require('busboy');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());

app.post('/', (req, res) => {
  const bodyParser = busboy({ headers: req.headers });

  bodyParser.on('field', (name, val, info) => {
    console.log(`Field [${name}]: value: ${val}`);
  });

  bodyParser.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(`File [${name}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`);

    file.on('data', (data) => {
      console.log(`File [${name}]: got ${data.length} bytes`);
    }).on('close', () => {
      console.log(`File [${name}] done`);
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