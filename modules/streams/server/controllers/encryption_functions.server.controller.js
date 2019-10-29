'use strict'
var path = require('path'),
    crypto = require('crypto'),
    responses = require(path.resolve("./config/responses.js"));


 function getClientIp(req) {
    var ipAddress;
    // The request may be forwarded from local web server.
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        // 'x-forwarded-for' header may return multiple IP addresses in
        // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
        // the first one
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        // If request was not forwarded
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
}

function mysha1( data ) {
    var generator = crypto.createHash('sha1');
    generator.update( data );
    return generator.digest('hex')
}


exports.free_default_key = function(req,res) {
    var keyStr = "";

    var keyBuffer = [];
    res.writeHead(200, {"Content-Type": "binary/octet-stream", "Pragma": "no-cache"});
    for (var i = 0; i < keyStr.length-1; i += 2)
        keyBuffer.push(parseInt(keyStr.substr(i,2), 16));
    var content = String.fromCharCode.apply(String, keyBuffer);
    res.end(content);
};