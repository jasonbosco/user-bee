var userbee = require('../')();

userbee.setAttribute(123, [
    {"Signed Up":true}
], function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
