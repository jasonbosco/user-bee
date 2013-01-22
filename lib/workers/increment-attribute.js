"use strict";

var incrementAttributeJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                name:job.data.name,
                userId:job.data.userId
            };

            var updatedDoc = {
                '$inc':{
                    data:job.data.data // Contains the increment step size
                }
            };
            collection.update(query, updatedDoc, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = incrementAttributeJob;
