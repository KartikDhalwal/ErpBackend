const { Sequelize, DataTypes, literal, QueryTypes, Op } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");

const { _NewJoining, NewJoiningSchema } = require("../models/NewJoining");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");

exports.findAll = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const NewJoining = _NewJoining(sequelize, DataTypes);
    const MiscMst = _MiscMst(sequelize, DataTypes);
    NewJoining.belongsTo(MiscMst, { as: "state", foreignKey: "STATE" });
    NewJoining.belongsTo(MiscMst, { as: "city", foreignKey: "CITY" });
    NewJoining.belongsTo(MiscMst, { as: "desg", foreignKey: "DESIGNATION" });
    // const result = await NewJoining.findAll({
    //     attributes: [
    //         [sequelize.col('mm.Misc_Name'), 'stateee'],
    //         [sequelize.col('mm1.Misc_Name'), 'city1'],
    //         [sequelize.col('mm2.Misc_Name'), 'desg'],
    //         [sequelize.literal('nj.*'), 'nj']
    //     ],
    //     include: [
    //         {
    //             model: MiscMst,
    //             as: 'mm',
    //             attributes: [],
    //             where: {
    //                 Misc_Type: 3
    //             },
    //             on: {
    //                 [Op.and]: [
    //                     sequelize.where(sequelize.col('nj.STATE'), '=', sequelize.col('mm.Misc_Code'))
    //                 ]
    //             }
    //         },
    //         {
    //             model: MiscMst,
    //             as: 'mm1',
    //             attributes: [],
    //             where: {
    //                 Misc_Type: 2
    //             },
    //             on: {
    //                 [Op.and]: [
    //                     sequelize.where(sequelize.col('nj.CITY'), '=', sequelize.col('mm1.Misc_Code'))
    //                 ]
    //             }
    //         },
    //         {
    //             model: MiscMst,
    //             as: 'mm2',
    //             attributes: [],
    //             where: {
    //                 Misc_Type: 95
    //             },
    //             on: {
    //                 [Op.and]: [
    //                     sequelize.where(sequelize.col('nj.DESIGNATION'), '=', sequelize.col('mm2.Misc_Code'))
    //                 ]
    //             }
    //         }
    //     ],
    //     where: {
    //         INT_STATUS: 1
    //     }
    // });
    const data = await sequelize.query(
      `SELECT mm.Misc_Name as stateee, 
        mm1.Misc_Name as city1,
        mm2.Misc_Name as desg,
        nj.*  
        FROM New_Joining nj   
        JOIN Misc_Mst mm ON nj.STATE = mm.Misc_Code AND mm.Misc_Type =  3
        JOIN Misc_Mst mm1 ON nj.CITY = mm1.Misc_Code AND mm1.Misc_Type =  2
        JOIN Misc_Mst mm2 ON nj.DESIGNATION = mm2.Misc_Code AND mm2.Misc_Type =  95`,
      { type: QueryTypes.SELECT }
    );
    if (!result) {
      return res.status(500).send({ success: false, message: "No data found" });
    }
    return res.status(200).send({ success: true, data: result });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
    console.log("connection closed");
  }
};

exports.insertData = async function (req, res) {
  const BodyData = req.body;
  const { error, value: NewJoiningData } = NewJoiningSchema.validate(
    BodyData.NewJoining,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );
  const Created_by = BodyData.Created_by;
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const NewJoining = _NewJoining(sequelize, DataTypes);
    try {
      const NewJoining_ = await NewJoining.create(
        { ...NewJoiningData, Created_by: BodyData.Created_by },
        { transaction: t }
      );
      await t.commit();
      res.status(200).send({ success: true, Message: "Data saved" });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while creating Employee jasj.",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  }
};
