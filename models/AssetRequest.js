const Sequelize = require("sequelize");
const _Asset_Request = function (sequelize, DataTypes) {
  return sequelize.define(
    "AssetRequest",
    {
        tran_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          Req_Date: {
            type: DataTypes.DATE(7),
            allowNull: true
          },
          Asset_Category: {
            type: DataTypes.STRING(20),
            allowNull: false
          },
          EmpCode: {
            type: DataTypes.STRING(20),
            allowNull: true
          },
          OnBehalfEmpCode: {
            type: DataTypes.STRING(20),
            allowNull: true
          },
          Reason: {
            type: DataTypes.STRING(200),
            allowNull: true
          },
          AssetIssue: {
            type: DataTypes.STRING(20),
            allowNull: true
          },
          Quotation: {
            type: DataTypes.STRING(255),
            allowNull: true
          },
          Location: {
            type: DataTypes.STRING(10),
            allowNull: true
          },
          Created_By: {
            type: DataTypes.STRING(255),
            allowNull: true
          },
          IsApproval: {
            type: DataTypes.STRING(10),
            allowNull: true
          },
    },
    {
      sequelize,
      tableName: "Asset_Request",
      schema: "dbo",
      timestamps: false,
      indexes: [
        {
          name: "PK__purchase__C5B6F0D2AB5F9DEC",
          unique: true,
          fields: [{ name: "tran_id" }],
        },
      ],
    }
  );
};
const Joi = require("joi");

const AssetRequestSchema = Joi.object({
    tran_id: Joi.number().integer().optional(), // IDENTITY (auto-increment)
    Req_Date: Joi.date().iso().optional(),
    Asset_Category: Joi.string().max(20).required(),
    Subcategory: Joi.string().max(20).optional(),
    EmpCode: Joi.string().max(20).optional(),
    OnBehalfEmpCode: Joi.string().max(20).optional(),
    Reason: Joi.string().max(200).optional().allow(null,''),
    AssetIssue: Joi.string().max(20).optional().allow(null,''),
    Quotation: Joi.string().max(255).optional().allow(null,''),
    Location: Joi.alternatives().try(Joi.string().max(10), Joi.number()).optional().allow(null),
    Created_By: Joi.string().max(255).optional(),
    IsApproval: Joi.alternatives().try(
      Joi.string().max(10),
      Joi.number().allow(null)
    ).optional(),
});

module.exports = { _Asset_Request, AssetRequestSchema };
