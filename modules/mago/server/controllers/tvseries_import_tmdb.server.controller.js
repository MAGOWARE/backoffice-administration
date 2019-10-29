'use strict';
var winston = require("winston");

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    sequelize_t = require(path.resolve('./config/lib/sequelize')),
    DBModel = db.tv_series,
    refresh = require(path.resolve('./modules/mago/server/controllers/common.controller.js')),
    saas_functions = require(path.resolve('./custom_functions/saas_functions')),
    request = require("request"),
    fs = require('fs');
var download = require('download-file');

function link_tv_show_with_genres(tv_show_id,array_category_ids, db_model, company_id) {
    var transactions_array = [];
    //todo: references must be updated to non-available, not deleted
    return db_model.update(
        {
            is_available: false
        },
        {
            where: {
                tv_show_id: tv_show_id,
                category_id: {$notIn: array_category_ids},
                company_id: company_id
            }
        }
    ).then(function (result) {
        return sequelize_t.sequelize.transaction(function (t) {
            for (var i = 0; i < array_category_ids.length; i++) {
                transactions_array.push(
                    db_model.upsert({
                        tv_show_id: tv_show_id,
                        category_id: array_category_ids[i],
                        is_available: true,
                        company_id: company_id
                    }, {transaction: t}).catch(function(error){
                        winston.error(error)
                    })
                )
            }
            return Promise.all(transactions_array, {transaction: t}); //execute transaction
        }).then(function (result) {
            return {status: true, message:'transaction executed correctly'};
        }).catch(function (err) {
            winston.error("Error executing transaction, error: ", err);
            return {status: false, message:'error executing transaction'};
        })
    }).catch(function (err) {
        winston.error("Error deleting existing packages, error: ", err);
        return {status: false, message:'error deleting existing packages'};
    })
}

function link_tv_show_with_packages(item_id, data_array, model_instance, company_id) {
    var transactions_array = [];
    var destroy_where = (data_array.length > 0) ? {
        tv_show_id: item_id,
        company_id: company_id,
        package_id: {$notIn: data_array}
    } : {tv_show_id: item_id};

    return model_instance.destroy({
        where: destroy_where
    }).then(function (result) {
        return sequelize_t.sequelize.transaction(function (t) {
            for (var i = 0; i < data_array.length; i++) {
                transactions_array.push(
                    model_instance.upsert({
                        tv_show_id: item_id,
                        package_id: data_array[i],
                        is_available: true,
                        company_id: company_id
                    }, {transaction: t})
                )
            }
            return Promise.all(transactions_array, {transaction: t}); //execute transaction
        }).then(function (result) {
            return {status: true, message:'transaction executed correctly'};
        }).catch(function (err) {
            winston.error("Error executing transaction, error: ", err);
            return {status: false, message:'error executing transaction'};
        })
    }).catch(function (err) {
        winston.error("Error deleting existing packages, error: ", err);
        return {status: false, message:'error deleting existing packages'};
    })
}

/**
 * Create
 */
