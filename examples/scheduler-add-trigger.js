var userBee = require('../lib/user-bee')();

userBee.scheduler.addTrigger({
    query:{userId:103}, // Mongo DB compatible query
    frequency:"* * * * * *", // First field is for seconds
    email:{
        templateName:"welcome-template",
        subject:"Welcome to UserBee",
        fromField:"hello@jbos.co"
    }
}, function () {
    process.exit();
});