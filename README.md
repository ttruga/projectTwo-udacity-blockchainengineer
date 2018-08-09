# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.
```
npm init
```
- Install crypto-js with --save flag to save dependency to our package.json file
```
npm install crypto-js --save
```
- Install level with --save flag
```
npm install level --save
```

## Testing

To test code:
1: Open a command prompt or shell terminal after install node.js.
2: Enter a node session, also known as REPL (Read-Evaluate-Print-Loop).
```
node
```
3: Copy and paste the code contained inside `simpleChain.js` file into your node session
4: Instantiate blockchain with chain variable
```
let chain = new Blockchain();
```
5: Generate 10 blocks using a for loop
```
(function theLoop (i) {
  setTimeout(function () {
    chain.addBlock(new Block(`test block n: ${i}`))
    if (--i) theLoop(i);
  }, 100);
})(10);
```
6: Validate blockchain
```
chain.validateChain();
```
7: Induce errors by changing block data by first resetting the REPL, executing `node` again and pasting the following code
```
# first reset the 
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

db.get(3).then(block => {
  console.log(block);
  const modBlock =  JSON.parse(block);
  modBlock.body = 'this is a screw up body';
  return Promise.all([modBlock, db.del(3)]);
}).then(promises => {
  return db.put(3, JSON.stringify(promises[0]))
});
```
8: Validate blockchain. The chain should now fail with block 3.
```
chain.validateChain();
```
