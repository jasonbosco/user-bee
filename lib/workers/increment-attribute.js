"use strict";

var incrementAttributeJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                userId:job.data.userId
            };

            var incData = new Object();
            incData[job.data.name] = job.data.data; // Contains the increment step size
            var incCmd = {
                '$inc':incData
            }

            collection.update(query, incCmd, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = incrementAttributeJob;
