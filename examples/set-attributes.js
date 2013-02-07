var userBee = require('../')();

userBee.setAttributes(110, {
    "Signed Up":true,
    "Signed Up Date":new Date(),
    "Added Card":false,
    "email":"jason@jbos.co",
    "firstName":"Jason"
}, function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
