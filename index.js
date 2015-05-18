var http = require('http');
var AWS = require('aws-sdk');

var elb;
var instanceId;
var configDone = false;

module.exports = {};

module.exports.getInstanceId = function(cb) {
  if (instanceId) {
    cb(null, instanceId);
  } else {
    http.get({host:'169.254.169.254', port:80, path:'/latest/meta-data/instance-id'}, function(res){
      res.on('data', function (chunk) {
        instanceId = chunk.toString();
        cb(null, instanceId);
      }).on('error', function(e) {
        cb(e);
      });
    });
  }
};

module.exports.configure = function(file) {
  require('util')._extend(AWS.config, require(file));
  if (!AWS.config.region) {
    // Default to Virginia
    AWS.config.region = 'us-east-1';

    // But attempt to find the actual region of the instance
    http.get({host:'169.254.169.254', port:80, path:'/latest/meta-data/placement/availability-zone'}, function(res){
      res.on('data', function(chunk) {
        AWS.config.region = chunk.toString().slice(0,-1);
      });
    });
  }
  configDone = true;
};

module.exports.getLoadBalancers = function(config, cb) {
  if (!configDone) { cb(new Error("No AWS config present")); }
  if (!config.region) {
    config.region = AWS.config.region;
  }
  elb = elb || new AWS.ELB();
  elb.describeLoadBalancers({}, function(err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null,data.LoadBalancerDescriptions);
    }
  });
};

module.exports.amIFirst = function(cb) {
  module.exports.getInstanceId(function (err,instance) {
    if (err) {cb(err);}
    module.exports.getLoadBalancers({}, function (err, lbs) {
      if (err) {cb(err);}
      var thisLB = false;
      for (var i=0; i< lbs.length;i++) {
        var instanceObjects = lbs[i].Instances;
        var instances = [];
        for (var j=0 ; j < instanceObjects.length ; j++) {
          var thisInstance = instanceObjects[j].InstanceId;
          if (thisInstance === instance) {
            thisLB = true;
          }
          instances.push(instanceObjects[j].InstanceId);
        }
        if (thisLB) {
          instances.sort();
          console.log(instances[0] === instance);
          cb(null, (instances[0] === instance));
        }
      }
      if (!thisLB) {
        cb(new Error('Could not find load balancer'));  
      }
    });
  });
};

