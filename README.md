# aws-elb-util

A few utilities to let an AWS EC2 instance figure out whether it is the only instance (or 'first'
instance) on a Load Balancer.  The main purpose if to make it easy to ensure that single instances of 
a worker process can be run in an installation as servers get added and taken down.

    npm install aws-elb-util


    var awsUtil = require('aws-elb-utils');

Configure through config file, which must include *owner_id*.  AWS *accessKeyId* and *secretAccessKey* can be in 
config file or in environment variables *AWS_ACCESS_KEY* and *AWS_SECRET_ACCESS_KEY*.

    awsUtil.configure(configFilename);
    
## Determining whether you are running on EC2
    
    awsUtil.onEC2 (function (err, onEC2) {
      ;
    });
     
## Getting the instance id     
     
    awsUtil.getInstanceId (function (err, instanceId) {
      ;
    });
    
## Get information about load balancers

    awsUtil.getLoadBalancers (configObject, function(err, loadBalancers)) {
      ;
    });
    
## See if you are the 'primary' instance

    awsUtil.amIFirst(function (err, primary, loadBalancer) {
       // primary is a boolean
       // load balancer is the name of the load balancer 
       //   or 
       // -1 (Running on EC2 but not under a load balancer)
       //   or
       // -2 (Not running on EC2)
     });
   
## Handle changing state
   
    awsUtil.handlePromotionDemotion( 
      function onPromotionToPrimary() {},
      function onDemotionFromPrimary() {}
    );



