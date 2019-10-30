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
    request = require("request"),
    fs = require('fs');

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
                company_id: company_id,
                category_id: {$notIn: array_category_ids}
            }
        }
    ).then(function (result) {
        return sequelize_t.sequelize.transaction(function (t) {
            for (var i = 0; i < array_category_ids.length; i++) {
                transactions_array.push(
                    db_model.upsert({
                        tv_show_id: tv_show_id,
                        category_id: array_category_ids[i],
                        company_id: company_id,
                        is_available: true
                    }, {transaction: t}).catch(function(error){
                        winston.error("Error at link_tv_show_with_genres, transaction upsert, error:" + error)
                    })
                )
            }
            return Promise.all(transactions_array, {transaction: t}); //execute transaction
        }).then(function (result) {
            return {status: true, message:'transaction executed correctly'};
        }).catch(function (err) {
            winston.error("Error at link_tv_show_with_genres, failed executing transaction, error:" + err);
            return {status: false, message:'error executing transaction'};
        })
    }).catch(function (err) {
        winston.error("Error at link_tv_show_with_genres, error deleting existing packages, error:" + err);
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
                        company_id: company_id,
                        package_id: data_array[i],
                        is_available: true
                    }, {transaction: t})
                )
            }
            return Promise.all(transactions_array, {transaction: t}); //execute transaction
        }).then(function (result) {
            return {status: true, message:'transaction executed correctly'};
        }).catch(function (err) {
            winston.error("Error at link_tv_show_with_packages, failed executing transaction, error:" + err);
        })
    }).catch(function (err) {
        winston.error("Error at link_tv_show_with_packages, error deleting existing packages, error:" + err);
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

    DBModel.create(req.body).then(function(result) {
        if (!result) {
            winston.error("Error at creating tv-series method");
            return res.status(400).send({message: 'Failed creating tv-series'});
        } else {
            logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(req.body));
            return link_tv_show_with_genres(result.id,array_tv_series_categories, db.tv_series_categories, req.token.company_id).then(function(t_result) {
                if (t_result.status) {
                    return link_tv_show_with_packages(result.id, array_tv_series_packages, db.tv_series_packages, req.token.company_id).then(function(t_result) {
                        if (t_result.status) {
                            return res.jsonp(result);
                        }
                        else {
                            return res.send(t_result);
                        }
                    })
                }
                else {
                    return res.send(t_result);
                }
            })
        }
    }).catch(function(err) {
        winston.error("Error at creating tv-series method error: " + err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};


/**
 * Show current
 */
exports.read = function(req, res) {
    if(req.tv_show.company_id === req.token.company_id) res.json(req.tv_show);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {

    var updateData = req.tv_show;
    if(updateData.icon_url != req.body.icon_url) {
        var deletefile = path.resolve('./public'+updateData.icon_url);
    }
    if(updateData.image_url != req.body.image_url) {
        var deleteimage = path.resolve('./public'+updateData.image_url);
    }

    var array_tv_series_categories = req.body.tv_series_categories || [];
    delete req.body.tv_series_categories;

    var array_tv_series_packages = req.body.tv_series_packages || [];
    delete req.body.tv_series_packages;

    if(req.tv_show.company_id === req.token.company_id){
        updateData.updateAttributes(req.body).then(function(result) {
            if(deletefile) {
                fs.unlink(deletefile, function (err) {
                    //todo: return some warning
                });
            }
            logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(req.body));
            if(deleteimage) {
                fs.unlink(deleteimage, function (err) {
                    //todo: return some warning
                });
            }
            return link_tv_show_with_genres(req.body.id,array_tv_series_categories, db.tv_series_categories, req.token.company_id).then(function(t_result) {
                if (t_result.status) {
                    return link_tv_show_with_packages(req.body.id, array_tv_series_packages, db.tv_series_packages, req.token.company_id).then(function(t_result) {
                        if (t_result.status) {
                            return res.jsonp(result);
                        }
                        else {
                            return res.send(t_result);
                        }
                    })
                }
                else {
                    return res.send(t_result);
                }
            })
        }).catch(function(err) {
            winston.error("Error at tv-series, error: " + err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    }
    else{
        res.status(404).send({message: 'User not authorized to access these data'});
    }
};


/**
 * Delete
 */
exports.delete = function(req, res) {
    //delete single tv show item and it's dependencies, as long as the item doesn't belong to a package
    db.tv_series_packages.findAll({
        where: {tv_show_id: req.tv_show.id}
    }).then(function (delete_tv_show) {
        if (delete_tv_show && delete_tv_show.length > 0) {
            return res.status(400).send({message: 'This item belongs to at least one package. Please remove it from the packages and try again'});
        }
        else {
            return sequelize_t.sequelize.transaction(function (t) {
                return db.tv_series_categories.destroy({where: {tv_show_id: req.tv_show.id}}, {transaction: t}).then(function (removed_genres) {
                    return db.t_tv_series_sales.destroy({where: {tv_show_id: req.tv_show.id}}, {transaction: t}).then(function (removed_series_sales) {
                        return db.tv_season.destroy({where: {tv_show_id: req.tv_show.id}}, {transaction: t}).then(function (removed_seasons) {
                            return db.tv_series.destroy({where: {id: req.tv_show.id, company_id: req.token.company_id}}, {transaction: t});
                        });
                    });
                });
            }).then(function (result) {
                return res.json(result);
            }).catch(function (err) {
                winston.error("Deleting tv-show item failed, error: " + err);
                return res.status(400).send({message: 'Deleting tv-show item failed, error ' + err });
            });
        }
    }).catch(function (error) {
        winston.error("Searching tv-show item failed, error: " + error);
        return res.status(400).send({message: 'Searching for this tv show item failed : ' + error});
    });

};

exports.list = function(req, res) {
    var qwhere = {},
        final_where = {},
        query = req.query;

    var package_where = (query.not_id) ? {id: {$notIn: [query.not_id]}} : {id: {$gt: 0}};

    if(query.q) {
        qwhere.$or = {};
        qwhere.$or.title = {};
        qwhere.$or.title.$like = '%'+query.q+'%';
        qwhere.$or.description = {};
        qwhere.$or.description.$like = '%'+query.q+'%';
        qwhere.$or.director = {};
        qwhere.$or.director.$like = '%'+query.q+'%';
    }
    if(query.title) qwhere.title = {like: '%'+query.title+'%'};

    //filter films added in the following time interval
    if(query.added_before && query.added_after) qwhere.createdAt = {lt: query.added_before, gt: query.added_after};
    else if(query.added_before) qwhere.createdAt = {lt: query.added_before};
    else if(query.added_after) qwhere.createdAt = {gt: query.added_after};
    //filter films updated in the following time interval
    if(query.updated_before && query.updated_after) qwhere.createdAt = {lt: query.updated_before, gt: query.updated_after};
    else if(query.updated_before) qwhere.createdAt = {lt: query.updated_before};
    else if(query.updated_after) qwhere.createdAt = {gt: query.updated_after};
    if(query.expiration_time) qwhere.expiration_time = query.expiration_time;
    if(query.is_available === 'true') qwhere.is_available = true;
    else if(query.is_available === 'false') qwhere.is_available = false;
    if(query.pin_protected === '1') qwhere.pin_protected = true;
    else if(query.pin_protected === '0') qwhere.pin_protected = false;

    //start building where
    final_where.where = qwhere;
    if(parseInt(query._end) !== -1){
        if(parseInt(query._start)) final_where.offset = parseInt(query._start);
        if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
    }
    if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;

    var category_filter = (req.query.category) ? {
        where: {category_id: Number(req.query.category), is_available: true},
        required: true
    } : {where: {category_id: {gt: 0}, is_available: true}, required: false};
    var package_filter = (req.query.package_id) ? {
        where: {package_id: Number(req.query.package_id)},
        required: true
    } : {where: {package_id: {gt: 0}}, required: false};
    final_where.include = [
        {
            model: db.tv_series_categories,
            attributes: ['category_id'],
            where: category_filter.where,
            required: category_filter.required
        },
        {
            model: db.tv_series_packages,
            attributes: ['package_id'],
            required: package_filter.required,
            where: package_filter.where
        }
    ];


    final_where.distinct = true; //avoids wrong count number when using includes
    //end build final where
    final_where.where.company_id = req.token.company_id; //return only records for this company

    if(query.not_id){
        db.tv_series_packages.findAll({attributes: [ 'tv_show_id'], where: {package_id: query.not_id}}).then(function(excluded_tv_show_items){
            //prepare array with id's of all tv show items that belong to specified package
            var excluded_item_list = [];
            for(var i=0; i<excluded_tv_show_items.length; i++) excluded_item_list.push(excluded_tv_show_items[i].tv_show_id);
            if(excluded_item_list.length > 0) qwhere.id = {$notIn: excluded_item_list}; //if there are items to be excluded, add notIn filter

            DBModel.findAndCountAll(final_where).then(function(results) {
                if (!results) return res.status(404).send({message: 'No data found'});
                else {
                    res.setHeader("X-Total-Count", results.count);
                    res.json(results.rows);
                }
            }).catch(function(err) {
                winston.error("Error tv series list, error: " + err);
                res.jsonp(err);
            });
        });
    }
    else{
        DBModel.findAndCountAll(
            final_where
        ).then(function(results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                res.setHeader("X-Total-Count", results.count);
                res.json(results.rows);
            }
        }).catch(function(err) {
            winston.error("Error fetching tv series list and count, error: " + err);
            res.jsonp(err);
        });
    }



};

/**
 * middleware
 */
exports.dataByID = function(req, res, next, id) {

    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    DBModel.find({
        where: {
            id: id
        },
        include: [
            {model: db.tv_series_categories, where: {is_available: true}, required: false}, //outer join, to display also movies that don't belong to any category
            {model: db.tv_series_packages, required: false}
        ]
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.tv_show = result;
            next();
            return null;
        }
    }).catch(function(err) {
        winston.error("Error at fetching dataById tv-series, error: " + err);
        return next(err);
    });

};



/**
 * @api {post} /api/update_film/ update film
 * @apiVersion 0.2.0
 * @apiName UpdateFilm3rdParty
 * @apiGroup Backoffice
 * @apiHeader {String} authorization Token string acquired from login api.
 * @apiDescription Gets movie information from a third party and updates movie
 * @apiSuccessExample Success-Response:
 *     {
 *       "title": "Pan's Labyrinth",
 *       "imdb_id": "tt0457430",
 *       "description": "In the falangist Spain of 1944, ...",
 *       "year": "2006",
 *       "rate": 8,
 *       "duration": "118",
 *       "director": "Guillermo del Toro",
 *       "starring": "Ivana Baquero, Sergi López, Maribel Verdú, Doug Jones"
 *      }
 * @apiErrorExample Error-Response:
 *     {
 *        "message": "error message"
 *     }
 *     Error value set:
 *     An error occurred while updating this movie // Unexpected error occurred when the movie was being updated with teh new data
 *     Could not find this movie // the search params did not return any movie
 *     An error occurred while searching for this movie // Unexpected error occurred while searching for the movie in our database
 *     An error occurred while trying to get this movie's data // Unexpected error occurred while getting the movie's data from the 3rd party
 *     Unable to parse response // The response from the 3rd party service was of invalid format
 *     Unable to find the movie specified by your keywords // The 3rd party service could not find a match using our keywords
 *
 */
exports.update_film = function(req, res) {
    var tv_show_where = {};
    if(req.body.imdb_id) tv_show_where.imdb_id = req.body.imdb_id;
    else if(req.body.tv_show_id) tv_show_where.id = req.body.tv_show_id;
    else {
        if(req.body.title) tv_show_where.title = req.body.title;
        if(req.body.year) tv_show_where.year = req.body.year;
    }

    DBModel.findOne({
        attributes: ['title', 'imdb_id'], where: tv_show_where
    }).then(function(tv_show_data){
        if(tv_show_data){
            var search_params = {"tv_show_title": tv_show_data.title};
            if(tv_show_data.imdb_id !== null) search_params.imdb_id = tv_show_data.imdb_id; //only use if it is not null
            omdbapi(search_params, function(error, response){
                if(error){
                    return res.status(404).send({
                        message: response
                    });
                }
                else{
                    DBModel.update(
                        response, {where: tv_show_where}
                    ).then(function(result){
                        res.send(response);
                    }).catch(function(error){
                        winston.error("Error at updating tv-series film, error: " + error);
                        return res.status(404).send({
                            message: "An error occurred while updating this movie"
                        });
                    });
                    return null;
                }
            });
        }
        else return res.status(404).send({
            message: "Could not find this movie"
        });
    }).catch(function(error){
        winston.error("An error occurred while searching for this movie at tv series, error: ", error);
        return res.status(404).send({
            message: "An error occurred while searching for this movie"
        });
    })



};

function omdbapi(tv_show_data, callback){

    var api_key = "a421091c"; //todo: dynamic value
    var search_params = "";
    if(tv_show_data.imdb_id) search_params = search_params+'&'+'i='+tv_show_data.imdb_id;
    else{
        if(tv_show_data.tv_show_title) search_params = search_params+'&'+'t='+tv_show_data.tv_show_title;
        if(tv_show_data.year) search_params = search_params+'&'+'&y='+tv_show_data.year;
    }

    if(search_params !== ""){
        var options = {
            url: 'http://www.omdbapi.com/?apikey='+api_key+search_params,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        request(options, function (error, response, body) {
            if(error) {
                winston.error("Error at tv-series error: " + error);
                callback(true, "An error occurred while trying to get this movie's data");
            }
            else try {
                var tv_show_data = {
                    title: JSON.parse(response.body).Title,
                    imdb_id: JSON.parse(response.body).imdbID,
                    //category: JSON.parse(response.body).Genre, //todo:get categories list, match them with our list
                    description: JSON.parse(response.body).Plot,
                    year: JSON.parse(response.body).Year,
                    //icon_url: JSON.parse(response.body).Poster, //todo: check if url is valid. donwload + resize image. if successful, pass new filename as param
                    rate: parseInt(JSON.parse(response.body).imdbRating),
                    duration: JSON.parse(response.body).Runtime.replace(' min', ''),
                    director: JSON.parse(response.body).Director,
                    starring: JSON.parse(response.body).Actors,
                    //pin_protected: (['R', 'X', 'PG-13'].indexOf(JSON.parse(response.body).Rated) !== -1) ? 1 : 0 //todo: will this rate be taken into consideration?
                };
                callback(null, tv_show_data);
            }
            catch(error){
                callback(true, "Unable to parse response");
            }

        });
    }
    else{
        callback(true, "Unable to find the movie specified by your keywords");
    }

}