var path = require('path');

var userBee = require('../lib/user-bee')({
    emailTemplatesDir:path.resolve(__dirname, 'email-templates'),
    smtp:{
        service:"SendGrid",
        auth:{
            user:'USERNAME',
            pass:'PASSWORD'
        }
    }
});
userBee.workers.start();
