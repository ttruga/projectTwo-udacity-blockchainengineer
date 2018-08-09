const { Block, Blockchain } = require('./simpleChain');

let chain = new Blockchain();

return chain.getBlockHeight()
.then(h => {
  console.log(h);
  return chain.getBlock(0);
})
.then(block => {
  console.log(block);
  return chain.addBlock(new Block('Second block on the chain'));
})
.then(d => {
  console.log(d);
  return chain.validateChain();
});


// chain.addBlock(new Block('Second block on the chain')).then(d => console.log(d));
// chain.getBlock(0).then(block => console.log(block))
// chain.getBlockHeight().then(h => console.log(h))
