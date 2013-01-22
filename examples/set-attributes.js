var userBee = require('../')();

userBee.setAttributes(123, [
    {"Signed Up":false}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
