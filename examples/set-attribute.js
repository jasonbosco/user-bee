var userBee = require('../')();

userBee.setAttribute(123, [
    {"Signed Up":false}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
