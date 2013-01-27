"use strict"

var scheduler = function (options) {

    var mongo = require('mongodb');

    var mongoServer = new mongo.Server(options.mongodb.host, options.mongodb.port, options.mongodb.options);
    var db = new mongo.Db('user_bee', mongoServer, {safe:false});

    db.open(function (err, db) {
        if (err) {
            console.error("Could not connect to mongodb");
            return false;
        }
    });

    return {
        addTrigger:function (trigger, callback) {
            db.collection('triggers', function (err, collection) {
                if (err) return callback(err);
                var doc = {
                    query:trigger.query,
                    frequency:trigger.frequency,
                    createdAt:Math.round((new Date()).getTime() / 1000)
                };
                collection.insert(doc, {safe:true}, function (err, result) {
                    if (err) return callback(err);
                    callback(result);
                });
            });
        },
        start:function (options) {

        }
    }

};

module.exports = scheduler;