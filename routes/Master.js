const { Sequelize, DataTypes, literal, QueryTypes } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");

const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");

exports.updateMaster = async function (req, res) {
  const BodyData = req.body;
  const { error, value: MasterData } = MiscMstSchema.validate(
    BodyData.MiscMst,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const MiscMst = _MiscMst(sequelize, DataTypes);
    try {
      const existingUser = await sequelize.query(
        `select * from misc_mst where utd = ${req.params.id}`
      );
      if (existingUser[0][0]?.Misc_Type == 620 || existingUser[0][0]?.Misc_Type == 621) {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        // if (!MasterData.Birth_Date) {
        //   await t.rollback();
        //   return res.status(500).send({
        //     success: false,
        //     message: "Team Shifting date can not be Empty",
        //   });
        // }
        console.log(existingUser[0][0]?.Birth_Date);
        console.log(MasterData.Birth_Date);
        const birthDate = new Date(MasterData.Birth_Date);

        const birthYear = birthDate.getFullYear();
        const birthMonth = birthDate.getMonth();

        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        // if (new Date(existingUser[0][0]?.Birth_Date) >= new Date(MasterData.Birth_Date)) {
        //   await t.rollback();
        //   return res.status(500).send({
        //     success: false,
        //     message: "Team Shifting date can not Same as previous Team join date or less than that",
        //   });
        // }
        // if (birthYear === currentYear && birthMonth === currentMonth) {

        // } else {
        //   await t.rollback();
        //   return res.status(500).send({
        //     success: false,
        //     message: "Team Shifting date can not be out of the range of current month",
        //   });
        // }

      }

      if (!existingUser[0]?.length) {
        return res.status(500).send({
          success: false,
          message: "No Master found with the provided Id.",
        });
      } else {
        const { UTD, ...newUserTbl } = existingUser[0][0];
        console.log(newUserTbl);
        await MiscMst.create(
          { ...newUserTbl, Export_Type: 33 },
          { transaction: t }
        );
      }
      await MiscMst.update(
        {
          Misc_Name: MasterData.Misc_Name,
          Misc_Abbr: MasterData.Misc_Abbr,
          Misc_Dtl1: MasterData.Misc_Dtl1,
          Misc_Add1: MasterData.Misc_Add1,
          Misc_Add2: MasterData.Misc_Add2,
          Exp_Date: MasterData.Exp_Date,
          Birth_Date: MasterData.Exp_Date ? null : MasterData.Birth_Date,
          Join_Date: MasterData.Join_Date,
          Loc_code: MasterData.Loc_code
        },
        {
          where: { UTD: req.params.id },
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).send({ success: true, Message: "Master Updated" });
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
  const BodyData = req.body;
  const { error, value } = MiscMstSchema.validate(BodyData.MiscMst, {
    abortEarly: false,
    stripUnknown: true,
  });
  console.log(error)
  const MasterData = value;
  const Created_by = BodyData.Created_by;
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const MiscMst = _MiscMst(sequelize, DataTypes);
    const EmpMstCheck = await sequelize.query(`select isPayroll from KeyData`);
    let EMPLOYEEMASTERFLAG = 0;
    console.log(EmpMstCheck[0][0].isPayroll, 'EmpMstCheck[0].isPayroll')
    if (EmpMstCheck[0][0].isPayroll == 'Y') {
      EMPLOYEEMASTERFLAG = 1;
    }
    try {
      if (MasterData.Misc_Type === 619 || MasterData.Misc_Type === 620 || MasterData.Misc_Type === 621) {
        const Check = await sequelize.query(`SELECT Misc_Name FROM Misc_Mst WHERE Misc_Name = '${MasterData.Misc_Name}' AND Misc_Type = ${MasterData.Misc_Type}`);
        console.log(Check)
        console.log(Check[0].length)
        if (Check[0].length > 0) {
          return res.status(201).send({ success: false, message: "This Master Already Exist" });
        }
        if (EMPLOYEEMASTERFLAG == 1) {
          console.log('jhgghjk')
          const check2 = await sequelize.query(`SELECT * FROM EMPLOYEEMASTER WHERE EMPCODE  = '${MasterData.Misc_Name}'`);
          if (check2[0].length == 0) {
            return res.status(202).send({ success: false, message: "Employee Not Created Please Create the Employee Master First" });
          }
        }
      }
      console.log(MasterData, "MasterData");
      const maxMiscCode = await MiscMst.max("Misc_Code", {
        where: { Misc_Type: MasterData.Misc_Type },
        transaction: t,
      });

      const newMiscCode = maxMiscCode + 1;

      const MiscMst_ = await MiscMst.create(
        {
          Misc_Type: MasterData.Misc_Type,
          Misc_Code: newMiscCode,
          Misc_Name: MasterData.Misc_Name,
          Misc_Abbr: MasterData.Misc_Abbr,
          Misc_Dtl1: MasterData.Misc_Dtl1,
          Misc_Add1: MasterData.Misc_Add1,
          Misc_Add2: MasterData.Misc_Add2,
          Join_Date: MasterData.Join_Date,
          Exp_Date: MasterData.Exp_Date,
          Export_Type: 1,
          ServerId: 1,
          Loc_code: MasterData.Loc_Code
        },
        {
          transaction: t,
        }
      );
      await t.commit();
      res.status(200).send({ success: true, Message: "DATA SAVED" });
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
exports.FindMaster = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MiscMst = _MiscMst(sequelize, DataTypes);
    const MiscMstData = await MiscMst.findAll({
      attributes: [
        ["UTD", "UTD"],
        ["Misc_Code", "Misc_Code"],
        ["Misc_Name", "Misc_Name"],
        ["Misc_Abbr", "Misc_Abbr"],
        ["Misc_Dtl1", "Misc_Dtl1"],
        ["Misc_Add1", "Misc_Add1"],
        ["Misc_Add2", "Misc_Add2"],
        ["Exp_Date", "Exp_Date"],
        ["Join_Date", "Join_Date"],
        ["Birth_Date", "Birth_Date"],
      ],
      where: { Misc_Type: req.body.Misc_Type, Export_Type: 1 },
    });
    let data = {
      MiscMst: MiscMstData,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();
    console.log(err);
  }
};
exports.findbranchdivision = async function (req, res) {
  console.log("findMasters")
  let sequelize;
  sequelize = await dbname(req.headers.compcode);

  try {
    const [department] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 68`);
    const [Location] = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 85');
     
     const data = {
      department,
      Location
    };

    res.status(200).send({ success: true, data });
  } catch (err) {
    console.error(err);
    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
    }
    res.status(500).send({ success: false, message: 'An error occurred' });
  }
};
exports.saveholiday = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const data = req.body.formData2
  console.log(data, "datadtaa");


  try {
      const [maxCodeResult] = await sequelize.query(
          'SELECT COALESCE(MAX(Holiday_Code), 0) AS max_Holiday_Code FROM holidaylist',
          { transaction: t }
      );
      const next_Holiday_Code = maxCodeResult[0].max_Holiday_Code + 1;

      console.log(next_Holiday_Code,"maxxode")
      await sequelize.query(
          `INSERT INTO holidaylist (Holiday_Code, Holiday_Name,Rel_Code, Rec_Date, Dept_Code,Loc_Code ,Half_Holiday, Export_Type)
          VALUES ( :Holiday_Code, :Holiday_Name,:Rel_Code, :Rec_Date, :Dept_Code, :Loc_Code , :Half_Holiday, :Export_Type)`,
          {
              replacements: {
                Holiday_Code : next_Holiday_Code, 
                Holiday_Name :data.Holiday_Name, 
                Rel_Code :data.Rel_Code, 
                Rec_Date :data.Rec_Date, 
                Dept_Code :data.Dept_Code,
                Loc_Code :data.Loc_Code,
                Half_Holiday :data.Half_Holiday==true ? 1 : 0,
                Export_Type:1
              },
              transaction: t
          }
      );
      await t.commit();
      res.status(200).send({
          Status: true,
          Message: "Success",
          Result: null
      });
  } catch (e) {
      res.status(500).send({
          Status: false,
          Message: "Error occurred while inserting data",
          Result: null
      });
  } finally {
      if (sequelize) {
          await sequelize.close();
      }
  }
};



exports.holidaydata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const data = req.body.formData2
  console.log(data, "datadtaa");
  try {
      const [data] = await sequelize.query(
          `SELECT  Holiday_Code,Holiday_Name ,Rel_Code ,Rec_Date,Dept_Code ,Loc_Code ,
              FORMAT(Rec_Date, 'yyyy-MM-dd') as Rec_Date,
              Half_Holiday FROM holidaylist where export_type = 1`,
          { transaction: t }
      );
      await t.commit();
      res.status(200).send({
          Status: true,
          Message: "Success",
          Result: data
      });
  } catch (e) {
      res.status(500).send({
          Status: false,
          Message: "Error occurred while inserting data",
          Result: null
      });
  } finally {
      if (sequelize) {
          await sequelize.close();
      }
  }
};


exports.updateholiday = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const data = req.body.formData2 
  console.log(data, "datadtaa");
  const holidaycode=req.body.formData2.Holiday_Code
  try {
      const update_export_type = await sequelize.query(
          `update holidaylist set export_type = 33 where Holiday_Code = ${holidaycode} `,
          { transaction: t }
      );

      await sequelize.query(
          `INSERT INTO holidaylist (Holiday_Code, Holiday_Name,Rel_Code, Rec_Date, Dept_Code,Loc_Code ,Half_Holiday, Export_Type)
          VALUES ( :Holiday_Code, :Holiday_Name,:Rel_Code, :Rec_Date, :Dept_Code, :Loc_Code , :Half_Holiday, :Export_Type)`,
          {
              replacements: {
                Holiday_Code : holidaycode, 
                Holiday_Name :data.Holiday_Name, 
                Rel_Code :data.Rel_Code, 
                Rec_Date :data.Rec_Date, 
                Dept_Code :data.Dept_Code,
                Loc_Code :data.Loc_Code,
                Half_Holiday :data.Half_Holiday,
                Export_Type:1
              },
              transaction: t
          }
      );
      await t.commit();
      res.status(200).send({
          Status: true,
          Message: "Success",
          Result: null
      });
  } catch (e) {
      res.status(500).send({
          Status: false,
          Message: "Error occurred while inserting data",
          Result: null
      });
  } finally {
      if (sequelize) {
          await sequelize.close();
      }
  }
};




exports.salarmasterdata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
      const [data] = await sequelize.query(
          ` select top 100 * from salarystructure where export_type =1`,
          { transaction: t }
      );
      await t.commit();
      res.status(200).send({
          Status: true,
          Message: "Success",
          Result: data
      });
  } catch (e) {
      res.status(500).send({
          Status: false,
          Message: "Error occurred while inserting data",
          Result: null
      });
  } finally {
      if (sequelize) {
          await sequelize.close();
      }
  }
};