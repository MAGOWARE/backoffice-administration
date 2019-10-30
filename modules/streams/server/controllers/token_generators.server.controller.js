'use strict'
var path = require('path'),
    response = require(path.resolve("./config/responses.js")),
    akamai_token_generator = require(path.resolve('./modules/streams/server/controllers/akamai_token_v2')),
    crypto = require('crypto'),
    responses = require(path.resolve("./config/responses.js")),
    ectoken = require('ectoken').V3;


//nimble dateFormat function
var dateFormat = function () {
    var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var	_ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Nimble dateFormat MASKS
dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Nimble Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};


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

//temp hdnts

exports.akamai_token_v2_generator_hdnts = function(req,res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].akamai;
    var config = {
        algorithm : 'SHA256',
        acl : '*',
        window : tokenConfig.window,
        key : tokenConfig.key,
        //ip: getClientIp(req),
        ip: req.ip.replace('::ffff:', ''),
        startTime:0,
        url:'',
        session:'',
        data:req.auth_obj.username,
        salt: tokenConfig.salt,
        delimeter:'~',
        escape_early:false,
        name:'hdnts'
    };

    var token = "?" + new akamai_token_generator.default(config).generateToken();
    var theresponse = new responses.OK();
    theresponse.extra_data = token;
    res.send(theresponse);
};



exports.akamai_token_v2_generator = function(req,res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].akamai;
    var config = {
        algorithm : 'SHA256',
        acl : '*',
        window : tokenConfig.window,
        key : tokenConfig.key,
        //ip: getClientIp(req),
        ip: req.ip.replace('::ffff:', ''),
        startTime:0,
        url:'',
        session:'',
        data:req.auth_obj.username,
        salt: tokenConfig.salt,
        delimeter:'~',
        escape_early:false,
        name:'__token__'
    };

    var token = "?" + new akamai_token_generator.default(config).generateToken();
    var theresponse = new responses.OK();
        theresponse.extra_data = token;
    res.send(theresponse);
};

//returns the token as aditional query paramter
exports.akamai_token_v2_generator_extraquery = function(req,res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].akamai;
    var config = {
        algorithm : 'SHA256',
        acl : '*',
        window : tokenConfig.window,
        key : tokenConfig.key,
        //ip: getClientIp(req),
        ip: req.ip.replace('::ffff:', ''),
        startTime:0,
        url:'',
        session:'',
        data:req.auth_obj.username,
        salt: tokenConfig.salt,
        delimeter:'~',
        escape_early:false,
        name:'__token__'
    };

    var token = "&" + new akamai_token_generator.default(config).generateToken();
    var theresponse = new responses.OK();
    theresponse.extra_data = token;
    res.send(theresponse);
};


exports.catchup_akamai_token_v2_generator = function(req,res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].akamai;
    var config = {
        algorithm : 'SHA256',
        acl : '*',
        window : tokenConfig.window,
        key : tokenConfig.key,
        //ip: getClientIp(req),
        ip: req.ip.replace('::ffff:', ''),
        startTime:0,
        url:'',
        session:'',
        data:req.auth_obj.username,
        salt: tokenConfig.salt,
        delimeter:'~',
        escape_early:false,
        name:'token'
    };

    var token = "?" + new akamai_token_generator.default(config).generateToken();
    var theresponse = new responses.OK();
    theresponse.extra_data = token;
    res.send(theresponse);
};

exports.flussonic_token_generator =  function(req, res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].flussonic;

    var token_key = tokenConfig.key; //server side only
    var password = req.query.password || tokenConfig.password; //Can be sent as query parameter
    var salt = req.query.salt || tokenConfig.salt; //Can be sent as query parameter

    var stream_name = req.params[0];
    var ip = req.query.ip || req.ip.replace('::ffff:', '');
    var starttime = req.query.starttime || Date.now()/1000|0;
    var endtime = req.query.endtime || (Date.now()/1000|0) + tokenConfig.window;

    var tohash = stream_name + ip + starttime + endtime + token_key + salt;

    var token = "?token="+mysha1(tohash)+ "-" + salt + "-" + endtime + "-" + starttime;

    var theresponse = new responses.OK();
        theresponse.extra_data = token;

    res.send(theresponse);
};

