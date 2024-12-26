const Sequelize = require('sequelize');

const _ReleaseNote = function (sequelize, DataTypes) {
    return sequelize.define('ReleaseNote', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        module_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        platform: {
            type: DataTypes.ENUM('web', 'mobile'),
            allowNull: false
        },
        release_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        created_by: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
    }, {
        sequelize,
        tableName: 'release_notes',
        schema: 'dbo',
        timestamps: false,
        indexes: [
            {
                name: 'release_note_index',
                fields: [
                    { name: 'platform' },
                    { name: 'release_date' },
                ]
            }
        ]
    });
};

module.exports = { _ReleaseNote };
