var userBee = require('../lib/user-bee.js')();

userBee.setAttributes(103, [
    {"Signed Up":true},
    {"Added Card":false},
    {"email":"jason@jbos.co"}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
