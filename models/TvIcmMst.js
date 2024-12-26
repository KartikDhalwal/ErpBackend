const Sequelize = require('sequelize');
const _TvIcmMst = function (sequelize, DataTypes) {
  return sequelize.define('TvIcmMst', {
    UTD: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    TV_PUR_INV: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    TV_SALE_INV: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    CUST_ID: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    FILE_NO: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    ICM_SAVE_DATE: {
      type: "SMALLDATETIME",
      allowNull: true
    },
    VEHREGNO: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    CHAS_NO: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ENGINE_NO: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    SELLER_NAME: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    MODEL_VARIANT: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    REG_YEAR: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    VEH_TYPE: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    SALE_STOCK_TYPE: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DMS_SALE_INV: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    PURCHASE_COST: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true
    },
    PUR_EVAL_NAME: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    SALE_CUST_TYPE: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    SALE_CUST_CODE: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SALE_CUST_MOB: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    SALE_CUST_ADD: {
      type: DataTypes.STRING(400),
      allowNull: true
    },
    SALE_CUST_PINCD: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    SALE_CUST_PAN: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    SALE_CUST_CITY: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SALE_CUST_STATE: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SALE_CUST_GST: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    SALE_FINANCIER: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SALE_FIN_TYPE: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SALE_FIN_DONO: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    SALE_EXEC_DESG: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    SALE_EXEC_NAME: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    DELV_STAT: {
      type: DataTypes.SMALLINT,
      allowNull: true
    },
    DELV_DATE: {
      type: "SMALLDATETIME",
      allowNull: true
    },
    REMARKS: {
      type: DataTypes.STRING(400),
      allowNull: true
    },
    Created_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    SALE_DATE: {
      type: "SMALLDATETIME",
      allowNull: true
    },
    LOC_CODE: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    DRD_ID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    MODEL_VAR: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Appr_1_Code: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Appr_1_Stat: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    Appr_1_Rem: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    Appr_2_Code: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Appr_2_Stat: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    Appr_2_Rem: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    Appr_3_Code: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Appr_3_Stat: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    Appr_3_Rem: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    Fin_Appr: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    PUR_BOOK: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    SALE_BOOK: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    PUR_DATE: {
      type: "SMALLDATETIME",
      allowNull: true
    },
    PUR_CUST_STATE: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    DRD_ID_SALE: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    VERF_DATE: {
      type: "SMALLDATETIME",
      allowNull: true
    },
    SALE_REMARKS: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    KM_DRIVEN: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DMS_BI: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    DMS_DOC: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    VIEW_FLAG: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Export_Type: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    TvDo: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TV_ICM_MST',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__TV_ICM_M__C5B6F0D29B4E65DB",
        unique: true,
        fields: [
          { name: "UTD" },
        ]
      },
    ]
  });
};


const Joi = require('joi');

const TvIcmMstSchema = Joi.object({
  UTD: Joi.number().allow(null).allow(''),
  TV_PUR_INV: Joi.string().max(50).allow(null).allow(''),
  TV_SALE_INV: Joi.string().max(50).allow(null).allow(''),
  CUST_ID: Joi.string().max(30).allow(null).allow(''),
  FILE_NO: Joi.string().max(30).allow(null).allow(''),
  ICM_SAVE_DATE: Joi.date().raw().allow(null).allow(''),
  VEHREGNO: Joi.string().max(15).allow(null).allow(''),
  CHAS_NO: Joi.string().max(50).allow(null).allow(''),
  ENGINE_NO: Joi.string().max(50).allow(null).allow(''),
  SELLER_NAME: Joi.string().max(200).allow(null).allow(''),
  SALE_STOCK_TYPE: Joi.string().max(20).allow(null).allow(''),
  DMS_SALE_INV: Joi.string().max(50).allow(null).allow(''),
  MODEL_VARIANT: Joi.string().max(100).allow(null).allow(''),
  REG_YEAR: Joi.string().max(10).allow(null).allow(''),
  VEH_TYPE: Joi.string().max(10).allow(null).allow(''),
  PURCHASE_COST: Joi.number().allow(null).allow(''),
  PUR_EVAL_NAME: Joi.string().max(100).allow(null).allow(''),
  SALE_CUST_TYPE: Joi.string().max(20).allow(null).allow(''),
  SALE_CUST_CODE: Joi.number().integer().allow(null).allow(''),
  SALE_CUST_MOB: Joi.string().max(15).allow(null).allow(''),
  SALE_CUST_ADD: Joi.string().max(400).allow(null).allow(''),
  SALE_CUST_PINCD: Joi.string().max(10).allow(null).allow(''),
  SALE_CUST_PAN: Joi.string().max(15).allow(null).allow(''),
  SALE_CUST_CITY: Joi.number().integer().allow(null).allow(''),
  SALE_CUST_STATE: Joi.number().integer().allow(null).allow(''),
  SALE_CUST_GST: Joi.string().max(50).allow(null).allow(''),
  SALE_FINANCIER: Joi.number().integer().allow(null).allow(''),
  SALE_FIN_TYPE: Joi.number().integer().allow(null).allow(''),
  SALE_FIN_DONO: Joi.string().max(150).allow(null).allow(''),
  SALE_EXEC_DESG: Joi.string().max(100).allow(null).allow(''),
  SALE_EXEC_NAME: Joi.string().max(100).allow(null).allow(''),
  DELV_STAT: Joi.number().integer().allow(null).allow(''),
  DELV_DATE: Joi.date().raw().allow(null).allow(''),
  REMARKS: Joi.string().max(400).allow(null).allow(''),
  SALE_DATE: Joi.date().raw().allow(null).allow(''),
  LOC_CODE: Joi.number().integer().allow(null).allow(''),
  DRD_ID: Joi.number().integer().allow(null).allow(''),
  MODEL_VAR: Joi.string().max(100).allow(null).allow(''),
  Appr_1_Code: Joi.number().integer().allow(null),
  Appr_1_Stat: Joi.number().integer().allow(null),
  Appr_1_Rem: Joi.string().max(300).allow(null).allow(''),
  Appr_2_Code: Joi.number().integer().allow(null),
  Appr_2_Stat: Joi.number().integer().allow(null),
  Appr_2_Rem: Joi.string().max(300).allow(null).allow(''),
  Appr_3_Code: Joi.number().integer().allow(null),
  Appr_3_Stat: Joi.number().integer().allow(null),
  Appr_3_Rem: Joi.string().max(300).allow(null).allow(''),
  Fin_Appr: Joi.number().integer().allow(null),
  PUR_BOOK: Joi.string().max(30).allow(null).allow(''),
  SALE_BOOK: Joi.string().max(30).allow(null).allow(''),
  PUR_DATE: Joi.date().raw().allow(null).allow(''),
  PUR_CUST_STATE: Joi.number().integer().allow(null).allow(''),
  DRD_ID_SALE: Joi.number().integer().allow(null).allow(''),
  VERF_DATE: Joi.date().raw().allow(null).allow(''),
  SALE_REMARKS: Joi.string().max(200).allow(null).allow(''),
  KM_DRIVEN: Joi.string().max(20).allow(null).allow(''),
  DMS_BI: Joi.string().max(50).allow(null).allow(''),
  DMS_DOC: Joi.string().max(10).allow(null).allow(''),
  VIEW_FLAG: Joi.number().integer().allow(null).allow(''),
  Export_Type: Joi.number().integer().allow(null).allow(''),
  TvDo: Joi.number().integer().allow(null).allow(''),
});

module.exports = { _TvIcmMst, TvIcmMstSchema };
