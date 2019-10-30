'use strict'

var passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    authentication = require(path.resolve('./modules/mago/server/controllers/authentication.controller')),
    companyFn = require(path.resolve('./custom_functions/company')),
    winston = require('winston');


exports.init = function (app) {
    // Use the GoogleStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and Google
    //   profile), and invoke a callback with a user object.
    passport.use(new GoogleStrategy({
            clientID: '',
            clientSecret: '',
            callbackURL: '/api/auth/google/callback',
            passReqToCallback: true,
            proxy: true
        },
        function (req, res, accessToken, refreshToken, profile, done) {
            let email = profile.emails[0].value;

            db.groups.findOne({
                attributes: ['id'], where: {code: 'admin'}
            }).then(function(admin_group){
                db.users.findOne({
                    where:{email: email},
                    include: [{model:db.groups, required: true}]
                }).then(function(user){
                    if (!user) {
                        req.body.email = email;
                        done(null, email);
                    }
                    else {
                        req.body.token = authentication.issueJWT(user.id, user.username, user.group.code, user.company_id)
                        done(null, user.username);
                    }
                });
                return null;
            }).catch(function(error){
                done(true);
            });
        }
    ));

    app.get('/api/auth/google', passport.authenticate('google', { scope:['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read']}));

    app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/admin', session: false}),
        function(req, res) {
            if(req.body.token){
                let url = '/admin/#/auth?access_token=' + req.body.token;
                res.redirect(url);
            }
            else{
                res.redirect('/create_company/'+req.body.email);
            }
        })
}

exports.create_company_form = function (req, res) {
    res.render(path.resolve('./modules/users/server/templates/create-company'), { title: 'Create new company', email: req.params.email })
};

exports.create_company_and_user = function (req, res) {
    //set email in body container
    req.body.email = req.params.email;
    
    //set 30 day trial
    let expire_date = new Date(Date.now());
    expire_date.setDate(expire_date.getDate() + 30);
    req.body.expire_date = expire_date.toString();

    companyFn.createCompany(req).then(function (result) {
        req.body.token = authentication.issueJWT(result.owner.id, result.owner.username, 'admin', result.owner.company_id)
        res.redirect('/admin/#/auth?access_token=' + req.body.token)
    }).catch(function (error) {
        winston.error('Company create failed with error: ' + error);
        res.redirect('/admin/')
    });
};

