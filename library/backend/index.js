const express = require('express');
const app = express();

app.post('/', (req, res) => {
  return res.sendStatus(405);
});