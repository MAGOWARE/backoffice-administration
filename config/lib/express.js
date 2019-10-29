'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    favicon = require('serve-favicon'),
    cookieParser = require('cookie-parser'),
    helmet = require('helmet'),
    consolidate = require('consolidate'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    multer = require('multer'),
    fs = require('fs'),
    winston = require('./winston'),
    cors = require('cors'),
    rateLimit = require('express-rate-limit'),
    securityConfig = require('../security/exprees.security.config'),
    policy = require(path.resolve('./modules/mago/server/policies/mago.server.policy')),
    morgan = require('morgan');

//documentation
//docs = require("express-mongoose-docs");

//language configuration parameters
global.languages = {};
const language_folder_path = './config/languages/';
global.vod_list = {};
global.company_configurations = {};
global.livetv_s_subscription_end = [];
global.livetv_l_subscription_end = [];
global.vod_s_subscription_end = [];
global.vod_l_subscription_end = [];

/**
 * Initialize local variables
 */
module.exports.initLocalVariables = function (app) {
    winston.info('Initializing LocalVariables...');
    // Setting application local variables
    app.locals.title = config.app.title;
    app.locals.description = config.app.description;
    if (config.secure && config.secure.ssl === true) {
        app.locals.secure = config.secure.ssl;
    }
    app.locals.keywords = config.app.keywords;
    app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;

    app.locals.logo = config.logo;
    app.locals.favicon = config.favicon;
    app.locals.usersProfileDir = config.app.usersProfileDir;
    app.locals.reCaptchaSecret = config.app.reCaptchaSecret;
    app.locals.livereload = config.livereload;
};

/**
 * Initialize application middleware
 */
module.exports.initMiddleware = function (app) {
    winston.info('Initializing Middleware...');

    // Passing the request url to environment locals
    app.use(function (req, res, next) {
        res.locals.host = req.protocol + '://' + req.hostname;
        res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
        app.locals.originUrl = req.protocol + '://' + req.headers.host;
        next();
    });

    // Showing stack errors
    app.set('showStackError', true);

    // Enable jsonp
    app.enable('jsonp callback');

    // Environment dependent middleware
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

        // Disable views cache
        app.set('view cache', false);
    } else
        if (process.env.NODE_ENV === 'production') {
            app.locals.cache = 'memory';
        }

    if (securityConfig.rate_limit.enabled) {
        //Add rate req limit
        const limiter = rateLimit({
            windowMs: 60 * 1000, // 15 minutes
            max: securityConfig.rate_limit.max_request_min, // limit each IP to 100 requests per windowMs
            handler: function(req, res, next) {
                let ip = req.ip.substring(req.ip.lastIndexOf(':') + 1, req.ip.length);
                if (securityConfig.rate_limit.ip_whitelist.indexOf(ip) !== -1) {
                    next();
                }
                else{
                    res.status(429).send({message: "Too many requests, please try again later"})
                }
            }
        });

        let protectedRoutes = securityConfig.rate_limit.protected_routes;
        protectedRoutes.forEach(function (path) {
            app.use(path, limiter);
        });
    }

    //Add cors support
    const corsDisabled = securityConfig.cors.length === 0 ? true : false;
    app.use(cors({
        credentials: true,
        origin: function (origin, callback) {
            // allow requests with no origin
            // (like mobile apps or curl requests)
            if (!origin || corsDisabled) return callback(null, true);

            for (var i = 0; i < securityConfig.cors.length; i++) {
                if (origin.startsWith(securityConfig.cors[i])) {
                    return callback(null, true);
                }
            }

            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
    }));
    // Request body parsing middleware should be above methodOverride
    app.use('/file-upload', bodyParser.raw({
        limit: '25mb'
    }));
    app.use('/', bodyParser.urlencoded({
        extended: true
    }));
    app.use('/', bodyParser.json({
        limit: securityConfig.max_body_size
    }));

    // Add the cookie parser and flash middleware
    app.use(cookieParser());

    //Custom error handling when error occurs in middleware
    app.use(function (err, req, res, next) {
        winston.error(err);

        if (err.name == 'PayloadTooLargeError') {
            res.status(413).send({ message: 'Payload too large' });
        } else {
            res.send(500).send({ message: 'Internal server error' })
        }
    })
    // Add multipart handling middleware
    /*
    var storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, './uploads');
        },
        filename: function(req, file, cb) {
            var getFileExt = function(fileName) {
                var fileExt = fileName.split(".");
                if (fileExt.length === 1 || (fileExt[0] === "" && fileExt.length === 2)) {
                    return "";
                }
                return fileExt.pop();
            };
            cb(null, Date.now() + '.' + getFileExt(file.originalname));
        }
    });

    app.use(multer({
        storage: storage
    }).single('file'));
    */

};

/**
 * Configure view engine
 */
module.exports.initViewEngine = function (app) {
    winston.info('Initializing ViewEngine...');
    // Set swig as the template engine
    app.engine('server.view.html', consolidate[config.templateEngine]);

    // Set views path and view engine
    app.set('view engine', 'server.view.html');
    app.set('views', './');
};

/**
 * Configure Express session
 */
module.exports.initSession = function (app, db) {
    winston.info('Initializing Session...');

    app.use(session({
        saveUninitialized: true,
        resave: true,
        secret: config.sessionSecret,
        cookie: {
            maxAge: config.sessionCookie.maxAge,
            httpOnly: config.sessionCookie.httpOnly,
            secure: config.sessionCookie.secure && config.secure && config.secure.ssl
        },
        key: config.sessionKey,
        store: new RedisStore({
            host: config.redis.host || 'localhost',
            port: config.redis.port || 6379,
            db: config.redis.database || 0,
            pass: config.redis.password || ''
        })
    }));

};

/**
 * Invoke modules server configuration
 */
module.exports.initModulesConfiguration = function (app, db) {
    winston.info('Initializing Modules Configuration...');
    config.files.server.configs.forEach(function (configPath) {
        require(path.resolve(configPath))(app, db);
    });
};

/**
 * Configure Helmet headers configuration
 */
module.exports.initHelmetHeaders = function (app) {
    winston.info('Initializing Helmet Headers...');
    // Use helmet to secure Express headers
    var SIX_MONTHS = 15778476000;
    app.use(helmet.frameguard());
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.ieNoOpen());
    app.use(helmet.hsts({
        maxAge: SIX_MONTHS,
        includeSubDomains: true,
        force: true
    }));
    app.disable('x-powered-by');
};

