"use strict";

var incrementAttributeJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                userId:job.data.userId
            };

            var incCmd = {
                '$inc':job.data.attributes
            }

            collection.update(query, incCmd, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = incrementAttributeJob;
