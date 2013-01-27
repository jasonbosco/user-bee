"use strict";

var pushAttributeJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                userId:job.data.userId
            };

            var pushData = new Object();
            pushData[job.data.name] = job.data.data;
            var pushCmd = {
                '$pushAll':pushData
            }

            collection.update(query, pushCmd, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = pushAttributeJob;
