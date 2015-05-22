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

    awsUtil.amIFirst(function(err, primary, loadBalancer){
      assert.equal(err, null);
      console.log(loadBalancer ? ('We are on the load balancer ' + loadBalancer) : 'We are not being load balanced, so we will be seen as primary');
      console.log(primary ? 'We are (or should be treated as) primary' : 'We are not the primary at the moment');
    });
    console.log('If you don\'t see any horrible messages and the process finishes you are OK!');

  } else {
    console.log('You aren\'t running on EC2 instance')
  }
});


