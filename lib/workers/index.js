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
            console.log("Starting worker");
            jobs.process('recordAction', workersOptions.concurrencyFactor, require('./record-action')(db));
            jobs.process('setAttributes', workersOptions.concurrencyFactor, require('./set-attributes')(db));
            jobs.process('incrementAttributes', workersOptions.concurrencyFactor, require('./increment-attributes')(db));
            jobs.process('pushAttributes', workersOptions.concurrencyFactor, require('./push-attributes')(db));
            jobs.process('sendEmail', workersOptions.concurrencyFactor, require('./send-email')(workersOptions));
        }
    }
};

module.exports = workers;
