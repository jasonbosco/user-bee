var userBee = require('../')();

userBee.recordAction(123, [
    {"Signed Up":{"Plan":"Premium"}}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});