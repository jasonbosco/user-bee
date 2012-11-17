"use strict";

var recordActionJob = function (db) {
    return function (job, callback) {
        db.collection('actions', function (err, collection) {
            if (err) return callback(err);
            var doc = {
                name  :job.data.name,
                data  :job.data.data,
                userId:job.data.userId,
                timestamp:job.data.timestamp
            };
            collection.insert(doc, {safe:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = recordActionJob;
