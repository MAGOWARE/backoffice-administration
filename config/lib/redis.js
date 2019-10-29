var path = require('path'),
    RedisServer = require('redis-server'),
    download = require('download'),
    fs = require('fs-extra'),
    winston = require('./winston'),
    redis = require('redis'),
    extractZip = require('extract-zip');

var binName;
var dir = './bin/redis';

module.exports.startServer = function(callback) {
    if (process.platform == 'win32') {
        binName = 'redis-server.exe';
        if (!fs.existsSync(dir)) {
            winston.info('Redis is missing! Downloading');
            getRedisFromLocalCopy();
        }
        else {
            start();
        }    
    } else {
        binName = 'redis-server';
        if (!fs.existsSync(dir)) {
            winston.info('Redis is missing! Downloading');
            getRedisFromLocalCopy();
        }
        else {
            start();
        }    
    }
    
    function downloadRedis(downloadUrl) {
        const ext = path.extname(downloadUrl);
        const filename = 'redis-server' + ext;
    
        download(downloadUrl).then((data) => {
            // noinspection JSAnnotator
            fs.writeFileSync('./redis/' + filename, data, {mode: 0775});
            if (ext == '') {
                start();
                return;
            } 
            else if (ext == '.zip') {
                //unzip to redis folder and cleanup
                const dir  = path.resolve('./redis');
                extractZip('./redis/' + filename, {dir: dir}, function(err) {
                    if (err) {
                        callback(err);
                        return;
                    }
    
                    winston.info('Redis download complete');
                    start()
                })
            }
        })
    }

    function getRedisFromLocalCopy() {
        winston.info("Getting redis from local stock");
        
        if (!fs.existsSync('./bin')) {
            fs.mkdirSync('./bin');

            fs.mkdirSync(dir);
        }
        else {
            fs.mkdirSync(dir);
        }

        const source = './public/files/redis/'
        if(process.platform == 'win32') {
            const dir  = path.resolve('./bin/redis');
            extractZip(source + 'redis-win.zip', {dir: dir}, function(err) {
                if (err) {
                    callback(err);
                    return;
                }

                winston.info('Redis install complete');
                start()
            });
        } else {
            let version = process.platform == 'darwin' ? 'redis-darwin': 'redis-linux';
            fs.copySync(source + version, dir + '/' + binName);
            // noinspection JSAnnotator
            fs.chmodSync(dir + '/' + binName, 0775);

            start();
        }
    }
    
    function start () {
        server = new RedisServer({
            port: 6379,
            bin: dir + '/' + binName
        });
    
        server.open((error) => {
            if (error) {
                callback(error);
                return;
            }

            winston.info('Redis server started');
            callback(null);
        });
    }    
}

module.exports.createClient = function() {
    this.client = redis.createClient({port: 6379})
    
    this.client.on('error', function(error){
        winston.error("Redis error: " + error);
    });
}

module.exports.client = null;