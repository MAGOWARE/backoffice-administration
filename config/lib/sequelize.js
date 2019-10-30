"use strict";

var
    path = require('path'),
    config = require(path.resolve('./config/config')),
    Sequelize = require('sequelize'),
    winston = require('./winston'),
    async = require('async'),
    db = {},
    http = require('http'),
    https = require('https');

    const default_activity = require(path.resolve("./config/defaultvalues/activity.json"));
    const default_app_groups = require(path.resolve("./config/defaultvalues/app_groups.json"));
    const default_package_type = require(path.resolve("./config/defaultvalues/package_type.json"));

    const complete_menu_object = require(path.resolve("./config/defaultvalues/menu_map.json"));
    const complete_api_group = [];
    const complete_api_url = [];
    
    const protocol = (config.port === 443) ? 'https://' : 'http://'; //port 443 means we are running https, otherwise we are running http (preferably on port 80)

    db.Sequelize = Sequelize;
    db.models = {};
    db.discover = [];

// Expose the connection function
db.connect = function(database, username, password, options) {

    if (typeof db.logger === 'function') winston.info("Connecting to: " + database + " as: " + username);

    // Instantiate a new sequelize instance
    var sequelize = new db.Sequelize(database, username, password, options);

    db.discover.forEach(function(location) {
        var model = sequelize["import"](location);
        if (model)
            db.models[model.name] = model;
    });

    sequelize.authenticate().then(function(results) {

        // Execute the associate methods for each Model
        Object.keys(db.models).forEach(function(modelName) {
            if (db.models[modelName].options.hasOwnProperty('associate')) {
                db.models[modelName].options.associate(db.models);
            }
        });

        let companyFunctions = require(path.resolve('./custom_functions/company'));
        
        if (config.db.sync) {

            sequelize.sync({force: (process.env.DB_SYNC_FORCE === 'true')})
                .then(function() {
                    async.waterfall([
                        //create root company
                        function(callback){
                            companyFunctions.createRootCompany()
                                .then(function() {
                                    callback(null)
                                })
                                .catch(function(err) {
                                    if (err.code == 500) {
                                        process.exit();
                                    }
                                    else{
                                        callback(null)
                                    }
                                });
                        },
                        function(callback){
                            var baseurl = process.env.NODE_HOST || 'localhost' + ":" + config.port;
                            var apiurl = (baseurl == 'localhost:'+config.port) ? protocol+baseurl+'/apiv2/schedule/reload' : baseurl+'/apiv2/schedule/reload'; //api path
                            try {
                                if(config.port === 443){
                                    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //invalid ssl certificate ignored
                                    https.get(apiurl, function(resp){
                                        callback(null);
                                    }).on("error", function(e){
                                        callback(null); //return offset 0 to avoid errors
                                    });
                                }
                                else{
                                    http.get(apiurl, function(resp){
                                        callback(null);
                                    }).on("error", function(e){
                                        callback(null); //return offset 0 to avoid errors
                                    });
                                }
                            } catch(e) {
                                callback(null); //catch error 'Unable to determine domain name' when url is invalid / key+service are invalid
                            }
                        }
                    ],function(err) {
                        if (err) {
                            return next(err);
                        }
                    });
                    winston.info("Database synchronized");
                    return null;
                }).then(function() {
                    //Populating activity table
                    async.forEach(default_activity, function(activity_obj, callback){
                        db.models['activity'].findOrCreate({
                            where: Sequelize.or({id: activity_obj.id}, {description: activity_obj.description}), defaults: activity_obj
                        }).then(function(done) {
                            winston.info('Activity '+activity_obj.description+' created successfuly.');
                            callback(null);
                            return null;
                        }).catch(function(err) {
                            winston.error('Error creating activity '+activity_obj.description+': ',err);
                            return null;
                        });
                    }, function(error){
                        winston.info('Default activities created successfully. Creating App group table ...');
                        return null;
                    });
                    return null;
                }).then(function() {
                    //Populating app_group table
                    async.forEach(default_app_groups, function(app_group_obj, callback){
                        db.models['app_group'].findOrCreate({
                            where: {id: app_group_obj.id}, defaults: app_group_obj
                        }).then(function(done) {
                            callback(null);
                            return null;
                        }).catch(function(err) {
                            winston.error('Error creating app group with id '+app_group_obj.id+': ',err);
                            return null;
                        });
                    }, function(error){
                        winston.info('Default app groups created successfully. Creating package_type table ...');
                        return null;
                    });
                    return null;
                }).then(function() {
                    async.forEach(default_package_type, function(package_type_obj, callback){
                        db.models['package_type'].findOrCreate({
                            where: {id: package_type_obj.id}, defaults: package_type_obj
                        }).then(function(done) {
                            callback(null);
                            return null;
                        }).catch(function(err) {
                            winston.error('Error creating package type '+package_type_obj.description+': ',err);
                            return null;
                        });
                    }, function(error){
                        winston.info('Default package_types created successfully. Creating device menu table ...');
                        return null;
                    });
                    return null;
                }).then(function() {
                    //prepare the objects for api_url and api_group tables
                    async.forEach(complete_menu_object, function(label, callback){
                        async.forEach(label.menu_list, function(menu_level_one, callback){
                            complete_api_group.push({id: menu_level_one.id, api_group_name: menu_level_one.api_group_name, description: menu_level_one.description});
                            async.forEach(menu_level_one.api_list, function(api_url_obj, callback){
                                complete_api_url.push({api_url: api_url_obj.api_url, description: '????????', api_group_id: menu_level_one.id});
                            }, function(error){
                                winston.info('Default api groups created successfully. Creating device api group table ...');
                                return null;
                            });
                        }, function(error){
                            winston.info('Default api groups created successfully. Creating device api group table ...');
                            return null;
                        });
                    }, function(error){
                        winston.info('Default api groups created successfully. Creating device api group table ...');
                        return null;
                    });
                }).then(function() {
                    //Populating api_group table
                    db.models['api_group'].bulkCreate(
                        complete_api_group, {updateOnDuplicate: ['id']}
                    ).then(function(done) {
                        return null;
                    }).catch(function(err) {
                        winston.error('Error creating api group '+complete_api_group.api_group_name+': ',err);
                        return null;
                    });
                    return null;
                }).then(function() {
                    //Populating api_url table. First all existing urls ought to be deleted, then proceed with the creation.
                    db.models['api_url'].bulkCreate(
                        complete_api_url, {fields: ['api_url', 'description', 'api_group_id'], updateOnDuplicate: ['api_url', 'api_url_obj']}
                    ).then(function(done) {
                        return null;
                    }).catch(function(err) {
                        winston.error('Error creating api url '+complete_api_url.api_url+': ',err);
                        return null;
                    });
                    return null;
                }).then(function() {
                    var schedule = require(path.resolve("./modules/deviceapiv2/server/controllers/schedule.server.controller.js"));
                    schedule.reload_scheduled_programs(); //reloading the scheduled future programs into the event loop
                    return null;
                }).catch(function(err) {
                    winston.error("An error occured: ", err);
                    return null;
                });
        }
        else{
            var schedule = require(path.resolve("./modules/deviceapiv2/server/controllers/schedule.server.controller.js"));
            schedule.reload_scheduled_programs(); //reloading the scheduled future programs into the event loop
        }
        return null;
    }).catch(function(error) {
        winston.error("Error connecting to database - ", error);
    });

    db.sequelize = sequelize;
    winston.info("Finished Connecting to Database");
    return true;
};

module.exports = db;
