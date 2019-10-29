"use strict";

var crypto = require('crypto');
var winston = require('winston');

module.exports = function(sequelize, DataTypes) {
    var Users = sequelize.define('users', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        company_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            defaultValue: 1
        },
        username: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true,
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    Users.find({
                            where: {
                                username: value
                            }
                        })
                        .then(function(user) {
                            // reject if a different user wants to use the same email
                            if (user && self.id !== user.id) {
                                return next('Username already exists, please choose another');
                            }
                            return next();
                        })
                        .catch(function(err) {
                            winston.error("Error finding user, error: ",err);
                            return next(err);
                        });
                }
            }
        },
        hashedpassword: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        salt: DataTypes.STRING,
        email: {
            type: DataTypes.STRING(45),
            unique: true,
            validate: {
                //isValid: validateLocalStrategyProperty,
                isEmail: {
                    msg: 'Please fill a valid email address'
                },
                isUnique: function(value, next) {
                    var self = this;
                    Users.find({
                            where: {
                                email: value
                            }
                        })
                        .then(function(user) {
                            // reject if a different user wants to use the same email
                            if (user && self.id !== user.id) {
                                return next('Email already exists, please choose another');
                            }
                            return next();
                        })
                        .catch(function(err) {
                            winston.error(err);
                            return next(err);
                        });
                }
            }
        },
        telephone: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        address: {
            type: DataTypes.STRING(45),
            allowNull: true,
            defaultValue: ''
        },
            country: {
                type: DataTypes.STRING(100), //longest country name has 74 characters
                allowNull: true,
                defaultValue: 'other'
            },
            city: {
                type: DataTypes.STRING(100), //longest city name has 85 characters
                allowNull: true,
                defaultValue: 'city'
        },
        jwtoken: {
            type: DataTypes.STRING(255),
            defaultValue: '',
            allowNull: false
        },
        last_login_ip: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        third_party_api_token: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ''
        },
        isavailable: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        group_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        resetpasswordtoken: DataTypes.STRING,
        resetpasswordexpires: DataTypes.BIGINT,
        invite_pending: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    },
    {
        instanceMethods: {
            makeSalt: function() {
                return crypto.randomBytes(16).toString('base64');
            },
            authenticate: function(plainText) {
                return this.encryptPassword(plainText, this.salt) === this.hashedpassword;
            },
            encryptPassword: function(hashedpassword, salt) {
                if (!hashedpassword || !salt || hashedpassword.length < 1 || salt.length < 1) return false;
                salt = Buffer.from(salt, 'base64');
                return crypto.pbkdf2Sync(hashedpassword, salt, 10000, 64,'sha1').toString('base64');
            }
        },
        tableName: 'users',
        associate: function(models) {
            if(models.salesreport){
                Users.hasMany(models.salesreport, {foreignKey: 'user_id'})
            }
            Users.belongsTo(models.groups, {foreignKey: 'group_id'});
            Users.hasMany(models.logs, {foreignKey: 'user_id'});
            Users.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });

    Users.beforeCreate(function(users, options) {
        users.set('salt', users.salt);
        users.set('hashedpassword', users.encryptPassword(users.hashedpassword, users.salt));
    });
    Users.beforeUpdate(function(users, options) {
        if (users.changed('hashedpassword')) {
            var salt = users.makeSalt();
            users.set('salt', salt);
            users.set('hashedpassword', users.encryptPassword(users.hashedpassword, salt));
        }
    });

    return Users;
};
