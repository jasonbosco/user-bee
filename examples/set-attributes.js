var userBee = require('../')();

userBee.setAttributes(123, [
    {"Signed Up":true},
    {"Added Card":false},
    {"email":"jason@jbos.co"}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
