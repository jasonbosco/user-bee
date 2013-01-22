"use strict";

var recordActionJob = function (db) {
    return function (job, callback) {
        db.collection('actions', function (err, collection) {
            if (err) return callback(err);
            var doc = {
                name:job.data.name,
                data:job.data.data,
                userId:job.data.userId,
                timestamp:('timestamp' in job.data) ? job.data.timestamp : Math.round((new Date()).getTime() / 1000)
            };
            collection.insert(doc, {safe:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = recordActionJob;
