const { Block, Blockchain } = require('./simpleChain');
const level                 = require('level');
const chainDB               = './chaindata';
const db                    = level(chainDB);

let chain = new Blockchain(db);
chain.getBlock(0);

let block = new Block('hola');
chain.addBlock(block);

block = new Block('chao');
chain.addBlock(block);

if (chain.validateBlock(1)) {
  console.log('block 1 is valid');
} else {
  console.log('block 1 is not valid');
}

return chain.validateChain();



