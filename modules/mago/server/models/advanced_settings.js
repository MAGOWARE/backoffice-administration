"use strict";

module.exports = function(sequelize, DataTypes) {
    var advancedSettings = sequelize.define('advanced_settings', {
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
            defaultValue: 1,
            unique: true
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: true,
            get: function () {
                try {
                    return JSON.parse(this.getDataValue('data'));
                } catch (e) {
                    return null;
                }
            },
            set: function (value) {
                return this.setDataValue('data', JSON.stringify(value));
            }
        }
    }, {
        tableName: 'advanced_settings',
        timestamps: false,
        associate: function(models) {
            advancedSettings.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });
    return advancedSettings;
};