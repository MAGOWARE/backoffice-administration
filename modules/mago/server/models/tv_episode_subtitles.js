"use strict";
var winston = require('winston');

module.exports = function(sequelize, DataTypes) {
    var tv_episode_subtitles = sequelize.define('tv_episode_subtitles', {
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
        tv_episode_id: {
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
        tableName: 'tv_episode_subtitles',
        associate: function(models) {
            tv_episode_subtitles.belongsTo(models.tv_episode, {foreignKey: 'tv_episode_id'});
            tv_episode_subtitles.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });
    tv_episode_subtitles.beforeDestroy(function(vod_subtitles, options) {
        //if a subtitle record is deleted, remove references from vod.default_subtitle_id
        sequelize.models.vod.update(
            {default_subtitle_id: 0},
            {where: {default_subtitle_id: vod_subtitles.id}}
        ).catch(function(error){
            winston.error("Removing value of default subtitle before deleting subtitle failed with error: ", error);
        });
        return null;
    });

    return tv_episode_subtitles;
};
