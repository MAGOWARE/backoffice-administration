'use strict'

var path = require('path'),
    db = require(path.resolve('config/lib/sequelize')).models,
    winston = require('winston');

 /**
 * @api {get} /api/public/combo Get combos/products
 * @apiName GetCombos
 * @apiGroup Combo
 * @apiVersion  0.2.0
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam (Query parameters) {Number} offset Offset where start getting combos
 * @apiSuccess (200) {Object[]} data Response
 * @apiSuccess {Number} data.id Combo id
 * @apiSuccess {Number} data.product_id Product id
 * @apiSuccess {String} data.name Combo name
 * @apiSuccess {Number} data.duration Combo duration
 * @apiSuccess {Number} data.value Combo value
 * @apiSuccess {Date} data.createdAt Created date of the combo
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
*/
exports.getCombos = function(req, res) {
    let query = {};
    query.attributes = ['id','product_id','name', 'duration', 'value', 'isavailable','createdAt'];
    query.where = {company_id: req.token.company_id};
    query.limit = 100;
    query.order = 'id desc';
    query.raw = true;

    if (req.query.offset) {
        let offset = parseInt(req.query.offset);
        query.offset = offset;
    }

    db.combo.findAll(query)
        .then(function(results) {
            if (!results) {
                return res.status(204).send({
                    data: []
                });
            } else {
                res.json({data: results});
            }
        }).catch(function(err) {
            winston.error("Getting list of products failed with error: ", err);
            res.status(500).send({error: {code: 500, message: 'Internal error'}});
        });
};