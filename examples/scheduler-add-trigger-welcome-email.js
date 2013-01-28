var userBee = require('../lib/user-bee')();

//Triggers a welcome email when user signs up
userBee.scheduler.addTrigger({
    query:{"Signed Up":true}, //Any Mongo DB compatible query
    frequency:"* * * * * *", // First field is for seconds
    email:{
        templateName:"welcome-template",
        subject:"Welcome to UserBee",
        fromField:"hello@jbos.co"
    }
}, function () {
    process.exit();
});