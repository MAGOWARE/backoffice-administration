'use strict';
const path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')),
  sequelize = require('sequelize'),
  response = require(path.resolve("./config/responses.js")),
  crypto = require('crypto'),
  models = db.models,
  winston = require(path.resolve('./config/lib/winston'));
const sequelizes = require(path.resolve('./config/lib/sequelize'));
const async = require('async');
const sqlstring = require('sqlstring');
const dateformat = require('dateformat');


//RETURNS LIST OF VOD PROGRAMS VIA GET Request
/**
 * @api {get} /apiv2/vod/listnewdata/:pagenumber GetVodNewDataList
 * @apiName GetVodNewDataList
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiHeader {String[]} etag Timestamp when last successful request was made to get saved data
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns a chunk of video on demand assets/movies that have been modified after specifik time
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.list_get_newdata = function (req, res) {

  models.subscription.findAll({
    attributes: ['package_id'], where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}, group: ['package_id'],
    include: [{
      model: models.package,
      required: true,
      attributes: [],
      where: {package_type_id: req.auth_obj.screensize + 2},
      include: [{
        model: models.package_vod, required: true, attributes: []
      }]
    }],
    raw: true
  }).then(function (result) {
    if (result && result.length > 0) {
      let package_list = [];
      for (let i = 0; i < result.length; i++) {
        package_list.push(result[i].package_id); //list of packages into array
      }
      const allowed_content = [0, 1]; //(req.thisuser.show_adult === true) ? [0, 1] : [0];
      const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

      const offset = (!req.params.pagenumber || req.params.pagenumber === '-1') ? 0 : ((parseInt(req.params.pagenumber) - 1) * req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr); //for older versions of vod, start query at first record
      const limit = (!req.params.pagenumber || req.params.pagenumber === '-1') ? 99999999999 : req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr; //for older versions of vod, set limit to 99999999999


      if (isNaN(req.headers['etag'])) {
        var tmptimestamp = 0;
      } else {
        var tmptimestamp = Number(req.headers['etag'])
      }


      models.vod.findAll({
        attributes: ['id', 'title', 'pin_protected', 'duration', 'rate', 'isavailable', [db.sequelize.literal('UNIX_TIMESTAMP(createdAt) * 1000'), "dataadded"],
          [db.sequelize.fn('concat', db.sequelize.col('vod.description'), '<p><strong>Director:</strong> ', db.sequelize.col('vod.director'),
            '</p><p><strong>Starring:</strong> ', db.sequelize.col('vod.starring'), '</p>'), 'description'],
          [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "release_date"],
          [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
          [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('icon_url')), 'icon']
        ],
        include: [
          {
            model: models.vod_stream,
            required: true,
            attributes: ['url', 'drm_platform', 'encryption', 'token', 'stream_format', 'token_url'],
            where: {
              stream_source_id: req.thisuser.vod_stream_source,
              stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
            }
          },
          {
            model: models.vod_vod_categories,
            required: true,
            attributes: ['category_id'],
            where: {is_available: true},
            include: [{model: models.vod_category, attributes: ['name']}]
          },
          {model: models.package_vod, required: true, attributes: [], where: {package_id: {in: package_list}}}
        ],
        where: {
          pin_protected: {in: allowed_content},
          adult_content: show_adult,
          isavailable: true,
          updatedAt: {gt: tmptimestamp},
          expiration_time: {$gte: Date.now()},
          company_id: req.thisuser.company_id
        },
        offset: offset,
        limit: limit
      }).then(function (result) {
        let raw_result = [];
        //flatten nested json array
        async.forEach(result, function (obj, callback) {
          let raw_obj = obj.toJSON();

          let category_list = "";
          for (let i = 0; i < obj.vod_vod_categories.length; i++) {
            if (category_list.length > 0) category_list += ", " + obj.vod_vod_categories[i].vod_category.name;
            else category_list += obj.vod_vod_categories[i].vod_category.name;
          }

          raw_obj.id = String(obj.id);
          raw_obj.vod_type = "film";
          raw_obj.rate = (raw_obj.rate > 0 && raw_obj.rate <= 10) ? String(obj.rate) : "5"; // rate should be in the interval ]0:10]
          raw_obj.year = String(obj.release_date);

          raw_obj.categoryid = String(obj.vod_vod_categories[0].category_id);
          raw_obj.categories = category_list;
          delete raw_obj.vod_vod_categories;

          raw_obj.url = obj.vod_streams[0].url;
          raw_obj.stream_format = obj.vod_streams[0].stream_format;
          raw_obj.token = (obj.vod_streams[0].token === true) ? "1" : "0";
          raw_obj.TokenUrl = (obj.vod_streams[0].token_url) ? obj.vod_streams[0].token_url : "";
          raw_obj.encryption = (obj.vod_streams[0].encryption === true) ? "1" : "0";
          raw_obj.encryption_url = (obj.vod_streams[0].encryption_url) ? obj.vod_streams[0].encryption_url : "";
          raw_obj.drm_platform = obj.vod_streams[0].drm_platform;
          delete raw_obj.vod_streams;

          raw_result.push(raw_obj);
          callback(null);
        }, function (error, results) {
          if (result.length > 0) res.setHeader("etag", Date.now());
          else res.setHeader("etag", tmptimestamp);
          response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        });
      }).catch(function (error) {
        winston.error("Getting a list of vod items failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
      });
    } else {
      response.send_res_get(req, res, [], 200, 1, 'NO_DATA_FOUND', 'OK_DATA', 'private,max-age=86400');
    }
    return null;
  }).catch(function (error) {
    winston.error("Searching for the client's subscription failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//RETURNS LIST OF VOD PROGRAMS VIA GET Request
/**
 * @api {get} /apiv2/vod/list/:pagenumber VodList
 * @apiName VodList
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns a chunk of video on demand items
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.list_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  const offset = (!req.params.pagenumber || req.params.pagenumber === '-1') ? 0 : ((parseInt(req.params.pagenumber) - 1) * req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr); //for older versions of vod, start query at first record
  const limit = (!req.params.pagenumber || req.params.pagenumber === '-1') ? 99999999999 : req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr; //for older versions of vod, set limit to 99999999999


  models.vod.findAll({
    attributes: ['id', 'title', 'pin_protected', 'duration', 'rate', [db.sequelize.literal('UNIX_TIMESTAMP(vod.createdAt) * 1000'), "dataadded"],
      [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
      [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('vod.icon_url')), 'icon'],
      [db.sequelize.fn('concat', db.sequelize.col('vod.description'), '<p><strong>Director:</strong> ', db.sequelize.col('vod.director'),
        '</p><p><strong>Starring:</strong> ', db.sequelize.col('vod.starring'), '</p>'), 'description'],
      [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "release_date"]],
    include: [
      {
        model: models.vod_stream,
        required: true,
        attributes: ['url', 'drm_platform', 'encryption', 'token', 'stream_format', 'token_url']
      },
      {
        model: models.vod_vod_categories, required: true, attributes: ['category_id'], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: ['name'],
          where: {password: {in: allowed_content}, isavailable: true}
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    offset: offset,
    limit: limit,
    subQuery: false
  }).then(function (result) {
    let raw_result = [];
    //flatten nested json array
    async.forEach(result, function (obj, callback) {
      let raw_obj = obj.toJSON();
      let category_list = "";
      for (let i = 0; i < obj.vod_vod_categories.length; i++) {
        if (category_list.length > 0) category_list += ", " + obj.vod_vod_categories[i].vod_category.name;
        else category_list += obj.vod_vod_categories[i].vod_category.name;
      }

      raw_obj.id = String(obj.id);
      raw_obj.vod_type = "film";
      raw_obj.rate = (raw_obj.rate > 0 && raw_obj.rate <= 10) ? String(obj.rate) : "5"; // rate should be in the interval ]0:10]
      raw_obj.year = String(obj.release_date);

      raw_obj.categoryid = String(obj.vod_vod_categories[0].category_id);
      raw_obj.categories = category_list;
      delete raw_obj.vod_vod_categories;

      raw_obj.url = obj.vod_streams[0].url;
      raw_obj.stream_format = obj.vod_streams[0].stream_format;
      raw_obj.token = (obj.vod_streams[0].token === true) ? "1" : "0";
      raw_obj.TokenUrl = (obj.vod_streams[0].token_url) ? obj.vod_streams[0].token_url : "";
      raw_obj.encryption = (obj.vod_streams[0].encryption === true) ? "1" : "0";
      raw_obj.encryption_url = (obj.vod_streams[0].encryption_url) ? obj.vod_streams[0].encryption_url : "";
      raw_obj.drm_platform = obj.vod_streams[0].drm_platform;
      delete raw_obj.vod_streams;

      raw_result.push(raw_obj);
      callback(null);
    }, function (error, result) {
      response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
    });
  }).catch(function (error) {
    winston.error("Getting list of vod items failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//RETURNS LIST OF VOD PROGRAMS
/**
 * @api {post} /apiv2/vod/list VodCompleteList
 * @apiName VodCompleteList
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns video on demand assets/movies
 *
 * Copy paste this auth for testing purposes
 *auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.list = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  const offset = (!req.body.subset_number || req.body.subset_number === '-1') ? 0 : ((parseInt(req.body.subset_number) - 1) * req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr); //for older versions of vod, start query at first record
  const limit = (!req.body.subset_number || req.body.subset_number === '-1') ? 99999999999 : req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr; //for older versions of vod, set limit to 99999999999

  models.vod.findAll({
    attributes: ['id', 'title', 'pin_protected', 'duration', 'rate', [db.sequelize.literal('UNIX_TIMESTAMP(vod.createdAt) * 1000'), "dataadded"],
      [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "release_date"],
      [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
      [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('vod.icon_url')), 'icon'],
      [db.sequelize.fn('concat', db.sequelize.col('vod.description'), '<p><strong>Director:</strong> ', db.sequelize.col('vod.director'),
        '</p><p><strong>Starring:</strong> ', db.sequelize.col('vod.starring'), '</p>'), 'description']
    ],
    include: [
      {
        model: models.vod_stream,
        required: true,
        attributes: ['url', 'encryption', 'token', 'stream_format', 'token_url', 'drm_platform']
      },
      {
        model: models.vod_vod_categories,
        required: true,
        attributes: ['category_id'],
        where: {is_available: true},
        include: [{model: models.vod_category, attributes: ['name'], where: {isavailable: true}}]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    offset: offset,
    limit: limit,
    subQuery: false
  }).then(function (result) {
    let raw_result = [];
    //flatten nested json array

    async.forEach(result, function (obj, callback) {
      let raw_obj = obj.toJSON();
      let category_list = "";
      for (let i = 0; i < obj.vod_vod_categories.length; i++) {
        if (category_list.length > 0) category_list += ", " + obj.vod_vod_categories[i].vod_category.name;
        else category_list += obj.vod_vod_categories[i].vod_category.name;
      }
      raw_obj.id = String(obj.id);
      raw_obj.vod_type = "film";
      raw_obj.rate = (raw_obj.rate > 0 && raw_obj.rate <= 10) ? String(obj.rate) : "5"; // rate should be in the interval ]0:10]
      raw_obj.year = String(obj.release_date);

      raw_obj.categoryid = String(obj.vod_vod_categories[0].category_id);
      raw_obj.categories = category_list;
      delete raw_obj.vod_vod_categories;

      raw_obj.url = obj.vod_streams[0].url;
      raw_obj.stream_format = obj.vod_streams[0].stream_format;
      raw_obj.token = (obj.vod_streams[0].token === true) ? "1" : "0";
      raw_obj.TokenUrl = (obj.vod_streams[0].token_url) ? obj.vod_streams[0].token_url : "";
      raw_obj.encryption = (obj.vod_streams[0].encryption === true) ? "1" : "0";
      raw_obj.encryption_url = (obj.vod_streams[0].encryption_url) ? obj.vod_streams[0].encryption_url : "";
      raw_obj.drm_platform = obj.vod_streams[0].drm_platform;
      delete raw_obj.vod_streams;

      raw_result.push(raw_obj);
      callback(null);
    }, function (error, result) {
      response.send_partial_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
    });
  }).catch(function (error) {
    winston.error("Getting list of vod items failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


//RETURNS FULL LIST OF CATEGORIES
/**
 * @api {post} /apiv2/vod/categories VodCategories
 * @apiName VodCategories
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns list of categories
 *
 * Copy paste this auth for testing purposes
 *auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.categories = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod_category.findAll({
    attributes: ['id', 'name', 'password', 'sorting', 'icon_url', 'small_icon_url'],
    include: [{
      model: models.vod_vod_categories,
      attributes: [],
      where: {is_available: true, company_id: req.thisuser.company_id},
      include: [
        {
          model: models.vod,
          attributes: [],
          required: true,
          where: {
            pin_protected: {in: allowed_content},
            adult_content: show_adult,
            isavailable: true,
            expiration_time: {$gte: Date.now()}
          },
          include: [
            {model: models.vod_stream, required: true, attributes: []},
            {
              model: models.package_vod, required: true, attributes: [],
              include: [{
                model: models.package,
                required: true,
                attributes: [],
                where: {package_type_id: req.auth_obj.screensize + 2},
                include: [{
                  model: models.subscription,
                  required: true,
                  attributes: [],
                  where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
                }]
              }]
            }
          ]
        }
      ]
    }],
    where: {password: {in: allowed_content}, isavailable: true, company_id: req.thisuser.company_id}
  }).then(function (result) {
    let category_list = [];
    //type conversation of id from int to string. Setting static values
    for (let i = 0; i < result.length; i++) {
      const temp_list = {
        "id": result[i].id.toString(),
        "name": result[i].name,
        "password": (result[i].password) ? "True" : "False",
        "sorting": result[i].sorting,
        "IconUrl": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result[i].icon_url,
        "small_icon_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result[i].small_icon_url,
        "pay": "False"
      };
      category_list.push(temp_list);
    }
    response.send_res(req, res, category_list, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of vod genres failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//RETURNS FULL LIST OF CATEGORIES GET
/**
 * @api {get} /apiv2/vod/categories VodCategoriesGet
 * @apiName VodCategoriesGet
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns list of vod categories
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.categories_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod_category.findAll({
    attributes: ['id', 'name', 'password', 'sorting', 'icon_url', 'small_icon_url'],
    include: [{
      model: models.vod_vod_categories,
      attributes: [],
      where: {is_available: true, company_id: req.thisuser.company_id},
      include: [
        {
          model: models.vod,
          attributes: [],
          required: true,
          where: {
            pin_protected: {in: allowed_content},
            adult_content: show_adult,
            isavailable: true,
            expiration_time: {$gte: Date.now()}
          },
          include: [
            {model: models.vod_stream, required: true, attributes: []},
            {
              model: models.package_vod, required: true, attributes: [],
              include: [{
                model: models.package,
                required: true,
                attributes: [],
                where: {package_type_id: req.auth_obj.screensize + 2},
                include: [{
                  model: models.subscription,
                  required: true,
                  attributes: [],
                  where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
                }]
              }]
            }
          ]
        }
      ]
    }],
    where: {password: {in: allowed_content}, isavailable: true, company_id: req.thisuser.company_id}
  }).then(function (result) {
    let category_list = [];
    //type conversation of id from int to string. Setting static values
    for (let i = 0; i < result.length; i++) {
      const temp_list = {
        "id": result[i].id.toString(),
        "name": result[i].name,
        "password": (result[i].password) ? "True" : "False",
        "sorting": result[i].sorting,
        "IconUrl": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result[i].icon_url,
        "small_icon_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result[i].small_icon_url,
        "pay": "False"
      };
      category_list.push(temp_list);
    }
    response.send_res_get(req, res, category_list, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of vod categories failed with error: ", error);
    response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//RETURNS SUBTITLE DATA FOR A ITEM IF SPECIFIED, OR FOR ALL ITEMS OTHERWISE
/**
 * @api {post} /apiv2/vod/subtitles VodSubtitle
 * @apiName VodSubtitle
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiDescription Returns a complete subtitle list
 *
 * Use this token for testing purposes
 *
 * auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 */

