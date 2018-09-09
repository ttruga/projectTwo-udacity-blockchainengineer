const SHA256 = require('crypto-js/sha256')
const level = require('level')

class Block {
  constructor (data) {
    this.hash   = ''
    this.height = 0
    this.body   = data
    this.time   = 0
    this.previousBlockHash = ''
  }
}

class Blockchain {
  constructor () {
    const chainDB = './chaindata'
    this.chain = level(chainDB)
    this.getBlockHeight()
      .then(blockHeight => {
        console.log(`Current chain height: ${blockHeight}`)
        if (blockHeight === 0) {
          return this.addBlock(new Block('First block in the chain - Genesis block'))
        }
      })
  }

  getBlockHeight () {
    return new Promise((resolve, reject) => {
      let blockIndex = 0
      this.chain.createReadStream()
        .on('data', () => {
          blockIndex++
        })
        .on('error', err => {
          console.log(`getBlockHeight error: ${err.message}`)
          reject(err)
        })
        .on('close', () => {
          resolve(blockIndex)
        })
    })
  }

  async addBlock (newBlock) {
    let blockHeight = 0
    try {
      blockHeight = await this.getBlockHeight()
      if (blockHeight === 0) {
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()
        return this.chain.put(blockHeight, JSON.stringify(newBlock))
      }

      const lastBlock            = await this.getBlock(blockHeight - 1)
      newBlock.height            = blockHeight
      newBlock.time              = new Date().getTime().toString().slice(0, -3)
      newBlock.previousBlockHash = lastBlock.hash
      newBlock.hash              = SHA256(JSON.stringify(newBlock)).toString()

      return this.chain.put(newBlock.height, JSON.stringify(newBlock))
    } catch (err) {
      if (err) {
        console.error('Block ' + blockHeight + ' submission failed', err)
        return null
      }
    }
  }

  async getBlock (blockIndex) {
    try {
      const block = await this.chain.get(blockIndex)
      if (block) {
        return JSON.parse(block)
      }
      return null
    } catch (e) {
      console.log(`getBlock err:  ${e.message}`)
      return null
    }
  }

  async getBlocksByAddress (address) {
    const height = await this.getBlockHeight()
    const blocks = []
    for (let i = 0; i < height; i++) {
      try {
        if (i !== 0) {
          let block = await this.getBlock(i)
          console.log(block)
          if (block && block.body && block.body.address === address) {
            block.body.star.decodedStory = block.body.star.story && Buffer.from(block.body.star.story, 'hex').toString()
            blocks.push(block)
          }
        }
      } catch (e) {
        console.log('validateChain error: ', e.message)
      }
    }

    return blocks
  }

  async getBlockByHash (hash) {
    const height = await this.getBlockHeight()
    for (let i = 0; i < height; i++) {
      try {
        if (i !== 0) {
          let block = await this.getBlock(i)
          if (block && block.hash && block.hash === hash) {
            block.body.star.decodedStory = block.body.star.story && Buffer.from(block.body.star.story, 'hex').toString()
            return block
          }
        }
      } catch (e) {
        console.log('validateChain error: ', e.message)
      }
    }

    return null
  }

  async validateBlock (blockHeight) {
    const block = await this.getBlock(blockHeight)
    if (block) {
      let blockHash = block.hash
      block.hash = ''
      let validBlockHash = SHA256(JSON.stringify(block)).toString()

      if (blockHash === validBlockHash) {
        console.log('Block #' + blockHeight + ' is VALID!')
        return true
      } else {
        console.log('Block #' + blockHeight + ' IS INVALID!!! hash:\n' + blockHash + ' <> ' + validBlockHash)
        return false
      }
    }
    return null
  }

  async validateChain () {
    let errorLog = []

    const height = await this.getBlockHeight()

    for (let i = 0; i < height; i++) {
      const blockIsValid = await this.validateBlock(i)

      if (!blockIsValid) {
        errorLog.push(i)
      }

      try {
        if (i !== 0) {
          let block = await this.getBlock(i)
          let previousBlock = await this.getBlock(i - 1)
          if (block.previousBlockHash !== previousBlock.hash) {
            errorLog.push(i)
          }

          if (errorLog.length > 0) {
            console.log('Block errors = ' + errorLog.length)
            console.log('Blocks: ' + errorLog)
          } else {
            console.log('validateChain: No errors detected')
          }
        }
      } catch (e) {
        console.log('validateChain error: ', e.message)
      }
    }
  }
}

module.exports = { Block, Blockchain }
