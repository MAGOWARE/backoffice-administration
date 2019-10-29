"use strict";
var winston = require('winston');

module.exports = function(sequelize, DataTypes) {
    var vodSubtitles = sequelize.define('vod_subtitles', {
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
        vod_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        language: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'en'
        },
        title: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        subtitle_url: {
            type: DataTypes.STRING(256),
            allowNull: false
        }
    }, {
        tableName: 'vod_subtitles',
        associate: function(models) {
            vodSubtitles.belongsTo(models.vod, {foreignKey: 'vod_id'});
            vodSubtitles.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });
    vodSubtitles.beforeDestroy(function(vod_subtitles, options) {
        //if a subtitle record is deleted, remove references from vod.default_subtitle_id
        sequelize.models.vod.update(
            {default_subtitle_id: 0},
            {where: {default_subtitle_id: vod_subtitles.id}}
        ).catch(function(error){
            winston.error("Removing value of default subtitle before deleting subtitle failed with error: ", error);
        });
        return null;
    });

    return vodSubtitles;
};
