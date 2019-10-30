'use strict';
var winston = require("winston");

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModelTvSeries = db.tv_episode_subtitles,
    DBModelVod = db.vod_subtitles,
    OS = require('opensubtitles-api');

var download = require('download-file');

const OpenSubtitles = new OS({
    useragent:'TemporaryUserAgent',
    username: '',
    password: '',
    ssl: true
});

const languages = ['en', 'fr', 'pt', 'sp', 'ru', 'sq', 'mk', 'ar', 'sl', 'et', 'bg', 'sv', 'zt', 'bs', 'sr', 'he', 'hr', 'ro', 'tr', 'it', 'cs', 'pb', 'nl', 'el', 'no', 'sk', 'de', 'es', 'ms', 'fa', 'ja',, 'fi', 'da'];
/**
 * @return {string}
 */
const uuid = function () {
    return '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Create
 */
exports.create = function(req, res) {
    const {vodId, episodeId, url, language} = req.body.data;

    if ((vodId && vodId !== '') && (episodeId && episodeId !== '')) {
        winston.error("Error you must enter both vodId and episodeId at subtitle controller");
        return res.status(400).send({message: "Error you must not enter both vodId and episodeId"})
    }
    req.body.company_id = req.token.company_id; //save record for this company

    const destination_subtitles = "./public/files/subtitles/";
    const subtitle_url = req.body.data.vodId ? req.body.data.vodId : req.body.data.episodeId ; //get name of new file
    const options = {
        directory: destination_subtitles,
        filename: uuid() + subtitle_url + '.zip'
    };
    download(url, options, function (err) {
        if (err) {
            winston.error("Error downloading subtitle file, error: " + err);
            return res.status(400).send({message: `Error download file ${err}`})
        }
    });
    req.body.data.url = '/files/subtitles' + subtitle_url;
    if (vodId && vodId !== '') {
        const body = {
            subtitle_url: '/files/subtitles/' + options.filename,
            company_id: req.token.company_id,
            vod_id: vodId,
            title: language,
            language
        };
        DBModelVod.create(body).then(function (result) {
            if (!result) {
                winston.error("Error creating vod subtitles");
                return res.status(400).send({message: 'fail create data'});
            } else {
                res.status(200).jsonp(result)
            }
        }).catch(function (err) {
            winston.error("Error creating vod subtitles, error: " + err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    } else if (episodeId && episodeId !== '') {
        const body = {
            subtitle_url: '/files/subtitles/' + options.filename,
            company_id: req.token.company_id,
            tv_episode_id: episodeId,
            title: language,
            language
        };
        DBModelTvSeries.create(body).then(function (result) {
            if (!result) {
                return res.status(400).send({message: 'fail create data'});
            } else {
                res.status(200).jsonp(result)
            }
        }).catch(function (err) {
            winston.error("Error creating tv series subtitles, error: ", err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    }
};


/**
 * Show current
 */
exports.read = function(req, res) {
    const name = req.params.id;

    OpenSubtitles.login()
        .then(data => {
            OpenSubtitles.search({
                query: name
            }).then(dt => {
                res.status(200).send([dt["en"]][0])
            })
        })
        .catch(err => {
            winston.error("Failed logging in to open subtitles and getting data, error: ", err);
        });
};

/**
 * List
 */

exports.list = function(req, res) {
    const query = req.query.query;
    let arr = [];

    OpenSubtitles.login()
        .then(data => {
            OpenSubtitles.search({
                query
            }).then(dt => {
                languages.map(language => {
                    if(dt[language]) {
                        arr.push(dt[language])
                    }
                });
                res.status(200).send(arr)
            })
        })
        .catch(err => {
            winston.error("Failed logging in to open subtitles and listing subtitles, error: ", err);
        });

};