const { Sequelize, DataTypes, literal, Op, where } = require("sequelize");
const { dbname } = require("../utils/dbconfig");

var { _GodownMst, GodownMstSchema } = require("../models/GodownMst");
var { _CompMst, compMstSchema } = require("../models/CompMst");

exports.insertData = async function (req, res) {
  const branchData = req.body;
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const BranchMst = _GodownMst(sequelize, DataTypes);

  try {
    const BranchMst1 = await BranchMst.create(branchData.BranchMst, {
      transaction: t,
    });
    // const godwCode = BranchMst1.Godw_Code;
    // console.log(godwCode)
    // await BranchCreds.create({
    //     Godw_Code: godwCode,
    //     ...branchData.BranchCreds
    // }, { transaction: t });

    // await BranchDms.create({
    //     Godw_Code: godwCode,
    //     ...branchData.BranchDms
    // }, { transaction: t });

    // await BranchLedg.create({
    //     Godw_Code: godwCode,
    //     ...branchData.BranchLedg
    // }, { transaction: t });
    await t.commit();
    res.status(200).send({ success: true, Message: "data saved" });
  } catch (error) {
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while creating branch.",
    });
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};

exports.updateData = async function (req, res) {
  const branchData = req.body;
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const BranchMst = _BranchMst(sequelize, DataTypes);
  const BranchCreds = _BranchCreds(sequelize, DataTypes);
  const BranchDms = _BranchDms(sequelize, DataTypes);
  const BranchLedg = _BranchLedg(sequelize, DataTypes);
  try {
    const { Godw_Code } = branchData;
    if (!Godw_Code)
      return res
        .status(500)
        .send({ success: false, message: "godown code is mandatory" });
    if (branchData.BranchMst)
      await BranchMst.update(
        branchData.BranchMst,
        { where: { Godw_Code } },
        { transaction: t }
      );
    if (branchData.BranchCreds)
      await BranchCreds.update(
        branchData.BranchCreds,
        { where: { Godw_Code } },
        { transaction: t }
      );
    if (branchData.BranchDms)
      await BranchDms.update(
        branchData.BranchDms,
        { where: { Godw_Code } },
        { transaction: t }
      );
    if (branchData.BranchLedg)
      await BranchLedg.update(
        branchData.BranchLedg,
        { where: { Godw_Code } },
        { transaction: t }
      );

    await t.commit();
    res.status(200).send({ success: true, Message: "Date updated" });
  } catch (error) {
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while creating user.",
    });
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};
exports.findAll = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const BranchMst = _GodownMst(sequelize, DataTypes);
    const CompMst = _CompMst(sequelize, DataTypes);
    // Fetch all branches grouped by Comp_Code
    const data = await sequelize.query(`SELECT Comp_Code, Godw_Code, Godw_Name
    FROM godown_mst
    WHERE godw_code IN (
        SELECT LTRIM(RTRIM(m.value('.[1]', 'VARCHAR(8000)'))) AS value
        FROM user_tbl
        CROSS APPLY (
            SELECT CAST('<x>' + REPLACE(multi_loc, ',', '</x><x>') + '</x>' AS XML)
        ) AS t(x)
        CROSS APPLY t.x.nodes('/x') AS a(m)
        WHERE user_code = '${req.body.User_Code}'
          AND export_type < 3 
          AND module_code = 10
    ) 
    AND (export_type < 3 or export_type = 50) order by Godw_Code;`);
    // const data = await sequelize.query(`SELECT Comp_Code, Godw_Code, Godw_Name
    // FROM godown_mst
    // WHERE godw_code IN (
    //     SELECT value
    //     FROM user_tbl
    //     CROSS APPLY STRING_SPLIT(multi_loc, ',')
    //     WHERE user_code = '${req.body.User_Code}'
    //       AND export_type < 3
    //       AND module_code = 10
    // ) and export_type < 3 order by godw_code`);
    const comp = await CompMst.findAll();

    await sequelize.close();

    if (!data[0] || data[0].length === 0) {
      return res.status(500).send({ success: false, message: "No data found" });
    }
    const compMap = comp.reduce((map, comp) => {
      map[comp.Comp_Code] = comp.Comp_Name;
      return map;
    }, {});
    // Aggregate branches by Comp_Code
    const aggregatedData = {};
    data[0]?.forEach((branch) => {
      if (!aggregatedData[branch.Comp_Code]) {
        aggregatedData[branch.Comp_Code] = {
          Comp_Code: branch.Comp_Code,
          Comp_Name: compMap[branch.Comp_Code],
          branch: [],
        };
      }
      aggregatedData[branch.Comp_Code].branch.push({
        value: branch.Godw_Code,
        label: branch.Godw_Name,
      });
    });

    const responseData = Object.values(aggregatedData);
    return res.status(200).send({ success: true, data: responseData });
  } catch (e) {
    await sequelize?.close();
    console.log(e);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};
exports.onlybranch = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
    console.log(req.body);
    console.log(req.headers);
  try {
    const BranchMst = _GodownMst(sequelize, DataTypes);
    // Fetch all branches grouped by Comp_Code
    const data = await BranchMst.findAll({
      attributes: [
        ["Godw_Code", "Code"],
        ["Godw_Code", "value"],
        ["Godw_Name", "Name"],
        ["Godw_Name", "label"],
      ],
     where: {
    	[Op.or]: [
      	      { export_type: { [Op.lt]: 3 } },
      	      { export_type: 50 }
    	    ]
  	},
    });
     const result = await sequelize.query(
      `select misc_code, Misc_Name,Misc_Hod,
      (select top 1 Godw_Name from Godown_mst where godw_code=Misc_Hod and export_type<3)as Branch_name
       from  Misc_Mst where  Misc_Type = '631'`
    );
    const result1 = await sequelize.query(
      `select misc_code as value, Misc_Name as label
       from  Misc_Mst where  Misc_Type = '631'`
    );
    await sequelize.close();
            return res.status(200).send({ success: true, data: data, result: result[0], result1: result1[0] });

  } catch (e) {
    await sequelize.close();
    console.log(e);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};
exports.findOne = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const BranchMst = _BranchMst(sequelize, DataTypes);
    const BranchCreds = _BranchCreds(sequelize, DataTypes);
    const BranchDms = _BranchDms(sequelize, DataTypes);
    const BranchLedg = _BranchLedg(sequelize, DataTypes);
    const BranchId = req.params.id;

    const BranchMstData = await BranchMst.findOne({
      where: { Godw_Code: BranchId },
    });
    if (!BranchMstData) {
      return res
        .status(500)
        .send({ success: "false", message: "No data found" });
    }
    const BranchCredsData = await BranchCreds.findOne({
      where: { Godw_Code: BranchId },
    });
    const BranchDmsData = await BranchDms.findOne({
      where: { Godw_Code: BranchId },
    });
    const BranchLedgData = await BranchLedg.findOne({
      where: { Godw_Code: BranchId },
    });

    const data = {
      BranchMst: BranchMstData,
      BranchCreds: BranchCredsData,
      BranchDms: BranchDmsData,
      BranchLedg: BranchLedgData,
    };

    await sequelize.close();
    res.status(200).send({ success: true, data });
  } catch (e) {
    await sequelize.close();
    console.log(e);
  }
};
