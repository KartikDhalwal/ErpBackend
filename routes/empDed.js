const { Sequelize, DataTypes, literal, fn, col, cast } = require("sequelize");
const { dbname } = require("../utils/dbconfig");

const { _EmpDed, empDedSchema } = require("../models/EmpDed");
const { _Employeemaster, EmployeemasterSchema } = require("../models/Employeemaster");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");



exports.findAll = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EmpDed = _EmpDed(sequelize, DataTypes);
    const result = await sequelize.query(`SELECT 
      CASE 
      WHEN Ded_Type = 7 THEN Basic_Arr
      WHEN Ded_type = 15 THEN INCENTIVE_AMT
      ELSE Ded_Amt
      END AS Amount,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 610 AND Misc_Code = Ded_Type) DedName,
      * FROM Emp_Ded`);
    return res.status(200).send({ success: true, data: result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  } finally {
    await sequelize.close();
    console.log("connection closed");
  }
};

exports.insertData = async function (req, res) {
  const BodyData = req.body;
  console.log(BodyData);
  const { error, value: EmplData } = empDedSchema.validate(
    BodyData.employeeData,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );
  console.log(error, 'error');
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const EmpDed = _EmpDed(sequelize, DataTypes);
    const EmpName = await sequelize.query(`SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EmpName 
    FROM EMPLOYEEMASTER 
    WHERE EMPCODE = '${EmplData.Emp_Id}'`);
    try {
      let a
      console.log(EmplData)
      if (EmplData.Ded_Type === 7) {
        EmplData.Basic_Arr = EmplData.Ded_Amt;
        EmplData.Ded_Amt = null;
      } else if (EmplData.Ded_Type === 15) {
        EmplData.INCENTIVE_AMT = EmplData.Ded_Amt;
        EmplData.Ded_Amt = null;
      }
      console.log(EmplData)
      await EmpDed.create({
        ...EmplData,
        Emp_Name: EmpName[0][0].EmpName
      }, { transaction: t });
      await t.commit();
      res.status(200).send({ success: true, Message: "Data saved" });

    } catch (error) {
      res.status(500).send({
        success: false,
        message: "An error occurred while Applying Deduction",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  }
};

exports.updateData = async function (req, res) {
  const BodyData = req.body;
  const { error, value: employeeData } = empDedSchema.validate(
    BodyData.employeeData,
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
    const EmpDed = _EmpDed(sequelize, DataTypes);
    try {
      if (employeeData.Ded_Type === 7) {
        employeeData.Basic_Arr = employeeData.Ded_Amt;
        employeeData.Ded_Amt = null;
      } else if (employeeData.Ded_Type === 15) {
        employeeData.INCENTIVE_AMT = employeeData.Ded_Amt;
        employeeData.Ded_Amt = null;
      }
      await EmpDed.update(
        { ...employeeData },
        { where: { UTD: BodyData.UTD } },
        { transaction: t }
      );
      await t.commit();
      res.status(200).send({ success: true, Message: "Date updated" });

    } catch (error) {
      await t.rollback();
      res.status(500).send({
        success: false,
        message: "An error occurred while creating user.",
        error,
      });
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  }
};

exports.findMasters = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MiscMst = _MiscMst(sequelize, DataTypes);
    const EmpMst = _Employeemaster(sequelize, DataTypes);
    const Employees = await EmpMst.findAll({
      attributes: [
        ["EMPCODE", "value"],
        [
          sequelize.literal("EMPCODE +' - ' + EMPFIRSTNAME + ' ' + EMPLASTNAME "),
          "label",
        ],
      ],
      where: { Export_Type: 1 },
    });

    const DeductionType = await MiscMst.findAll({
      attributes: [
        [cast(col('misc_code'), 'VARCHAR'), 'value'],
        [cast(col('misc_name'), 'VARCHAR'), 'label'],
      ],
      where: { misc_type: 610 },
    });

    let data = {
      DeductionType,
      Employees
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();

    console.log(err);
  }
};