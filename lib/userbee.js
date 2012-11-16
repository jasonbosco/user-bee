"use strict";

var userbee = function (options) {

    var kue = require('kue')
        , async = require('async');

    var defaults = options || {};

    if (defaults.hasOwnProperty('redis')) {
        kue.redis.createClient = function () {
            var client = redis.createClient(defaults.redis.port || 6379, defaults.redis.host || '127.0.0.1');
            if (defaults.redis.hasOwnProperty('password')) {
                client.auth(defaults.redis.password);
            }
            return client;
        }
    }

    var jobs = kue.createQueue();
    jobs.priorities = {
        normal                 :0, /* TODO:Check if kue indeed depends on 'normal' being in the list of priorities */
        PRIORITY_RECORD_ACTION :10,
        PRIORITY_SAVE_ATTRIBUTE:11
    };

    /* Private functions */
    var createJob = function (jobName, jobData, jobPriority, callback) {
        jobs
            .create(jobName, jobData)
            .priority(jobPriority)
            .save(function (err) {
                if (err) return callback(err);
                return callback(null);
            });
    };

    var actionsAttributesIterator = function (userId, actionOrAttributeIdentifier, actionOrAttributeObject, callback) {
        for (var name in actionOrAttributeObject) {
            if (actionOrAttributeObject.hasOwnProperty(name)) {
                var jobData = {
                    title :(actionOrAttributeIdentifier == "action") ? "Record Action - " + name : "Set Attribute - " + name,
                    userId:userId,
                    name  :name,
                    data  :actionOrAttributeObject[name]
                };
                var jobName = (actionOrAttributeIdentifier == "action") ? "RecordAction" : "SetAttribute";
                var jobPriority = (actionOrAttributeIdentifier == "action") ? jobs.priorities.PRIORITY_RECORD_ACTION : jobs.priorities.PRIORITY_SAVE_ATTRIBUTE;
                createJob(jobName, jobData, jobPriority, callback);
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
         *   ActionData is a key value pair
         *
         */
        recordAction     :function (userId, actions, callback) {
            async.forEach(actions
                , function (action, callback) {
                    actionsAttributesIterator(userId, 'action', action, callback);
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        }, setAttribute:function (userId, attributes, callback) {
            async.forEach(attributes
                , function (attribute, callback) {
                    actionsAttributesIterator(userId, 'attribute', attribute, callback);
                }
                , function (err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        }
    };

};


module.exports = userbee;
