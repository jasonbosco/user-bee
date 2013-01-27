var userBee = require('../lib/user-bee')();

userBee.scheduler.addTrigger({
    query:"{asd:asd}",
    frequency:"* * * * *",
    emailTemplate:"emailTemplate"
}, function() {
    process.exit();
});
//userBee.scheduler.start();