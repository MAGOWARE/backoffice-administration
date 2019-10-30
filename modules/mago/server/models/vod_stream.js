"use strict";

module.exports = function(sequelize, DataTypes) {
    var vodStream = sequelize.define('vod_stream', {
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
        stream_source_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        stream_resolution: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "1,2,3,4,5,6"
        },
        stream_format: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        token: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        encryption: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        token_url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        encryption_url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        drm_platform: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        stream_type:{
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'regular',
            unique: 'vodstream_type'
        }
    }, {
        tableName: 'vod_stream',
        associate: function(models) {
            vodStream.belongsTo(models.vod, {foreignKey: 'vod_id'});
            vodStream.belongsTo(models.vod_stream_source, {foreignKey: 'stream_source_id'});
            vodStream.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });
    return vodStream;
};
