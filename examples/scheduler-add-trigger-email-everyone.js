var userBee = require('../')();

// Emails all users once immediately (once because, no trigger is triggered twice for a user)
userBee.scheduler.addTrigger({
    query:{}, //Any Mongo DB compatible query
    frequency:"* * * * * *", // First field is for seconds
    email:{
        templateName:"new-feature-announcement",
        subject:"Announcing New Feature",
        fromField:"hello@jbos.co"
    }
}, function () {
    process.exit();
});