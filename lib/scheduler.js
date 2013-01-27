"use strict"

var scheduler = function (options) {

    var mongo = require('mongodb');
    var mongoServer = new mongo.Server(options.mongodb.host, options.mongodb.port, options.mongodb.options);
    var db = new mongo.Db('user_bee', mongoServer, {safe:false});

    db.open(function (err, db) {
        if (err) {
            console.error("Could not connect to mongodb: " + err);
            return false;
        }
    });


    /**
     * Private functions
     */

    var _processTrigger = function (args) {
        console.log(args);
    };

    return {
        addTrigger:function (trigger, callback) {
            db.collection('triggers', function (err, collection) {
                if (err) return callback(err);
                var doc = {
                    query:trigger.query,
                    frequency:trigger.frequency,
                    emailTemplate:trigger.emailTemplate,
                    createdAt:Math.round((new Date()).getTime() / 1000)
                };
                collection.insert(doc, {safe:true}, function (err, result) {
                    if (err) return callback(err);
                    callback(result);
                });
            });
        },
        start:function () {
            db.collection('triggers', function (err, collection) {
                if (err) {
                    console.error('Could not load triggers from mongodb: ' + err)
                    return false;
                }
                var async = require('async');
                var cron = require('later').cronParser
                    , later = require('later').later;
                collection.find().toArray(function (err, docs) {
                    if (err) {
                        console.error('Could not load triggers from mongodb: ' + err)
                        return false;
                    }
                    async.forEach(docs,
                        function (trigger, callback) {
                            later(1).exec(cron().parse(trigger.frequency, true), (new Date()), _processTrigger, trigger);
                            callback();
                        },
                        function (err) {
                            if (err) {
                                console.error('Error processing trigger: ' + err)
                                return false;
                            }
                        }
                    );
                });
            });

        }
    }

};

module.exports = scheduler;