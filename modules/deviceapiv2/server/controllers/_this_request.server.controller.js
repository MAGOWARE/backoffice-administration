'use strict'
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    responses = require(path.resolve("./config/responses.js")),
    models = db.models,
    winston = require(path.resolve('./config/lib/winston'));

//find one user data information and pass it to request
exports.read_thisuser_information = function(req,res,next){
    let COMPANY_ID = req.get("company_id") || 1;

    models.login_data.findOne({
        where: {username: req.auth_obj.username, company_id: COMPANY_ID},
        include: [{model:models.customer_data}] //{model:models.subscription}
    }).then(function (result) {
        if(result) {
              req.thisuser = result;
              next();
              return null; //returns promise
            }
            else {
            responses.send_res_get(req, res, [], 702, -1, 'USER_NOT_FOUND_DESCRIPTION', 'USER_NOT_FOUND_DATA', 'no-store');
        }
    }).catch(function(error) {
        responses.send_res_get(req, res, [], 888, -1, 'USER_NOT_FOUND_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
};