const express        = require('express');
const bodyParser     = require('body-parser');
const bitcoinMessage = require('bitcoinjs-message');
const Blockchain     = require('./simpleChain').Blockchain;
const path           = require('path');

const app   = express();
const chain = new Blockchain();

const memoryValidations = {};
const windowDuration = 300;

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

app.post('/requestValidation', (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).send({ message: 'Invalid request, blockchain address missing' });
  }

  const addressEntry     = memoryValidations[address];
  const requestTimestamp = Math.floor(Date.now() / 1000);

  if (!addressEntry) {
    //memoryValidations[address] = { timestamp: requestTimestamp, message: `${address}:${requestTimestamp}:starRegistry` };
    memoryValidations[address] = { timestamp: requestTimestamp, message: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532330740:starRegistry' };
  }

  const window           = Math.floor(Date.now() / 1000) - memoryValidations[address].timestamp;
  const validationWindow = windowDuration - window;

  if (validationWindow < 0) {
    delete memoryValidations[address];
    return res.status(400).send({ message: 'time window expired' });
  }

  const message = memoryValidations[address].message;

  return res.status(200).send({ message, requestTimestamp, validationWindow });
});

app.post('/message-signature/validate', (req, res) => {
  const { address, signature } = req.body;

  if (!address) {
    return res.status(400).send({ message: 'Invalid request, [address] missing' });
  }

  if (!signature) {
    return res.status(400).send({ message: 'Invalid request, [signature] missing' });
  }

  const validationEntry = memoryValidations[address];
  if (!validationEntry) {
    return res.status(400).send({ message: 'validation data not found! retry with new request, go again to /requestValidation' });
  }

  const requestTimestamp = Math.floor(Date.now() / 1000);

  const window = Math.floor(Date.now() / 1000) - validationEntry.timestamp;
  const validationWindow = windowDuration - window;

  if (validationWindow < 0) {
    delete memoryValidations[address];
    return res.status(400).send({ message: 'validation window expired, go again to /requestValidation' });
  }

  const message = validationEntry.message;

  let registerStar = null;

  try {
    registerStar = bitcoinMessage.verify(message, address, signature);
  } catch(error) {
    console.error(error);
    return res.status(400).send({ error: error.message });
  }

  if (!registerStar) {
    const status = { address, requestTimestamp, message, validationWindow, messageSignature: 'invalid' };
    return res.status(400).send({ registerStar, status });
  }

  const status = { address, requestTimestamp, message, validationWindow, messageSignature: 'valid' };
  return res.status(200).send({ registerStar, status });
});

//
// app.post('/block', (req, res) => {
//   const { body } = req;
//   if (!body) {
//     return res.status(400).send({ message: 'block is required' });
//   }
// });

/**
 * root basepath serves the documentation
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(8000, () => {
  console.log(`server running on port 8000`);
});
