var userBee = require('../')();

userBee.pushAttributes(123, {
    "Discount Codes Used":['DISCOUNT-CODE-1', 'DISCOUNT-CODE-2'],
    "Features Used":['play', 'rewind', 'templates']
}, function (err) {
    if (err) console.error(err);
    else console.log("Done");
    process.exit();
});
