'use strict';

var passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    vods = require(path.resolve('./modules/mago/server/controllers/vod.server.controller')),
    tv_shows = require(path.resolve('./modules/mago/server/controllers/tv_series.server.controller')),
    tv_seasons = require(path.resolve('./modules/mago/server/controllers/tv_seasons.server.controller')),
    tv_episodes = require(path.resolve('./modules/mago/server/controllers/tv_episodes.server.controller'));


module.exports = function(app) {

    /* ===== vods ===== */
    app.route('/api/vods')
        .all(policy.Authenticate)
        .get(vods.list)
        .post(vods.create);

    app.route('/api/vods/:vodId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(vods.read)
        .put(vods.update)
        .delete(vods.delete);

    app.param('vodId', vods.dataByID);



    /* ===== VodEpisode ===== */
    app.route('/api/VodEpisode')
        .all(policy.Authenticate)
        .get(tv_episodes.list);

    app.route('/api/VodEpisode')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .post(tv_episodes.create);

    app.route('/api/VodEpisode/:VodEpisodeId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(tv_episodes.read)
        .put(tv_episodes.update)
        .delete(tv_episodes.delete);

    app.param('VodEpisodeId', tv_episodes.dataByID);



    /* ===== VodSeries ===== */
    app.route('/api/Series')
        .all(policy.Authenticate)
        .get(tv_shows.list);

    app.route('/api/Series')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .post(tv_shows.create);

    app.route('/api/Series/:SeriesId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(tv_shows.read)
        .put(tv_shows.update)
        .delete(tv_shows.delete);

    app.param('SeriesId', tv_shows.dataByID);



    /* ===== VodSeason ===== */
    app.route('/api/Season')
        .all(policy.Authenticate)
        .get(tv_seasons.list);

    app.route('/api/Season')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .post(tv_seasons.create);

    app.route('/api/Season/:SeasonId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(tv_seasons.read)
        .put(tv_seasons.update)
        .delete(tv_seasons.delete);

    app.param('SeasonId', tv_seasons.dataByID);


    app.route('/api/update_film')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .put(vods.update_film);


};
