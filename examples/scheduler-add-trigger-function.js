var userBee = require('../')();

//Triggers a welcome email 7 days after user signs up
userBee.scheduler.addTrigger({
    //queryFunction has to return a valid Mongo DB compatible query
    queryFunction:function () {
        var today = new Date();
        var date7DaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

        return {
            "Signed Up":true,
            "Signed Up Date":{
                '$lt':date7DaysAgo.toISOString()
            }
        };
    },
    frequency:"* * * * * *", // First field is for seconds
    email:{
        templateName:"welcome-template",
        subject:"Welcome to UserBee",
        fromField:"hello@jbos.co"
    }
}, function () {
    process.exit();
});