'user strict';

//stripe servers IPs list
var stripe_whiteilst_IPs =[];

exports.stripe_isAllowed = function(req, res, next) {

    var reqip = req.ip.replace('::ffff:', '');

    if (stripe_whiteilst_IPs.indexOf(req) === -1) {
        //IP not found
        res.send('error')
    }
    else {
        //ipfound on list
        next();
    }
};