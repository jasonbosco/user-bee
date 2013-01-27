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
        PRIORITY_SAVE_ATTRIBUTE:11,
        PRIORITY_INCREMENT_ATTRIBUTE:12,
        PRIORITY_PUSH_ATTRIBUTE:13,
        PRIORITY_SEND_EMAIL:14
    };

    var workers = null;

    var jobsMetaData = {
        'recordAction':{
            'title':'Record Action',
            'priority':jobs.priorities.PRIORITY_RECORD_ACTION
        },
        'setAttribute':{
            'title':'Set Attribute',
            'priority':jobs.priorities.PRIORITY_SAVE_ATTRIBUTE
        },
        'incrementAttribute':{
            'title':'Increment Attribute',
            'priority':jobs.priorities.PRIORITY_INCREMENT_ATTRIBUTE
        },
        'pushAttribute':{
            'title':'Push Attribute',
            'priority':jobs.priorities.PRIORITY_PUSH_ATTRIBUTE
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

    var _actionsAttributesIterator = function (userId, typeIdentifier, actionOrAttributeObject, callback) {
        for (var name in actionOrAttributeObject) {
            if (actionOrAttributeObject.hasOwnProperty(name)) {
                var jobData = {
                    title:jobsMetaData[typeIdentifier].title + " - " + name,
                    userId:userId,
                    name:name,
                    data:actionOrAttributeObject[name],
                    timestamp:Math.round((new Date()).getTime() / 1000)
                };

                _createJob(typeIdentifier, jobData, jobsMetaData[typeIdentifier].priority, callback);
                break;
            }
        }
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
                    _actionsAttributesIterator(userId, 'recordAction', action, callback);
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        },

        /*
         * attributes is an array of attribute objects of the following form:
         *
         *   [ {"Attribute Name": AttributeValue}, {"Attribute Name": AttributeValue}, {"Attribute Name": AttributeValue}, {"Attribute Name": AttributeValue}, ...]
         *
         */

        setAttributes:function (userId, attributes, callback) {
            async.forEach(attributes
                , function (attribute, callback) {
                    _actionsAttributesIterator(userId, 'setAttribute', attribute, callback);
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        },

        /*
         * attributes is an array of attribute objects of the following form:
         *
         *   [ {"Attribute Name": IncrementBy}, {"Attribute Name": IncrementBy}, {"Attribute Name": IncrementBy}, {"Attribute Name": IncrementBy}, ...]
         *
         */
        incrementAttributes:function (userId, attributes, callback) {
            async.forEach(attributes
                , function (attribute, callback) {
                    _actionsAttributesIterator(userId, 'incrementAttribute', attribute, callback);
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        },

        /*
         * attributes is an array of attribute objects of the following form:
         *
         *   [ {"Attribute Name": ValuesArray}, {"Attribute Name": ValuesArray}, {"Attribute Name": ValuesArray}, {"Attribute Name": ValuesArray}, ...]
         *
         *   ValuesArray is an array of values to push into Attribute name
         *
         */
        pushAttributes:function (userId, attributes, callback) {
            async.forEach(attributes
                , function (attribute, callback) {
                    _actionsAttributesIterator(userId, 'pushAttribute', attribute, callback);
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
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
