'use strict';
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    winston = require(path.resolve('./config/lib/winston')),
    settings_DBModel = db.settings,
    advanced_settings_DBMmodel = db.advanced_settings,
    async = require('async'),
    combo_DBMmodel = db.combo,
    redis = require(path.resolve('./config/lib/redis')),
    settings = require(path.resolve('./custom_functions/settings'))


/**
 * Module init function.
 */

//todo: advanced_Settgins duhet hequr dhe kaluar ne redis
module.exports = function(app,   db) {
    settings.init(app);
    app.locals.backendsettings = {};

    let subscriber = redis.client.duplicate();
    subscriber.on('message', function(channel, message) {
        redis.client.get(message + ':company_settings', function(err, raw_company_settings) {
            let company_settings = JSON.parse(raw_company_settings);
            if(!app.locals.backendsettings[message].already_updated) {
                let expire_date = new Date(company_settings.expire_date);
                delete company_settings.expire_date;
                company_settings.expire_date = expire_date;
                delete app.locals.backendsettings[message];
                app.locals.backendsettings[message] = company_settings;
            }
            else {
                delete app.locals.backendsettings[message].already_updated;
            }
        });
    });

    subscriber.subscribe('event:company_settings_updated');

    settings_DBModel.findAll({

    }).then(function (results) {
        for(let i = 0; i < results.length; i++) {
            let settingsId = results[i].id + ":company_settings";
            app.locals.backendsettings[results[i].id] = results[i];
            let settingsRaw = JSON.stringify(results[i].toJSON())
            redis.client.set(settingsId, settingsRaw);
        }

        return settings.loadAdvancedSettings()
        .then(function () {
            winston.info("Advanced settings loaded")
            //find if transactional vod is active, and it's set duration
            combo_DBMmodel.findAll({
                attributes: ['duration', 'company_id'],
                where: {product_id: 'transactional_vod', isavailable: true}
            }).then(function (t_vod_combos) {
                async.forEach(t_vod_combos, function(t_vod_combo, callback){
                    if(t_vod_combo && t_vod_combo.duration) app.locals.backendsettings[t_vod_combo.company_id].t_vod_duration = t_vod_combo.duration;
                    else app.locals.backendsettings[t_vod_combo.company_id].t_vod_duration = null;
                    callback(null);
                });
            }).catch(function(error) {
                winston.error('error reading transactional vod settings: ',error);
            });
            return null;

        }).catch(function(err) {
            winston.error("Loading advanced settings failed with error: " + err);
            process.exit(1);
        });
    }).catch(function(error) {
        winston.error('error reading database settings: ',error);
    });

};

