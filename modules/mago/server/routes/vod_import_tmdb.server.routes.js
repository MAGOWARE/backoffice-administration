'use strict';

var passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    tmdbVod = require(path.resolve('./modules/mago/server/controllers/vod_import_tmdb.server.controller'));

module.exports = function(app) {

    /* ===== vods ===== */
    app.route('/api/tmdbvods')
        .all(policy.Authenticate)
        .get(tmdbVod.list);

    app.route('/api/tmdbvods/:tmdbId')
        .all(policy.Authenticate)
        .get(tmdbVod.read);

    app.route('/api/tmdbvods/*')
        .all(policy.Authenticate)
        .put(tmdbVod.create);

};
