var awsUtil = require('./index.js');
var assert = require('assert');

awsUtil.onEC2(function(err, onEC2) {
  assert.equal(err, null);
  if (onEC2) {
    awsUtil.getInstanceId(function(err, instanceId) {
      assert.equal(err, null);
      assert.equal(typeof instanceId,'string');
      console.log(instanceId);
    });

    awsUtil.configure('./../AWSConfig.js');

    awsUtil.getLoadBalancers({}, function(err, lbs) {
      assert.equal(err, null);
      assert(Array.isArray(lbs), 'getLoadBalancers should return an array');
    });

    awsUtil.amIFirst(function(err, response){
      assert.equal(response, true, 'I was expecting to be first on the load balancer');
    });
    console.log('If you don\'t see any horrible messages and the process finishes you are OK!');

  } else {
    console.log('You aren\'t running on EC2 instance')
  }
});


