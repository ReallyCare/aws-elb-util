var http = require('http');
var request = require('request');   // massively heavy, but was struggling with timeout in http
var AWS = require('aws-sdk');

var ec2;
var elb;
var instanceId;
var configDone = false;

module.exports = {};

module.exports.getInstanceId = function (cb) {

  // Instanceid is actually detected by onEC2

  function returnInstanceId() {
    if (instanceId) {
      cb(null, instanceId);
    } else {
      cb(new Error('You cannot call getInstanceId unless you ar on EC2 instance'))
    }
  }

  if (typeof instanceId === 'undefined') {
    module.exports.onEC2(function (err) {
      if (err) {
        cb(err);
      }
      returnInstanceId();
    });
  } else {
    returnInstanceId();
  }
};

module.exports.onEC2 = function (cb) {
  if (instanceId) {
    cb(null, instanceId);
  } else {
    request({
      uri: 'http://169.254.169.254/latest/meta-data/instance-id',
      method: "GET",
      timeout: 500
    }, function (error, response, body) {
      if (error) {
        if (['ESOCKETTIMEDOUT','ETIMEDOUT'].indexOf(error.code) !== -1 ) {
          instanceId = false;
          cb(null, false);
        } else {
          cb(error);
        }
      } else {
        instanceId = body;
        cb(null, instanceId);
      }
    });
  }
};

module.exports.configure = function (file) {
  require('util')._extend(AWS.config, require(file));
  if (!AWS.config.region) {
    // Default to Virginia
    AWS.config.region = 'us-east-1';

    // But attempt to find the actual region of the instance
    http.get({
      host: '169.254.169.254',
      port: 80,
      path: '/latest/meta-data/placement/availability-zone'
    }, function (res) {
      res.on('data', function (chunk) {
        AWS.config.region = chunk.toString().slice(0, -1);
      });
    });
  }
  configDone = true;
};

module.exports.getLoadBalancers = function (config, cb) {
  if (!configDone) {
    cb(new Error("No AWS config present"));
  }
  if (!config.region) {
    config.region = AWS.config.region;
  }
  elb = elb || new AWS.ELB();
  elb.describeLoadBalancers({}, function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, data.LoadBalancerDescriptions);
    }
  });
};

module.exports.amIFirst = function (cb) {
  module.exports.onEC2(function (err, instance) {
    if (err) {
      cb(err);
    }
    if (instance) {
      module.exports.getLoadBalancers({}, function (err, lbs) {
        if (err) {
          cb(err);
        }
        var thisLB = false;
        for (var i = 0; i < lbs.length; i++) {
          var instanceObjects = lbs[i].Instances;
          var balancerName = lbs[i].LoadBalancerName;
          var instances = [];
          for (var j = 0; j < instanceObjects.length; j++) {
            var thisInstance = instanceObjects[j].InstanceId;
            if (thisInstance === instance) {
              thisLB = true;
            }
            instances.push(instanceObjects[j].InstanceId);
          }
          if (thisLB) {
            if (instances.length === 1) {
              // I am the only instance - I must be primary
              cb(null, true, balancerName);
            } else {
              ec2 = ec2 || new AWS.EC2();
              ec2.describeInstanceStatus({InstanceIds: instances}, function (err, data) {
                if (err) cb(err);
                data.InstanceStatuses.sort(function (a, b) {
                  return a.InstanceId < b.InstanceId;
                });
                cb(null, (data.InstanceStatuses[0].InstanceId === instance), balancerName);
              });
            }
          }
        }
        if (!thisLB) {
          // we are not attached to a load balancer, so we can't be 'primary'
          cb(null, -1);
        }
      });
    } else {
      cb(null, -2)
    }
  });
};

module.exports.handlePromotionDemotion = function (firstFunc, notFirstFunc) {

  var state = 0;

  function callEveryMinute() {
    setInterval(function () {
      module.exports.amIFirst(function (err, primary) {
        if (err) {
          throw new Error("Error callin amIFirst " + JSON.stringify(err));
        }
        if (primary) {
          if (state !== 1 && typeof firstFunc === 'function') {
            firstFunc();
            state = 1;
          }
        } else if (state !== 2 && typeof notFirstFunc === 'function') {
          notFirstFunc();
          state = 2;
        }
      });
    }, 1000 * 60);
  }

  var nextDate = new Date();

  if (nextDate.getSeconds() === 0) {
    callEveryMinute()
  } else {
    nextDate.setMinutes(nextDate.getMinutes() + 1);
    nextDate.setSeconds(0);

    var difference = nextDate - new Date();
    setTimeout(callEveryMinute, difference);
  }

};
