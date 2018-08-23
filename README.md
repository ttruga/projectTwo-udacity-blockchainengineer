# Blockchain Data explorer

This project implements a blockchain and a block class that allows anybody to store validated data into a transaction database. It also includes an REST API that connects the database with the external world. 

## Quickstart
In order to configure the project, first get all the packages..
```
yarn install 
```
then start the server..
```
node index.js
```
## Usage
The API exposes two endpoints, `GET` a block and `POST` a block. 
```
// Get block 0
curl "http://localhost:8000/block/0"

// POST new block
curl -X "POST" "http://localhost:8000/block" -H 'Content-Type: application/json' -d $'{"body": "Testing block with test string data"}'
```

## Testing blockchain class
To test the code:

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
7: Induce errors by changing block data by first resetting the REPL, executing `node` again and pasting the following code, please first shut down the current `node` session and start a new one so the DB is not caught by the previous process
```
# first reset the node
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
8: Clear the node session, start a new one, then execute steps 3 and 4 and validate blockchain again. The chain should now fail with block 3.
```
chain.validateChain();
```
