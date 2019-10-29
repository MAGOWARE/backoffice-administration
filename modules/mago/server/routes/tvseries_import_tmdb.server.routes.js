'use strict';

var passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    tmdbtvseries = require(path.resolve('./modules/mago/server/controllers/tvseries_import_tmdb.server.controller'));


module.exports = function(app) {

    /* ===== vods ===== */
    app.route('/api/tmdbseries')
        .all(policy.Authenticate)
        .get(tmdbtvseries.list);

    app.route('/api/tmdbseries/:tmdbIdd')
        .all(policy.Authenticate)
        .get(tmdbtvseries.read);

    app.route('/api/tmdbseries/*')
        .all(policy.Authenticate)
        .put(tmdbtvseries.create);
};
