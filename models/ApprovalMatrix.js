const Sequelize = require('sequelize');
const _ApprovalMatrix =  function(sequelize, DataTypes) {
  return sequelize.define('ApprovalMatrix', {
    UTD: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    module_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    empcode: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    approver1_A: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    approver1_B: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    approver2_A: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    approver2_B: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    approver3_A: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    approver3_B: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    Created_At: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Created_by: {
      type: DataTypes.STRING(30),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Approval_Matrix',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Approval__C5B6F0D2284882B4",
        unique: true,
        fields: [
          { name: "UTD" },
        ]
      },
    ]
  });
};


const Joi = require('joi');

// Define the Joi schema for the ApprovalMatrix model
const approvalMatrixSchema = Joi.object({
  module_code: Joi.string().max(20).allow(null).allow(''),
  empcode: Joi.string().max(20).allow(null).allow(''),
  approver1_A: Joi.string().max(20).allow(null).allow(''),
  approver1_B: Joi.string().max(20).allow(null).allow(''),
  approver2_A: Joi.string().max(20).allow(null).allow(''),
  approver2_B: Joi.string().max(20).allow(null).allow(''),
  approver3_A: Joi.string().max(25).allow(null).allow(''),
  approver3_B: Joi.string().max(25).allow(null).allow(''),
  Created_by: Joi.string().max(30).allow(null).allow('')
});

module.exports = {approvalMatrixSchema,_ApprovalMatrix};
