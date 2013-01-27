"use strict"

var scheduler = function (options) {

    var mongo = require('mongodb')
        , async = require('async')
        , userBee = require('./user-bee')(options);

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

    var _processTrigger = function (trigger) {
        db.collection('attributes', function (err, collection) {
            if (err) {
                console.error("Could not fetch attributes collection from mongodb: " + err);
                return false;
            }

            collection.find(trigger.query).each(function (err, userAttributes) {
                if (err) {
                    console.error("Could not query attributes collection from mongodb: " + err);
                    return false;
                }

                if (userAttributes == null) return true;

                //Trigger only if not already triggered
                if (!('triggersTriggered' in userAttributes && userAttributes.triggersTriggered.indexOf(trigger._id) == -1)) {
                    userBee.trigger(trigger, userAttributes, function (err) {
                        if (err) {
                            console.error("Error triggering trigger: " + err);
                            return false;
                        }

                        //Mark trigger as triggered in DB

                        db.collection('attributes', function (err, updateCollection) {
                            if (err) {
                                console.error("Could not fetch attributes collection from mongodb: " + err);
                                return false;
                            }
                            var query = {
                                userId:userAttributes.userId
                            };

                            var pushCmd = {
                                '$push':{
                                    'triggersTriggered':trigger._id
                                }
                            }

                            updateCollection.update(query, pushCmd, {safe:true, upsert:true}, function (err, result) {
                                if (err) {
                                    console.error("Could not mark trigger as triggered in mongodb: " + err);
                                    return false;
                                }
                                return true;
                            });
                        });

                    });
                }
            });

        });

    };

    return {
        addTrigger:function (trigger, callback) {
            db.collection('triggers', function (err, collection) {
                if (err) return callback(err);
                var doc = {
                    query:trigger.query,
                    frequency:trigger.frequency,
                    email:trigger.email,
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