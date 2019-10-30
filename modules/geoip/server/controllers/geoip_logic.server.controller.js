'use strict'

const Reader = require('@maxmind/geoip2-node').Reader;
var path = require('path'),
    fs = require('fs-extra'),
    downloader = require('download-file'),
    tar = require('tar'),
    winston = require(path.resolve('./config/lib/winston'));

exports.handleGetIPData = function(req, res) {
   let ip = req.query.ip;
   if (!ip) {
       res.send("Invalid geoip request")
       return;
   }

   Reader.open('./public/files/geoip/GeoLite2-City.mmdb')
       .then(function(reader) {
           let geoInfo = reader.city(ip);
           let response = {};
           response.country = geoInfo.country.isoCode
           response.city = geoInfo.city.names.en;
           response.timezone = geoInfo.location.timeZone;
           res.send({status: true, geo_data: response});
        }).catch(function(error) {
            res.send({status: false, message: error})
        });
}

exports.middleware = function (req, res, next) {
    var ip = req.ip.replace('::ffff:', ''); //req.header('x-forwarded-for') || req.connection.remoteAddress;

    return Reader.open('./public/files/geoip/GeoLite2-City.mmdb')
    .then(function(reader) {
        let geoInfo = reader.city(ip);
        let response = {};
        response.country = geoInfo.country.isoCode;
        response.city = geoInfo.city.names.en;
        response.timezone = geoInfo.location.timeZone;
        req.geoip = response;
        next()
     }).catch(function(error) {
        req.geoip = {};
        req.geoip.country = "England";
        req.geoip.city = "Greenwich";
        req.geoip.timezone = "Etc/Greenwich";
        next();
     });
 
};

exports.handleDownloadDatabase = function(req, res) {
    let url = req.body.url;

    if (!url) {
        return res.send({status: false, message: "Invalid url"});
    }
    
    let extension;
    if(url.endsWith('.tar.gz')) {
        extension = '.tar.gz';
    }

    var options = {
        directory: './public/files/geoip',
        filename: 'GeoLite2-City' + extension
    }

    downloader(url, options, function(err) {
        if (err) {
            winston.error("Error downloading geoip database, error: ", err);
            res.send({status: false, message: 'Error downloading'});
            return;
        }
        
        winston.info("GEOIP database downloaded");

        let path = options.directory + '/' + options.filename;
        let dbPath;

        tar.x({
            file: path,
            cwd: options.directory,
            strip: 0,
            filter: (path, entry) => {
                if (entry.path.endsWith('.mmdb')) {
                    dbPath = entry.path;
                    return true;
                }
                
                return false;
            },
        }).then(() => {
            if (!dbPath) {
                res.send({status:false, message : "No mmdb file found in tar"});
                return;
            }
    
            move(options.directory + '/' + dbPath, options.directory + '/GeoLite2-City.mmdb', function(err) {
                if (err) {
                    winston.error("Error moving GeoIP database", err);
                    res.send({status: false, message: 'Error copying'});
                }
                else {
                    res.send({status: true, message: "Database Updated"});
                    //cleanup
                    fs.remove(path);
                    let folderName = dbPath.toString();
                    folderName = folderName.substring(0, folderName.indexOf('/'));
                    fs.remove(options.directory + '/' + folderName);
                }
            });
        });    
    });

    function move(oldPath, newPath, callback) {

        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
                    copy();
                } else {
                    callback(err);
                }
                return;
            }
            callback();
        });
    
        function copy() {
            var readStream = fs.createReadStream(oldPath);
            var writeStream = fs.createWriteStream(newPath);
    
            readStream.on('error', callback);
            writeStream.on('error', callback);
    
            readStream.on('close', function () {
                fs.unlink(oldPath, callback);
            });
    
            readStream.pipe(writeStream);
        }
    }
}

exports.handleDatabaseStatus = function(req, res) {
    if (fs.existsSync('./public/files/geoip/GeoLite2-City.mmdb')) {
        res.send({status:true, message: "Geoip is active"});
    }
    else {
        res.send({status: false, message: "Geoip is not active because Database binary file not found"});
    }
}
