"use strict";

var emailTemplates = require('email-templates')
    , nodeMailer = require('nodemailer');

var sendEmailJob = function (configOptions) {
    return function (job, callback) {

        var userAttributes = job.data.userAttributes;
        var trigger = job.data.trigger;

        emailTemplates(configOptions.emailTemplatesDir, function (err, template) {

            if (err) return callback(err);

            var transport = nodeMailer.createTransport("SMTP", configOptions.smtp);

            template(trigger.email.templateName, userAttributes, function (err, html) {
                if (err) return callback(err);
                transport.sendMail({
                    from:trigger.email.fromField,
                    to:userAttributes.email,
                    subject:trigger.email.subject,
                    html:html,
                    generateTextFromHTML:true
                }, function (err, responseStatus) {
                    if (err) return callback(err);

                    callback();
                });

            });
        });
    }
};

module.exports = sendEmailJob;
