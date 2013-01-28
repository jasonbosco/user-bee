var userBee = require('../')();

userBee.incrementAttributes(123, {
    "Login Count":1,
    "Doc Count":3
}, function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
