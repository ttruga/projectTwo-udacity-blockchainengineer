const express    = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./simpleChain').Blockchain;

const app   = express();
const chain = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/block/:height', (req, res) => {
  const { height } = req.params;
  if (height) {
    return chain.getBlock(height)
    .then(block => {
      if (block) {
        return res.status(200).send(block);
      }
      return res.status(400).send({ message: 'no block available at this height' });
    });
  }
  res.status(400).send({ message: 'no block height available' });
});

app.post('/block', (req, res) => {
  const { body } = req;
  if (!body) {
    return res.status(400).send({ message: 'block is required' });
  }

  const newBlock = req.body;

  return chain.addBlock(newBlock)
  .then(() => chain.getBlockHeight())
  .then(height => chain.getBlock(height - 1))
  .then(block => {
    console.log('New block: ', block);
    return res.status(200).send(block);
  });
});

app.listen(8000, () => {
  console.log(`server running on port 8000`);
});
