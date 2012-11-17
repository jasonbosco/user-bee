"use strict";

var workers = function (jobs, workersOptions) {

    var mongo = require('mongodb');

    var mongoServer = new mongo.Server(workersOptions.mongodb.host, workersOptions.mongodb.port, workersOptions.mongodb.options);
    var db = new mongo.Db('user_bee', mongoServer, {safe:false});

    db.open(function (err, db) {
        if (err) {
            console.error("Could not connect to mongodb");
            return false;
        }
    });

    return {
        start:function () {
            jobs.process('RecordAction', workersOptions.concurrencyFactor, require('./record-action')(db));
            jobs.process('SetAttribute', workersOptions.concurrencyFactor, require('./set-attribute')(db));
        }
    }
};

module.exports = workers;
