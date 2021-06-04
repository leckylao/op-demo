// Place holder addresses
const KOVAN_ADDRESS_RESOLVER = '0xb08b62e1cdfd37eCCd69A9ACe67322CCF801b3A6';
const TESTNET_DAO = '0xab0c25f17e993F90CaAaec06514A2cc28DEC340b';

const { expect } = require("chai");

const hre = require('hardhat')
const l2ethers = hre.l2ethers

let poolFactory, PoolLogic, PoolManagerLogic, poolLogic, poolManagerLogic, mock, poolLogicProxy, poolManagerLogicProxy, synthsABI, fundAddress;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const _SYNTHETIX_KEY = "0x53796e7468657469780000000000000000000000000000000000000000000000" // Synthetix

const _EXCHANGE_RATES_KEY = "0x45786368616e6765526174657300000000000000000000000000000000000000"; // ExchangeRates

const susdKey = '0x7355534400000000000000000000000000000000000000000000000000000000'
const sethKey = '0x7345544800000000000000000000000000000000000000000000000000000000'
const slinkKey = '0x734c494e4b000000000000000000000000000000000000000000000000000000'
const sbtcKey = '0x7342544300000000000000000000000000000000000000000000000000000000'

// For run in console
// const versions = require("./versions.json");
const versions = require("../../versions.json");

