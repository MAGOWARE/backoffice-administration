'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    dateFormat = require('dateformat'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    merge = require('merge'),
    DBModel = db.settings,
    sequelize = require('sequelize'),
    config = require(path.resolve('./config/config')),
    redis = require(path.resolve('./config/lib/redis')),
    companyFunctions = require(path.resolve('./custom_functions/company')),
    userFunctions = require(path.resolve('./custom_functions/user'));

var sequelize_t = require(path.resolve('./config/lib/sequelize'));
var jwt = require('jsonwebtoken'),
    jwtSecret = "thisIsMySecretPasscode";


/**
 * Show current
 */


exports.read = function (req, res) {
    //for every client company perform a redirect to their setting path, then display their settings. For the mother company, display results
    if (req.token.company_id !== req.settings.id && req.token.role !== 'superadmin') {
        res.redirect(req.path.substr(0, req.path.lastIndexOf("/") + 1) + req.token.company_id); //redirects to /settings_api_example_url/company_id
    }
    else {
        res.json(req.settings);
    }
};

exports.env_settings = function (req, res) {

    var company_id = 1;
    if (req.get("Authorization")) {
        var aHeader = req.get("Authorization");

        //Check if this request is signed by a valid token
        var token = null;
        if (typeof aHeader != 'undefined') token = aHeader;

        try {
            var decoded = jwt.verify(token, jwtSecret);
            company_id = decoded.company_id;
        } catch (err) {
            company_id = 1;
        }
    }
    var env_settings = {
        "backoffice_version": config.seanjs.version + ' ' + config.seanjs.db_migration_nr,
        "company_name": req.app.locals.backendsettings[company_id].company_name,
        "company_logo": req.app.locals.backendsettings[company_id].assets_url + req.app.locals.backendsettings[company_id].company_logo
    };
    res.json(env_settings); //returns version number and other middleware constants
};


/*
* Create
 */
exports.create = function (req, res) {

    //set 30 day trial
    let expire_date = new Date(Date.now());
    let free_trial_days = 30;
    if(req.body.freetrialdays) free_trial_days = 1 * req.body.freetrialdays
    expire_date.setDate(expire_date.getDate() + free_trial_days);
    req.body.expire_date = expire_date;

    req.body.telephone = req.body.telephone ? req.body.telephone : ' ';

    companyFunctions.createCompany(req)
        .then(function(result) {
            userFunctions.sendInvite(req, result.owner, true).then(function() {
                res.status(200).send({ status: true, message: "Company created successfully! An invite was sent to admin." });
            }).catch(function(err) {
                res.status(500).send({status: false, message: 'Company created but failed to send invitation'})
            })
        }).catch(function(result) {
            res.status(result.error.code).send({status: false, message: result.error.message});
        });
};

exports.createByEmail = function(req, res) {
    //set 30 day trial
    let expire_date = new Date(Date.now());
    expire_date.setDate(expire_date.getDate() + 30);
    req.body.expire_date = expire_date.toString();
    companyFunctions.createCompany(req)
        .then(function(result) {
            userFunctions.sendInvite(req, result.owner, true).then(function() {
                res.status(200).send({ message: "Invitation sent, check your mail" });
                res.redirect('/admin/#/login');
            }).catch(function(err) {
                res.status(500).send({status: false, message: 'Company created but failed to send invitation'})
            })
        }).catch(function(result) {
            res.status(result.error.code).send({status: false, message: result.error.message});
        });
}

/**
 * Update
 */

