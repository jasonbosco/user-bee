user-bee
========

UserBee is a framework to trigger and send automated emails asynchronously based on user behavior.

A common use case is to setup [drip email campaigns](http://en.wikipedia.org/wiki/Drip_marketing).


## Installation


Add the line `user-bee: "git://github.com/jasonbosco/user-bee.git"` to your `package.json` and then

    $ npm install

or

    $ npm install "git://github.com/jasonbosco/user-bee.git"


## Requirements


+ Redis
+ MongoDB

## Setup


UserBee consists of two processes:

The **Scheduler** is responsible for executing triggers at the specified frequency.

    // Start the scheduler (as a seperate process)
    var userBee = require('user-bee')();
    userBee.scheduler.start();

**Workers** are responsible for executing asyncronous jobs. They write data to the DB and send out emails.

    // Start the worker (as a seperate process)
    var userBee = require('user-bee')();
    userBee.worker.start();

UserBee uses [kue](https://github.com/learnboost/kue) for a queue. To start the frontend for kue:

    // Start frontend for kue (as a seperate process)
    var kue = require('kue');
    kue.app.listen(3000);


## Workflow


- Start the scheduler and worker processes as described above.
- Add user attributes with `userBee.setAttributes()`
    - UserBee enqueues an async job with the specified attributes.
    - Worker process picks up the job and saves the user attributes to DB.
- Add triggers that query the DB for users matching a condition.
    - A trigger consists of a query, a frequency and options for the email template to be used when the trigger is processesed.
    - A trigger is processed at specific times using the given frequency pattern.
    - When the trigger is processed, it queries the DB using the given query.
    - It will then enqueue a job that will send an email using the specified email template and email subject.
    - All user attributes are available for use in the email template as user.* .
    - Worker process picks up the email job and sends out the actual email.


## Usage


    var userBee = require('user-bee')(); /* See source for available actions */


### Set user attributes

    // Set user attribute(s)
    //      - enqueues a job to save the specified user attributes to DB
    userBee.setAttributes(100001, {
        "Signed Up":true,
        "Added Card":false,
        "email":"jason@jbos.co",
        "firstName":"Jason"
    }, function (err) {
        if (err) console.error(err);
        else console.log("Done");
    });


    // Increment an integer type user attribute(s)
    //      - enqueues a job to increment the specified user attributes by the specified values
    userBee.incrementAttributes(100001, {
        "Login Count":1
    }, function (err) {
        if (err) console.error(err);
        else console.log("Done");
    });


    // Push values into an array type user attribute(s)
    //      - enqueues a job to increment the specified user attributes by the specified values
    userBee.pushAttributes(123, {
        "Discount Codes Used":['DISCOUNT-CODE-1', 'DISCOUNT-CODE-2'],
        "Features Used":['feature 1', 'feature 2', 'social share']
    }, function (err) {
        if (err) console.error(err);
        else console.log("Done");
    });


### Record user actions

    // Record user action(s)
    //  - enqueues a job to record the specified user actions along with their properties
    userBee.recordActions(123, [
        {"Signed Up":{"Plan":"Premium"}}
    ], function (err) {
        if (err) console.error(err);
        else console.log("Done");
    });


### Add triggers

    //Add a trigger to send a welcome email when a user signs up
    userBee.scheduler.addTrigger({
        query:{"Signed Up":true}, //Any Mongo DB type query
        frequency:"* * * * * *", // First field is for seconds
        email:{
            templateName:"welcome-template",
            subject:"Welcome to UserBee",
            fromField:"hello@jbos.co"
        }
    }, function (err) {
        if(err) console.error(err);
        else console.log("Done");
    });


## Todo


- See issues : https://github.com/jasonbosco/user-bee/issues


## License


### The MIT License (MIT)

Copyright (c) 2013 Jason Bosco J <jason@jbos.co>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.