exports.flussonic_token__remote =  function(req, res) {
    var stream_name = req.params.stream_name;
    var token_url = req.query.tokenurl;
    var password = 'password';
    var salt = 'somesalt';
    var ip = req.ip.replace('::ffff:', '');
    var starttime = Date.now();
    var endtime = Date.now() + 1000;

    var queryparams = 'sing?' + 'password=' + password+'&name=' + stream_name + '&salt=' + salt + '&ip=' + ip + '&startime=' + starttime + '&endtime=' + endtime;

    request(token_url+queryparams, function (error, response, body) {
        var thisresponse = new responses.OK();

        if(response.statusCode === 200) {
            thisresponse.extra_data = body;
            res.send(thisresponse);
        }
        else {
            res.send(thisresponse);
        }
    });
};

/**
 * @api {get} /apiv2/token/nimble/:content name Request token Nimble Streamer
 * @apiName GetNimbleToken
 * @apiGroup TOKEN Generators
 *
 * @apiHeader {String} auth End User auth token.
 *
 */

exports.nimble_token_generator =  function(req, res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].nimble_token;
    var today = (new Date()).format("UTC:m/d/yyyy h:MM:ss TT");
    var ip = req.ip.replace('::ffff:', ''); //req.connection.remoteAddress;
    var str2hash = ip + tokenConfig.key + today + tokenConfig.window;

    var md5sum = crypto.createHash('md5');
        md5sum.update(str2hash, 'ascii');
    var base64hash = md5sum.digest('base64');

    var urlsignature = "server_time=" + today  + "&hash_value=" + base64hash + "&validminutes=" + tokenConfig.window;

    var base64urlsignature = new Buffer(urlsignature).toString('base64'); //todo: new buffer eshte depricated dhe duhet zevendesuar.

    var signedurlwithvalidinterval = "?wmsAuthSign=" + base64urlsignature;

    var thisresponse = new responses.OK();
        thisresponse.extra_data = signedurlwithvalidinterval;

    res.send(thisresponse);

};

exports.handleGenerateTokenJson = function(req, res) {
    const token = generateECToken(req);
    const resp = {"status_code":200,"error_code":-1,"error_description":"","extra_data":"?" + token,"response_object":[]};
    res.send(resp);
}

function generateECToken(req) {
    let config = req.app.locals.advanced_settings[req.thisuser.company_id].verizon;
    let expireAt = Date.now() + config.window * 1000;
    let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    ip = ip.replace('::ffff:', '');

    let paramString = 'ec_expire=' + expireAt + 
                        '&ec_proto_allow=' + config.proto_allowed +
                        '&ec_clientip=' + ip;
                        
    let token = ectoken.encrypt(config.key, paramString);
    return token;
}

exports.nimble_drm_key = function(req, res) {
    var key = req.app.locals.advanced_settings[req.thisuser.company_id].nimble_drm.key;

    var content = Buffer.from(key, 'hex');
    res.setHeader('Content-Type', 'binary/octet-stream');
    res.end(content);
};

// Generate wowza HASH Token.
exports.wowza_token_generator = function (req, res) {
    var tokenConfig = req.app.locals.advanced_settings[req.thisuser.company_id].wowza;

    // The shared secret as generated in our Wowza application (Playback security tab) - use your own
    var sharedSecret = '6e94c7a77220aea1';
    //content path coming as query parameter, path=
    var contentPath = req.query.path;

    // The Hash Query Parameter Prefix as set in Wowza application
    var customSecureTokenPrefix = 'wowzatoken';
    // A custom paramater to add pepper and salt to security - use your own
    //var customParam = 'pepperandsalt';
    // date time start
    var startTime = Date.now()/ 1000 | 0 ; //'1440081611';
    startTime = startTime - 300;
    // duration in secconds, valid for 3 hrs
    var endTime = startTime + tokenConfig.window; //'1511704011';
    var toHash;
    toHash = contentPath + '?' +
        tokenConfig.shared_secret + '&' +
        //customSecureTokenPrefix + 'CustomParameter=' + customParam + '&' +
        customSecureTokenPrefix + 'endtime=' + endTime + '&' +
        customSecureTokenPrefix + 'starttime=' + startTime;

    var hash = crypto.createHash('sha256').
    update(toHash, "utf8").
    digest('base64');

    hash = hash.replace(/\//g, '_');
    hash = hash.replace(/\+/g, '-');

    var token = "?wowzatokenstarttime=" + startTime + "&wowzatokenendtime=" + endTime + "&wowzatokenhash=" + hash;

    var thisresponse = new responses.OK();
    thisresponse.extra_data = token;

    res.send(thisresponse);

}