exports.update = function (req, res) {
    var new_settings = {}; //final values of settings will be stored here
    var new_setting = {}; //temporary timestamps will be stored here

    //for each activity, if the checkbox was checked, store the current timestamp at the temporary object. Otherwise delete it so that it won't be updated
    //LIVE TV
    if (req.body.updatelivetvtimestamp === true) {
        delete req.body.livetvlastchange;
        new_setting.livetvlastchange = Date.now();
    }
    else delete req.body.livetvlastchange;
    //MAIN MENU
    if (req.body.updatemenulastchange) {
        delete req.body.menulastchange;
        new_setting.menulastchange = Date.now()
    }
    else delete req.body.menulastchange;
    //VOD
    if (req.body.updatevodtimestamp) {
        delete req.body.vodlastchange;
        new_setting.vodlastchange = Date.now()
    }
    else delete req.body.vodlastchange;

    if (req.body.expire_date) {
        new_setting.expire_date = new Date(req.body.expire_date);
        delete req.body.expire_date;
    }

    new_settings = merge(req.body, new_setting); //merge values left @req.body with values stored @temp object into a new object
    logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(new_settings)); //write new values in logs

    req.body.asset_limitations = {
        "client_limit": req.body.asset_limitations.client_limit,
        "channel_limit": req.body.asset_limitations.channel_limit,
        "vod_limit": req.body.asset_limitations.vod_limit
    };

    req.settings.updateAttributes(new_settings).then(function (result) {
        //refresh company settings in app memory
        delete req.app.locals.backendsettings[result.id];
        result.already_updated = true;
        req.app.locals.backendsettings[result.id] = result;

        redis.client.set(req.token.company_id + ':company_settings', JSON.stringify(new_settings), function () {
            redis.client.publish('event:company_settings_updated', req.token.company_id)
        });

        return res.json(result);
    }).catch(function (err) {
        winston.error("Updating setting failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};


/**
 * Delete
 */
exports.delete = function (req, res) {
    var deleteData = req.settings;
    DBModel.findById(deleteData.id).then(function (result) {
        if (result) {
            result.destroy().then(function () {
                return res.json(result);
            }).catch(function (err) {
                winston.error("Deleting this setting failed with error: ", err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            });
        } else {
            delete req.app.locals.backendsettings[deleteData.id]; //delete from local app storage this setting
            return res.status(400).send({
                message: 'Unable to find the Data'
            });
        }
    }).catch(function (err) {
        winston.error("Getting setting object failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * List todo: ky api duhet mbrojtur vetem per admins
 */
exports.list = function (req, res) {

    var qwhere = {},
        final_where = {},
        query = req.query;

    if(query.q) {
        qwhere.$or = {};
        qwhere.$or.company_name = {};
        qwhere.$or.company_name.$like = '%'+query.q+'%';
    }

    //start building where
    final_where.where = qwhere;
    if(parseInt(query._end) !== -1){
        if(parseInt(query._start)) final_where.offset = parseInt(query._start);
        if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
    }
    if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;
    final_where.include = [];
    //end build final where


    DBModel.findAndCountAll(
        final_where
    ).then(function (results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function (err) {
        winston.error("Getting setting list failed with error: ", err);
        res.jsonp({ message: err });
    });
};

exports.listCompanySettingsData = function(req, res) {
    var listAccounts = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(u.id) as total_accounts, u.company_id as id " +
            "from users u inner join settings s on s.id = u.company_id " +
            "group by u.company_id)as b " +
            "UNION ALL " +
            "select * from (SELECT s.company_name, 0 , s.id " +
            "FROM settings s LEFT OUTER JOIN users u ON s.id = u.company_id " +
            "WHERE u.company_id IS NULL )a " +
            " order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("Not found");
                } else {
                    resolve(results);
                }
            }).catch(function (err) {
                winston.error("Listing company settings failed", err);
                reject("Listing company settings failed" + err);
            });
    });

    var listChannels = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(ch.id) as total_channels, ch.company_id as id " +
            "from channels ch " +
            "inner join settings s on s.id = ch.company_id group by ch.company_id)as b " +
            "UNION ALL select * from (SELECT s.company_name, 0, s.id FROM settings s " +
            "LEFT OUTER JOIN channels ch ON s.id = ch.company_id " +
            "WHERE ch.company_id IS NULL)  a " +
            "order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("No data found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
                winston.error("Listing channels failed", err);
                reject("Listing channels failed" + err);
            });
    });

    var listVod = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(v.id) as total_vod, v.company_id as id " +
            "from vod v inner join settings s on s.id = v.company_id " +
            "group by v.company_id)as b UNION ALL select * from (SELECT s.company_name, 0, s.id FROM " +
            "settings s LEFT OUTER JOIN vod v ON s.id = v.company_id " +
            "WHERE v.company_id IS NULL) a order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("No data found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
                winston.error("Listing vod failed", err);
                reject('Listing vod failed' + err);
            });
    });

    var listAssets = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(am.id) as total_assets, am.company_id as id "+
            "from assets_master am inner join settings s on s.id = am.company_id "+
            "group by am.company_id)as b "+
            " UNION ALL select * from (SELECT s.company_name, 0, s.id "+
            "FROM settings s LEFT OUTER JOIN assets_master am ON s.id = am.company_id "+
            "WHERE am.company_id IS NULL)a "+
            "order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("No data found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
                winston.error("Listing assets failed", err);
                reject("Listing assets failed" + err);
            });
    });

    Promise.all([listAccounts, listChannels, listVod, listAssets]).then(function(data) {
        let totalArr = data[0];

        for (let i = 0; i < data[1].length; i++) {
            if(data[1][i].id === data[0][i].id)
            {
                totalArr[i] = Object.assign(totalArr[i], { total_channels: data[1][i].total_channels });
            }
            else  {
                totalArr[i] = Object.assign(totalArr[i], { total_channels: 0 });
            }
        }

        for (let i = 0; i < data[1].length; i++) {
            if(data[2][i].id === data[0][i].id)
            {
                totalArr[i] = Object.assign(totalArr[i], { total_vod: data[2][i].total_vod });
            }
            else {
                totalArr[i] = Object.assign(totalArr[i], { total_vod: 0 });
            }
        }

        for (let i = 0; i < data[1].length; i++) {
            if(data[3][i].id === data[0][i].id)
            {
                totalArr[i] = Object.assign(totalArr[i], { total_assets: data[3][i].total_assets });
            } else {
                totalArr[i] = Object.assign(totalArr[i], {total_assets: 0});
            }
        }

        res.status(200).send(totalArr)
    }).catch(err => {
        winston.error("Error at listing assets ", err);
    });
};

