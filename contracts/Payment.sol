// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.6;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract Payment {
  // custom structs
  // plan struct
  struct Plan {
    address merchant;
    address token;
    uint amount;
    // duration in seconds
    uint frequency;
  }

  // subscription struct
  struct Subscription {
    address subscriber;
    // timestamp when the subscription starts
    uint start;
    // timestamp for next payment
    uint nextPayment;
  }
  
  // contract data
  // counter for planId
  uint public nextPlanId;

  // map of plans. planId => plan
  mapping(uint => Plan) public plans;
  
  // map of subscriptions. subscriberAddress => planId => subscription 
  mapping(address => mapping(uint => Subscription)) public subscriptions;

  // events
  event PlanCreated(
    address merchant,
    uint planId,
    uint date
  );

  event SubscriptionCreated(
    address subscriber,
    uint planId,
    uint date
  );
  
  event SubscriptionCancelled(
    address subscriber,
    uint planId,
    uint date
  );
  
  event PaymentSent(
    address from,
    address to,
    uint amount,
    uint planId,
    uint date
  );

  // function call by merchants
  function createPlan(address token, uint amount, uint frequency) external {
    // validations
    require(token != address(0), 'address cannot be null address');
    require(amount > 0, 'amount needs to be > 0');
    require(frequency > 0, 'frequency needs to be > 0');

    // add a new plan
    plans[nextPlanId] = Plan(
      msg.sender, 
      token,
      amount, 
      frequency
    );
    // increment planId
    nextPlanId++;
  }

  // function call by buyers/subscribers
  function subscribe(uint planId) external {
    // validations
    // check the plan exists
    Plan storage plan = plans[planId];
    require(plan.merchant != address(0), 'this plan does not exist');

    // create a reference to the token contract
    IERC20 token = IERC20(plan.token);
    // transfer tokens from the subscriber to the merchants
    // this is the first payment of the subscription
    token.transferFrom(msg.sender, plan.merchant, plan.amount);  
    // emit event
    emit PaymentSent(
      msg.sender, 
      plan.merchant, 
      plan.amount, 
      planId, 
      block.timestamp
    );

    // store the subscription
    subscriptions[msg.sender][planId] = Subscription(
      msg.sender, // buyer/subscriber
      block.timestamp, // timestamp => start of subscription
      block.timestamp + plan.frequency // timestamp of next payment
    );
    // emit event
    emit SubscriptionCreated(msg.sender, planId, block.timestamp);
  }

  // function call by the buyers/subscribers
  function cancel(uint planId) external {
    // get subscription per subscriber per plan
    Subscription storage subscription = subscriptions[msg.sender][planId];
    
    // validations
    // check the subscription exists
    require(subscription.subscriber != address(0), 'this subscription does not exist');
    
    // delete the subscription
    delete subscriptions[msg.sender][planId];
    // emit event
    emit SubscriptionCancelled(msg.sender, planId, block.timestamp);
  }

  // function call by either merchants or subscribers
  function pay(address subscriber, uint planId) external {
    // get subscription
    Subscription storage subscription = subscriptions[subscriber][planId];
    // get plan
    Plan storage plan = plans[planId];
    // get a reference to the token contract
    IERC20 token = IERC20(plan.token);

    // validations
    // check the subscription exists
    require(subscription.subscriber != address(0), 'this subscription does not exist');
    // check if payment is due
    require(block.timestamp > subscription.nextPayment, 'not due yet');

    // make a payment
    token.transferFrom(subscriber, plan.merchant, plan.amount);  
    // emit event
    emit PaymentSent(
      subscriber,
      plan.merchant, 
      plan.amount, 
      planId, 
      block.timestamp
    );

    // re-calculate the nextPayment timestamp
    subscription.nextPayment = subscription.nextPayment + plan.frequency;
  }

}
