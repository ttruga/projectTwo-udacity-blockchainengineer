const { Block, Blockchain } = require('./simpleChain');
const level                 = require('level');
const chainDB               = './chaindata';
const db                    = level(chainDB);

let chain = new Blockchain(db);

let promises = [];
promises.push(chain.addBlock(new Block('hola')));
promises.push(chain.addBlock(new Block('chao')));
promises.push(chain.addBlock(new Block('wasaapaaaaaa!')));

return Promise.all(promises).then(() => chain.validateChain());






