const { Block, Blockchain } = require('./simpleChain');
const level                 = require('level');
const chainDB               = './chaindata';
const db                    = level(chainDB);

let chain = new Blockchain(db);
// let block = new Block('vhchchhchchch');
// chain.addBlock(block);

//chain.getBlock(2);

//chain.getAllBlocks();


// if (chain.validateBlock(1)) {
//  console.log('Es valido!');
// } else {
//   console.log('NO es valido!');
// }

chain.validateChain();

// return chain.getBlockHeight()
// .then(val => console.log(val));