exports.listCompanySettingsDataById = function(req, res) {
    const id = req.params.id;
    var listAccounts = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(u.id) as total_accounts, u.company_id as id " +
            "from users u inner join settings s on s.id = u.company_id " +
            "group by u.company_id)as b " +
            "UNION ALL " +
            "select * from (SELECT s.company_name, 0 , s.id " +
            "FROM settings s LEFT OUTER JOIN users u ON s.id = u.company_id " +
            "WHERE u.company_id IS NULL )a " +
            " order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("Not found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
                winston.error("Failed listing company settings ", err);
                reject("Not found");
            });
    });

    var listChannels = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(ch.id) as total_channels, ch.company_id as id " +
            "from channels ch " +
            "inner join settings s on s.id = ch.company_id group by ch.company_id)as b " +
            "UNION ALL select * from (SELECT s.company_name, 0, s.id FROM settings s " +
            "LEFT OUTER JOIN channels ch ON s.id = ch.company_id " +
            "WHERE ch.company_id IS NULL)  a " +
            "order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("No data found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
            winston.error("Failed listing channels promise", err);
            reject("No data found")
        });
    });

    var listVod = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(v.id) as total_vod, v.company_id as id " +
            "from vod v inner join settings s on s.id = v.company_id " +
            "group by v.company_id)as b UNION ALL select * from (SELECT s.company_name, 0, s.id FROM " +
            "settings s LEFT OUTER JOIN vod v ON s.id = v.company_id " +
            "WHERE v.company_id IS NULL) a order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("No data found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
                winston.error("Failed listing vod promise", err);
                reject(err)
            });
    });

    var listAssets = new Promise(function(resolve, reject) {
        sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(am.id) as total_assets, am.company_id as id "+
            "from assets_master am inner join settings s on s.id = am.company_id "+
            "group by am.company_id)as b "+
            " UNION ALL select * from (SELECT s.company_name, 0, s.id "+
            "FROM settings s LEFT OUTER JOIN assets_master am ON s.id = am.company_id "+
            "WHERE am.company_id IS NULL)a "+
            "order by company_name",
            {type: sequelize_t.sequelize.QueryTypes.SELECT})
            .then(function (results) {
                if (!results) {
                    reject("No data found")
                } else {
                    resolve(results)
                }
            }).catch(function (err) {
            reject("No data found")
        });
    });

    Promise.all([listAccounts, listChannels, listVod, listAssets]).then(function(data) {
        const ob1 = data[0].find(x => x.id == id);
        const ob2 = data[1].find(x => x.id == id);
        const ob3 = data[2].find(x => x.id == id);
        const ob4 = data[3].find(x => x.id == id);
        const company_name = ob1.company_name;

        const ob = {  id, company_name, total_accounts: ob1.total_accounts, total_channels: ob2.total_channels, total_vod: ob3.total_vod, total_assets: ob4.total_assets };

        res.status(200).send(ob)
    }).catch(err => {
        winston.error("Failed getting all assets list data", err);
    });
};

