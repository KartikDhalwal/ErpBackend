const Sequelize = require('sequelize');
const _LeaveBal = function (sequelize, DataTypes) {
  return sequelize.define('LeaveBal', {
    UTD: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    SRNO: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    Leave_Type: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Leave_Mnth: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Op_Bal: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true
    },
    Gen_Lev: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true
    },
    Avail_Lev: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true
    },
    Cl_Bal: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true
    },
    Leave_Yr: {
      type: DataTypes.INTEGER,
      allowNull: true
    } ,
    Created_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Created_At: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    sequelize,
    tableName: 'Leave_Bal',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Leave_Ba__C5B6F0D27E81FAC0",
        unique: true,
        fields: [
          { name: "UTD" },
        ]
      },
    ]
  });
};


const Joi = require('joi');

const LeaveBalSchema = Joi.object({
  SRNO: Joi.string().max(30).allow(null).allow(''),
  Leave_Type: Joi.number().integer().allow(null).allow(''),
  Leave_Mnth: Joi.number().integer().allow(null).allow(''),
  Op_Bal: Joi.number().precision(4).allow(null).allow(''),
  Gen_Lev: Joi.number().precision(4).allow(null).allow(''),
  Avail_Lev: Joi.number().precision(4).allow(null).allow(''),
  Cl_Bal: Joi.number().precision(4).allow(null).allow(''),
  Leave_Yr: Joi.number().integer().allow(null).allow(''),
  Created_by: Joi.string().max(50).allow(null).allow('').required()
});

module.exports = { _LeaveBal, LeaveBalSchema };
