"use strict";

var userBee = function (options) {

    var kue = require('kue')
        , async = require('async')
        , redis = require('redis')
        , workers = require('./workers')
        ;

    var defaults = {
        redis:{
            host:"127.0.0.1",
            port:6379
        },
        mongodb:{
            host:"127.0.0.1",
            port:27017,
            options:{
                auto_reconnect:true
            }
        },
        emailTemplatesDir:'./',
        smtp:{}
    };

    if (options) {
        if (options.hasOwnProperty('redis')) {
            options.redis.host = options.redis.host || defaults.redis.host;
            options.redis.port = options.redis.port || defaults.redis.port;
        } else {
            options.redis = defaults.redis;
        }

        if (options.hasOwnProperty('mongodb')) {
            options.mongodb.host = options.mongodb.host || defaults.mongodb.host;
            options.mongodb.port = options.mongodb.port || defaults.mongodb.port;
            options.mongodb.options = options.mongodb.options || defaults.mongodb.options;
        } else {
            options.mongodb = defaults.mongodb;
        }

        if (options.hasOwnProperty('emailTemplatesDir')) {
            options.emailTemplatesDir = options.emailTemplatesDir || defaults.emailTemplatesDir;
        } else {
            options.emailTemplatesDir = defaults.emailTemplatesDir;
        }

        if (options.hasOwnProperty('smtp')) {
            options.smtp = options.smtp || defaults.smtp;
        } else {
            options.smtp = defaults.smtp;
        }
    } else {
        options = defaults;
    }

    kue.redis.createClient = function () {
        var client = redis.createClient(options.redis.port, options.redis.host);
        if (options.redis.hasOwnProperty('password')) {
            client.auth(options.redis.password);
        }
        return client;
    }

    var workersOptions = {
        mongodb:options.mongodb,
        smtp:options.smtp,
        emailTemplatesDir:options.emailTemplatesDir
    };

    var schedulerOptions = {
        mongodb:options.mongodb,
        redis:options.redis
    };

    var jobs = kue.createQueue();
    jobs.priorities = {
        normal:0, /* TODO:Check if kue indeed depends on 'normal' being in the list of priorities */
        PRIORITY_RECORD_ACTION:10,
        PRIORITY_SAVE_ATTRIBUTES:11,
        PRIORITY_INCREMENT_ATTRIBUTES:12,
        PRIORITY_PUSH_ATTRIBUTES:13,
        PRIORITY_SEND_EMAIL:14
    };

    var workers = null;

    var jobsMetaData = {
        'recordAction':{
            'title':'Record Action',
            'priority':jobs.priorities.PRIORITY_RECORD_ACTION
        },
        'setAttributes':{
            'title':'Set Attributes',
            'priority':jobs.priorities.PRIORITY_SAVE_ATTRIBUTES
        },
        'incrementAttributes':{
            'title':'Increment Attributes',
            'priority':jobs.priorities.PRIORITY_INCREMENT_ATTRIBUTES
        },
        'pushAttributes':{
            'title':'Push Attribute',
            'priority':jobs.priorities.PRIORITY_PUSH_ATTRIBUTES
        },
        'sendEmail':{
            'title':'Send Email',
            'priority':jobs.priorities.PRIORITY_SEND_EMAIL
        }
    };

    /* Private functions */
    var _createJob = function (jobName, jobData, jobPriority, callback) {
        jobs
            .create(jobName, jobData)
            .priority(jobPriority)
            .save(function (err) {
                if (err) return callback(err);
                return callback(null);
            });
    };

    /* End Private functions */

    return {
        /*
         * actions is an array of action objects of the following form:
         *
         *   [ {"Action Name": ActionData}, {"Action Name": ActionData}, {"Action Name": ActionData}, {"Action Name": ActionData}, ...]
         *
         *   ActionData is an array of key value pair
         *
         */
        recordActions:function (userId, actions, callback) {
            async.forEach(actions
                , function (action, callback) {

                    for (var name in action) {
                        if (action.hasOwnProperty(name)) {
                            var jobData = {
                                title:jobsMetaData.recordAction.title + " - " + name,
                                userId:userId,
                                name:name,
                                data:action[name],
                                timestamp:Math.round((new Date()).getTime() / 1000)
                            };
                            _createJob('recordAction', jobData, jobsMetaData.recordAction.priority, callback);
                            break;
                        }
                    }
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        },

        /*
         * attributes is an object of the following form:
         *
         *   {Attribute: Value, Attribute: Value, Attribute: Value, ...}
         *
         */

        setAttributes:function (userId, attributes, callback) {
            if (typeof attributes != 'object' || Object.prototype.toString.call(attributes) === '[object Array]') {
                return callback(new Error('attributes should be a key-value pair object'));
            }

            var jobData = {
                title:jobsMetaData.setAttributes.title,
                userId:userId,
                attributes:attributes,
                timestamp:Math.round((new Date()).getTime() / 1000)
            };

            _createJob('setAttributes', jobData, jobsMetaData.setAttributes.priority, function (err) {
                if (err) return callback(err);
                return callback(null);
            });
        },

        /*
         * attributes is an object of the following form:
         *
         *   {Attribute: IncrementBy, Attribute: IncrementBy, Attribute: IncrementBy, ...}
         *
         */
        incrementAttributes:function (userId, attributes, callback) {

            if (typeof attributes != 'object' || Object.prototype.toString.call(attributes) === '[object Array]') {
                return callback(new Error('attributes should be a key-value pair object'));
            }

            var jobData = {
                title:jobsMetaData.incrementAttributes.title,
                userId:userId,
                attributes:attributes,
                timestamp:Math.round((new Date()).getTime() / 1000)
            };

            _createJob('incrementAttributes', jobData, jobsMetaData.incrementAttributes.priority, function (err) {
                if (err) return callback(err);
                return callback(null);
            });
        },

        /*
         * attributes is an object of the following form:
         *
         *   {Attribute: ArrayOfValues, Attribute: ArrayOfValues, Attribute: ArrayOfValues, ...}
         *
         *   where ArrayOfValues is of the form [Value, Value, Value, ...]
         *
         */
        pushAttributes:function (userId, attributes, callback) {

            if (typeof attributes != 'object' || Object.prototype.toString.call(attributes) === '[object Array]') {
                return callback(new Error('attributes should be a key-value pair object'));
            }

            var jobData = {
                title:jobsMetaData.pushAttributes.title,
                userId:userId,
                attributes:attributes,
                timestamp:Math.round((new Date()).getTime() / 1000)
            };

            _createJob('pushAttributes', jobData, jobsMetaData.pushAttributes.priority, function (err) {
                if (err) return callback(err);
                return callback(null);
            });
        },

        trigger:function (trigger, userAttributes, callback) {
            var emailJobData = {
                title:jobsMetaData.sendEmail.title + ' - ' + userAttributes.email + ': ' + trigger.email.subject,
                userAttributes:userAttributes,
                trigger:trigger
            };
            _createJob('sendEmail', emailJobData, jobsMetaData.sendEmail.priority, callback);
        },
        workers:{
            start:function (nConcurrentJobs) {
                workersOptions.concurrencyFactor = nConcurrentJobs || 5;
                var workers = require('./workers')(jobs, workersOptions);
                workers.start();
            }
        },
        scheduler:{
            start:function () {
                var scheduler = require('./scheduler')(schedulerOptions);
                scheduler.start();
            },
            addTrigger:function (trigger, callback) {
                var scheduler = require('./scheduler')(schedulerOptions);
                scheduler.addTrigger(trigger, callback);
            }
        }
    };

};


module.exports = userBee;