/**
 * Configure the modules static routes
 */
module.exports.initModulesClientRoutes = function (app) {
    winston.info('Initializing Modules Client Routes...');
    // Setting the app router and static folder
    app.use('/', express.static(path.resolve('./public')));
};

/**
 * Configure the modules ACL policies
 */
module.exports.initModulesServerPolicies = function (app) {
    winston.info('Initializing Modules Server Policies...');

    // Globbing policy files
    config.files.server.policies.forEach(function (policyPath) {
        require(path.resolve(policyPath)).invokeRolesPolicies();
    });
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function (app) {
    winston.info('Initializing Modules Server Routes...');
    // Globbing routing files
    config.files.server.routes.forEach(function (routePath) {
        require(path.resolve(routePath))(app);
    });
};

/**
 * Configure error handling
 */
module.exports.initErrorRoutes = function (app) {
    winston.info('Initializing Error Routes...');
    app.use(function (err, req, res, next) {
        // If the error object doesn't exists
        if (!err) {
            return next();
        }

        // Log it
        winston.error(err.stack);

        // Redirect to error page
        res.redirect('/server-error');
    });
};

/**
 * Configure Socket.io
*/

module.exports.configureSocketIO = function (app, db) {
    winston.info('Initializing Socket.io...');
    // Load the Socket.io configuration
    var server = require('./socket.io')(app, db);

    // Return server object
    return server;
};

module.exports.initExpressStatusMonitor = function (app) {
    const io = require('socket.io');
    io.listen(3000);

    let config = {
        title: 'Express Status',  // Default title
        theme: 'default.css',     // Default styles
        path: '',
        websocket: io,
        spans: [
            {
                interval: 1,            // Every second
                retention: 60           // Keep 60 datapoints in memory
            },
            {
                interval: 5,            // Every 5 seconds
                retention: 60
            },
            {
                interval: 15,           // Every 15 seconds
                retention: 60
            }
        ],
        chartVisibility: {
            cpu: true,
            mem: true,
            load: true,
            responseTime: true,
            rps: true,
            statusCodes: true
        },
        healthChecks: [],
        ignoreStartsWith: '/admin'
    }
    const monitor = require('express-status-monitor')(config);

    app.use(monitor.middleware);
    app.get('/status', monitor.pageRoute);
}
/**
 * Configure server response languages
 */
module.exports.configureLanguages = function (app) {
    winston.info('Initializing Languages ...');
    // Globbing routing files
    try {
        fs.readdir(language_folder_path, function (err, files) {
            files.forEach(function (file) {
                var lang = require(path.resolve(language_folder_path + file));
                if (lang.language_code && lang.language_name && lang.language_variables)
                    global.languages['' + lang.language_code + ''] = lang;
            });
        });
    } catch (error) {
        winston.error("Error loading languages!, error: ", error);
    }
};

/**
 * Initiatialize company configurations
 */
module.exports.readCompanyConfigurations = function (app) {
    winston.info('Initializing company configurations ...');
    // Globbing routing files
    try {
        company_configurations = require(path.resolve('./config/company_configurations/' + fs.readdirSync('./config/company_configurations')[0]));
    }
    catch (error) {
        winston.error("Error reading company configurations, error: ", error);
    }
};

/**
 * Initialize the Express application
 */
module.exports.init = function (db, redis) {
    // Initialize express app
    var app = express();

    // Initialize local variables
    this.initLocalVariables(app);

    //Init Express Monitor Status
    this.initExpressStatusMonitor(app);

    // Initialize Express middleware
    this.initMiddleware(app);

    // Initialize Express view engine
    this.initViewEngine(app);

    // Initialize Express session
    this.initSession(app, db);

    // Initialize Modules configuration
    this.initModulesConfiguration(app);

    // Initialize Helmet security headers
    this.initHelmetHeaders(app);

    // Initialize modules static client routes
    this.initModulesClientRoutes(app);

    // Initialize modules server authorization policies
    this.initModulesServerPolicies(app);

    // Initialize modules server routes
    this.initModulesServerRoutes(app);

    // Configure Languages
    this.configureLanguages(app);

    // Configure Languages
    this.readCompanyConfigurations(app);

    // Initialize error routes
    this.initErrorRoutes(app);

    // Configure Socket.io
    var serverApp = this.configureSocketIO(app, db);

    return serverApp;
};