exports.create = function(req, res) {
    if(!req.body.clicks) req.body.clicks = 0;
    if(!req.body.duration) req.body.duration = 0;

    var array_tv_series_categories = req.body.tv_series_categories || [];
    delete req.body.tv_series_categories;

    var array_tv_series_packages = req.body.tv_series_packages || [];
    delete req.body.tv_series_packages;
    req.body.company_id = req.token.company_id; //save record for this company
    var limit = req.app.locals.backendsettings[req.token.company_id].asset_limitations.vod_limit;


    if(!req.body.icon_url.startsWith("/files/vod/")){
        var origin_url_icon_url = 'https://image.tmdb.org/t/p/w500'+req.body.icon_url;
        var destination_path_icon_url = "./public/files/vod/";
        var vod_filename_icon_url = req.body.icon_url; //get name of new file
        var options_icon_url = {
            directory: destination_path_icon_url,
            filename: vod_filename_icon_url
        };
        download(origin_url_icon_url, options_icon_url, function(err){
            if (err){
                winston.error("Error downloading tmdb image, error:  "+err);
            }
        });
        // delete req.body.poster_path;
        req.body.icon_url = '/files/vod'+vod_filename_icon_url;
    }

    if(!req.body.image_url.startsWith("/files/vod/")){
        var origin_url_image_url = 'https://image.tmdb.org/t/p/original'+req.body.image_url;
        var destination_path_image_url = "./public/files/vod/";
        var vod_filename_image_url = req.body.image_url; //get name of new file
        var options = {
            directory: destination_path_image_url,
            filename: vod_filename_image_url
        };
        download(origin_url_image_url, options, function(err){
            if (err){
                winston.error("Error downloading tmdb image, error:  "+err);
            }
        });
        // delete req.body.backdrop_path;
        req.body.image_url = '/files/vod'+vod_filename_image_url;
    }
    saas_functions.check_limit('vod', req.token.company_id, limit).then(function(limit_reached){
        if(limit_reached === true) return res.status(400).send({message: "You have reached the limit number of vod items you can create for this plan. "});
        else {
            DBModel.create(req.body).then(function (result) {
                if (!result) {
                    winston.error("Couldn't create tv series");
                    return res.status(400).send({message: 'Failed to create tv-series'});
                } else {
                    logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(req.body));
                    return link_tv_show_with_genres(result.id, array_tv_series_categories, db.tv_series_categories, req.token.company_id).then(function (t_result) {
                        if (t_result.status) {
                            return link_tv_show_with_packages(result.id, array_tv_series_packages, db.tv_series_packages, req.token.company_id).then(function (t_result) {
                                if (t_result.status) {
                                    return res.jsonp(result);
                                } else {
                                    return res.send(t_result);
                                }
                            })
                        } else {
                            return res.send(t_result);
                        }
                    })
                }
            }).catch(function (err) {
                winston.error("Couldn't create tv series, error: ", err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            });
        }})
};


/**
 * Show current
 */
exports.read = function(req, res) {
    const id = req.params.tmdbIdd
    if (!(id % 1 === 0)) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    var options = { method: 'GET',
        url: 'https://api.themoviedb.org/3/tv/'+id,
        qs:
            { language: 'en-US',
                api_key: 'e76289b7e0306b6e6b6088148b804f01',
                append_to_response: 'credits,videos'
            },
        body: '{}' };


    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        let res_data = JSON.parse(body);

        // get all starring/cast from tmdb
        var b;
        var starring_array = '';
        for (b = 0; b < res_data.credits.cast.length; b++ ){
            starring_array += res_data.credits.cast[b].name+',';
        }
        //./get all starring/cast from tmdb

        //get director from tmdb
        var c;
        var director_array = '';
        for (c = 0; c < res_data.credits.crew.length; c++ ){

            if (res_data.credits.crew[c].job === 'Executive Producer')
                director_array += res_data.credits.crew[c].name+',';
        }
        //./get director from tmdb

        //get trailer url
        if(res_data.videos.results.length > 0){
            res_data.trailer_url = 'https://www.youtube.com/watch?v='+res_data.videos.results[0].key;
        }else {
            res_data.trailer_url = '';
        }
        //./get trailer url

        //get origin country
        var origin_country = '';
        origin_country += res_data.origin_country;
        //./get origin country


        res_data.origin_country = origin_country;
        res_data.title = res_data.name; delete res_data.name;
        res_data.description = res_data.overview; delete res_data.overview;
        res_data.icon_url = res_data.poster_path; delete res_data.poster_path;
        res_data.image_url = res_data.backdrop_path; delete res_data.backdrop_path;
        res_data.cast = starring_array; delete res_data.credits;
        res_data.director = director_array;



        res.send(res_data);
    });
};

/**
 * List
 */

exports.list = function(req, res) {
    var query = req.query;
    var page = query.page || 1;

    if(parseInt(query._start)) page = parseInt(query._start);

    var options = { method: 'GET',
        url: 'https://api.themoviedb.org/3/search/tv',
        qs:
            { page: page,
                query: query.q,
                api_key: 'e76289b7e0306b6e6b6088148b804f01' },
        body: '{}' };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        let res_data = JSON.parse(body);
        // res.setHeader("X-Total-Count", res_data.total_results);
        res.send(res_data.results);
    });
};