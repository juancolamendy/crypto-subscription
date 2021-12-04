const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const { time } = require('@openzeppelin/test-helpers');

const THIRTY_DAYS = time.duration.days(30); 
const SIXTY_DAYS = time.duration.days(60); 

describe("crypto-subscription", function() {
  // vars 
  let admin, merchant, subscriber;
  let payment = null;
  let token = null;

  // hooks
  beforeEach(async function() {
    let [admin, merchant, subscriber, _] = await ethers.getSigners()

    const Payment = await ethers.getContractFactory("Payment")
    payment = await Payment.deploy()
    await payment.deployed()

    const MockToken = await ethers.getContractFactory("MockToken")
    token = await MockToken.deploy()
    await token.deployed()
  });

  // test cases
  it("should create a plan", async function() {
    await payment.createPlan(token.address, String(100), String(THIRTY_DAYS), {from: merchant});
    const plan1 = await payment.plans(0);
    assert(plan1.token === token.address);
    assert(plan1.amount.toString() === '100'); 
    assert(plan1.frequency.toString() === THIRTY_DAYS.toString()); 

    await payment.createPlan(token.address, String(200), String(SIXTY_DAYS), {from: merchant});
    const plan2 = await payment.plans(1);
    assert(plan2.token === token.address);
    assert(plan2.amount.toString() === '200'); 
    assert(plan2.frequency.toString() === SIXTY_DAYS.toString()); 
  });

})
