const Sequelize = require('sequelize');
const _ExpenseTemplate = function (sequelize, DataTypes) {
  return sequelize.define('ExpenseTemplate', {
    UTD: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Template_Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Template_Name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Field_Name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Field_Type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Table_field: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Field_Req: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    Field_Attr: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    Export_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Created_By: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Created_At: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }, {
    sequelize,
    tableName: 'Expense_Template',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Expense___C5B6F0D2C72E11D4",
        unique: true,
        fields: [
          { name: "UTD" },
        ]
      },
    ]
  });
};

module.exports = { _ExpenseTemplate };