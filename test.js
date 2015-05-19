var awsUtil = require('./index.js');
var assert = require('assert');

awsUtil.getInstanceId(function(err, instanceId) {
  assert.equal(err, null);
  assert.equal(typeof instanceId,'string');
});

awsUtil.configure('./../AWSConfig.js');

awsUtil.getLoadBalancers({}, function(err, lbs) {
  assert.equal(err, null);
  assert(Array.isArray(lbs), 'getLoadBalancers should return an array');
});

awsUtil.amIFirst(function(err, response){
  assert.equal(response, true, 'I was expecting to be first on the load balancer');
})

console.log('If you can\'t see any horrible messages you are OK!');
