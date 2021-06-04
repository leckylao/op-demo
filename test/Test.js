const { expect } = require("chai");

const hre = require('hardhat')
const l2ethers = hre.l2ethers

describe("TestArray", function(){
  it('should return array', async function() {
    const Test = await l2ethers.getContractFactory("TestArray");
    let test = await Test.deploy({ gasLimit: 8e6 });
    let tests = await test.get();
    expect(tests).to.deep.equal([1,2,3,4,5]);

    let asset = new Object;
    asset.asset = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    asset.isDeposit = true;

    await test.setAssets(asset, {gasLimit: 8e6});
    let assets = await test.getAssets();
    console.log(assets);
    expect(assets).to.deep.equal([ [ asset.asset, asset.isDeposit ] ]);
  });
})
