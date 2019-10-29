'use strict'

var path = require('path'),
    db = require(path.resolve('config/lib/sequelize')).models,
    sequelize_t = require(path.resolve('./config/lib/sequelize')),
    redis = require(path.resolve('./config/lib/redis')),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    winston = require('winston'),
    companyFunctions = require(path.resolve('./custom_functions/company')),
    userFunctions = require(path.resolve('./custom_functions/user'));

/**
 * @api {post} /api/public/company Create Company
 * @apiVersion 0.2.0
 * @apiName CreateCompany
 * @apiGroup Company
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam {String} company_name Company name
 * @apiParam {Number} expire_date Date when service of company is canceled
 * @apiParam {Number} client_limit Limit of clients
 * @apiParam {Number} channel_limit Limit of channels
 * @apiParam {Number} vod_limit Limit of vods
 * @apiParam {String} email Email of company owner
 * @apiParam {String} telephone Telephone of company owner
 * @apiParam {String} [mobile_background_url] Company settings
 * @apiParam {String} [mobile_logo_url] Company settings
 * @apiParam {String} [box_logo_url] Company settings
 * @apiParam {String} [box_background_url] Company settings
 * @apiParam {String} [vod_background_url] Company settings
 * @apiParam {String} [assets_url] Company settings
 * @apiParam {String} [company_logo] Company settings
 * @apiParam {String} [email_address] Company settings
 * @apiParam {String} [email_username] Company settings
 * @apiParam {String} [email_password] Company settings
 * @apiSuccess (200) {JSON} data Response data
 * @apiSuccess {String} data.message Message
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 * 
 * @apiSuccessExample {Json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "data" : {
 *          message : 'Company created successfully'
 *     }
 * }
 * 
 */
exports.createCompany = function (req, res) {
    companyFunctions.createCompany(req)
        .then(function (result) {
            userFunctions.sendInvite(req, result.owner, true).then(function () {
                res.status(200).send({ data: {message: "Company created successfully"} });
            }).catch(function (err) {
                res.status(500).send({ error: {code: 500, message: 'Company created but failed to send invitation'}})
            })
        }).catch(function (result) {
            res.status(result.error.code).send(result);
        });
}

/**
 * 
 * @api {put} /api/public/company/:id Update Company
 * @apiName UpdateCompany
 * @apiGroup Company
 * @apiVersion  0.2.0
 * 
 * @apiParam (Path parameter) {Number} id Id of the company
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam {String} [company_name] Company name
 * @apiParam {String} [mobile_background_url] Company settings
 * @apiParam {String} [mobile_logo_url] Company settings
 * @apiParam {String} [box_logo_url] Company settings
 * @apiParam {String} [box_background_url] Company settings
 * @apiParam {String} [vod_background_url] Company settings
 * @apiParam {String} [assets_url] Company settings
 * @apiParam {String} [company_logo] Company settings
 * @apiParam {String} [email_address] Company settings
 * @apiParam {String} [email_username] Company settings
 * @apiParam {String} [email_password] Company settings
 * 
 * @apiSuccess (200) {Object}  data Response data
 * @apiSuccess {String} data.message Message
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 * @apiSuccessExample {Json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *     "data" : {
 *          message : 'Company updated successfully'
 *     }
 * }
 * 
 * 
 */
exports.updateCompany = function (req, res) {
    db.settings.findOne({
        where: { id: req.params.id }
    }).then(function (company) {
        if (!company) {
            res.status(404).send({ error: { code: 404, message: 'Commpany not found' } });
            return;
        }

        company.update(req.body)
            .then(function () {
                res.send({ data: { message: 'Company updated successfully' } });
            }).catch(function (err) {
                winston.error('Company update failed with error: ', err);
                res.status(500).send({ error: { code: 500, message: 'Internal error' } });
            });
    }).catch(function (err) {
        winston.error('Getting company failed with error: ', err);
        res.status(500).send({ error: { code: 500, message: 'Internal error' } });
    });
}

/**
 * 
 * @api {get} /api/public/company Get Company List
 * @apiName GetCompanyList
 * @apiGroup Company
 * @apiVersion  0.2.0
 * 
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object[]} data Response data
 * @apiSuccess {String} data.company_name Company name
 * @apiSuccess {String} data.mobile_background_url Company settings
 * @apiSuccess {String} data.mobile_logo_url Company settings
 * @apiSuccess {String} data.box_logo_url Company settings
 * @apiSuccess {String} data.box_background_url Company settings
 * @apiSuccess {String} data.vod_background_url Company settings
 * @apiSuccess {String} data.assets_url Company settings
 * @apiSuccess {String} data.company_logo Company settings
 * @apiSuccess {String} data.email_address Company settings
 * @apiSuccess {String} data.email_username Company settings
 * @apiSuccess {String} data.email_password Company settings
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 * @apiSuccessExample {Json} Success-Response:
 * HTTP/1.1 200 OK
 * {
    "data": [
        {
            "id": 1,
            "company_name": "Magoware",
            "mobile_background_url": "/files/settings/1560106088690testwhite.png",
            "mobile_logo_url": "/files/settings/1560106094435testwhite.png",
            "box_logo_url": "/files/settings/1560106103845testwhite.png",
            "box_background_url": "/files/settings/1560106109251testwhite.png",
            "vod_background_url": "/files/settings/1560106114012testwhite.png",
            "assets_url": "https://devapp.magoware.tv",
            "company_logo": "/files/settings/1560106069137testwhite.png",
            "email_address": "gentjana.lalaj@magoware.tv",
            "email_username": "gentjana.lalaj@magoware.tv",
            "email_password": "High-co2mand1",
            "client_limit": 2132,
            "vod_limit": 391,
            "channel_limit": 2132
        },
    ]
 * }
 * 
 * 
 */
exports.getCompanies = function (req, res) {
    db.settings.findAll({
        attributes: ['id', 'company_name', 'mobile_background_url', 'mobile_logo_url', 'box_logo_url',
            'box_background_url', 'vod_background_url', 'assets_url', 'company_logo', 'email_address', 'email_username',
            'email_password', 'asset_limitations']
    }).then(function (companies) {
        let companyList = [];
        for (let i = 0; i < companies.length; i++) {
            let asset_limitations = companies[i].get('asset_limitations');
            let company = companies[i].toJSON();
            company.client_limit = asset_limitations.client_limit;
            company.vod_limit = asset_limitations.vod_limit;
            company.channel_limit = asset_limitations.channel_limit;
            delete company.asset_limitations;
            companyList.push(company);
        }

        res.send({ data: companyList });
    }).catch(function (err) {
        winston.error('Getting companies failed with error:', err);
        res.status(500).send({ error: { code: 500, message: 'Internal error' } })
    })
}