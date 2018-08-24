const express    = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./simpleChain').Blockchain;
const path       = require('path');

const app   = express();
const chain = new Blockchain();

// Configuring the express framework to use the json parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * GET block endpoint
 * Receives height as parameter
 */
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

/**
 * POST block endpoint
 * Receives a block object as parameter inside body
 */
app.post('/block', (req, res) => {
  const { body } = req;
  if (!body) {
    return res.status(400).send({ message: 'block is required' });
  }

  const newBlock = req.body;

  return chain.addBlock(newBlock)             // we store the block
  .then(() => chain.getBlockHeight())
  .then(height => chain.getBlock(height - 1)) // we retrieve the new block
  .then(block => {
    console.log('New block: ', block);
    return res.status(200).send(block);       // we return the new block
  });
});

/**
 * root basepath serves the documentation
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(8000, () => {
  console.log(`server running on port 8000`);
});