exports.listAccounts = function (req, res) {
    const id = req.params.company1Id;
    var finalData = [];

    sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(u.id) as total_accounts, u.company_id as id " +
        "from users u inner join settings s on s.id = u.company_id " +
        "group by u.company_id)as b " +
        "UNION ALL " +
        "select * from (SELECT s.company_name, 0 , s.id " +
        "FROM settings s LEFT OUTER JOIN users u ON s.id = u.company_id " +
        "WHERE u.company_id IS NULL )a " +
        " order by company_name",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                finalData = results;
                res.json(results);
            }
        }).catch(function (err) {
        winston.error("Getting data failed with error: ", err);
        res.jsonp(err);
    });

    return finalData
};



exports.listChannels = function (req, res) {
    const id = req.params.channelId;
    var finalData = [];

    sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(ch.id) as total_channels, ch.company_id as id " +
        "from channels ch " +
        "inner join settings s on s.id = ch.company_id group by ch.company_id)as b " +
        "UNION ALL select * from (SELECT s.company_name, 0, s.id FROM settings s " +
        "LEFT OUTER JOIN channels ch ON s.id = ch.company_id " +
        "WHERE ch.company_id IS NULL)  a " +
        "order by company_name",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                finalData = results;
                res.json(results);
            }
        }).catch(function (err) {
        winston.error("Getting channels list failed with error: ", err);
        res.jsonp(err);
    });

    return finalData
};


exports.listVod = function (req, res) {
    const id = req.params.vodId;
    var finalData = [];
    //console.log(id);
    sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(v.id) as total_vod, v.company_id as id " +
        "from vod v inner join settings s on s.id = v.company_id " +
        "group by v.company_id)as b UNION ALL select * from (SELECT s.company_name, 0, s.id FROM " +
        "settings s LEFT OUTER JOIN vod v ON s.id = v.company_id " +
        "WHERE v.company_id IS NULL) a order by company_name",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                finalData = results;
                res.json(results);
            }
        }).catch(function (err) {
        winston.error("Getting vod list failed with error: ", err);
        res.jsonp(err);
    });

    return finalData;
};

exports.listAssets = function (req, res) {
    const id = req.params.assetsId;
    var finalData = [];
    sequelize_t.sequelize.query("select * from (select s.company_name, COUNT(am.id) as total_assets, am.company_id as id "+
        "from assets_master am inner join settings s on s.id = am.company_id "+
        "group by am.company_id)as b "+
        " UNION ALL select * from (SELECT s.company_name, 0, s.id "+
        "FROM settings s LEFT OUTER JOIN assets_master am ON s.id = am.company_id "+
        "WHERE am.company_id IS NULL)a "+
        "order by company_name",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                finalData = results;
                res.json(results);
            }
        }).catch(function (err) {
            winston.error("Getting assets list failed with error: ", err);
            res.jsonp(err);
    });

    return finalData;
};





