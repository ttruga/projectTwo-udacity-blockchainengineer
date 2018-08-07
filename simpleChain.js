/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/
class Block {
  constructor(data) {
    this.hash              = '';
    this.height            = 0;
    this.body              = data;
    this.time              = 0;
    this.previousBlockHash = '';
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain {
  constructor(db) {
    this.chain     = db;
    let blockIndex = 0;

    this.chain.createReadStream()
    .on('data', function(data) {
      blockIndex++;
    })
    .on('error', err => {
      return console.log('Unable to read data stream!', err)
    })
    .on('close', () => {
      if (blockIndex === 0) {
        this.addBlock(new Block('First block in the chain - Genesis block'));
      }
    });
  }

  // Add new block
  addBlock(newBlock) {
    let blockIndex = 0;
    let lastBlock  = null;

    this.chain.createReadStream()
    .on('data', (data) => {
      blockIndex++;
      lastBlock = data;
    })
    .on('error', err => {
      return console.log('Unable to read data stream!', err)
    })
    .on('close', () => {
      // console.log('Last Block height: ' + blockIndex);
      if (blockIndex === 0) {
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        this.chain.put(blockIndex, JSON.stringify(newBlock), function(err) {
          if (err) return console.log('Block ' + blockIndex + ' submission failed', err);
        });
        return;
      }

      // console.log('Last Block data: ' + JSON.stringify(lastBlock));
      newBlock.height = blockIndex;
      newBlock.time   = new Date().getTime().toString().slice(0, -3);

      if (blockIndex > 0) {
        newBlock.previousBlockHash = JSON.parse(lastBlock.value).hash;
      }

      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

      return this.chain.put(newBlock.height, JSON.stringify(newBlock))
      .catch(err => {
        if (err) return console.log('Block ' + newBlock.height + ' submission failed', err);
      });
    });
  }

  // get block
  async getBlock(blockHeight) {
    // return object as a single string
    try {
      const block = await this.chain.get(blockHeight);
      if (block) {
        return JSON.parse(block);
      }
      return null;
    } catch(e) {
      console.log('blockHeight ' + blockHeight + ' not found!', e.message);
      return null;
    }
  }

  getBlockHeight() {
    return new Promise((resolve, reject) => {
      this.chain.createReadStream({ reverse: true, limit: 1 })
      .on('data', data => {
        return resolve(data.key);
      })
      .on('error', err => {
        console.log('Unable to read data stream!', err);
        return reject(err);
      })
      .on('close', () => {});
    });
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    const block = await this.getBlock(blockHeight);
    if (block) {
      // get block hash
      let blockHash = block.hash;

      // remove block hash to test block integrity
      block.hash = '';

      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();

      // Compare
      if (blockHash === validBlockHash) {
        console.log('Block #' + blockHeight + ' is VALID!');
        return true;
      } else {
        console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
        return false;
      }
    }
    return null;
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [];

    const height = await this.getBlockHeight();

    for (let i = 0; i < height - 1; i++) {
      // validate block
      const blockIsValid = await this.validateBlock(i);

      if (!blockIsValid) {
        errorLog.push(i);
      }
      // compare blocks hash link
      try {
        let blockHash    = await this.getBlock(i).hash;
        let previousHash = await this.getBlock(i + 1).previousBlockHash;
        if (blockHash !== previousHash) {
          errorLog.push(i);
        }

        if (errorLog.length > 0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: ' + errorLog);
        } else {
          console.log('validateChain: No errors detected');
        }
      } catch(e) {
        console.log('validateChain error: ', e.message);
      }
    }
  }
}

module.exports = { Block, Blockchain };
