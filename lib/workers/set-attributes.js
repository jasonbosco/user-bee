"use strict";

var setAttributesJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                userId:job.data.userId
            };

            var setCmd = {
                '$set':job.data.attributes
            }

            collection.update(query, setCmd, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = setAttributesJob;
