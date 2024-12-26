const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");

const { _GrupMst, GrupMstSchema } = require("../models/GrupMst");

exports.updateGroup = async function (req, res) {
  const BodyData = req.body;
  const { error, value: GrupData } = GrupMstSchema.validate(BodyData.GrupData, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const GrupMSt = _GrupMst(sequelize, DataTypes);
    try {
      _GrupMSt = await GrupMSt.update(
        { ...GrupData },
        { where: { Group_Code: BodyData.Group_Code } },
        { transaction: t }
      );
      await t.commit();
      res.status(200).send({ success: true, Message: "Group Updated" });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while Updating Master.",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  }
};


exports.insertData = async function (req, res) {
  const BodyData = req.body.GrupData;
  const { error, value: GrupData } = GrupMstSchema.validate(BodyData.GrupData, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const GrupMSt = _GrupMst(sequelize, DataTypes);

    const MaxCode = await sequelize.query('SELECT MAX(Group_Code) AS max_top FROM Grup_Mst');
    console.log(MaxCode[0][0],"maxCode");
    console.log(req.body,"req.body");
     const max= MaxCode[0][0].max_top +1;
    const a = {...BodyData,Group_Code:max}
    console.log(a,"a");


    try {
      // const updatedGrupData = {
      //   ...GrupData,
      //   TAN_YN: GrupData.TAN_YN || "N", 
      // };
      
      const createdGrupMst = await GrupMSt.create(a, {
        transaction: t,
      });

      // Commit the transaction
      await t.commit();

      res.status(200).send({ success: true, message: "Done", data: createdGrupMst });
    } catch (error) {
      console.error("Error during insert:", error);

      // Rollback the transaction in case of error
      if (t) await t.rollback();

      res.status(500).send({
        success: false,
        message: "An error occurred while creating the group.",
        error: error.message || error,
      });
    } finally {
      // Ensure connection is closed
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  }
};



exports.FindGroupName = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const GrupMst = _GrupMst(sequelize, DataTypes);
    const GrupMstData = await GrupMst.findAll({
      attributes: [
        ["Group_Code", "value"],
        ["Group_Name", "label"],
      ],
    });
    let data = {
      data: GrupMstData,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();
    console.log(err);
  }
};

exports.FindGroup = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const GrupMst = _GrupMst(sequelize, DataTypes);
    const GrupMstData = await GrupMst.findAll({
      attributes: [
        ["Sub_Group", "Sub_Group"],
        ["Group_Code", "Group_Code"],
        ["Group_Name", "Group_Name"],
        ["CompAct_Head", "CompAct_Head"],
        ["CompAct_Head2", "CompAct_Head2"],
        ["TAN_YN", "TAN_YN"],
        ["IsGeneric", "IsGeneric"],
        ["Exp_Date", "Exp_Date"],
        ["IsPost_Br", "IsPost_Br"],
        ["Server_Id", "Server_Id"],
      ],
    });
    let data = {
      GrupMst: GrupMstData,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();
    console.log(err);
  }
};