/**
 * @api {post} /apiv2/vod/movie_subtitle VodSubtitles
 * @apiName VodSubtitles
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {Number} vod_id Specify id of vod item for subtitle
 * @apiDescription Returns subtitles for a single vod item
 *
 * Use this token for testing purposes
 *
 * auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 */
exports.subtitles = function (req, res) {
  const subtitle_where = (req.body.vod_id) ? {
    vod_id: req.body.vod_id,
    company_id: req.thisuser.company_id
  } : {vod_id: {$gt: 0}, company_id: req.thisuser.company_id};
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];

  models.vod_subtitles.findAll({
    attributes: [['vod_id', 'vodid'], 'title', 'subtitle_url'],
    include: [
      {
        model: models.vod,
        required: true,
        attributes: [],
        where: {pin_protected: {in: allowed_content}, isavailable: true, expiration_time: {$gte: Date.now()}},
        include: [
          {model: models.vod_stream, required: true, attributes: []},
          {
            model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
            include: [{
              model: models.vod_category,
              required: true,
              attributes: [],
              where: {password: {in: allowed_content}, isavailable: true}
            }]
          },
          {
            model: models.package_vod, required: true, attributes: [],
            include: [{
              model: models.package,
              required: true,
              attributes: [],
              where: {package_type_id: req.auth_obj.screensize + 2},
              include: [{
                model: models.subscription,
                required: true,
                attributes: [],
                where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
              }]
            }]
          }
        ]
      }
    ],
    where: subtitle_where
  }).then(function (result) {
    //type conversation of id from int to string
    let vod_subtitles = [];
    for (let i = 0; i < result.length; i++) {
      let temp_obj = {};
      temp_obj.vodid = String(result[i].toJSON().vodid);
      temp_obj.title = result[i].title;
      temp_obj.url = req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result[i].subtitle_url;
      vod_subtitles.push(temp_obj)
    }
    response.send_res(req, res, vod_subtitles, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of vod subtitles failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//RETURNS ALL SUBTITLES FOR THE SELECTED PROGRAM GET METHOD
/**
 * @api {get} /apiv2/vod/subtitles VodSubtitlesGet
 * @apiVersion 0.2.0
 * @apiName VodSubtitlesGet
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiDescription Returns all subtitles list
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.subtitles_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];

  models.vod_subtitles.findAll({
    attributes: [['vod_id', 'vodid'], 'title', [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('subtitle_url')), 'url']],
    include: [
      {
        model: models.vod,
        required: true,
        attributes: [],
        where: {pin_protected: {in: allowed_content}, isavailable: true, expiration_time: {$gte: Date.now()}},
        include: [
          {model: models.vod_stream, required: true, attributes: []},
          {
            model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
            include: [{
              model: models.vod_category,
              required: true,
              attributes: [],
              where: {password: {in: allowed_content}, isavailable: true}
            }]
          },
          {
            model: models.package_vod, required: true, attributes: [],
            include: [{
              model: models.package,
              required: true,
              attributes: [],
              where: {package_type_id: req.auth_obj.screensize + 2},
              include: [{
                model: models.subscription,
                required: true,
                attributes: [],
                where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
              }]
            }]
          }
        ]
      }
    ],
    where: {company_id: req.thisuser.company_id}
  }).then(function (result) {
    //type conversation of id from int to string
    for (let i = 0; i < result.length; i++) {
      result[i].toJSON().vodid = String(result[i].toJSON().vodid);
    }
    response.send_res_get(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of vod subtitles failed with error: ", error);
    response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//RETURNS CLICKS FOR THE SELECTED PROGRAM
/**
 * @api {post} /apiv2/vod/totalhits VodTotalHits
 * @apiName VodTotalHits
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {Number} id_vod VOD item ID
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns number of clicks for selected vod item
 *
 * Copy paste this auth for testing purposes
 *auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.totalhits = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  //if hits for a specific movie are requested
  if (req.body.id_vod != "all") {
    models.vod.findAll({
      attributes: [['id', 'id_vod'], ['clicks', 'hits']],
      where: {
        id: req.body.id_vod,
        pin_protected: {in: allowed_content},
        adult_content: show_adult,
        isavailable: true,
        expiration_time: {$gte: Date.now()},
        company_id: req.thisuser.company_id
      },
      include: [
        {model: models.vod_stream, required: true, attributes: []},
        {
          model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
          include: [{
            model: models.vod_category,
            required: true,
            attributes: [],
            where: {password: {in: allowed_content}, isavailable: true}
          }]
        }]
    }).then(function (result) {
      response.send_res(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
    }).catch(function (error) {
      winston.error("Getting number of clicks for a vod item failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
  }
  //return hits for each vod movie
  else {
    models.vod.findAll({
      attributes: [['id', 'id_vod'], ['clicks', 'hits']],
      where: {
        pin_protected: {in: allowed_content},
        isavailable: true,
        expiration_time: {$gte: Date.now()},
        company_id: req.thisuser.company_id
      },
      include: [
        {model: models.vod_stream, required: true, attributes: []},
        {
          model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
          include: [{
            model: models.vod_category,
            required: true,
            attributes: [],
            where: {password: {in: allowed_content}, isavailable: true}
          }]
        },
        {
          model: models.package_vod, required: true, attributes: [],
          include: [{
            model: models.package,
            required: true,
            attributes: [],
            where: {package_type_id: req.auth_obj.screensize + 2},
            include: [{
              model: models.subscription,
              required: true,
              attributes: [],
              where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
            }]
          }]
        }
      ]
    }).then(function (result) {
      response.send_res(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
    }).catch(function (error) {
      winston.error("Getting the list of vod clicks failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
  }

};


/**
 * @api {post} /apiv2/vod/mostwatched VodMostWatched
 * @apiName VodMostWatched
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns most played movies.
 *
 * Copy paste this auth for testing purposes
 *auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id": 17,
 *       "clicks": 1567
 *      }, ...
 */
exports.mostwatched = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  //if hits for a specific movie are requested
  models.vod.findAll({
    attributes: ['id', 'clicks'],
    limit: 30, subQuery: false,
    order: [['clicks', 'DESC']],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}},
          isavailable: true
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ]
  }).then(function (result) {
    for (let i = 0; i < result.length; i++) {
      result[i].toJSON().id = String(result[i].toJSON().id);
    }
    response.send_res(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of most watched vod items failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/mostwatched VodMostWatchedGet
 * @apiName VodMostWatchedGet
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns most played movies.
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id": 17,
 *       "clicks": 1567
 *      }, ...
 */
exports.mostwatched_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  //if hits for a specific movie are requested
  models.vod.findAll({
    attributes: ['id', 'clicks'],
    limit: 30, subQuery: false,
    order: [['clicks', 'DESC']],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}},
          isavailable: true
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ]
  }).then(function (result) {
    for (let i = 0; i < result.length; i++) {
      result[i].toJSON().id = String(result[i].toJSON().id);
    }
    response.send_res_get(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of most watched movies failed with error: ", error);
    response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {post} /apiv2/vod/mostrated VodMostRated
 * @apiName VodMostRated
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns list of most rated vod items
 *
 * Copy paste this auth for testing purposes
 *auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.mostrated = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  //if most rated movies are requested
  models.vod.findAll({
    attributes: ['id', 'rate'], order: [['rate', 'DESC']],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    limit: 30, subQuery: false,
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}},
          isavailable: true
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ]
  }).then(function (result) {
    let mostrated = [];

    for (let i = 0; i < result.length; i++) {
      let mostrated_object = {};
      mostrated_object.id = result[i].id;
      mostrated_object.rate = parseInt(result[i].rate);
      mostrated.push(mostrated_object);
    }

    response.send_res(req, res, mostrated, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting list of most rated movies failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/mostrated VodMostRatedGet
 * @apiName VodMostRatedGet
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns list of most rated vod items
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.mostrated_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  //if most rated movies are requested
  models.vod.findAll({
    attributes: ['id', 'rate'], order: [['rate', 'DESC']],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    limit: 30, subQuery: false,
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}},
          isavailable: true
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ]
  }).then(function (result) {
    let mostrated = [];
    for (let i = 0; i < result.length; i++) {
      let mostrated_object = {};
      mostrated_object.id = result[i].id;
      mostrated_object.rate = parseInt(result[i].rate);
      mostrated.push(mostrated_object);
    }
    response.send_res_get(req, res, mostrated, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("getting list of most rated vod items failed with error: ", error);
    response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


/**
 * @api {post} /apiv2/vod/related VodRelated
 * @apiName VodRelated
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 * @apiParam {Number} vod_id Id for specidied vod item
 *
 * @apiDescription Returns id's of vod items related to specified item
 *
 * Copy paste this auth for testing purposes
 *auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.related = function (req, res) {

  models.vod.findAll({
    attributes: [/*'category_id',*/ 'director', 'starring'],
    where: {id: req.body.vod_id, company_id: req.thisuser.company_id},
    limit: 1
  }).then(function (result) {
    const director_list = result[0].director.split(',');
    let director_matching_score = "";
    for (let i = 0; i < director_list.length; i++) {
      if (i === director_list.length - 1) director_matching_score += sqlstring.format(" IF( ( director like '%??%' ), 0.5, 0)", [director_list[i].trim()]);
      else director_matching_score += sqlstring.format(" IF( ( director like '%??%' ), 0.5, 0) + ", [director_list[i].trim()]);
    }

    const actor_list = result[0].starring.split(',');
    let actor_matching_score = "";
    for (let j = 0; j < actor_list.length; j++) {
      if (j === actor_list.length - 1) actor_matching_score += sqlstring.format("IF( ( starring like '%??%' ), 0.3, 0)", [actor_list[j].trim()]);
      else actor_matching_score += sqlstring.format("IF( ( starring like '%??%' ), 0.3, 0) + ", [actor_list[j].trim()]);
    }

    let where_condition = " vod.id <> " + req.body.vod_id + " AND isavailable = true AND vod_stream.stream_source_id = " + sqlstring.escape(req.thisuser.vod_stream_source) + " AND expiration_time > NOW() ";
    where_condition += "AND vod_stream.stream_resolution LIKE '%" + req.auth_obj.appid + "%' ";
    if (req.thisuser.show_adult === true) where_condition = where_condition + " AND pin_protected = false ";
    if (!req.body.show_adult || req.body.show_adult !== 'true') where_condition = where_condition + " AND adult_content = false ";

    where_condition += " AND subscription.login_id = " + req.thisuser.id + " and subscription.end_date > NOW() AND package.package_type_id = " + Number(req.auth_obj.screensize + 2) + " ";

    where_condition += " AND company_id = " + req.thisuser.company_id + "";

    const related_query = "SELECT DISTINCT vod.id, " +
      " ( " +
      //" IF( (category_id = "+result[0].category_id+"), 1, 0) + "+ //category matching score
      " ( " + director_matching_score + " ) + " + //director matching score
      " ( " + actor_matching_score + " ) " + //actor matching score
      " ) AS matching_score " +
      " FROM vod " +
      " INNER JOIN vod_stream ON vod.id = vod_stream.vod_id " +
      " INNER JOIN package_vod ON vod.id = package_vod.vod_id INNER JOIN package ON package.id = package_vod.package_id INNER JOIN subscription ON subscription.package_id = package.id   " +
      " WHERE " + where_condition +
      " ORDER BY matching_score DESC " +
      " LIMIT 5 " +
      ";";

    sequelizes.sequelize.query(
      related_query
    ).then(function (related_result) {
      if (!related_result || !related_result[0]) {
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'NO DATA FOUND', 'no-store');
      } else {
        let response_data = [];
        for (let i = 0; i < related_result[0].length; i++) {
          response_data[i] = {"id": related_result[0][i].id.toString()};
        }
        response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
      }
    }).catch(function (error) {
      winston.error("Getting the list of related movies failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
    return null;
  }).catch(function (error) {
    winston.error("Searching for atirbutes of this movie failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {post} /apiv2/vod/suggestions VodSuggestions
 * @apiName VodSuggestions
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns suggestions based on user preferences
 *
 * Copy paste this auth for testing purposes
 * auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.suggestions = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod.findAll({
    attributes: ['id'],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}, isavailable: true}
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ],
    limit: 10, subQuery: false
  }).then(function (result) {
    response.send_res(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Searching for suggested movies failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/suggestions VodSuggestionsGet
 * @apiName VodSuggestionsGet
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns suggestions based on user preferences
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.suggestions_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod.findAll({
    attributes: ['id'],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}, isavailable: true}
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ],
    limit: 10, subQuery: false
  }).then(function (result) {
    response.send_res_get(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Searching for suggested movies failed with error: ", error);
    response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {post} /apiv2/vod/categoryfilms VodCategoryFilms
 * @apiName VodCategoryFilms
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {Number} category_id  Id of specified category
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns id's of vod items that belong to a specific category
 *
 * Copy paste this auth for testing purposes
 * auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.categoryfilms = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod.findAll({
    attributes: ['id'],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories,
        required: true,
        attributes: [],
        where: {category_id: req.body.category_id, is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}},
          isavailable: true
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ]
  }).then(function (result) {
    let raw_result = [];
    //flatten nested json array
    result.forEach(function (obj) {
      let raw_obj = {};
      raw_obj.id = String(obj.id);
      raw_result.push(raw_obj);
    });
    response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Searching for movies of specific genre failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/categoryfilms VodCategoryFilmsGet
 * @apiName VodCategoryFilmsGet
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 * @apiParam {Number} category_id  Id of specified category
 *
 * @apiDescription Returns id's of vod items that belong to a specific category
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.categoryfilms_get = function (req, res) {
  const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod.findAll({
    attributes: ['id'],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {model: models.vod_stream, required: true, attributes: []},
      {
        model: models.vod_vod_categories,
        required: true,
        attributes: [],
        where: {category_id: req.query.category_id, is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}},
          isavailable: true
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ]
  }).then(function (result) {
    let raw_result = [];
    //flatten nested json array
    result.forEach(function (obj) {
      let raw_obj = {};
      raw_obj.id = String(obj.id);
      raw_result.push(raw_obj);
    });
    response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("eraching for movies of specific category failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/voditem/:vodID GetVodItemDetails
 * @apiName GetVodItemDetails
 * @apiGroup VOD
 *
 * @apiUse header_auth
 *
 * @apiDescription Returns information for a vod item, it's stream and subtitles
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_vod_item_details = function (req, res) {
  const vodID = req.params.vodID;
  models.vod.find({
    where: {
      id: vodID,
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    },
    include: [
      {
        model: models.vod_subtitles,
        attributes: ['id', 'vod_id', 'title', [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('subtitle_url')), 'subtitle_url'], 'createdAt', 'updatedAt']
      },
      {
        model: models.vod_vod_categories, required: true, attributes: ['category_id'], where: {is_available: true},
        include: [{model: models.vod_category, required: true, attributes: ['name'], where: {isavailable: true}}]
      },
      {
        model: models.vod_stream,
        where: {
          stream_source_id: req.thisuser.vod_stream_source,
          stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
        }
      }
    ]
  }).then(function (result) {
    if (!result) {
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'NO DATA FOUND', 'no-store');
    } else {
      let raw_obj = [];
      raw_obj[0] = {};
      let category_names = "";
      for (let i = 0; i < result.vod_vod_categories.length; i++) {
        if (category_names.length > 0) category_names += ", " + result.vod_vod_categories[i].vod_category.name;
        else category_names += result.vod_vod_categories[i].vod_category.name;
      }

      raw_obj[0].id = result.id;
      raw_obj[0].title = result.title;
      raw_obj[0].vod_type = "film";
      raw_obj[0].duration = result.duration;
      raw_obj[0].pin_protected = result.pin_protected;
      raw_obj[0].subtitles = result.vod_subtitles;
      raw_obj[0].drm_platform = result.vod_streams[0].drm_platform;
      raw_obj[0].stream_format = result.vod_streams[0].stream_format;
      raw_obj[0].stream_type = result.vod_streams[0].stream_type;
      raw_obj[0].url = result.vod_streams[0].url;
      raw_obj[0].description = result.description + '<p><strong>Director:</strong> ' + result.director + '</p><p><strong>Starring:</strong> ' + result.starring + '</p>';
      raw_obj[0].icon_url = req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result.icon_url;
      raw_obj[0].image_url = req.app.locals.backendsettings[req.thisuser.company_id].assets_url + result.image_url;
      raw_obj[0].categoryid = String(result.vod_vod_categories[0].category_id);
      raw_obj[0].category_names = category_names;
      raw_obj[0].rate = (result.rate > 0 && result.rate <= 10) ? String(result.rate) : "5"; // rate should be in the interval ]0:10]
      raw_obj[0].year = dateformat(result.release_date, 'yyyy');
      raw_obj[0].token = (result.vod_streams[0].token) ? "1" : "0";
      raw_obj[0].TokenUrl = result.vod_streams[0].token_url;
      raw_obj[0].encryption = (result.vod_streams[0].encryption) ? "1" : "0";
      raw_obj[0].encryption_url = result.vod_streams[0].encryption_url;

      response.send_res_get(req, res, raw_obj, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');

    }
  }).catch(function (error) {
    winston.error("Getting all information for specific movie failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/tvshow_details/:vodID/seasonNumber GetTvShowDetails
 * @apiName GetTvShowDetails
 * @apiGroup VOD
 *
 * @apiUse header_auth
 *
 * @apiDescription Copy paste this auth for testing purposes
 * auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_tvshow_item_details = function (req, res) {

  const vodID = req.params.tvshowID;
  let where_seasonNumber = {};

  if (req.params.seasonNumber)
    where_seasonNumber.season_number = req.params.seasonNumber;
  else
    where_seasonNumber.season_number = 1;

  models.tv_series.find({
    attributes: ['id', [sequelize.literal('"film"'), 'tv_series'], 'title', 'icon_url', 'image_url', 'rate', 'trailer_url', 'pin_protected',
      [db.sequelize.fn('YEAR', db.sequelize.col('tv_series.release_date')), "year"],
      [db.sequelize.fn('concat', db.sequelize.col('tv_series.description'), '<p><strong>Director:</strong> ', db.sequelize.col('tv_series.director'),
        '</p><p><strong>Starring:</strong> ', db.sequelize.col('tv_series.cast'), '</p>'), 'description'],
      [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('tv_series.icon_url')), 'icon'],
      [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('tv_series.image_url')), 'largeimage']
    ],
    where: {id: vodID, expiration_time: {$gte: Date.now()}, company_id: req.thisuser.company_id},
    include: [
      {
        model: models.tv_season,
        attributes: ['id', 'season_number', 'title'],
        where: {expiration_time: {$gte: Date.now()}}
      },
      {
        model: models.tv_series_categories, where: {is_available: true}, attributes: ['id'],
        include: [{model: models.vod_category, where: {isavailable: true}, attributes: ['name']}]
      }
    ]
  }).then(function (result) {
    if (!result) {
      response.send_res_get(req, res, [], 404, -1, 'E_NOT_FOUND', 'NO DATA FOUND', 'no-store');
    } else {
      result = result.toJSON();
      result.category_names = "";
      for (let i = 0; i < result.tv_series_categories.length; i++) {
        if (result.category_names.length > 0) result.category_names += ", " + result.tv_series_categories[i].vod_category.name;
        else result.category_names += result.tv_series_categories[i].vod_category.name;
      }
      delete result.tv_series_categories;

      const season_id = result.tv_seasons.filter(function (obj) {
        return obj.season_number === Number(where_seasonNumber.season_number)
      })[0].id;

      models.tv_episode.findAll({
        attributes: ["id", [sequelize.literal('"tv_episode"'), 'vod_type'], "title", "rate", "trailer_url", [db.sequelize.fn('YEAR', db.sequelize.col('tv_episode.release_date')), "year"],
          [db.sequelize.fn('concat', db.sequelize.col('tv_episode.description'), '<p><strong>Director:</strong> ', db.sequelize.col('tv_episode.director'),
            '</p><p><strong>Starring:</strong> ', db.sequelize.col('tv_episode.cast'), '</p>'), 'description'],
          [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('tv_episode.icon_url')), 'icon']
        ],
        where: {tv_season_id: season_id, expiration_time: {$gte: Date.now()}},
        include: [{
          model: models.tv_episode_stream,
          where: {
            stream_source_id: req.thisuser.vod_stream_source,
            stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
          },
          attributes: []
        }]
      }).then(function (episodes) {
        result.season_count = result.tv_seasons.length; //add number of seasons for the tv show
        result.episodes = [];

        async.forEach(episodes, function (episode, callback) {
          episode = episode.toJSON(); //convert episode item to editable json object
          episode.category_names = result.category_names; //the episodes inherit their list of genres from the tv series
          result.episodes.push(episode);
          callback(null);
        }, function (error, success) {
          response.send_res_get(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        });

      }).catch(function (error) {
        winston.error("Quering for episodes failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
      });
      return null;
    }
  }).catch(function (error) {
    winston.error("Getting data for a tv show failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/related/:vodid GetRelatedVodItems
 * @apiName GetRelatedVodItems
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns a list of related items of the same type for the specified vod item
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_vod_item_related = function (req, res) {

  models.vod.findAll({
    attributes: ['director', 'starring'], where: {id: req.params.vodID, company_id: req.thisuser.company_id},
    limit: 1
  }).then(function (result) {
    if (result && result.length > 0) {
      const director_list = result[0].director.split(',');
      let director_matching_score = "";
      for (let i = 0; i < director_list.length; i++) {
        if (i === director_list.length - 1) director_matching_score += sqlstring.format(" IF( ( director like '%??%' ), 0.5, 0)", [director_list[i].trim()]);
        else director_matching_score += sqlstring.format(" IF( ( director like '%??%' ), 0.5, 0) + ", [director_list[i].trim()]);
      }

      const actor_list = result[0].starring.split(',');
      let actor_matching_score = "";
      for (let j = 0; j < actor_list.length; j++) {
        if (j === actor_list.length - 1) actor_matching_score += sqlstring.format("IF( ( starring like '%??%' ), 0.3, 0)", [actor_list[j].trim()]);
        else actor_matching_score += sqlstring.format("IF( ( starring like '%??%' ), 0.3, 0) + ", [actor_list[j].trim()]);
      }
      const vod_stream = {
        join_query: " INNER JOIN vod_stream ON vod.id = vod_stream.vod_id ",
        where_condition: " AND vod_stream.stream_source_id = " + sqlstring.escape(req.thisuser.vod_stream_source) + " AND vod_stream.stream_resolution LIKE '%" + req.auth_obj.appid + "%' "
      };


      let where_condition = " vod.id <> " + sqlstring.escape(req.params.vodID) +
        " AND vod.isavailable = true AND expiration_time > NOW() " + vod_stream.where_condition;

      if (req.thisuser.show_adult === true) where_condition = where_condition + " AND pin_protected = false ";
      if (!req.query.show_adult || req.query.show_adult !== 'true') where_condition = where_condition + " AND adult_content = false ";
      where_condition += " AND subscription.login_id = " + sqlstring.escape(req.thisuser.id) + " and subscription.end_date > NOW() AND package.package_type_id = " + Number(req.auth_obj.screensize + 2) + " ";
      where_condition += " AND vod.company_id = " + sqlstring.escape(req.thisuser.company_id) + " ";

      const offset = isNaN(parseInt(req.query._start)) ? 0 : parseInt(req.query._start);
      const limit = isNaN(parseInt(req.query._end)) ? req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr : parseInt(req.query._end) - offset;
      const order_by = (req.query._orderBy) ? req.query._orderBy + ' ' + req.query._orderDir : "matching_score DESC";
      const related_query = "SELECT DISTINCT CAST(vod.id AS CHAR) AS id, vod.title, 'film' as vod_type, " +
        "CONCAT(vod.description, '<p><strong>Director:</strong> ', vod.director, ' </p><p><strong>Starring:</strong> ', vod.starring, '</p>') AS description, vod.rate, vod.duration, " +
        "vod.pin_protected, YEAR(vod.release_date) as year, UNIX_TIMESTAMP(vod.createdAt) as dataadded, CONCAT('" + req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "', vod.icon_url) AS icon, " +
        " concat('" + req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "', vod.image_url) as largeimage," +
        " ( " +
        " ( " + director_matching_score + " ) + " + //director matching score
        " ( " + actor_matching_score + " ) " + //actor matching score
        " ) AS matching_score " +
        " , GROUP_CONCAT(DISTINCT vod_category.name SEPARATOR ', ') as categories, vod_vod_categories.category_id as categoryid " +
        " FROM vod " +
        " INNER JOIN vod_vod_categories ON vod.id = vod_vod_categories.vod_id INNER JOIN vod_category ON vod_vod_categories.category_id = vod_category.id " +
        vod_stream.join_query +
        " INNER JOIN package_vod ON vod.id = package_vod.vod_id INNER JOIN package ON package.id = package_vod.package_id INNER JOIN subscription ON subscription.package_id = package.id   " +
        " WHERE " + where_condition +
        " GROUP BY vod.id " +
        " ORDER BY " + order_by + " " +
        " LIMIT " + sqlstring.escape(offset) + ", " + sqlstring.escape(limit) + " " +
        ";";

      sequelizes.sequelize.query(
        related_query
      ).then(function (related_result) {
        if (!related_result || !related_result[0]) {
          response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'NO DATA FOUND', 'no-store');
        } else {
          res.setHeader("X-Total-Count", related_result[0].length);
          response.send_res_get(req, res, related_result[0], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        }
      }).catch(function (error) {
        winston.error("Searching for related items failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
      });
    } else response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'NO DATA FOUND', 'no-store');
    return null;
  }).catch(function (error) {
    winston.error("Searching th attributes of a vod item failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


/**
 * @api {get} /apiv2/vod/recommended GetRecommendedItems
 * @apiName GetRecommendedItems
 * @apiGroup VOD
 *
 * @apiUse header_auth
 * @apiParam {Number} [_start]  Optional, record pointer start
 * @apiParam {Number} [_end]  Optional, limit number of records
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 *@apiDescription GET recommended films and tv shows
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_vod_items_recommended = function (req, res) {
  //find the user's active vod packages
  models.subscription.findAll({
    attributes: ['package_id'], where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}, group: ['package_id'],
    include: [{
      model: models.package,
      required: true,
      attributes: [],
      where: {package_type_id: req.auth_obj.screensize + 2},
      include: [{
        model: models.package_vod, required: true, attributes: []
      }]
    }],
    raw: true
  }).then(function (result) {
    if (result && result.length > 0) {
      let package_list = [];
      for (let i = 0; i < result.length; i++) {
        package_list.push(result[i].package_id); //list of packages into array
      }
      const allowed_content = (req.thisuser.show_adult === true) ? [0, 1] : [0];
      const query = req.query;
      let qwhere = {};
      qwhere.where = {};

      qwhere.attributes = ['id', 'title', 'rate', 'duration', 'pin_protected', 'clicks',
        [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "year"],
        [db.sequelize.fn('concat', db.sequelize.col('vod.description'), '<p><strong>Director:</strong> ', db.sequelize.col('vod.director'),
          '</p><p><strong>Starring:</strong> ', db.sequelize.col('vod.starring'), '</p>'), 'description'],
        [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('icon_url')), 'icon'],
        [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
        [db.sequelize.literal('UNIX_TIMESTAMP(createdAt) * 1000'), "dataadded"]
      ];
      qwhere.where.pin_protected = 0;
      if (!req.query.show_adult || req.query.show_adult !== 'true') qwhere.where.adult_content = false;  //adult content returned only if request explicitly asks for it
      qwhere.where.isavailable = 1;
      qwhere.offset = isNaN(parseInt(query._start)) ? 0 : parseInt(query._start);
      qwhere.limit = isNaN(parseInt(query._end)) ? req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr : parseInt(query._end) - qwhere.offset;
      qwhere.where.expiration_time = {$gte: Date.now()};
      qwhere.where.company_id = req.thisuser.company_id;

      if (query._orderBy) qwhere.order = query._orderBy + ' ' + query._orderDir;
      qwhere.include = [
        {
          model: models.vod_stream,
          required: true,
          attributes: [],
          where: {
            stream_source_id: req.thisuser.vod_stream_source,
            stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
          }
        },
        {
          model: models.vod_vod_categories,
          required: true,
          attributes: ['id', 'category_id'],
          where: {is_available: true},
          include: [{model: models.vod_category, attributes: ['name']}]
        },
        {model: models.package_vod, required: true, attributes: [], where: {package_id: {in: package_list}}}
      ]; //exclude films without streams or from other stream sources

      models.vod.findAndCountAll(
        qwhere
      ).then(function (results) {
        let vod_list = [];
        async.forEach(results.rows, function (vod_film, callback) {
          let category_list = "";
          for (let i = 0; i < vod_film.vod_vod_categories.length; i++) {
            if (category_list.length > 0) category_list += ", " + vod_film.vod_vod_categories[i].vod_category.name;
            else category_list += vod_film.vod_vod_categories[i].vod_category.name;
          }
          const vod_item = vod_film.toJSON();
          vod_item.vod_type = "film";
          vod_item.categoryid = vod_film.vod_vod_categories[0].category_id;
          vod_item.categories = category_list;
          delete vod_item.vod_vod_categories;
          vod_list.push(vod_item);
          callback(null);
        }, function (error, result) {
          res.setHeader("X-Total-Count", vod_list.length);
          response.send_res_get(req, res, vod_list, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        });
      }).catch(function (error) {
        winston.error("Getting vod list failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
      });
    } else {
      response.send_res_get(req, res, [], 200, 1, 'NO_DATA_FOUND', 'OK_DATA', 'private,max-age=86400');
    }
    return null;
  }).catch(function (error) {
    winston.error("Getting the vod subsciption list failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//vod list api for live data
/**
 * @api {get} /apiv2/vod/vodlist GET VOD Items
 * @apiName GetVodList
 * @apiGroup VOD
 *
 * @apiUse header_auth
 *
 * @apiParam {String} [q]  Query string
 * @apiParam {String} [vod_type]  Query string, comma delimited, optional. If missing, return all vod types. Value set [film, tv_series] //todo: bej dy outer join queries per film dhe serial. filtri mbetet
 * @apiParam {Number} [pin_protected]  If 1, query will include pin protected items
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 * @apiParam {Number} [category] Filter records to this category id
 * @apiParam {Number} [_start] Record pointer start
 * @apiParam {Number} [_end] Limit number of records
 * @apiParam {String} [_orderBy] Database field name to order records.
 * @apiParam {String} [_orderDir] (ASC or DESC) Sorting directions.
 *
 *@apiDescription Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_vod_list = function (req, res) {
  //find the user's active vod packages
  models.subscription.findAll({
    attributes: ['package_id'], where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}, group: ['package_id'],
    include: [{
      model: models.package,
      required: true,
      attributes: [],
      where: {package_type_id: req.auth_obj.screensize + 2},
      include: [{
        model: models.package_vod, required: true, attributes: []
      }]
    }],
    raw: true
  }).then(function (result) {
    if (result && result.length > 0) {
      let package_list = [];
      for (let i = 0; i < result.length; i++) package_list.push(result[i].package_id); //list of packages into array

      //start querying for films and/or tv_series
      if (!req.query.vod_type) req.query.vod_type = "film,tv_series"; //if vod type is not specified, both these types should be included

      async.parallel({
        films: function (callback) {
          if (req.query.vod_type.indexOf('film') !== -1) {
            let vod_final_where = {include: [], where: {}}, query = req.query;
            if (req.query.q) {
              vod_final_where.where = {
                $or: {
                  title: {$like: '%' + query.q + '%'},
                  description: {$like: '%' + query.q + '%'},
                  director: {$like: '%' + query.q + '%'}
                }
              };
            }

            vod_final_where.where.expiration_time = {$gte: Date.now()};
            if (!req.query.show_adult || req.query.show_adult !== 'true') vod_final_where.where.adult_content = false;
            const allowed_content = ((req.thisuser.show_adult === true) && (req.query.pin_protected === '1')) ? [0, 1] : [0];
            const category_where = (req.query.category) ? {
              is_available: true,
              category_id: req.query.category
            } : {is_available: true};

            //filter films added in the following time interval
            if (query.added_before && query.added_after) vod_final_where.where.createdAt = {
              lt: query.added_before,
              gt: query.added_after
            };
            else if (query.added_before) vod_final_where.where.createdAt = {lt: query.added_before};
            else if (query.added_after) vod_final_where.where.createdAt = {gt: query.added_after};

            //filter films updated in the following time interval
            if (query.updated_before && query.updated_after) vod_final_where.where.createdAt = {
              lt: query.updated_before,
              gt: query.updated_after
            };
            else if (query.updated_before) vod_final_where.where.updatedAt = {lt: query.updated_before};
            else if (query.updated_after) vod_final_where.where.updatedAt = {gt: query.updated_after};

            vod_final_where.offset = isNaN(parseInt(query._start)) ? 0 : parseInt(query._start);
            vod_final_where.limit = isNaN(parseInt(query._end)) ? req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr : parseInt(query._end) - vod_final_where.offset;

            if (query._orderBy === 'createdAt') {
              vod_final_where.order = 'dataadded' + ' ' + query._orderDir;
            } else if (query._orderBy) vod_final_where.order = query._orderBy + ' ' + query._orderDir;


            vod_final_where.where.isavailable = true;
            vod_final_where.attributes = ['id', 'title', 'pin_protected', 'rate', 'duration', 'clicks', [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "year"],
              [db.sequelize.fn('concat', db.sequelize.col('vod.description'), '<p><strong>Director:</strong> ', db.sequelize.col('director'),
                '</p><p><strong>Starring:</strong> ', db.sequelize.col('starring'), '</p>'), 'description'],
              [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('vod.icon_url')), 'icon'],
              [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
              [db.sequelize.fn('UNIX_TIMESTAMP', db.sequelize.col('vod.createdAt')), 'dataadded']
            ];
            vod_final_where.include = [
              {
                model: models.vod_stream,
                required: false,
                attributes: ['id'],
                where: {
                  stream_source_id: req.thisuser.vod_stream_source,
                  stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
                }
              },
              {
                model: models.vod_vod_categories,
                as: 'vod_vod_category',
                required: true,
                attributes: [],
                where: category_where
              }, //join only vod items that belong to specific category
              {
                model: models.vod_vod_categories,
                required: false,
                attributes: ['category_id'],
                where: {is_available: true},
                include: [{model: models.vod_category, attributes: ['name']}]
              },
              {model: models.package_vod, required: true, attributes: [], where: {package_id: {$in: package_list}}}
            ];
            models.vod.findAndCountAll(
              vod_final_where
            ).then(function (film_list) {
              let films = [];
              async.forEach(film_list.rows, function (vod_film, callback) {
                vod_film = vod_film.toJSON(); //convert object to json, to be able to modify it

                //prepare category list
                vod_film.categories = "";
                for (let i = 0; i < vod_film.vod_vod_categories.length; i++) {
                  if (i !== 0) vod_film.categories += ", ";
                  vod_film.categories += vod_film.vod_vod_categories[i].vod_category.name;
                }

                vod_film.vod_type = "film"; //add static string "film" vod item type
                vod_film.categoryid = vod_film.vod_vod_categories[0].category_id; //get id of first category as categoryid

                delete vod_film.vod_vod_categories; //vod_vod_categories was transformed as a string, object no longer needed
                delete vod_film.vod_streams; //vod_streams is not needed for the response, only as a validator
                delete vod_film.clicks; //clicks is not needed for the response, only as a filter and sorter
                delete vod_film.year; //year is not needed for the response, only as a filter and sorter
                films.push(vod_film);
                callback(null);
              }, function (error, result) {
                callback(null, {data: films, count: film_list.count});
              });
            }).catch(function (error) {
              winston.error("Getting list of vod items failed with error: ", error);
              callback(null, {data: [], count: 0});
            });
          } else {
            callback(null, {data: [], count: 0}); //no films required in this request. don't query vod table
          }
        },
        tv_shows: function (callback) {
          if (req.query.vod_type.indexOf('tv_series') !== -1) {
            let tv_shows_final_where = {include: [], where: {}}, query = req.query;
            if (req.query.q) {
              tv_shows_final_where.where = {
                $or: {
                  title: {$like: '%' + query.q + '%'},
                  description: {$like: '%' + query.q + '%'},
                  director: {$like: '%' + query.q + '%'}
                }
              };
            }

            tv_shows_final_where.where.expiration_time = {$gte: Date.now()};
            if (!req.query.show_adult || req.query.show_adult !== 'true') tv_shows_final_where.where.adult_content = false;
            const allowed_content = ((req.thisuser.show_adult === true) && (req.query.pin_protected === '1')) ? [0, 1] : [0];
            const category_where = (req.query.category) ? {
              is_available: true,
              category_id: req.query.category
            } : {is_available: true};

            //filter films added in the following time interval
            if (query.added_before && query.added_after) tv_shows_final_where.where.createdAt = {
              lt: query.added_before,
              gt: query.added_after
            };
            else if (query.added_before) tv_shows_final_where.where.createdAt = {lt: query.added_before};
            else if (query.added_after) tv_shows_final_where.where.createdAt = {gt: query.added_after};

            //filter films updated in the following time interval
            if (query.updated_before && query.updated_after) tv_shows_final_where.where.createdAt = {
              lt: query.updated_before,
              gt: query.updated_after
            };
            else if (query.updated_before) tv_shows_final_where.where.updatedAt = {lt: query.updated_before};
            else if (query.updated_after) tv_shows_final_where.where.updatedAt = {gt: query.updated_after};

            tv_shows_final_where.offset = isNaN(parseInt(query._start)) ? 0 : parseInt(query._start);
            tv_shows_final_where.limit = isNaN(parseInt(query._end)) ? req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr : parseInt(query._end) - tv_shows_final_where.offset;

            if (query._orderBy === 'createdAt') {
              tv_shows_final_where.order = 'dataadded' + ' ' + query._orderDir;
            } else if (query._orderBy) tv_shows_final_where.order = query._orderBy + ' ' + query._orderDir;


            tv_shows_final_where.where.is_available = true;
            tv_shows_final_where.attributes = ['id', 'title', 'pin_protected', 'rate', 'clicks', [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "year"],
              [db.sequelize.fn('concat', db.sequelize.col('tv_series.description'), '<p><strong>Director:</strong> ', db.sequelize.col('director'),
                '</p><p><strong>Starring:</strong> ', db.sequelize.col('cast'), '</p>'), 'description'],
              [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('tv_series.icon_url')), 'icon'],
              [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
              [db.sequelize.fn('UNIX_TIMESTAMP', db.sequelize.col('tv_series.createdAt')), 'dataadded']
            ];
            tv_shows_final_where.include = [
              //  {model: models.tv_series_categories, as: 'tv_series_category', required: true, attributes: [], where: category_where}, //join only tv series items that belong to specific category
              {
                model: models.tv_series_categories,
                required: false,
                attributes: ['category_id'],
                where: {is_available: true},
                include: [{model: models.vod_category, attributes: ['name']}]
              },
              {
                model: models.tv_series_packages,
                required: true,
                attributes: [],
                where: {package_id: {$in: package_list}}
              }
            ];
            models.tv_series.findAndCountAll(
              tv_shows_final_where
            ).then(function (tv_series_list) {
              let tv_series = [];
              async.forEach(tv_series_list.rows, function (tv_show, callback) {
                tv_show = tv_show.toJSON(); //convert object to json, to be able to modify it

                //prepare category list
                tv_show.categories = "";
                for (let i = 0; i < tv_show.tv_series_categories.length; i++) {
                  if (i !== 0) tv_show.categories += ", ";
                  tv_show.categories += tv_show.tv_series_categories[i].vod_category.name;
                }

                tv_show.vod_type = "tv_series"; //add static string "tv_series" as item type
                tv_show.duration = 0;
                tv_show.categoryid = tv_show.tv_series_categories[0].category_id; //get id of first category as categoryid

                delete tv_show.tv_series_categories; //tv_series_categories was transformed as a string, object no longer needed
                delete tv_show.clicks; //clicks is not needed for the response, only as a filter and sorter
                delete tv_show.year; //year is not needed for the response, only as a filter and sorter
                tv_series.push(tv_show);
                callback(null);
              }, function (error, result) {
                callback(null, {data: tv_series, count: tv_series_list.count});
              });
            }).catch(function (error) {
              winston.error("Getting list of tv series items failed with error: ", error);
              callback(null, {data: [], count: 0});
            });
          } else {
            callback(null, {data: [], count: 0}); //no tv_series required in this request. don't query tv_series table
          }
        }
      }, function (err, results) {
        let vod_item_list = results.tv_shows.data;
        vod_item_list = vod_item_list.concat(results.films.data);
        res.setHeader("X-Total-Count", results.tv_shows.count + results.films.count);
        response.send_res_get(req, res, vod_item_list, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
      });
    } else response.send_res_get(req, res, [], 200, 1, 'NO_DATA_FOUND', 'OK_DATA', 'private,max-age=86400');
    return null;
  }).catch(function (error) {
    winston.error("Getting vod subscription failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {post} /apiv2/vod/searchvod?pin_protected=0 VodSearch
 * @apiName VodSearch
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {Number} search_string  Search keyword
 * @apiParam {String} [show_adult]  If set to true, include items with adult content. Value set ['true']
 *
 * @apiDescription Returns vod matches for a specified keyword. pin_protected query string parameter is optional, value set is [0, 1], default value is 0
 *
 * Copy paste this auth for testing purposes
 * auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.searchvod = function (req, res) {
  const allowed_content = ((req.thisuser.show_adult === true) && (req.query.pin_protected === "1")) ? [0, 1] : [0];
  const show_adult = (req.body.show_adult === 'true') ? {$in: [true, false]} : false; //adult content returned only if request explicitly asks for it

  models.vod.findAll({
    attributes: ['id', 'title'],
    include: [
      {model: models.vod_stream, required: true, attributes: ['url', 'encryption']},
      {
        model: models.vod_vod_categories, required: true, attributes: [], where: {is_available: true},
        include: [{
          model: models.vod_category,
          required: true,
          attributes: [],
          where: {password: {in: allowed_content}, isavailable: true}
        }]
      },
      {
        model: models.package_vod, required: true, attributes: [],
        include: [{
          model: models.package, required: true, attributes: [], where: {package_type_id: req.auth_obj.screensize + 2},
          include: [{
            model: models.subscription,
            required: true,
            attributes: [],
            where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
          }]
        }]
      }
    ],
    where: {
      pin_protected: {in: allowed_content},
      adult_content: show_adult,
      isavailable: true,
      title: {$like: "%" + sqlstring.escape(req.body.search_string.trim()).slice(1, -1) + "%"},
      expiration_time: {$gte: Date.now()},
      company_id: req.thisuser.company_id
    }

  }).then(function (result) {
    let raw_result = [];
    //flatten nested json array
    result.forEach(function (obj) {
      let raw_obj = {};
      Object.keys(obj.toJSON()).forEach(function (k) {
        if (typeof obj[k] == 'object') {
          Object.keys(obj[k]).forEach(function (j) {
            raw_obj.id = String(obj.id);
            raw_obj.title = obj.title;
          });
        }
      });
      raw_result.push(raw_obj);
    });
    response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
  }).catch(function (error) {
    winston.error("Searching for a vod item failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {post} /apiv2/vod/resume_movie VodResumeItem
 * @apiName VodResumeItem
 * @apiGroup VOD
 *
 * @apiUse body_auth
 * @apiParam {Number} vod_id  Id of vod item the user would like to resume
 * @apiParam {Number} resume_position  Player position where video should resume
 *
 * @apiDescription Saves the id and position of a video that the user would like to resume watching
 *
 * Copy paste this auth for testing purposes
 * auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A
 *
 */
exports.resume_movie = function (req, res) {
  //upsert must ensure that the combination [vod_id, login_id] is unique
  models.vod_resume.upsert(
    {
      login_id: req.thisuser.id,
      vod_id: req.body.vod_id,
      resume_position: req.body.resume_position,
      reaction: 0,
      device_id: req.auth_obj.boxid,
      company_id: req.thisuser.company_id
    }
  ).then(function (result) {
    response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
  }).catch(function (error) {
    winston.error("Saving a movie to watch later failed with error: ", error);
    if (error.message.split(': ')[0] === 'ER_NO_REFERENCED_ROW_2') {
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'INVALID_INPUT', 'no-store');
    } else response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/vod_details/:vod_id GetVodItemData
 * @apiName GetVodItemData
 * @apiGroup VOD
 *
 * @apiUse header_auth
 *
 *@apiDescription Returns information about the subtitles and stream of a vod item
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_movie_details = function (req, res) {
  const attributes = [
    'id', ['adult_content', 'adult'], 'budget', 'imdb_id', 'original_language', 'original_title', ['description', 'overview'], 'popularity', 'release_date', 'revenue', ['duration', 'runtime'],
    [sequelize.fn('DATE_FORMAT', sequelize.col('release_date'), '%Y-%m-%d'), 'release_date'], 'revenue', ['duration', 'runtime'], 'spoken_languages', 'status', 'tagline', 'title', 'vote_average',
    'vote_count', 'trailer_url', 'vod_preview_url', 'default_subtitle_id'];

  models.vod.findOne({
    attributes: attributes,
    include: [
      {
        model: models.vod_stream,
        attributes: ['stream_format', 'url', 'token', 'token_url', 'encryption', 'encryption_url'],
        where: {
          stream_source_id: req.thisuser.vod_stream_source,
          stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
        }
      },
      {
        model: models.vod_subtitles,
        attributes: ['id', 'title', [db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('subtitle_url')), 'url'], ['vod_id', 'vodid']]
      },
      {
        model: models.vod_vod_categories,
        attributes: ['id'],
        required: true,
        include: [{model: models.vod_category, attributes: ['id', 'name'], required: true}]
      }
    ],
    where: {id: Number(req.params.vod_id), company_id: req.thisuser.company_id}
  }).then(function (result) {
    let vod_data = {};
    if (result) {
      if (result.vod_subtitles) {
        try {
          const found = result.vod_subtitles.find(function (x) {
            if (x.id === (result.default_subtitle_id)) {
              return x.title;
            }
          }).title;
        } catch (error) {
          let found = "";
        }
      }

      //convert query results from instance to JSON, to modify it
      vod_data = result.toJSON();
      vod_data.vod_type = "film"; //assign type as film

      //asign value of default subtitle
      delete vod_data.default_subtitle_id;
      vod_data.default_language = found;
      //prepare array of categories
      vod_data.genres = [];
      for (let i = 0; i < vod_data.vod_vod_categories.length; i++) vod_data.genres.push({
        "id": vod_data.vod_vod_categories[i].vod_category.id,
        "name": vod_data.vod_vod_categories[i].vod_category.name
      });
      delete vod_data.vod_vod_categories;
      //assign vod stream properties to the response data object. delete vod_stream object
      vod_data.stream_format = (result.vod_streams[0] && result.vod_streams[0].stream_format) ? result.vod_streams[0].stream_format : "0";
      vod_data.stream_url = (result.vod_streams[0] && result.vod_streams[0].url) ? result.vod_streams[0].url : ""; //url e streamit
      vod_data.drm_platform = (result.vod_streams[0] && result.vod_streams[0].drm_platform) ? result.drm_platform : "none";
      vod_data.token = (result.vod_streams[0] && result.vod_streams[0].token) ? "1" : "0";
      vod_data.TokenUrl = (result.vod_streams[0] && result.vod_streams[0].token_url) ? result.vod_streams[0].token_url : "";
      vod_data.encryption = (result.vod_streams[0] && result.vod_streams[0].encryption) ? "1" : "0";
      vod_data.encryption_url = (result.vod_streams[0] && result.vod_streams[0].encryption_url) ? result.vod_streams[0].encryption_url : "";

      vod_data.subtitles = vod_data.vod_subtitles;
      delete vod_data.vod_subtitles;
    }
    response.send_res_get(req, res, [vod_data], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
  }).catch(function (error) {
    winston.error("Getting a movie's data failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/get_tv_series_data/:vod_id/:season_number GetTvSeriesData
 * @apiName GetTvSeriesData
 * @apiGroup VOD
 *
 * @apiUse header_auth
 *
 *@apiDescription GET list of seasons and episodes of a tv show. By default, pin protected or adult items are not returned, unless specified otherwise.
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.get_tv_series_data = function (req, res) {

  const vodID = req.params.tvshowID;
  let where_seasonNumber = {};

  if (req.params.seasonNumber)
    where_seasonNumber.season_number = req.params.seasonNumber;
  else
    where_seasonNumber.season_number = 1;

  const show_adult = (req.query.show_adult === 'true') ? {$in: [true, false]} : false;
  const pin_protected = (req.query.pin_protected === 'true') ? {$in: [true, false]} : false;

  models.tv_series.find({
    attributes: ['id', [sequelize.literal('"tv_series"'), 'vod_type']],
    where: {
      id: vodID, expiration_time: {$gte: Date.now(), company_id: req.thisuser.company_id}
    },
    include: [
      {
        model: models.tv_season,
        attributes: ['id', 'season_number', 'title', [sequelize.literal('"tv_season"'), 'vod_type']],
        where: {
          expiration_time: {$gte: Date.now()},
          is_available: true,
          adult_content: show_adult,
          pin_protected: show_adult
        }
      },
      {
        model: models.tv_series_categories, where: {is_available: true}, attributes: ['id'],
        include: [{model: models.vod_category, where: {isavailable: true}, attributes: ['name']}]
      }
    ]
  }).then(function (result) {
    if (!result) {
      response.send_res_get(req, res, [], 404, -1, 'E_NOT_FOUND', 'NO DATA FOUND', 'no-store');
    } else {
      result = result.toJSON();
      result.category_names = "";
      for (let i = 0; i < result.tv_series_categories.length; i++) {
        if (result.category_names.length > 0) result.category_names += ", " + result.tv_series_categories[i].vod_category.name;
        else result.category_names += result.tv_series_categories[i].vod_category.name;
      }
      delete result.tv_series_categories;

      const season_id = result.tv_seasons.filter(function (obj) {
        return obj.season_number === Number(where_seasonNumber.season_number)
      })[0].id;

      models.tv_episode.findAll({
        attributes: ["id", [sequelize.literal('"tv_episode"'), 'vod_type'], "title", "rate", "trailer_url", "vod_preview_url", "is_available",
          [db.sequelize.fn('YEAR', db.sequelize.col('release_date')), "year"],
          [db.sequelize.fn('concat', db.sequelize.col('description'), '<p><strong>Director:</strong> ', db.sequelize.col('director'),
            '</p><p><strong>Starring:</strong> ', db.sequelize.col('cast'), '</p>'), 'description'],
          [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('icon_url')), 'icon'],
          [db.sequelize.fn('concat', req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('image_url')), 'largeimage'],
          [sequelize.literal('"' + result.category_names + '"'), 'category_names']
        ],
        where: {
          tv_season_id: season_id,
          expiration_time: {$gte: Date.now()},
          is_available: true,
          adult_content: show_adult,
          pin_protected: show_adult,
          company_id: req.thisuser.company_id
        },
        include: [
          {
            model: models.tv_episode_stream,
            where: {
              stream_source_id: req.thisuser.vod_stream_source,
              stream_resolution: {$like: "%" + req.auth_obj.appid + "%"}
            },
            attributes: []
          }
        ]
      }).then(function (episodes) {
        result.season_count = result.tv_seasons.length; //add number of seasons for the tv show

        //rename seasons object
        result.seasons = result.tv_seasons;
        delete result.tv_seasons;

        result.episodes = []; //prepare empty array for episodes

        async.forEach(episodes, function (episode, callback) {
          let episode_obj = episode.toJSON();
          episode_obj.isavailable = (episode.is_available === true) ? true : false;
          delete episode_obj.is_available;
          result.episodes.push(episode_obj);
          callback(null);
        }, function (error, success) {
          response.send_res_get(req, res, [result], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        });
      }).catch(function (error) {
        winston.error("Getting the episodes of a specific season failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
      });
      return null;
    }
  }).catch(function (error) {
    winston.error("Getting the data for a tv show failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};


/**
 * @api {get} /apiv2/vod/vod_menu  GetVodMenu
 * @apiName GetVodMenu
 * @apiGroup VOD
 *
 * @apiUse header_auth
 *
 *@apiDescription GET list of vod menu
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.vod_menu_list = function (req, res) {
  // {1: 'Android Set Top Box', 2: 'Android Smart Phone',3: 'IOS', 4: 'Android Smart TV', 5: 'Samsung Smart TV', 6: 'Apple TV'};
  let whr;
  if (!req.thisuser.show_adult || req.auth_obj.screensize == 2 || req.auth_obj.screensize == 3) {
    whr = {company_id: req.thisuser.company_id, pin_protected: 0}
  } else {
    whr = {company_id: req.thisuser.company_id}
  }

  models.vod_menu.findAll({
    attributes: ['id', 'name', 'description', 'order', 'pin_protected', 'isavailable'],
    include: [{
      model: models.vod_menu_carousel,
      attributes: ['id', 'name', 'description', 'order', 'url', 'isavailable'],
      required: false,
      where: {company_id: req.thisuser.company_id}
    }],
    where: whr
  }).then(function (result) {

    response.send_res_get(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');

  }).catch(function (error) {
    winston.error("Getting list of vod menus failed with error: ", error);
    response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


function delete_resume_movie(user_id, vod_id) {

  models.vod_resume.destroy(
    {
      where: {
        login_id: user_id,
        vod_id: vod_id
      }
    }
  ).then(function (result) {
    return null;
  }).catch(function (error) {
    winston.error("Removing a vod item form the watch later list failed with error: ", error);
    return null;
  });

};

function add_click(movie_title) {
  models.vod.findOne({
    attributes: ['id', 'clicks'],
    where: {title: movie_title}
  }).then(function (result) {
    models.vod.update(
      {clicks: result.clicks + 1},
      {where: {id: result.id}}
    ).then(function (result) {
      return null;
    }).catch(function (error) {
      winston.error("Incrementing number of clicks failed with error: ", error);
      return null;
    });
    return null;
  }).catch(function (error) {
    winston.error("Getting number of clicks for a movie failed with error: ", error);
    return null;
  });
};

exports.delete_resume_movie = delete_resume_movie;
exports.add_click = add_click;

