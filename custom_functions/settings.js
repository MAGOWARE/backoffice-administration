"use stric"

var path = require('path'),
    winston = require('winston'),
    redis = require(path.resolve('./config/lib/redis')),
    db = require(path.resolve('./config/lib/sequelize')).models;

const KEY_POSTFIX = ':company_advanced_settings'
var locals;

module.exports.setAdvancedSettings = function (newAdvancedSettings, clean, setUpdatedFlag) {
    if (clean) {
        delete locals.advanced_settings[newAdvancedSettings.company_id];
    }

    let settingsJson = newAdvancedSettings.data;
    locals.advanced_settings[newAdvancedSettings.company_id] = settingsJson;

    if (setUpdatedFlag) {
        locals.advanced_settings[newAdvancedSettings.company_id].already_updated = true;
    }

    return new Promise(function (resolve, reject) {
        let key = newAdvancedSettings.company_id + KEY_POSTFIX;
        redis.client.set(key, JSON.stringify(settingsJson), function (err) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        });
    })
}

module.exports.updateAdvancedSettings = function (updatedAdvancedSettings) {
    return new Promise((resolve, reject) => {
        this.setAdvancedSettings(updatedAdvancedSettings, true, true)
        .then(function(){
            redis.client.publish('event:company_advanced_settings_updated', updatedAdvancedSettings.company_id);
            resolve();
        })
        .catch(function(err) {
            reject(err);
        })
    })
}

module.exports.loadAdvancedSettings = function () {
    return new Promise((resolve, reject) => {
        let subscriber = redis.client.duplicate();
        subscriber.on('message', function(channel, message) {
            console.log('event:company_advanced_settings_updated' + channel + ' ' + message);
            redis.client.get(message + KEY_POSTFIX, function(err, rawSettings) {

                if(!locals.advanced_settings[message].already_updated) {
                    delete locals.advanced_settings[message];
                    locals.advanced_settings[message] = JSON.parse(rawSettings);
                }
                else {
                    delete locals.advanced_settings[message].already_updated;
                }
            });
        });

        subscriber.subscribe('event:company_advanced_settings_updated');

        return db.advanced_settings.findAll().then((result) => {
            let loadPromises = [];
            for (let i = 0; i < result.length; i++) {
                loadPromises.push(this.setAdvancedSettings(result[i], false, false))
            }

            return Promise.all(loadPromises)
                .then(function() {
                    resolve();
                })
                .catch(function (err) {
                    reject(err)
                });
        });
    });
}

module.exports.init = function(app) {
    locals = app.locals;
    locals.advanced_settings = {};
}