const express        = require('express')
const bodyParser     = require('body-parser')
const bitcoinMessage = require('bitcoinjs-message')
const Blockchain     = require('./simpleChain').Blockchain
const path           = require('path')

const app   = express()
const chain = new Blockchain()

const memoryValidations = {}
const windowDuration    = 300

// Configuring the express framework to use the json parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

/**
 * GET block endpoint
 * Receives height as parameter
 */
app.get('/block/:height', (req, res) => {
  const { height } = req.params
  if (height) {
    return chain.getBlock(height)
      .then(block => {
        if (block) {
          return res.status(200).send(block)
        }
        return res.status(400).send({ message: 'no block available at this height' })
      })
  }
  res.status(400).send({ message: 'no block height available' })
})

/**
 * POST block endpoint
 * Receives a block object as parameter inside body
 */
app.post('/block', (req, res) => {
  const { body } = req
  if (!body) {
    return res.status(400).send({ message: 'block is required' })
  }

  const { address, star } = req.body

  if (!address) {
    return res.status(400).send({ message: 'Invalid request, [address] missing' })
  }

  if (!star) {
    return res.status(400).send({ message: 'Invalid request, [star] missing' })
  }

  const validationEntry = memoryValidations[address]

  if (!validationEntry) {
    return res.status(400).send({ message: 'address needs to get authorization first, go to /requestAuthorization' })
  }

  if (!validationEntry.registerStar) {
    return res.status(400).send({ message: 'star registration not valid for this address' })
  }

  const story = Buffer.from(star.story, 'ascii')

  if (story.byteLength > 500 || story.toString().split(' ').length > 250) {
    return res.status(400).send({ message: 'Invalid request, [star.story] larger than 500 bytes or has more than 250 words' })
  }

  star.story = story.toString('hex')

  const newBlock = { body: { address, star } }

  return chain.addBlock(newBlock) // we store the block
    .then(() => chain.getBlockHeight())
    .then(height => chain.getBlock(height - 1)) // we retrieve the new block
    .then(block => {
      console.log('New block: ', block)
      delete memoryValidations[address]
      return res.status(200).send(block) // we return the new block
    })
})

/**
 * POST requestValidation endpoint
 * Receives an address that needs to be auth in order to register a star later
 */
app.post('/requestValidation', (req, res) => {
  const { address } = req.body

  if (!address) {
    return res.status(400).send({ message: 'Invalid request, blockchain address missing' })
  }

  const addressEntry = memoryValidations[address]
  const requestTimestamp = Math.floor(Date.now() / 1000)

  if (!addressEntry) {
    memoryValidations[address] = { timestamp: requestTimestamp, message: `${address}:${requestTimestamp}:starRegistry` }
    // memoryValidations[address] = {
    //   timestamp: requestTimestamp,
    //   message: '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532330740:starRegistry'
    // }
  }

  const window = Math.floor(Date.now() / 1000) - memoryValidations[address].timestamp
  const validationWindow = windowDuration - window

  if (validationWindow < 0) {
    delete memoryValidations[address]
    return res.status(400).send({ message: 'time window expired' })
  }

  const message = memoryValidations[address].message

  return res.status(200).send({ message, requestTimestamp, validationWindow })
})

/**
 * POST message-signature/validate endpoint
 * Receives an address and a signature text in order to validate the user ownership of the address
 */
app.post('/message-signature/validate', (req, res) => {
  const { address, signature } = req.body

  if (!address) {
    return res.status(400).send({ message: 'Invalid request, [address] missing' })
  }

  if (!signature) {
    return res.status(400).send({ message: 'Invalid request, [signature] missing' })
  }

  const validationEntry = memoryValidations[address]
  if (!validationEntry) {
    return res.status(400).send({ message: 'validation data not found! retry with new request, go again to /requestValidation' })
  }

  const requestTimestamp = Math.floor(Date.now() / 1000)

  const window = Math.floor(Date.now() / 1000) - validationEntry.timestamp
  const validationWindow = windowDuration - window

  if (validationWindow < 0) {
    delete memoryValidations[address]
    return res.status(400).send({ message: 'validation window expired, go again to /requestValidation' })
  }

  const message = validationEntry.message

  let registerStar = null

  try {
    registerStar = bitcoinMessage.verify(message, address, signature)
  } catch (error) {
    console.error(error)
    return res.status(400).send({ error: error.message })
  }

  if (!registerStar) {
    const status = { address, requestTimestamp, message, validationWindow, messageSignature: 'invalid' }
    return res.status(400).send({ registerStar, status })
  }

  memoryValidations[address].registerStar = registerStar

  const status = {
    address,
    requestTimestamp,
    message,
    validationWindow,
    messageSignature: 'valid'
  }
  return res.status(200).send({ registerStar, status })
})

/**
 * GET /stars/address:address endpoint
 * Receives an address and returns all registered stars associated to this address
 */
app.get('/stars/address:address', (req, res) => {
  const { address } = req.params
  console.log(address)

  if (address[0] !== ':') {
    return res.status(400).send({ error: `address with wrong format: [${address}]` })
  }

  return chain.getBlocksByAddress(address.substring(1))
    .then(blocks => {
      if (blocks) {
        return res.status(200).send(blocks)
      }
      return res.status(400).send({ message: 'no registered stars found for this address' })
    })
})

/**
 * GET /stars/hash:hash endpoint
 * Receives a hash and returns the star associated with the hash
 */
app.get('/stars/hash:hash', (req, res) => {
  const { hash } = req.params
  console.log(hash)

  if (hash[0] !== ':') {
    return res.status(400).send({ error: `hash with wrong format: [${hash}]` })
  }

  return chain.getBlockByHash(hash.substring(1))
    .then(block => {
      if (block) {
        return res.status(200).send(block)
      }
      return res.status(400).send({ message: 'no registered stars found for this hash' })
    })
})

/**
 * root basepath serves the documentation
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/index.html`))
})

app.listen(8000, () => {
  console.log(`server running on port 8000`)
})
