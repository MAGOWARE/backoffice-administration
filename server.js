'use strict';

var async = require('async');
var fs = require('fs');
var path = require('path');
var prompt = require('prompt');
var dbfile = path.resolve("./config/env/db.connection.js");

process.env.NODE_ENV = 'development'; //this value should be set to production to enable https
process.env.DB_SYNC = true;

if (!process.env.NODE_APP_INSTANCE) {
    process.env.NODE_APP_INSTANCE = 0;
}

async.waterfall([

    function(callback){
        //check argument install
        if(process.argv[2] === 'sync') process.env.DB_SYNC = true;
        if(process.argv[2] === 'sync' && process.argv[3] === 'force') process.env.DB_SYNC_FORCE = true;

        //console.log('sync = ',process.env.DB_SYNC);
        //console.log('force = ',process.env.DB_SYNC_FORCE);

        callback(null);
    },
    function(callback){
       //check if db file exists
        if ((!fs.existsSync(dbfile)) || (process.argv[2] === 'config') ) {
            process.env.DB_SYNC = true;
            //configure database connection parameters
            console.log("Please enter database information below :");
             prompt.properties = {
                    username: {
                        message: 'Username cannot be blank',
                        description: 'Enter database username',
                        required: true
                    },
                    password: {
                        description: 'Enter database password',
                    },
                    host: {
                        message: 'Hostname cannot be blank',
                        description: 'Enter database host address',
                        required: true,
                    },
                    database: {
                        message: 'Database cannot be blank',
                        description: 'Enter database name',
                        required: true,
                    }
                };

                prompt.message = "";
                prompt.start();

                prompt.get(['username', 'password','host','database'], function (err, result) {

                var configfile = 'module.exports = { \n'   +
                                        'database: process.env.DB_NAME || "' + result.database + '", \n' +
                                        'host: process.env.DB_HOST || "' + result.host + '",  \n ' +
                                        'port: process.env.DB_PORT || 3306, //5432, \n ' +
                                        'username: process.env.DB_USERNAME || "' + result.username + '",  \n' +
                                        'password: process.env.DB_PASSWORD || "' + result.password + '",  \n' +
                                        'dialect: process.env.DB_DIALECT || "mysql", //mysql, postgres, sqlite3,... \n' +
                                        'storage: "./db.development.sqlite", \n' +
                                        'enableSequelizeLog: (process.env.DB_LOG === \'true\') ? true:false, \n' +
                                        'ssl: process.env.DB_SSL || false,   \n' +
                                        'sync: (process.env.DB_SYNC === \'true\') ? true:false //Synchronizing any model changes with database \n' +
                                        '};';

                fs.writeFile(dbfile, configfile, function(err) {
                    if(err) {
                        return winston.error("Failed saving database config file, error: " + err)
                    }
                    console.log("Configuration file saved !");
                    callback(null);
                });

            });
        }
        else {
          callback(null);
        }
    },

    function(callback){
        callback(null, 'done');
    }
], function (err, result) {
    // result now equals 'done'
    console.log('-------------------------------------Starting server----------------------------------------------------');
    var app = require('./config/lib/app');
    var server = app.start();
});