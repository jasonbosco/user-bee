"use strict"

var scheduler = function (options) {

    var mongo = require('mongodb')
        , redis = require('redis')
        , async = require('async')
        , userBee = require('./user-bee')(options);

    var mongoServer = new mongo.Server(options.mongodb.host, options.mongodb.port, options.mongodb.options);
    var db = new mongo.Db('user_bee', mongoServer, {safe:false});
    var laterRefs = new Array();

    var redis = redis.createClient(options.redis.port, options.redis.host);
    if (options.redis.hasOwnProperty('password')) {
        redis.auth(options.redis.password);
    }

    /**
     * Private functions
     */

    var _processTrigger = function (trigger) {
        db.collection('attributes', function (err, collection) {
            if (err) {
                console.error("Could not fetch attributes collection from mongodb: " + err);
                return false;
            }

            //TODO: Exclude unsubscribed users
            //Fetch users for whom this trigger has not been triggered yet
            var queryCondition = ('query' in trigger) ? trigger.query : ('queryFunction' in trigger ? eval('(' + trigger.queryFunction + ')()') : {})
            var query = {
                '$and': [
                    {
                        'triggersTriggered': {'$ne': trigger._id}
                    },
                    queryCondition
                ]
            };

            collection.find(query).each(function (err, userAttributes) {
                if (err) {
                    console.error("Could not query attributes collection from mongodb: " + err);
                    return false;
                }
                if (userAttributes == null) {
                    return true;
                }

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
                            userId: userAttributes.userId
                        };

                        var pushCmd = {
                            '$push': {
                                'triggersTriggered': trigger._id
                            }
                        };

                        updateCollection.update(query, pushCmd, {safe: true, upsert: true}, function (err, result) {
                            if (err) {
                                console.error("Could not mark trigger as triggered in mongodb: " + err);
                                return false;
                            }
                            return true;
                        });
                    });

                });
            });
        });
    };

    var _startScheduler = function () {
        console.log("Starting scheduler");
        db.open(function (err, db) {
            if (err) {
                console.error("Could not connect to mongodb: " + err);
                return false;
            }
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
                    async.each(docs,
                        function (trigger, callback) {
                            var laterRef = later(1);
                            laterRef.exec(cron().parse(trigger.frequency, true), (new Date()), _processTrigger, trigger);
                            laterRefs.push(laterRef);
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
        });
    };

    var _stopScheduler = function () {
        console.log("Stopping scheduler");
        for (var i in laterRefs) {
            laterRefs[i].stopExec();
        }
        laterRefs = new Array();
        db.close();
    };

    return {
        addTrigger: function (trigger, callback) {
            db.open(function (err, db) {
                if (err) {
                    console.error("Could not connect to mongodb: " + err);
                    return false;
                }

                db.collection('triggers', function (err, collection) {
                    if (err) {
                        return callback(err);
                    }
                    var doc = {
                        frequency: trigger.frequency,
                        email: trigger.email,
                        createdAt: Math.round((new Date()).getTime() / 1000)
                    };
                    if ('query' in trigger) {
                        doc.query = trigger.query;
                    }
                    if ('queryFunction' in trigger) {
                        doc.queryFunction = trigger.queryFunction.toString();
                    }
                    collection.insert(doc, {safe: true}, function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        //Publish that a new trigger was added
                        redis.publish("addTrigger", JSON.stringify(trigger), function (err, result) {
                            callback(result);
                        });
                    });
                });
            });
        },
        start: function () {
            redis.on("message", function (channel, message) {
                console.log("New trigger added, restarting scheduler");
                _stopScheduler();
                _startScheduler();
            });
            redis.subscribe("addTrigger");
            _startScheduler();
        }
    }

};

module.exports = scheduler;