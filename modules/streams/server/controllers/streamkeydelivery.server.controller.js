'use strict'
var path = require('path'),
    crypto = require('crypto'),
    response = require(path.resolve("./config/responses.js"));
var winston = require("winston");

const keyStr = "";

const secure_key = ""; //server side only
const token_valid_time = 96000; //time window for valid tokens

function generate_sha1( data ) {
    var generator = crypto.createHash('sha1');
    generator.update( data );
    return generator.digest('hex')
}

exports.generate_internal_hash_token = function(req,res) {
    req.track_object = {};

        let ip = req.query.ip || req.ip.replace('::ffff:', '');
        let starttime = req.query.starttime || Date.now() / 1000 | 0;
        let username = req.auth_obj.username;
        let tohash = secure_key + ip + starttime + username;
        let token = "?token=" + generate_sha1(tohash) + "~" + ip + "~" + starttime + "~" + username;

            var theresponse = {
                status_code: 200,
                error_code: 1,
                timestamp: Date.now(),
                error_description: "OK",
                extra_data: token,
                response_object: []
            };

            req.track_object.el = JSON.stringify(req.auth_obj);
            req.track_object.an = "small screen";      //application name
            req.track_object.av = "1.1";    //application version
            req.track_object.aid= req.auth_obj.appid | 3;         //application id

            //googlelogs.sendlog(req);
            res.send(theresponse);


};

//get request for decryption key
exports.generate_internal_key = function(req,res) {

    req.track_object = {};
    req.auth_obj = {};

    if(req.query.token) {
        let queryobject = req.query.token.split("~");

        //if token has more than three objects
        if(queryobject.length >= 3 ) {
            let timenow = req.query.starttime || Date.now() / 1000 | 0;

            //if time difference lower than limitatino
            if((timenow - queryobject[2]) < token_valid_time) {
                let ip = req.query.ip || req.ip.replace('::ffff:', '');
                let username = queryobject[3];
                let thishashvalue = generate_sha1(secure_key + ip + queryobject[2] + username);
                let tmptoken = "?token=" + thishashvalue + "~" + ip + "~" + queryobject[2] + "~" + queryobject[3];

                if(thishashvalue === queryobject[0]) {
                    req.auth_obj.username = username;
                    req.track_object.el = JSON.stringify(req.auth_obj);
                    req.track_object.ev = timenow - queryobject[2];
                    req.auth_obj.description = "success key request";
                    //googlelogs.sendlog(req);

                    var keyBuffer = [];
                    res.writeHead(200, {"Content-Type": "binary/octet-stream", "Pragma": "no-cache"});
                    for (var i = 0; i < keyStr.length - 1; i += 2)
                        keyBuffer.push(parseInt(keyStr.substr(i, 2), 16));
                    var content = String.fromCharCode.apply(String, keyBuffer);

                    res.end(content); //deliver decryption key
                }
                else {

                    req.auth_obj.username = username;
                    req.track_object.el = JSON.stringify(req.auth_obj);
                    req.track_object.ev = timenow - queryobject[2];
                    req.auth_obj.description = "invalid key request - hash mismatch";
                    //googlelogs.sendlog(req);

                    winston.error('invalid hash');
                    res.send('invalid hash');
                }
            }
            else {
                req.track_object.el = JSON.stringify(req.auth_obj);
                req.auth_obj.description = "invalid key request - old token"
                //googlelogs.sendlog(req);
                res.send('old reques');
            }
        }
        else {
            req.track_object.el = JSON.stringify(req.auth_obj);
            req.auth_obj.description = "invalid key request - bad token";
            //googlelogs.sendlog(req);
            res.send('bad token');
        }
    }
    else {
        req.track_object.el = JSON.stringify(req.headers);
        req.auth_obj.description = "invalid key request - no token";
        //googlelogs.sendlog(req);
        res.send('no token');
    }
};