"use strict";

var setAttributeJob = function (db) {
    return function (job, callback) {
        db.collection('attributes', function (err, collection) {
            if (err) return callback(err);
            var query = {
                userId:job.data.userId
            };

            var setData = new Object();
            setData[job.data.name] = job.data.data;
            var setCmd = {
                '$set':setData
            }
            collection.update(query, setCmd, {safe:true, upsert:true}, function (err, result) {
                if (err) return callback(err);
                callback();
            });
        });
    }
};

module.exports = setAttributeJob;
