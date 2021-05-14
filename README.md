## Background

This demo is to showcase two issues on Kovan OVM.
1. The current block limit on Kovan OVM is 9m. The `testPass` transaction would work with 60 times transfer for 7.1m gas. But the `testFail` transaction would fail with 70 times transfer for 7.8m gas, which still under 9m that should pass.
2. Moreover the average tx gas cost is more than 5m which would make one block can only include 1 - 2 tx and becomes non useable.

## Set up

- `npm install`

- `npx hardhat compile`

- `cp .env.example .env` - put the private key in .env in order to run the test

## Unit test

`npx hardhat test test/StupidTest.js --network hardhat`

    ✓ should transfer 60 times successfully (15985ms)
    ✓ should transfer 70 times successfully (30271ms)

·------------------------|---------------------------|-------------|----------------------------·
|  Solc version: 0.6.12  ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 9500000 gas  │
·························|···························|·············|·····························
|  Methods                                                                                      │
··············|··········|·············|·············|·············|·············|···············
|  Contract   ·  Method  ·  Min        ·  Max        ·  Avg        ·  # calls    ·  usd (avg)   │
·-------------|----------|-------------|-------------|-------------|-------------|--------------·

  2 passing (1m)

## Integration test

You could look at the explorer and see the `testFail` got reverted with 7.8m gas.
https://kovan-l2-explorer.surge.sh/tx/0xbdc3f63674e704c20a03fddfe3b78dd7112a75880f6f8a1f91f573e9374c51c4

`npx hardhat test test/StupidTest.js`

testPass tx:  0xd9890d4d5a2a329ff3ff394cb2a5b54cb0d6eb3d80bf327286ff729805a03ec1
    ✓ should transfer 60 times successfully (7342ms, 8650761 gas)
testFail tx:  0xbdc3f63674e704c20a03fddfe3b78dd7112a75880f6f8a1f91f573e9374c51c4

    1) should transfer 70 times successfully

·---------------------------|---------------------------|-------------|----------------------------·
|   Solc version: 0.6.12    ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 6718946 gas  │
····························|···························|·············|·····························
|  Methods                                                                                         │
···············|············|·············|·············|·············|·············|···············
|  Contract    ·  Method    ·  Min        ·  Max        ·  Avg        ·  # calls    ·  usd (avg)   │
···············|············|·············|·············|·············|·············|···············
|  StupidTest  ·  testPass  ·          -  ·          -  ·    7146058  ·          1  ·           -  │
·--------------|------------|-------------|-------------|-------------|-------------|--------------·

  1 passing (1m)
  1 failing

  1) StupidTest
       should transfer 70 times successfully:

      AssertionError: expected '99999999400000000000' to equal '99999998700000000000'
      + expected - actual

      -99999999400000000000
      +99999998700000000000

      at Context.<anonymous> (test/StupidTest.js:75:39)
      at processTicksAndRejections (internal/process/task_queues.js:93:5)
