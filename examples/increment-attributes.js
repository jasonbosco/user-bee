var userBee = require('../')();

userBee.incrementAttributes(123, [
    {"Login Count":1}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
