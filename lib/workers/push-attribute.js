"use strict";

var pushAttributeJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                name:job.data.name,
                userId:job.data.userId
            };

            var updatedDoc = {
                '$pushAll':{
                    data:job.data.data
                }
            };
            collection.update(query, updatedDoc, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = pushAttributeJob;