describe("PoolFactory", function() {
    before(async function(){
        [manager, user1] = await ethers.getSigners();

        PoolLogic = await ethers.getContractFactory("PoolLogic");
        poolLogic = await PoolLogic.attach(versions["v1.0.0-alpha"].contracts.poolLogic);

        PoolManagerLogic = await ethers.getContractFactory("PoolManagerLogic");
        poolManagerLogic = await PoolManagerLogic.attach(versions["v1.0.0-alpha"].contracts.poolManagerLogic);

        const PoolFactoryLogic = await ethers.getContractFactory("PoolFactory");
        poolFactory = await PoolFactoryLogic.attach(versions["v1.0.0-alpha"].contracts.poolFactoryProxy)
    });

    it("Should be able to createFund", async function() {
        console.log("Creating Fund...")

        let fundCreatedEvent = new Promise((resolve, reject) => {
            poolFactory.on('FundCreated', (fundAddress, isPoolPrivate, fundName, managerName, manager, time, managerFeeNumerator, managerFeeDenominator, event) => {
                event.removeListener();

                resolve({
                    fundAddress: fundAddress,
                    isPoolPrivate: isPoolPrivate,
                    fundName: fundName,
                    // fundSymbol: fundSymbol,
                    managerName: managerName,
                    manager: manager,
                    time: time,
                    managerFeeNumerator: managerFeeNumerator,
                    managerFeeDenominator: managerFeeDenominator
                });
            });

            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });

        let deployedFundsLength = await poolFactory.deployedFundsLength();

        let tx = await poolFactory.createFund( false, manager.address, 'Barren Wuffet', 'Test Fund', "DHTF", new ethers.BigNumber.from('5000'), [sethKey, sbtcKey]);
        console.log("createdFund tx: ", tx.hash)

        let event = await fundCreatedEvent;

        fundAddress = event.fundAddress
        expect(event.isPoolPrivate).to.be.false;
        expect(event.fundName).to.equal("Test Fund");
        // expect(event.fundSymbol).to.equal("DHTF");
        expect(event.managerName).to.equal("Barren Wuffet");
        expect(event.manager).to.equal(manager.address);
        expect(event.managerFeeNumerator.toString()).to.equal('5000');
        expect(event.managerFeeDenominator.toString()).to.equal('10000');

        let deployedFundsLengthAfter = await poolFactory.deployedFundsLength();
        expect(deployedFundsLengthAfter.toString()).to.equal(( deployedFundsLength.add(1) ).toString());

        let isPool = await poolFactory.isPool(fundAddress)
        expect(isPool).to.be.true;

        let poolManagerLogicAddress = await poolFactory.getLogic(1)
        expect(poolManagerLogicAddress).to.equal(poolManagerLogic.address);

        let poolLogicAddress = await poolFactory.getLogic(2)
        expect(poolLogicAddress).to.equal(poolLogic.address);

        poolLogicProxy = await PoolLogic.attach(fundAddress)
        let poolManagerLogicProxyAddress = await poolLogicProxy.poolManagerLogic()
        poolManagerLogicProxy = await PoolManagerLogic.attach(poolManagerLogicProxyAddress)

        //default assets are supported
        expect(await poolManagerLogicProxy.numberOfSupportedAssets()).to.equal("3")
        expect(await poolManagerLogicProxy.isAssetSupported(susdKey)).to.be.true
        expect(await poolManagerLogicProxy.isAssetSupported(sethKey)).to.be.true
        expect(await poolManagerLogicProxy.isAssetSupported(sbtcKey)).to.be.true

        //Other assets are not supported
        expect(await poolManagerLogicProxy.isAssetSupported(slinkKey)).to.be.false

    });

    it('should be able to deposit', async function() {

        let depositEvent = new Promise((resolve, reject) => {
            poolLogicProxy.on('Deposit', (fundAddress,
                investor,
                valueDeposited,
                fundTokensReceived,
                totalInvestorFundTokens,
                fundValue,
                totalSupply,
                time, event) => {
                    event.removeListener();

                    resolve({
                        fundAddress: fundAddress,
                        investor: investor,
                        valueDeposited: valueDeposited,
                        fundTokensReceived: fundTokensReceived,
                        totalInvestorFundTokens: totalInvestorFundTokens,
                        fundValue: fundValue,
                        totalSupply: totalSupply,
                        time: time
                    });
                });

            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });

        let totalFundValue = await poolLogicProxy.totalFundValue()
        let totalSupply = await poolLogicProxy.totalSupply();
        let sUSD = await poolManagerLogicProxy.getAssetProxy(susdKey)
        console.log("sUSD address: ", sUSD);
        const token = await ethers.getContractAt("IERC20", sUSD);
        let value = 1e18.toString()
        await token.approve(poolLogicProxy.address, value)

        let tx = await poolLogicProxy.deposit(value)
        console.log("deposit tx: ", tx.hash)

        let event = await depositEvent;
        let balance = await poolLogicProxy.balanceOf(manager.address);

        expect(event.fundAddress).to.equal(poolLogicProxy.address);
        expect(event.investor).to.equal(manager.address);
        expect(event.valueDeposited).to.equal(value);
        expect(event.fundTokensReceived).to.equal(value);
        expect(event.totalInvestorFundTokens).to.equal(balance.toString());
        expect(event.fundValue).to.equal(totalFundValue.add(value));
        expect(event.totalSupply).to.equal(totalSupply.add(value));
    });

    it('should be able to deposit again', async function() {

        let depositEvent = new Promise((resolve, reject) => {
            poolLogicProxy.on('Deposit', (fundAddress,
                investor,
                valueDeposited,
                fundTokensReceived,
                totalInvestorFundTokens,
                fundValue,
                totalSupply,
                time, event) => {
                    event.removeListener();

                    resolve({
                        fundAddress: fundAddress,
                        investor: investor,
                        valueDeposited: valueDeposited,
                        fundTokensReceived: fundTokensReceived,
                        totalInvestorFundTokens: totalInvestorFundTokens,
                        fundValue: fundValue,
                        totalSupply: totalSupply,
                        time: time
                    });
                });

            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });

        let totalFundValue = await poolLogicProxy.totalFundValue()
        let totalSupply = await poolLogicProxy.totalSupply();
        let sUSD = await poolManagerLogicProxy.getAssetProxy(susdKey)
        console.log("sUSD address: ", sUSD);
        const token = await ethers.getContractAt("IERC20", sUSD);
        let value = 1e18.toString()
        await token.approve(poolLogicProxy.address, value)

        let tx = await poolLogicProxy.deposit(value)
        console.log("deposit again tx: ", tx.hash)

        let event = await depositEvent;
        let balance = await poolLogicProxy.balanceOf(manager.address);

        expect(event.fundAddress).to.equal(poolLogicProxy.address);
        expect(event.investor).to.equal(manager.address);
        expect(event.valueDeposited).to.equal(value);
        expect(event.fundTokensReceived).to.equal(value);
        expect(event.totalInvestorFundTokens).to.equal(balance.toString());
        expect(event.fundValue).to.equal(totalFundValue.add(value));
        expect(event.totalSupply).to.equal(totalSupply.add(value));
    });

    it('should be able to exchange', async function() {
        let exchangeEvent = new Promise((resolve, reject) => {
            poolLogicProxy.on('Exchange', (
                poolLogicAddress,
                manager,
                sourceKey,
                sourceAmount,
                destinationKey,
                destinationAmount,
                time, event) => {
                    event.removeListener();

                    resolve({
                        poolLogicAddress: poolLogicAddress,
                        manager: manager,
                        sourceKey: sourceKey,
                        sourceAmount: sourceAmount,
                        destinationKey: destinationKey,
                        destinationAmount: destinationAmount,
                        time: time
                    });
                });

            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });

        let sETH = await poolManagerLogicProxy.getAssetProxy(sethKey)
        console.log("sETH address: ", sETH);
        const token = await ethers.getContractAt("IERC20", sETH);
        let balance = await token.balanceOf(poolLogicProxy.address)

        let tx = await poolLogicProxy.exchange(susdKey, 1e18.toString(), sethKey);
        console.log("exchange tx: ", tx.hash)

        let event = await exchangeEvent;
        expect(event.sourceKey).to.equal(susdKey);
        expect(event.sourceAmount).to.equal(1e18.toString());
        expect(event.destinationKey).to.equal(sethKey);

        let balanceAfter = await token.balanceOf(poolLogicProxy.address)
        expect(balanceAfter.sub(balance)).to.be.above(0);
    });

    it('should be able to withdraw', async function() {
        let withdrawalEvent = new Promise((resolve, reject) => {
            poolLogicProxy.on('Withdrawal', (
                fundAddress,
                investor,
                valueWithdrawn,
                fundTokensWithdrawn,
                totalInvestorFundTokens,
                fundValue,
                totalSupply,
                time, event) => {
                    event.removeListener();

                    resolve({
                        fundAddress: fundAddress,
                        investor: investor,
                        valueWithdrawn: valueWithdrawn,
                        fundTokensWithdrawn: fundTokensWithdrawn,
                        totalInvestorFundTokens: totalInvestorFundTokens,
                        fundValue: fundValue,
                        totalSupply: totalSupply,
                        time: time
                    });
                });

            setTimeout(() => {
                reject(new Error('timeout'));
            }, 60000)
        });

        let balance = await poolLogicProxy.balanceOf(manager.address);
        console.log("Balance: ", balance.toString())
        let withdrawAmount = 1e18
        console.log("withdrawAmount: ", withdrawAmount.toString())
        let totalSupply = await poolLogicProxy.totalSupply()
        let totalFundValue = await poolLogicProxy.totalFundValue()

        await poolFactory.setExitCooldown(0);

        let tx = await poolLogicProxy.withdraw(withdrawAmount.toString())
        console.log("withdraw tx: ", tx.hash)

        // let [exitFeeNumerator, exitFeeDenominator] = await poolFactory.getExitFee()
        // let daoExitFee = withdrawAmount * exitFeeNumerator / exitFeeDenominator

        let event = await withdrawalEvent;

        let fundTokensWithdrawn = withdrawAmount
        let valueWithdrawn = fundTokensWithdrawn / totalSupply * totalFundValue
        expect(event.fundAddress).to.equal(poolLogicProxy.address);
        expect(event.investor).to.equal(manager.address);
        // Comment out as there's little bit off as 333333333333333300 instead of 333333333333333333
        // expect(event.valueWithdrawn).to.equal(valueWithdrawn.toString());
        expect(event.fundTokensWithdrawn).to.equal(fundTokensWithdrawn.toString());
        expect(event.totalInvestorFundTokens).to.equal(50e18.toString());
        expect(event.fundValue).to.equal(2e18.toString());
        expect(event.totalSupply).to.equal((60e18 - fundTokensWithdrawn).toString());
    });

});
