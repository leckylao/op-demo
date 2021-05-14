const { expect } = require("chai");

const hre = require('hardhat')
const l2ethers = hre.l2ethers

let stupidToken, stupidTest, signer, firstTransfer, secondTransfer;

describe("StupidTest", function(){
    before(async function(){
        signer = (await ethers.getSigners())[0]
        const StupidToken = await l2ethers.getContractFactory("StupidToken")
        stupidToken = await StupidToken.deploy()
        await stupidToken.deployed()
        console.log('token deployed to:', stupidToken.address)
        tx = await stupidToken.initialize("TestToken", "TT")
        console.log("init tx: ", tx.hash)

        const StupidTest = await l2ethers.getContractFactory("StupidTest")
        const stupidTestLogic = await StupidTest.deploy()
        await stupidTestLogic.deployed()
        console.log('stupidTest deployed to:', stupidTestLogic.address)

        // Deploy ProxyAdmin
        const ProxyAdmin = await l2ethers.getContractFactory('ProxyAdmin')
        const proxyAdmin = await ProxyAdmin.deploy()
        tx = await proxyAdmin.deployed()

        console.log('ProxyAdmin deployed to:', proxyAdmin.address)
        console.log("proxyAdmin tx: ", tx.deployTransaction.hash)

        console.log('ProxyAdmin owner:', await proxyAdmin.owner())

        // Deploy Proxy
        const Proxy = await l2ethers.getContractFactory('OZProxy')
        const proxy = await Proxy.deploy(stupidTestLogic.address, proxyAdmin.address, "0x")
        tx = await proxy.deployed()

        console.log('proxy deployed to:', proxy.address)
        console.log("proxy tx: ", tx.deployTransaction.hash)

        stupidTest = await StupidTest.attach(proxy.address)
        tx = await stupidTest.initialize("TestToken", "TT")
        console.log("tx: ", tx.hash)

        await stupidToken.transfer(stupidTest.address, 1e20.toString())
        // await susd.transfer(stupidTest.address, 6e18.toString())

        let balance = await stupidToken.balanceOf(stupidTest.address)
        expect(balance.toString()).to.equal(1e20.toString());

        balance = await stupidToken.balanceOf(signer.address)
        expect(balance.toString()).to.equal("0");
    });

    it('should transfer 60 times successfully', async function() {
        tx = await stupidTest.testPass(stupidToken.address, 1e10.toString())
        console.log("testPass tx: ", tx.hash)

        let balance = await stupidToken.balanceOf(stupidTest.address)
        console.log("testPass contract balance: ", balance.toString())
        firstTransfer = 1e10 * 60;
        expect(balance.toString()).to.equal((1e20 - firstTransfer).toString());

        balance = await stupidToken.balanceOf(signer.address)
        expect(balance.toString()).to.equal(firstTransfer.toString());
    });

    it('should transfer 70 times successfully', async function() {
        tx = await stupidTest.testFail(stupidToken.address, 1e10.toString())
        console.log("testFail tx: ", tx.hash)

        let balance = await stupidToken.balanceOf(stupidTest.address)
        console.log("testFail contract balance: ", balance.toString())
        secondTransfer = 1e10 * 70;
        expect(balance.toString()).to.equal((1e20 - firstTransfer - secondTransfer).toString());

        balance = await stupidToken.balanceOf(signer.address)
        expect(balance.toString()).to.equal((firstTransfer + secondTransfer).toString());
    });
});