/**
 * middleware
 */
exports.dataByID = function (req, res, next, id) {

    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    DBModel.find({
        where: {
            id: id
        },
        include: []
    }).then(function (result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.settings = result;
            next();
            return null;
        }
    }).catch(function (err) {
        winston.error("Getting setting data failed with error: ", err);
        return next(err);
    });

};


exports.companyDataByID = function (req, res, next, id) {
//"+req.token.company_id+"
    const company_id = req.params.company1Id;
    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    sequelize_t.sequelize.query("select * from (select * from (select s.company_name, COUNT(u.id) as total_accounts, u.company_id as id " +
        "from users u inner join settings s on s.id = u.company_id " +
        "group by u.company_id)as b " +
        "UNION ALL " +
        "select * from (SELECT s.company_name, 0 , s.id " +
        "FROM settings s LEFT OUTER JOIN users u ON s.id = u.company_id " +
        "WHERE u.company_id IS NULL )a " +
        " order by company_name)d where id = "+company_id+" ",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                res.json(results[0]);

            }
        }).catch(function (err) {
        winston.error("Getting data failed with error: ", err);
        res.jsonp(err);
    });

};



exports.channelDataByID = function (req, res, next, id) {
//"+req.token.company_id+"
    const channel_id = req.params.companyId;
    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    sequelize_t.sequelize.query("select * from (select * from (select s.company_name, COUNT(ch.id) as total_channels, ch.company_id as id " +
        "from channels ch " +
        "inner join settings s on s.id = ch.company_id group by ch.company_id)as b " +
        "UNION ALL select * from (SELECT s.company_name, 0, s.id FROM settings s " +
        "LEFT OUTER JOIN channels ch ON s.id = ch.company_id " +
        "WHERE ch.company_id IS NULL)  a " +
        "order by company_name)d where id = "+channel_id+" ",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                res.json(results[0]);
            }
        }).catch(function (err) {
        winston.error("Getting data failed with error: ", err);
        res.jsonp(err);
    });

};

exports.vodDataByID = function (req, res, next, id) {
    const vod_id = req.params.vodId;
    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    sequelize_t.sequelize.query("select * from (select * from (select s.company_name, COUNT(v.id) as total_vod, v.company_id as id " +
        "from vod v inner join settings s on s.id = v.company_id " +
        "group by v.company_id)as b UNION ALL select * from (SELECT s.company_name, 0, s.id FROM " +
        "settings s LEFT OUTER JOIN vod v ON s.id = v.company_id " +
        "WHERE v.company_id IS NULL) a order by company_name)d where id = "+vod_id+" ",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                res.json(results[0]);
            }
        }).catch(function (err) {
        winston.error("Getting data failed with error: ", err);
        res.jsonp(err);
    });

};


exports.assetsDataByID = function (req, res, next, id) {
//"+req.token.company_id+"
    const assets_id = req.params.assetsId;
    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    sequelize_t.sequelize.query("select * from (select * from (select s.company_name, COUNT(am.id) as total_assets, am.company_id as id "+
        "from assets_master am inner join settings s on s.id = am.company_id "+
        "group by am.company_id)as b "+
        " UNION ALL select * from (SELECT s.company_name, 0, s.id "+
        "FROM settings s LEFT OUTER JOIN assets_master am ON s.id = am.company_id "+
        "WHERE am.company_id IS NULL)a "+
        "order by company_name)d where id = "+assets_id+" ",
        {type: sequelize_t.sequelize.QueryTypes.SELECT})
        .then(function (results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                res.json(results[0]);
            }
        }).catch(function (err) {
        winston.error("Getting data failed with error: ", err);
        res.jsonp(err);
    });

};





