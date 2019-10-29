'use strict';


var path = require('path');
var makeDrm = require(path.resolve('./modules/pallycon/server/core/logics/makeDrmData'));
var issueCID = require(path.resolve('./modules/pallycon/server/core/logics/CIDIssue'));
var rightsInfo = require(path.resolve('./modules/pallycon/server/core/logics/ContentUsageRightsInfo'));
var responses = require(path.resolve("./config/responses.js"));

const crypto = require("crypto");

exports.handleCIDIssue = function(req, res) {
    res.send(issueCID.makeRes(req.body.data));
};

exports.handleContentUsageRightInfo = function(req, res) {
    res.send(rightsInfo.makeRes(req.body.data));
};



// https://pallycon.com/docs/en/multidrm/license/license-token-tutorial/
/**
 * @api {get} apiv2/pallycon/TokenIssue Get pallycon token
 * @apiName GetPallyconToken
 * @apiGroup Pallycon
 * @apiVersion  0.2.0
 * @apiHeader {String} auth Authoriation token
 * @apiSuccess (200) {Object[]} data Response
 * @apiError {String} error.message Message description of error
*/

exports.TokenIssue = function(req, res) {

    //Step 1 - Input setting values

    const AES_IV = "0123456789abcdef";
    const siteInfo = {
        siteId: "ID",
        siteKey: "PALYCON_SITE_KEY_HERE",
        accessKey: "PALYCON_ACCESS_KEY_HERE"
    };

    let licenseInfo = {
        drmType: "NCG",
        contentId: "platinium",
        userId: req.thisuser.username,
    };

    let licenseRule = {
        playback_policy: {
            limit: true,
            persistent: false,
            duration: 3600
        },
        security_policy:{
            hardware_drm:false,
            output_protect: {
                allow_external_display:true,
                control_hdcp:0
            },
            allow_mobile_abnormal_device:true,
            playready_security_level:150
        }
    };

    //Step 2 - Encrypt license rule
    const cipher = crypto.createCipheriv("aes-256-cbc", siteInfo.siteKey, AES_IV);
    let encryptedRule = cipher.update(
        JSON.stringify(licenseRule),
        "utf-8",
        "base64"
    );
    encryptedRule += cipher.final("base64");

    //console.log("encrypted rule : " + encryptedRule);

    //Step 3 - Create hash value
            let util = {
                    leadingZeros: (n, digits) => {
                    let zero = "";
            n = n.toString();
            if (n.length < digits) {
                for (var i = 0; i < digits - n.length; i++) zero += "0";
            }
            return zero + n;
        },
            getUTCTime: inputTime => {
                let now;
                if (inputTime) {
                    now = new Date(inputTime);
                } else {
                    now = new Date();
                }
                let tz = now.getTime() + now.getTimezoneOffset() * 60000;

                now.setTime(tz);
                let s =
                    util.leadingZeros(now.getFullYear(), 4) +
                    "-" +
                    util.leadingZeros(now.getMonth() + 1, 2) +
                    "-" +
                    util.leadingZeros(now.getDate(), 2) +
                    "T" +
                    util.leadingZeros(now.getHours(), 2) +
                    ":" +
                    util.leadingZeros(now.getMinutes(), 2) +
                    ":" +
                    util.leadingZeros(now.getSeconds(), 2) +
                    "Z";
                return s;
            }
        };
    const currentTimeStamp = util.getUTCTime();
    let hashData = {
        siteId: siteInfo.siteId,
        accessKey: siteInfo.accessKey,
        drmType: licenseInfo.drmType,
        userId: licenseInfo.userId,
        cid: licenseInfo.contentId,
        token: encryptedRule,
        timestamp: currentTimeStamp
    };
    const hashInput =
        hashData.accessKey +
        hashData.drmType +
        hashData.siteId +
        hashData.userId +
        hashData.cid +
        hashData.token +
        hashData.timestamp;
    //console.log("hash input : " + hashInput);
    let hashString = crypto
        .createHash("sha256")
        .update(hashInput)
        .digest("base64");
    //console.log("hash string : " + hashString);
    //Step 4 - Create license token
    let tokenData = {
        drm_type: licenseInfo.drmType,
        site_id: siteInfo.siteId,
        user_id: licenseInfo.userId,
        cid: licenseInfo.contentId,
        token: encryptedRule,
        timestamp: currentTimeStamp,
        hash: hashString
    };

    //console.log("token json : " + JSON.stringify(tokenData));
    let thisbase64TokenObject = {};
        thisbase64TokenObject.base64Token = Buffer.from(JSON.stringify(tokenData)).toString("base64");
    let thisresponse = [];
        thisresponse.push(thisbase64TokenObject);

    //console.log("base64 encoded token : " + base64Token);
    //res.send(base64Token);
    responses.sendv3(req, res,thisresponse, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');

};
