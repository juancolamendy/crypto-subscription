const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const { time } = require('@openzeppelin/test-helpers');

const THIRTY_DAYS = time.duration.days(30);
const SIXTY_DAYS = time.duration.days(60);

describe("crypto-subscription", () => {
  // vars 
  let payment = null;
  let token = null;

  // hooks
  beforeEach(async () => {
    // get account
    const signers = await ethers.getSigners();
    const subscriber = signers[2];
    
    // deploy payment contract
    const Payment = await ethers.getContractFactory("Payment")
    payment = await Payment.deploy()
    await payment.deployed()

    // deploy token contract
    const MockToken = await ethers.getContractFactory("MockToken")
    token = await MockToken.deploy()
    await token.deployed()

    // transfer tokens from the token contract owner to the subscriber
    await token.transfer(subscriber.address, 1000);
    // token contract owner allow the subscriber to approve the payment contract to receive token
    // See connect using the signer not the signer.address
    await token.connect(subscriber).approve(payment.address, 1000);    
  });

  // test cases
  it("should create a plan", async () => {
    // get accounts
    const signers = await ethers.getSigners();
    const merchant = signers[1];

    await payment.connect(merchant).createPlan(token.address, String(100), String(THIRTY_DAYS));
    const plan1 = await payment.plans(0);
    assert(plan1.token === token.address);
    assert(plan1.amount.toString() === '100'); 
    assert(plan1.frequency.toString() === THIRTY_DAYS.toString()); 

    await payment.connect(merchant).createPlan(token.address, String(200), String(SIXTY_DAYS));
    const plan2 = await payment.plans(1);
    assert(plan2.token === token.address);
    assert(plan2.amount.toString() === '200'); 
    assert(plan2.frequency.toString() === SIXTY_DAYS.toString()); 
  });
  
  it('should create a subscription', async () => {
    // get accounts
    const signers = await ethers.getSigners();
    const merchant = signers[1];
    const subscriber = signers[2];
    
    // merchant creates a plan
    await payment.connect(merchant).createPlan(token.address, String(100), String(THIRTY_DAYS));

    // subscriber subscribes to the created plan
    await payment.connect(subscriber).subscribe(0);
    
    // get subscription
    const subscription = await payment.subscriptions(subscriber.address, 0);
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    assert(subscription.subscriber === subscriber.address);
    assert(subscription.start.toString() === block.timestamp.toString());
    assert(subscription.nextPayment.toString() === (block.timestamp + 86400 * 30).toString());
  });

  it('should subscribe and pay', async () => {
    // get accounts
    const signers = await ethers.getSigners();
    const merchant = signers[1];
    const subscriber = signers[2];
    
    let balanceMerchant, balanceSubscriber;
    
    // merchant creates a plan
    await payment.connect(merchant).createPlan(token.address, String(100), String(THIRTY_DAYS));

    // subscriber subscribes to the created plan
    await payment.connect(subscriber).subscribe(0);

    // check balances
    balanceMerchant = await token.balanceOf(merchant.address); 
    balanceSubscriber = await token.balanceOf(subscriber.address); 
    assert(balanceMerchant.toString() === '100');
    assert(balanceSubscriber.toString() === '900');

    await ethers.provider.send('evm_increaseTime', [31 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine');

    // make a payment
    await payment.connect(merchant).pay(subscriber.address, 0);
    // check balances
    balanceMerchant = await token.balanceOf(merchant.address); 
    balanceSubscriber = await token.balanceOf(subscriber.address); 
    assert(balanceMerchant.toString() === '200');
    assert(balanceSubscriber.toString() === '800');

    await ethers.provider.send('evm_increaseTime', [31 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine');
    
    // make a payment
    await payment.connect(merchant).pay(subscriber.address, 0);
    // check balances
    balanceMerchant = await token.balanceOf(merchant.address); 
    balanceSubscriber = await token.balanceOf(subscriber.address); 
    assert(balanceMerchant.toString() === '300');
    assert(balanceSubscriber.toString() === '700');
  });

})
