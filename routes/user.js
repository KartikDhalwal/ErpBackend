const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { _ReleaseNote } = require("../models/releaseNote")
const { _UserTbl, userTblSchema } = require("../models/UserTbl");
const {
  _ApprovalMatrix,
  approvalMatrixSchema,
} = require("../models/ApprovalMatrix");
const { _MandatoryFields } = require("../models/MandatoryFields");
const { _WhatsAppMessages } = require("../models/WhatsAppMessages");

const _UserRights = require("../models/UserRights");
const _MobileRights = require("../models/MobileRights");
const { dbauthenticate } = require("../utils/dbauthenticate");

const moduleName = [
  { value: "attdence", label: "ATTENDANCE" },
  { value: "discount", label: "DISCOUNT" },
  { value: "gatepass", label: "GATEPASS" },
  { value: "BookingRefund", label: "BOOKING REFUND" },
  { value: "EXPENSE", label: "EXPENSE MANAGEMENT" },
  { value: "Fuel", label: "FUEL" },
  { value: "AssetIssue", label: "Asset Issue" },
  { value: "AssetService", label: "Asset Service" },
  { value: "Asset", label: "Asset" },
  { value: "Payment_Tracker", label: "Payment Tracker" },
  { value: "Deal_Sheet", label: "Deal Sheet" },
  { value: "democar", label: "DemoCar Gatepass" },
];

async function SendWhatsAppMessgaeHindi(
  DLR_ID,
  number,
  template,
  parameter,
  tokenex
) {
  if (!DLR_ID) {
    return false;
  }
  if (!/^\d+$/.test(number) || number.length != 10 || !number) {
    return false;
  }
  // return true
  parameter.forEach((item) => {
    if (typeof item.text !== "string") {
      // Check if the text property is not already a string
      item.text = String(item.text); // Convert the value to a string
    }
    if (item.text.trim() === "") {
      item.text = item.text ? String(item.text) : "N/A";
    }
  });

  console.log(parameter);
  let messagejson = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `91${number}`,
    type: "template",
    template: {
      name: template?.toLowerCase(),
      language: {
        code: "hi",
      },
      components: [
        {
          type: "body",
          parameters: parameter,
        },
      ],
    },
  };
  try {
    if (!whatsappmsgAuth) {
      await getauthtoken();
    }
    const abcd2 = await axios.post(
      "https://messagingapi.charteredinfo.com/v19.0/442952878893870/messages",
      messagejson,
      {
        headers: {
          Authorization: `Bearer ${whatsappmsgAuth}`,
        },
      }
    );
    console.log(abcd2.data);
    try {
      const sequelizeForWhatsapp = await dbname("DBCON");
      const WaHstWeb = _WhatsAppMessages(sequelizeForWhatsapp, DataTypes);
      if (abcd2.data?.messages[0]?.id) {
        await WaHstWeb.create({
          wamid: abcd2.data?.messages[0]?.id,
          DLR_ID: DLR_ID?.split("-")[0],
        });
      }
    } catch (e) {}
    return true;
  } catch (e) {
    if (tokenex == 1) {
      return false;
    } else {
      const data = await getauthtoken();
      if (data)
        await SendWhatsAppMessgaeHindi(DLR_ID, number, template, parameter, 1);
      console.log(e);
    }
  }
}
exports.SendWhatsAppMessgaeHindi = SendWhatsAppMessgaeHindi;

exports.findOne = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    var UserTbl = _UserTbl(sequelize, DataTypes);
    var RightsTbl = _UserRights(sequelize, DataTypes);

    const userId = req.params.id;
    const userCredsData = await UserTbl.findOne({
      where: {
        User_Code: userId,
        Export_Type: 1,
        Module_Code: 10,
      },
    });
    if (!userCredsData) {
      return res
        .status(401)
        .send({ success: "false", message: "No data found" });
    }
    const userRightsData = await RightsTbl.findAll({
      where: {
        User_Code: userId,
        Module_Code: 10,
      },
    });
    const userBasedRights = await RightsTbl.findAll({
      where: {
        User_Code: userId,
        Module_Code: 99,
      },
    });
    const rights = userRightsData.map((item) => item.Optn_Name);
    const rights1 = userBasedRights.map((item) => item.Optn_Name);
    const moduleCode =
      userRightsData.length > 0 ? userRightsData[0].Module_Code : null;
    const moduleCode1 =
      userBasedRights.length > 0 ? userBasedRights[0].Module_Code : null;
    const formattedUserRights = {
      rights,
      Module_Code: moduleCode,
    };
    const formattedUserRights1 = {
      rights1,
      Module_Code: moduleCode1,
    };
    const data = {
      UTD: userCredsData.UTD,
      isActive: userCredsData.Export_Type == 1 ? 1 : 0,
      UserTbl: userCredsData,
      userRights: formattedUserRights,
      userBasedRights: formattedUserRights1,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};
exports.findAll = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    var UserTbl = _UserTbl(sequelize, DataTypes);
    var RightsTbl = _UserRights(sequelize, DataTypes);
    const data = await UserTbl.findAll({
      attributes: [
        ["User_Code", "value"],
        ["User_Name", "label"],
      ],
      where: {
        Export_Type: 1,
        Module_Code: 10,
      },
    });
    const data1 = await UserTbl.findAll({
      attributes: [
        ["User_Code", "value"],
        ["User_Name", "label"],
      ],
      where: {
        Export_Type: 1,
        Module_Code: {
          [Sequelize.Op.not]: 10,
        },
      },
    });
    const userRightsData = await RightsTbl.findAll({
      where: {
        User_Code: '-3',
        Module_Code: 10
      },
    });
    const rights = userRightsData.map((item) => item.Optn_Name);

    if (!data) {
      return res.status(500).send({ success: false, message: "No data found" });
    }
    return res.status(200).send({ success: true, data, data1, rights });
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
// Test the database connection and perform insert operations
exports.insertData = async function (req, res) {
  const userData = req.body;
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var User_Tbl = _UserTbl(sequelize, DataTypes);
  var RightsTbl = _UserRights(sequelize, DataTypes);

  try {
    let { UserTbl, UTD } = userData;
    if (!UserTbl?.Multi_loc)
      return res
        .status(500)
        .send({ success: false, message: "Please select Location" });
    const { error, value } = userTblSchema.validate(UserTbl, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errorMessage = error.details.map((err) => err.message).join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
    UserTbl = value;

    const existingUser = await User_Tbl.findOne({
      where: {
        user_name: UserTbl.User_Name,
        Module_Code: 10, // Assuming user_name is the column name for username
      },
    });
    if (existingUser) {
      return res
        .status(500)
        .send({ success: false, message: "Username already exists." });
    }
    // const hashedPassword = await bcrypt.hash(UserTbl.User_Pwd, 10); // Adjust the salt rounds as needed
    // UserTbl.Password = hashedPassword;
    const maxUser = await sequelize.query(
      `select isnull(max(user_code)+1,1) as maxUserCode from user_tbl`,
      { transaction: t }
    );

    const userCreds1 = await User_Tbl.create(
      {
        ...UserTbl,
        User_Code: maxUser[0][0]?.maxUserCode,
        Export_Type: req.body.isActive == 1 ? 1 : 3,
      },
      {
        transaction: t,
      }
    );

    const rightsData = userData.userRights.rights
      .filter((right) => right?.length > 4)
      .map((right) => ({
        User_Code: maxUser[0][0]?.maxUserCode,
        Optn_Name: right,
        Module_Code: userData.userRights.Module_Code,
      }));
    const UrB = userData.userBasedRights.UbR.filter(
      (right) => right?.length > 4
    ).map((right) => ({
      User_Code: maxUser[0][0]?.maxUserCode,
      Optn_Name: right,
      Module_Code: userData.userBasedRights.Module_Code,
    }));

    const a = [...rightsData, ...UrB];
    await RightsTbl.bulkCreate(a, { transaction: t });
    await t.commit();
    let Message = `User Created successfully on User Code : ${maxUser[0][0].maxUserCode}`;
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
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
// UserTbl.Export_Type=33;
exports.updateData = async function (req, res) {
  console.log(req.body, "body");
  const userData = req.body;
  let { UserTbl, UTD } = userData;
  if (!UTD)
    return res
      .status(500)
      .send({ success: false, message: "UTD is Mandatory" });
  if (!UserTbl?.Multi_loc)
    return res
      .status(500)
      .send({ success: false, message: "Please select Location" });
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var User_Tbl = _UserTbl(sequelize, DataTypes);
  var RightsTbl = _UserRights(sequelize, DataTypes);
  const maxUser = await sequelize.query(
    `select *  from user_tbl where user_name = '${UserTbl.User_Name}' and user_code not in (${UserTbl.User_Code}) and module_code = 10 and export_type<5`,
    { transaction: t }
  );
  try {
    if (maxUser[1] > 0) {
      return res
        .status(500)
        .send({ success: false, message: "Username already exists." });
    }
    // if (UserTbl.User_Pwd && UserTbl?.User_Pwd?.length !== 60) {
    //   const hashedPassword = await bcrypt.hash(UserTbl.User_Pwd, 10);
    //   UserTbl.User_Pwd = hashedPassword;
    // }
    const { error, value } = userTblSchema.validate(UserTbl, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errorMessage = error.details.map((err) => err.message).join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
    UserTbl = value;

    const existingUser = await sequelize.query(
      `select * from user_tbl where utd = ${UTD} and export_type < 4`
    );
    if (!existingUser[0]?.length) {
      return res.status(500).send({
        success: false,
        message: "No user found with the provided UTD.",
      });
    } else {
      const { UTD, ...newUserTbl } = existingUser[0][0];
      await User_Tbl.create(
        { ...newUserTbl, Export_Type: 33 }
        // { transaction: t }
      );
    }

    await User_Tbl.update(
      { ...UserTbl, Export_Type: req.body.isActive == 1 ? 1 : 3 },
      { where: { UTD } },
      { transaction: t }
    );

    await RightsTbl.destroy(
      { where: { User_Code: existingUser[0][0]?.User_Code } },
      { transaction: t }
    );

    const rightsData = userData.userRights.rights
      .filter((right) => right?.length > 4)
      .map((right) => ({
        User_Code: existingUser[0][0]?.User_Code,
        Optn_Name: right,
        Module_Code: userData.userRights.Module_Code,
      }));
    const UrB = userData.userBasedRights.UbR.filter(
      (right) => right?.length > 4
    ).map((right) => ({
      User_Code: existingUser[0][0]?.User_Code,
      Optn_Name: right,
      Module_Code: userData.userBasedRights.Module_Code,
    }));

    const a = [...rightsData, ...UrB];
    await RightsTbl.bulkCreate(a, { transaction: t });
    await t.commit();
    let Message = `User data Updated successfully`;
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    console.log(e);
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while creating user.",
    });
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};
// Sample data
exports.login = async function (req, res) {
  const { User_Name, Password, Year } = req.body;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    var User_Tbl = _UserTbl(sequelize, DataTypes);
    var RightsTbl = _UserRights(sequelize, DataTypes);
    const user = await User_Tbl.findOne({
      where: { User_Name, Module_Code: 10, Export_Type: 1 },
    });
    console.log(user.User_Pwd);
    // if (!user || !(await bcrypt.compare(Password, user.User_Pwd))) {
    //   return res.status(401).json({ message: "Invalid username or password" });
    // }
    if (!user) {
      res.status(500).send({ data: "user not found" });
    } else if (
      user.User_Pwd == Password &&
      user.User_Name.toUpperCase() == User_Name.toUpperCase()
    ) {
      const payload = { User_Code: user.User_Code, User_Name: user.User_Name };
      const email = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "8h",
      }); // Change your-secret-key
      const name = user.User_Name;
      const id = user.User_Code;
      const EMPCODE = user.EMPCODE;
      const emp_dms_code = user.emp_dms_code;
      const multi = user.Multi_loc;
      const userRightsData = await RightsTbl.findAll({
        where: { User_Code: id },
      });
      const rights = userRightsData
        .filter((item) => item.Module_Code === 10)
        .map((item) => item.Optn_Name);
      const role = rights;
      const rights1 = userRightsData
        .filter((item) => item.Module_Code === 99)
        .map((item) => item.Optn_Name);

      const role1 = rights1;

      const AutoVynRights = await sequelize.query(`
select GST_Lock_Date , INPUT_GST_Lock_Date from user_tbl where 
User_Code in (SELECT ERP_User_Code FROM User_tbl WHERE Export_type =1 AND Module_Code = 10 AND User_Code = ${id}) AND Export_type =1`);

      const DealerRights = await RightsTbl.findAll({
        where: {
          User_Code: -1,
          Module_Code: 50,
        },
      });

      const Deal = DealerRights.map((item) => item.Optn_Name);

      res.status(200).json({
        email,
        name,
        id,
        multi,
        role,
        role1,
        Comp_Code: `${req.headers.compcode}`,
        EMPCODE,
        emp_dms_code,
        DB: sequelize?.config?.database,
        AutoVynRights: AutoVynRights[0][0],
        Deal,
      });
    } else {
      res.send({ data: "Incorrect Password" });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Invalid Company Code " });
  }
};
exports.passwordChange = async function (req, res) {
  console.log(req.body, "body");
  const { username, password, newpassword } = req.body;

  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    var User_Tbl = _UserTbl(sequelize, DataTypes);

    const existingUser = await sequelize.query(
      `select *  from user_tbl where user_code = '${username}' and User_Pwd = '${password}' and module_code = 10 and export_type = 1`
    );
    try {
      if (existingUser[1] == 0) {
        return res.status(500).send({
          Message: "incorrect current password",
        });
      }
      await User_Tbl.update(
        { Last_PWD: password, User_Pwd: newpassword },
        { where: { UTD: existingUser[0][0].UTD } },
        { transaction: t }
      );

      await t.commit();
      let Message = `User data Updated successfully`;
      return res.status(200).send({
        Message: Message,
      });
    } catch (e) {
      console.log(e);
      await t.rollback();
      return res.status(500).send({
        success: false,
        message: "An error occurred while creating user.",
      });
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  } catch (e) {
    console.log(e);
    await t.rollback();
    return res.status(500).send({
      success: false,
      message: "An error occurred while creating user.",
    });
  }
};
exports.getyear = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const db = sequelize.config.database?.slice(0, 6);
    const new_database = await sequelize.query(
      `select name , RIGHT(name,2) as year from sys.databases where name like '%${db}%' order by year desc`
    );
    res.status(200).send({ year: new_database[0] });
  } catch (e) {
    console.log(e);
    res.status(500).send({ year: { year: null } });
  } finally {
    sequelize.close();
  }
};
exports.approvalmatrix = async function (req, res) {
  console.log(req.body, "body");
  let ApprovalMatrix = req.body;
  let { UTD, module_code, empcode, Created_by } = ApprovalMatrix;
  // if (!UTD)
  //   return res.status(500).send({ success: false, message: "UTD is Mandatory" });

  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var Approval_Matrix = _ApprovalMatrix(sequelize, DataTypes);

  try {
    const { error, value } = approvalMatrixSchema.validate(ApprovalMatrix, {
      abortEarly: false,
      stripUnknown: true,
    });
    console.log(value);
    if (error) {
      const errorMessage = error.details.map((err) => err.message).join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
    ApprovalMatrix = value;
    let Message = `ApprovalMatrix Updated successfully`;
    const ApprovalData = await Approval_Matrix.findOne({
      where: {
        module_code,
        empcode,
      },
    });
    console.log(ApprovalMatrix, "askdhdshaksd");
    if (UTD) {
      delete ApprovalMatrix.module_code;
      delete ApprovalMatrix.empcode;
      console.log({ ...ApprovalMatrix, Created_by });
      await Approval_Matrix.update(
        { ...ApprovalMatrix, Created_by },
        { where: { UTD } },
        { transaction: t }
      );
      Message = `ApprovalMatrix Updated successfully`;
    } else {
      if (ApprovalData) {
        return res
          .status(401)
          .send({ success: "false", message: "UTD Required for this case" });
      }
      await Approval_Matrix.create(
        { ...ApprovalMatrix, Created_by },
        { transaction: t }
      );
      Message = `ApprovalMatrix Created successfully`;
    }

    await t.commit();
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    console.log(e);
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while creating user.",
    });
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};
exports.approvalmatrixfindOne = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empcode = req.body.empcode;
    const data =
      await sequelize.query(`select top 1 (select top 1 concat(godw_code , ' - ',godw_name) from godown_mst where godw_code = location ) as Location,CORPORATEMAILID,MOBILE_NO,EMPLOYEEDESIGNATION ,concat(isnull(Title,'' ) , ' ' ,EmpFirstName , ' ' + EmpLastName) AS EMPNAME
    ,(select top 1 emp_dms_code from user_tbl where empcode= '${empcode}' and export_type < 3 and module_code = 10) as emp_dms_code
    ,(select top 1 Multi_Loc from user_tbl where empcode= '${empcode}' and export_type < 3 and module_code = 10) as Multi_Loc
      from EMPLOYEEMASTER where EMPCODE='${empcode}'`);
    const approval_data = await sequelize.query(
      `select * from approval_matrix where empcode='${empcode}' `
    );
    console.log({ data: data[0], approval_data: approval_data[0] });
    res.status(200).send({ data: data[0][0], approval_data: approval_data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.approvalmatrixfindOneByLocation = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empcode = req.body.empcode;
    const data = await sequelize.query(`
      	  select distinct location,module_code ,approver1_A,approver1_B,approver2_A,approver2_B,approver3_A,approver3_B ,count(*) as count_ from (
      select (select top 1 misc_code from misc_mst where Misc_Type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode = ap.empcode and export_type < 3) )as location,* from Approval_Matrix ap where module_code = '${req.body.module_code}'
      ) as asd where  location in (${req.body.branch})  group by location,module_code ,approver1_A,approver1_B,approver2_A,approver2_B,approver3_A,approver3_B `);
    const data2 = await sequelize.query(`
       	  SELECT count(*) as EmployeeCount
      FROM EMPLOYEEMASTER s
      WHERE NOT EXISTS (
          SELECT 1
          FROM Approval_Matrix t
          WHERE t.empcode = s.empcode
            AND t.module_code = '${req.body.module_code}'
      ) And s.Location in (${req.body.branch})`);

    res.status(200).send({ data: data[0], data2: data2[0][0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.findAllEmployee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const data = await sequelize.query(
      `select empcode as value,concat(isnull(Title,'' ) , ' ' ,EmpFirstName , ' ' + EmpLastName) AS label from EMPLOYEEMASTER where export_type < 3 and EMPFIRSTNAME is not null and  EMPFIRSTNAME <>'' and location in (select misc_code from misc_mst where misc_hod in (${req.body.branch}) and misc_type = 85 and export_type  < 3)`
    );
    var branch = await sequelize.query(
      `select misc_code as value , misc_name as label from misc_mst where misc_hod in (${req.body.branch}) and misc_type = 85`
    );

    res
      .status(200)
      .send({ data: data[0], branch: branch[0], module: moduleName });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.findMatrixEmployees = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    if (!req.body.branch) {
      return res.status(500).send({ Message: "Branch Code required" });
    }
    if (!req.body.Module_Code) {
      return res.status(500).send({ Message: "Module_Code required" });
    }
    const data =
      await sequelize.query(` select am.EMPCODE,concat(em.title,' ',em.empfirstname,' ',em.EMPLASTNAME) as emp_name,
    am.approver1_A	,
    (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where EMPCODE = am.approver1_A) as approver1_Aname ,
    am.approver1_B	,
    (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where EMPCODE = am.approver1_B) as approver1_Bname ,
    am.approver2_A	,
    (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where EMPCODE = am.approver2_A) as approver2_Aname ,
    am.approver2_B,
    (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where EMPCODE = am.approver2_B) as approver2_Bname ,
    am.approver3_A,
    (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where EMPCODE = am.approver3_A) as approver3_Aname ,
    am.approver3_B,
    (select top 1 concat(em.title,' ',em.empfirstname,' ',em.EMPLASTNAME)  from EMPLOYEEMASTER where EMPCODE = am.approver3_B) as approver3_Bname 
    from Approval_Matrix am join EMPLOYEEMASTER em  on em.empcode = am.empcode and em.export_type = 1
    where am.module_code in ('${req.body.Module_Code}') and  em.location in (${req.body.branch})`);
    res.status(200).send({ data: data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.approvalmatrixByLocation = async function (req, res) {
  console.log(req.body, "body");
  let ApprovalMatrix = req.body.User;
  let {
    module_code,
    Check,
    Location,
    approver1_A,
    approver1_B,
    approver2_A,
    approver2_B,
    approver3_A,
    approver3_B,
    Created_by,
  } = ApprovalMatrix;
  if (module_code == "" || module_code == undefined || module_code == null) {
    return res.status(500).send({
      status: false,
      Message: "module_code is mandatory",
    });
  }
  if (Location == "" || Location == undefined || Location == null) {
    return res.status(500).send({
      status: false,
      Message: "Location is mandatory",
    });
  }
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  try {
    if (Check) {
      const QueryForNotNull = await sequelize.query(`update Approval_Matrix set 
    approver1_A	= ${approver1_A ? `'${approver1_A}'` : "approver1_A"},
    approver1_B	= ${approver1_B ? `'${approver1_B}'` : "approver1_B"},
    approver2_A	= ${approver2_A ? `'${approver2_A}'` : "approver2_A"},
    approver2_B	= ${approver2_B ? `'${approver2_B}'` : "approver2_B"},
    approver3_A	= ${approver3_A ? `'${approver3_A}'` : "approver3_A"},
    approver3_B  = ${approver3_B ? `'${approver3_B}'` : "approver3_B"},
    Created_by = ${Created_by} where utd in (
      select utd from (
          select (select top 1 misc_code from misc_mst where Misc_Type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode = ap.empcode and export_type < 3) )as location,* from Approval_Matrix ap where module_code = '${module_code}'
          ) as asd where location in (${Location})
    )`);
    } else {
      const queryForNull = await sequelize.query(` update Approval_Matrix set 
    approver1_A	= ${approver1_A ? `'${approver1_A}'` : null},
    approver1_B	= ${approver1_B ? `'${approver1_B}'` : null},
    approver2_A	= ${approver2_A ? `'${approver2_A}'` : null},
    approver2_B	= ${approver2_B ? `'${approver2_B}'` : null},
    approver3_A	= ${approver3_A ? `'${approver3_A}'` : null},
    approver3_B  = ${approver3_B ? `'${approver3_B}'` : null},
    Created_by = ${Created_by} where utd in (
    select utd from (
          select (select top 1 misc_code from misc_mst where Misc_Type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode = ap.empcode and export_type < 3) )as location,* from Approval_Matrix ap where module_code = '${module_code}'
          ) as asd where location in (${Location})
        )`);
    }
    await t.commit();
    res.status(200).send({
      Message: `Approval Updated for Employees on this Location`,
    });
  } catch (e) {
    console.log(e);
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while creating user.",
    });
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};
exports.approvalmatrixTransfer = async function (req, res) {
  console.log(req.body, "body");
  let ApprovalMatrix = req.body.tranfer;
  let { module_code, EMPCODE, Appr_Code, Created_by } = ApprovalMatrix;
  if (module_code == "" || module_code == undefined || module_code == null) {
    return res.status(500).send({
      status: false,
      Message: "module_code is mandatory",
    });
  }
  if (EMPCODE == "" || EMPCODE == undefined || EMPCODE == null) {
    return res.status(500).send({
      status: false,
      Message: "EMPCODE is mandatory",
    });
  }
  if (Appr_Code == "" || Appr_Code == undefined || Appr_Code == null) {
    return res.status(500).send({
      status: false,
      Message: "Appr_Code is mandatory",
    });
  }
  if (Created_by == "" || Created_by == undefined || Created_by == null) {
    return res.status(500).send({
      status: false,
      Message: "Created_by is mandatory",
    });
  }
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  try {
    const data = await sequelize.query(`
    UPDATE Approval_Matrix 
    SET 
        approver1_A = CASE 
            WHEN approver1_A = '${EMPCODE}' 
            THEN ${Appr_Code ? `'${Appr_Code}'` : null} 
            ELSE approver1_A 
        END,
        approver1_B = CASE 
            WHEN approver1_B = '${EMPCODE}' 
            THEN ${Appr_Code ? `'${Appr_Code}'` : null} 
            ELSE approver1_B 
        END,
        approver2_A = CASE 
            WHEN approver2_A = '${EMPCODE}' 
            THEN ${Appr_Code ? `'${Appr_Code}'` : null} 
            ELSE approver2_A 
        END,
        approver2_B = CASE 
            WHEN approver2_B = '${EMPCODE}' 
            THEN ${Appr_Code ? `'${Appr_Code}'` : null} 
            ELSE approver2_B 
        END,
        approver3_A = CASE 
            WHEN approver3_A = '${EMPCODE}' 
            THEN ${Appr_Code ? `'${Appr_Code}'` : null} 
            ELSE approver3_A 
        END,
        approver3_B = CASE 
            WHEN approver3_B = '${EMPCODE}' 
            THEN ${Appr_Code ? `'${Appr_Code}'` : null} 
            ELSE approver3_B 
        END,
        Created_by = ${Created_by}
    WHERE 
        ( approver1_A = '${EMPCODE}' OR approver1_B = '${EMPCODE}' or
          approver2_A = '${EMPCODE}' OR approver2_B = '${EMPCODE}' or 
          approver3_A = '${EMPCODE}' OR approver3_B = '${EMPCODE}'
        ) 
        AND utd IN (
            SELECT utd FROM (
                SELECT 
                    (SELECT TOP 1 misc_code 
                     FROM misc_mst 
                     WHERE Misc_Type = 85 
                     AND misc_code = (SELECT location FROM EMPLOYEEMASTER WHERE empcode = ap.empcode)) AS location, 
                    * 
                FROM Approval_Matrix ap 
                WHERE module_code = '${module_code}'
            ) AS asd 
        )
`);

    await t.commit();
    res.status(200).send({
      Message: `Approval Transfred for Employee on this Location`,
    });
  } catch (e) {
    console.log(e);
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while creating user.",
    });
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};

exports.MandatoryFields = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const data = await sequelize.query(`SELECT * FROM Mandatory_Fields`);
    const RightsTemplate = await sequelize.query(
      `select Emp_Code as value,Emp_Code as label from (
 SELECT distinct(Emp_Code) FROM Mobile_rights where module_code = 99
 ) as ab`
    );
    res.status(200).send({ data: data[0], RightsTemplate: RightsTemplate[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.MandatoryFieldsUpdate = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body);
  var MandatoryFields = _MandatoryFields(sequelize, DataTypes);
  const { fields } = req.body;

  try {
    const transaction = await sequelize.transaction();
    try {
      const updatePromises = fields.map((field) =>
        MandatoryFields.update(
          { Is_Mandatory: field.Is_Mandatory },
          { where: { Utd: field.Utd }, transaction }
        )
      );

      await Promise.all(updatePromises);
      await transaction.commit();

      res.status(200).json({ message: "Update successful" });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await sequelize.close();
  }
};
exports.BranchApi = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    var data = await sequelize.query(
      `select godw_code as value , godw_name as label from godown_mst where godw_code in (${req.body.multi_loc}) and export_type < 3`
    );
    var data2 = await sequelize.query(
      `select misc_code as value , misc_name as label from misc_mst where misc_hod in (${req.body.multi_loc}) and misc_type = 85`
    );
    res.status(200).send({
      branch: data[0],
      branchMisc: data2[0],
      Options: moduleName,
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};

let whatsappmsgAuth;

async function getauthtoken() {
  try {
    const abcd = await axios.post(
      "https://messagingapi.charteredinfo.com/AuthTokenV1/AuthToken",
      {
        userId: "yuvraj@autovyn.com",
        password: "India@#50100",
      }
    );
    whatsappmsgAuth = abcd.data.txnOutcome;
    console.log(whatsappmsgAuth);

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// getauthtoken();
async function SendWhatsAppMessgae(
  DLR_ID,
  number1,
  template,
  parameter,
  tokenex,
  ImageId = null
) {
  if (!DLR_ID) {
    return false;
  }
  const number = number1?.slice(-10);
  if (!/^\d+$/.test(number) || number.length != 10 || !number) {
    return false;
  }
  // return true
  parameter.forEach((item) => {
    if (typeof item.text !== "string") {
      // Check if the text property is not already a string
      item.text = String(item.text); // Convert the value to a string
    }
    if (item.text.trim() === "") {
      item.text = item.text ? String(item.text) : "N/A";
    }
  });
  if (
    DLR_ID.split("-")[0]?.toLowerCase() == "ranah" ||
    DLR_ID.split("-")[0]?.toLowerCase() == "rmpl"
  ) {
    // let messagejson = {
    //   "messaging_product": "whatsapp",
    //   "recipient_type": "individual",
    //   "to": `918209932832`,
    //   "type": "template",
    //   "template": {
    //     "name": template?.toLowerCase(),
    //     "language": {
    //       "code": "en"
    //     },
    //     "components": [
    //       {
    //         "type": "body",
    //         "parameters": parameter
    //       }
    //     ]
    //   }
    // }
    let messagejson = {
      to: `91${number}`,
      recipient_type: "individual",
      type: "template",
      template: {
        language: {
          policy: "deterministic",
          code: "en_US",
        },
        name: template?.toLowerCase(),
        components: [
          {
            type: "body",
            parameters: parameter,
          },
        ],
      },
    };
    let abcd2;
    try {
      // const url = "https://crm.helloall.in/api/meta/v19.0/322026744336000/messages"; // Replace with actual URL
      // const options = {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': 'Bearer CT6ZGP8jfoD4YZmNfzFU035YllTb1hG9Ro3QIvLhK1U7V8YfDXIRsseMchLcUyZiH7YKOrd0NEKomN9eaO4kdV7VU5ERVJTQ09SRQ4HVU5ERVJTQ09SRQG2CYWe1zw3MHdGp2Fzu7P06IQeEQY0So' // Replace with your access token
      //   },
      //   body: JSON.stringify(messagejson)
      // };

      // // Send the request
      // fetch(url, options)
      //   .then(response => response.json())
      //   .then(data => console.log('Message sent successfully:', data))
      //   .catch(error => console.error('Error sending message:', error));

      abcd2 = await axios.post(
        "https://crm.helloall.in/api/meta/v19.0/322026744336000/messages",
        messagejson,
        {
          headers: {
            Authorization: `Bearer CT6ZGP8jfoD4YZmNfzFU035YllTb1hG9Ro3QIvLhK1U7V8YfDXIRsseMchLcUyZiH7YKOrd0NEKomN9eaO4kdV7VU5ERVJTQ09SRQ4HVU5ERVJTQ09SRQG2CYWe1zw3MHdGp2Fzu7P06IQeEQY0So`,
          },
        }
      );
      console.log(abcd2, "absc2");
      return true;
    } catch (e) {
      console.log(e);

      return false;
    }
  } else {
    let messagejson1 = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${number}`,
      type: "template",
      template: {
        name: template?.toLowerCase(),
        language: {
          code: "en",
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  id: ImageId,
                },
              },
            ],
          },
          {
            type: "body",
            parameters: parameter,
          },
        ],
      },
    };
    let messagejson = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${number}`,
      type: "template",
      template: {
        name: template?.toLowerCase(),
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: parameter,
          },
        ],
      },
    };
    try {
      if (!whatsappmsgAuth) {
        await getauthtoken();
      }
      const abcd2 = await axios.post(
        "https://messagingapi.charteredinfo.com/v19.0/442952878893870/messages",
        ImageId ? messagejson1 : messagejson,
        {
          headers: {
            Authorization: `Bearer ${whatsappmsgAuth}`,
          },
        }
      );
      console.log(abcd2.data);
      try {
        const sequelizeForWhatsapp = await dbname("DBCON");
        const WaHstWeb = _WhatsAppMessages(sequelizeForWhatsapp, DataTypes);
        if (abcd2.data?.messages[0]?.id) {
          await WaHstWeb.create({
            wamid: abcd2.data?.messages[0]?.id,
            DLR_ID: DLR_ID?.split("-")[0],
          });
        }
      } catch (e) {}

      return true;
    } catch (e) {
      console.log(e);
      if (tokenex == 1) {
        return false;
      } else {
        const data = await getauthtoken();
        if (data)
          await SendWhatsAppMessgae(DLR_ID, number, template, parameter, 1);
        console.log(e.response);
      }
    }
  }
}
exports.SendWhatsAppMessgae = SendWhatsAppMessgae;

exports.whatsappmsg = async function (req, res) {
  try {
    if (
      !/^\d+$/.test(req.body.mobile_no) ||
      req.body.mobile_no.length != 10 ||
      !req.body.mobile_no
    ) {
      return res
        .status(500)
        .send({ status: false, message: "Invalid mobile no" });
    }
    if (
      req.body.template == "" ||
      req.body.template == undefined ||
      req.body.template == null
    ) {
      return res.status(500).send({
        status: false,
        message: "template name is mandatory",
      });
    }
    if (!Array.isArray(req.body.parameter)) {
      return res.status(500).send({
        status: false,
        message: "perameter array is not a valid array",
      });
    }
    function transformArray(inputArray) {
      return inputArray.map((item) => ({
        type: "text",
        text: item,
      }));
    }
    const transformedArray = transformArray(req.body.parameter);

    const data = await SendWhatsAppMessgae(
      req.headers.compcode,
      req.body.mobile_no,
      req.body.template,
      transformedArray
    );
    if (data) {
      res.send({ status: true, message: "message sent!" });
    } else {
      res
        .status(500)
        .send({ status: false, message: "error sending message!" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: false, message: "internal server error!" });
  }
};
exports.dbauthenticate = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    let dbdata = [[{}]];
    try {
      dbdata = await sequelize.query(`select New_dev_code from Comp_keydata`);
    } catch (e) {
      dbdata[0][0].New_dev_code = 999;
    }
    console.log(`Data for ${req.headers.compcode}:`, dbdata[0][0].New_dev_code);
    const data = await dbauthenticate(
      req.headers.compcode,
      dbdata[0][0].New_dev_code
    );
    if (data) {
      res.status(200).send({
        Message: `Db Authenticated`,
      });
    } else {
      return res
        .status(500)
        .send({ success: "false", message: "Internal Server Error" });
    }
  } catch (e) {
    console.log(e);
  }
};
exports.Alldbauthenticate = async function (req, res) {
  try {
    const configPath = path.join(__dirname, "../config/config.json");
    const databaseConfigs = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const keysArray = Object.keys(databaseConfigs);
    console.log(keysArray); // Output: ["key1", "key2", "key3"]

    async function processKeys() {
      for (const key of keysArray) {
        const compcode = key;
        let dbdata = [[{}]];
        let sequelize;

        try {
          if (compcode == "DBCON") {
            continue;
          }
          sequelize = await dbname(compcode);
        } catch (e) {
          continue;
        }
        try {
          dbdata = await sequelize.query(
            `select iif((select count(*) from COMP_KEYDATA )> 0  , (select new_dev_code from COMP_KEYDATA),999) as New_dev_code`
          );
        } catch (e) {
          dbdata[0][0].New_dev_code = 999;
        }
        console.log(`Data for ${compcode}:`, dbdata[0][0].New_dev_code);
        try {
          const data = await dbauthenticate(
            compcode,
            dbdata[0][0].New_dev_code
          );
          console.log(
            `Authenticated ${compcode} with code ${dbdata[0][0].New_dev_code}`
          );
        } catch (e) {
          console.error(`Error authenticating ${compcode}:`, e);
        }
      }
    }

    processKeys()
      .then(() => {
        res.status(200).send({
          Message: `Db Authenticated`,
        });
      })
      .catch((error) => {
        console.error("Error processing keys:", error);
        return res
          .status(500)
          .send({ success: "false", message: "Internal Server Error" });
      });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};

exports.ranawhatsapp = async function (req, res) {
  try {
    if (
      !/^\d+$/.test(req.body.mobile_no) ||
      req.body.mobile_no.length != 10 ||
      !req.body.mobile_no
    ) {
      return res
        .status(500)
        .send({ status: false, message: "Invalid mobile no" });
    }
    if (
      req.body.template == "" ||
      req.body.template == undefined ||
      req.body.template == null
    ) {
      return res.status(500).send({
        status: false,
        message: "template name is mandatory",
      });
    }
    if (!Array.isArray(req.body.parameter)) {
      return res.status(500).send({
        status: false,
        message: "perameter array is not a valid array",
      });
    }
    function transformArray(inputArray) {
      return inputArray.map((item) => ({
        type: "text",
        text: item,
      }));
    }
    const transformedArray = transformArray(req.body.parameter);

    transformedArray.forEach((item) => {
      if (typeof item.text !== "string") {
        // Check if the text property is not already a string
        item.text = String(item.text); // Convert the value to a string
      }
      if (item.text.trim() === "") {
        item.text = item.text ? String(item.text) : "N/A";
      }
    });

    let messagejson = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${req.body.mobile_no}`,
      type: "template",
      template: {
        name: req.body.template?.toLowerCase(),
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: transformedArray,
          },
        ],
      },
    };
    let abcd2;
    try {
      abcd2 = await axios.post(
        "https://crm.helloall.in/api/meta/v19.0/322026744336000/messages",
        messagejson,
        {
          headers: {
            Authorization: `Bearer CT6ZGP8jfoD4YZmNfzFU035YllTb1hG9Ro3QIvLhK1U7V8YfDXIRsseMchLcUyZiH7YKOrd0NEKomN9eaO4kdV7VU5ERVJTQ09SRQ4HVU5ERVJTQ09SRQG2CYWe1zw3MHdGp2Fzu7P06IQeEQY0So`,
          },
        }
      );
      console.log();

      res.send({ status: true, message: "message sent!", data: abcd2.data });
    } catch (e) {
      res
        .status(500)
        .send({
          status: false,
          message: "error sending message!",
          data: abcd2.data,
        });
    }
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: false, message: "internal server error!" });
  }
};

exports.StatementAccNo = async function (req, res) {
  console.log(req.body, "req.body");
  // return;
  const sequelize = await dbname(req.headers.compcode);
  try {
    const data = await sequelize.query(`
      select ACCOUNTNO as value,ACCOUNTNO as label from BANK_API_SETUP
      `);
    res.status(200).send({ data: data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.GetStatement = async function (req, res) {
  console.log(req.body, "req.body");
  // return;
  const sequelize = await dbname(req.headers.compcode);
  try {
    const data = await sequelize.query(`
    SELECT *
    FROM API_BANK_STATEMENT
    WHERE PARSE(SUBSTRING(TXNDATE, 1, 10) AS DATETIME USING 'en-GB') BETWEEN '${req.body.DATE_FROM}' AND '${req.body.DATE_TO}' and bank_name='${req.body.Account_No}'
    ORDER BY PARSE(TXNDATE AS DATETIME USING 'en-GB') DESC
      `);
    res.status(200).send({ data: data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};
exports.ApprovalMatrixImport = async function (req, res) {
  console.log(req.body, "req.body");
  // return;
  const sequelize = await dbname(req.headers.compcode);
  try {
    const data = await sequelize.query(`
      INSERT INTO Approval_Matrix(empcode, module_code)
      output inserted.UTD
      SELECT s.empcode, '${req.body.module_code}'
      FROM EMPLOYEEMASTER s
      WHERE NOT EXISTS (
          SELECT 1
          FROM Approval_Matrix t
          WHERE t.empcode = s.empcode
            AND t.module_code = '${req.body.module_code}'
      ) And s.Location = '${req.body.Location}'
      `);
    res
      .status(200)
      .send({
        Message: `${data[0]?.length} Employees Imported for ${req.body.module_code} module`,
      });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  } finally {
    sequelize.close();
  }
};

exports.MobileRightsUpdate = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var RightsTbl = _MobileRights(sequelize, DataTypes);
  try {
    const { checkedKeys, empCodeList, USER_CODE } = req.body;
    const filteredRights = checkedKeys.filter((right) => right?.length > 0);

    // Create rights data for each employee in the empCodeList
    const rightsData = empCodeList.flatMap((empCode) => {
      return filteredRights.map((right) => ({
        Emp_Code: empCode?.toString(), // Map the current empCode to User_Code
        Optn_Name: right,
        Module_Code: 10,
        USER_CODE: USER_CODE,
      }));
    });
    const data = empCodeList.map((data) => data.toString());
    const a = [...rightsData];
    await RightsTbl.destroy(
      {
        where: {
          Emp_Code: data, // Assuming 'User_Code' matches elements in empCodeList
        },
      },
      {
        transaction: t,
      }
    );
    await RightsTbl.bulkCreate(a, { transaction: t });
    await t.commit();
    let Message = `Mobile Rights Updated`;
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
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
exports.SaveTemplateMobileRights = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var RightsTbl = _MobileRights(sequelize, DataTypes);
  try {
    const { checkedKeys, empCodeList, USER_CODE } = req.body;
    const filteredRights = checkedKeys.filter((right) => right?.length > 0);

    // Create rights data for each employee in the empCodeList
    const rightsData = empCodeList.flatMap((empCode) => {
      return filteredRights.map((right) => ({
        Emp_Code: empCode?.toString(), // Map the current empCode to User_Code
        Optn_Name: right,
        Module_Code: 99,
        USER_CODE: USER_CODE,
      }));
    });
    const data = empCodeList.map((data) => data.toString());
    const a = [...rightsData];
    await RightsTbl.destroy(
      {
        where: {
          Emp_Code: data, // Assuming 'User_Code' matches elements in empCodeList
        },
      },
      {
        transaction: t,
      }
    );
    await RightsTbl.bulkCreate(a, { transaction: t });
    await t.commit();
    const data2 =
      await sequelize.query(`select Emp_Code as value,Emp_Code as label from (
 SELECT distinct(Emp_Code) FROM Mobile_rights where module_code = 99
 ) as ab`);
    let Message = `Mobile Rights Updated`;
    res.status(200).send({
      Message: Message,
      templates: data2[0],
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
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
exports.MobileRightsGet = async function (req, res) {
  const { Emp_Code } = req.body;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    var RightsTbl = _MobileRights(sequelize, DataTypes);
    const userRightsData = await RightsTbl.findAll({
      where: { Emp_Code: Emp_Code },
    });
    const datecalender = await sequelize.query(
      ` select (iif((select top 1 LEFT(Misc_Dtl1,2)  as date_ from Misc_Mst where Misc_Type = 25 and misc_code = 1) is null ,'0',(select top 1 LEFT(Misc_Dtl1,2)  as date_ from Misc_Mst where Misc_Type = 25 and misc_code = 1))) as CustumDateForCalender  `
    );
    const rights = userRightsData
      .filter((item) => item.Module_Code === 10)
      .map((item) => item.Optn_Name);
    const Template = userRightsData
      .filter((item) => item.Module_Code === 99)
      .map((item) => item.Optn_Name);
    let role = [];
    if (rights.length) {
      role = rights;
    } else if (Template.length) {
      role = Template;
    }
    return res.status(200).send({
      Status: true,
      Message: "response.Message",
      Query: datecalender[0][0].CustumDateForCalender,
      Result: role,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(200).send({
      Status: true,
      Message: "Message",
      Query: "",
      Result: [],
    });
  }
};
const ExcelJS = require("exceljs");

exports.MobileRightsDownload = async function (req, res) {
  const { Rights } = req.query;
  console.log(`${Rights.split(",").map((asad) => `'${asad}'`)}`);
  try {
    const sequelize = await dbname(req.query.compcode);
    // const t = await sequelize.transaction();

    const txnDetails =
      await sequelize.query(` select distinct  fst.emp_code AS EMPCODE,
          (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as EmployeeName,
          (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as Designation,
          (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Location,
          (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Region,
          (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Department,
          (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Section 
		  from (
		  SELECT Emp_Code 
      FROM Mobile_Rights 
      WHERE module_code = 10 and  optn_name IN (${Rights.split(",").map(
        (asad) => `'${asad}'`
      )})
      GROUP BY Emp_Code
      HAVING COUNT(DISTINCT optn_name) = ${Rights.split(",").length}) as fst`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add headers for the data starting from the 3rd row
    const headers = Object.keys(txnDetails[0][0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Mobile_App_Rights.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (error) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="NO_data_available.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  }
};
exports.MobileRightsAddExtra = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var RightsTbl = _MobileRights(sequelize, DataTypes);
  try {
    const { checkedKeys, empCodeList, USER_CODE } = req.body;
    const filteredRights = checkedKeys.filter((right) => right?.length > 0);

    // Create rights data for each employee in the empCodeList
    const rightsData = empCodeList.flatMap((empCode) => {
      return filteredRights.map((right) => ({
        Emp_Code: empCode?.toString(),
        Optn_Name: right,
        Module_Code: 10,
        USER_CODE: USER_CODE,
      }));
    });

    const empCodes = empCodeList.map((empCode) => empCode.toString());

    // Step 1: Fetch existing rights for these employees
    const existingRights = await RightsTbl.findAll({
      where: {
        Emp_Code: empCodes,
        Optn_Name: filteredRights,
      },
    });

    // Step 2: Filter out the existing rights
    const existingRightsSet = new Set(
      existingRights.map((right) => `${right.Emp_Code}-${right.Optn_Name}`)
    );
    const newRightsData = rightsData.filter(
      (right) => !existingRightsSet.has(`${right.Emp_Code}-${right.Optn_Name}`)
    );

    if (newRightsData.length > 0) {
      // Step 3: Insert only the new rights
      await RightsTbl.bulkCreate(newRightsData, { transaction: t });
    }

    await t.commit();
    let Message = `Mobile Rights Updated. ${newRightsData.length} new rights added.`;
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
    res.status(500).send({
      success: false,
      message: "An error occurred while updating mobile rights.",
    });
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};
exports.MobileRightsRemoveExtra = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var RightsTbl = _MobileRights(sequelize, DataTypes);
  try {
    const { checkedKeys, empCodeList, USER_CODE } = req.body;
    const filteredRights = checkedKeys.filter((right) => right?.length > 0);

    // Remove only specified rights for each employee in empCodeList
    await RightsTbl.destroy(
      {
        where: {
          Emp_Code: empCodeList.map((empCode) => empCode.toString()), // Employees to remove rights from
          Optn_Name: filteredRights, // Rights to be removed
        },
      },
      { transaction: t }
    );

    await t.commit();
    res.status(200).send({
      Message: "Selected Mobile Rights Removed",
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
    res.status(500).send({
      success: false,
      message: "An error occurred while removing rights.",
    });
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};

exports.importformatapprovalmatrix = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const Headeres = [
      "module_code",
      "empcode",
      "approver1_A",
      "approver1_B",
      "approver2_A",
      "approver2_B",
      "approver3_A",
      "approver3_B",
    ];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Approval_matrix_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.excelimportapprovalmatrix = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Data = _ApprovalMatrix(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }
    const user = req.body.user;
    const branch = req.body.branch;

    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        module_code: "module_code",
        empcode: "empcode",
        approver1_A: "approver1_A",
        approver1_B: "approver1_B",
        approver2_A: "approver2_A",
        approver2_B: "approver2_B",
        approver3_A: "approver3_A",
        approver3_B: "approver3_B",
      };
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        // Convert empty string values to null
        acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        return acc;
      }, {});
    };

    const data = transformedData.map(renameKeys);

    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10); // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }
    const ErroredData = [];
    const CorrectData = [];

    data.forEach((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];
      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons.join(""),
        });
      } else {
        obj.Created_By = user;
        obj.Location = branch;
        CorrectData.push(obj);
      }
    });

    const InsuData1 = await Insu_Data.bulkCreate(CorrectData, {
      transaction: t,
    });
    await t.commit();
    await sequelize.close();

    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${InsuData1.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.importformatuser = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const Headeres = [
      "User_Name",
      "User_Pwd",
      "User_mob",
      "User_Email",
      "Multi_loc",
      "EMPCODE",
      "emp_dms_code",
    ];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="user_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.excelimportuser = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        User_Name: "User_Name",
        User_Pwd: "User_Pwd",
        User_mob: "User_mob",
        User_Email: "User_Email",
        Module_Code: "Module_Code",
        Multi_loc: "Multi_loc",
        EMPCODE: "EMPCODE",
        emp_dms_code: "emp_dms_code",
      };
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        // Convert empty string values to null
        acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        return acc;
      }, {});
    };

    var User_Tbl = _UserTbl(sequelize, DataTypes);
    const data = transformedData.map(renameKeys);
    const ErroredData = [];
    const CorrectData = [];
    for (const item of data) {
      const rejectionReasons = [];
      const existingUser = await User_Tbl.findOne({
        where: {
          user_name: item.User_Name,
          Module_Code: 10, // Assuming user_name is the column name for username
        },
      });
      if (existingUser) {
        rejectionReasons.push("User Already Exits");
        ErroredData.push({
          ...item,
          rejectionReasons: rejectionReasons.join(""),
        });
      } else {
        const maxUser = await sequelize.query(
          `select isnull(max(user_code)+1,1) as maxUserCode from user_tbl`
        );
        await User_Tbl.create({
          ...item,
          User_Code: maxUser[0][0]?.maxUserCode,
          Export_Type: 1,
          Module_Code: 10,
        });
        CorrectData.push({
          ...item,
        });
      }
    }
    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${CorrectData.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.importformatuserrights = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const Headeres = ["User_Code", "Optn_Name"];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="userrights_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.excelimportuserrights = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        User_Code: "User_Code",
        Optn_Name: "Optn_Name",
      };
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key
        acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        return acc;
      }, {});
    };
    var User_Tbl = _UserRights(sequelize, DataTypes);
    const data = transformedData.map(renameKeys);
    const ErroredData = [];
    const CorrectData = [];
    for (const item of data) {
      await User_Tbl.create({
        ...item,
        Module_Code: 10,
      });
      CorrectData.push({
        ...item,
      });
    }
    res.status(200).send({
      ErroredData: [],
      CorrectData: CorrectData,
      Message: `${CorrectData.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.MessageHistory = async function (req, res) {
  const sequelize = await dbname("DBCON");
  const t = await sequelize.transaction();
  try {
    const DATE_FROM = req.body.DATE_FROM;
    const DATE_TO = req.body.DATE_TO;
    // Remove only specified rights for each employee in empCodeList
    const data = await sequelize.query(
      `select ToFromPhoneNo ,MsgText,SentOrFailTime , MsgStatus,TemplateName,
      DeliveredTime,ReadTime from WhatsAppMessages  where DLR_ID = '${
        req.headers.compcode.split("-")[0]
      }' and MsgStatus not in ('F','E') and cast(SentOrFailTime as date) between '${DATE_FROM}' and '${DATE_TO}'`
    );

    await t.commit();
    res.status(200).send({
      Message: "",
      data: data[0],
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
    res.status(500).send({
      success: false,
      message: "An error occurred while removing rights.",
    });
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};

exports.savedealerrights = async function (req, res) {
  const checkedKeys2 = req.body.checkedKeys2;
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var RightsTbl = _UserRights(sequelize, DataTypes);

  try {
    await sequelize.query(
      `delete from user_rights where module_code=50 and user_code='-1'`
    );
    const rightsData = checkedKeys2
      .filter((right) => right?.length > 4)
      .map((right) => ({
        User_Code: -1,
        Optn_Name: right,
        Module_Code: 50,
      }));
    const a = [...rightsData];
    await RightsTbl.bulkCreate(a, { transaction: t });
    await t.commit();
    let Message = `User Created successfully on User Code`;
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
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

exports.findDealerRights = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    var RightsTbl = _UserRights(sequelize, DataTypes);
    const userRightsData = await RightsTbl.findAll({
      where: {
        User_Code: -1,
        Module_Code: 50,
      },
    });

    const rights = userRightsData.map((item) => item.Optn_Name);
    await sequelize.close();
    res.status(200).send({ success: true, rights });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};
exports.findCompanyRights = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    var RightsTbl = _UserRights(sequelize, DataTypes);
    const userRightsData = await RightsTbl.findAll({
      where: {
        User_Code: -3,
        Module_Code: 10
      },
    });

    const rights = userRightsData.map((item) => item.Optn_Name);
    await sequelize.close();
    res.status(200).send({ success: true, rights });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};

exports.saveCompanyRights = async function (req, res) {
  const checkedKeys2 = req.body.userRights.rights;
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  var RightsTbl = _UserRights(sequelize, DataTypes);

  try {
    console.log(req.body)
    await sequelize.query(`delete from user_rights where module_code=10 and user_code='-3'`)
    const rightsData = checkedKeys2
      .filter(right => right?.length > 4)
      .map((right) => ({
        User_Code: -3,
        Optn_Name: right,
        Module_Code: 10,
      }));
    const a = [
      ...rightsData
    ]
    await RightsTbl.bulkCreate(a, { transaction: t });
    await t.commit();
    let Message = `User Created successfully on User Code`;
    res.status(200).send({
      Message: Message,
    });
  } catch (e) {
    await t.rollback();
    console.log(e);
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


exports.addrelease = async function (req, res) {
  const sequelize = await dbname("DBCON");
  try {
    const { module_name, platform, release_date, description, created_by } = req.body;
    const Insu_Data = _ReleaseNote(sequelize, DataTypes);

    const newReleaseNote = await Insu_Data.create({
      module_name,
      platform,
      release_date,
      description,
      created_by
    });

    res.status(201).send({
      success: true,
      message: 'Release note added successfully!',
      data: newReleaseNote
    });

  } catch (e) {
    console.log(e);
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
exports.updaterelease = async function (req, res) {
  const sequelize = await dbname("DBCON");
  try {
    const { id, module_name, platform, release_date, description, created_by } = req.body;
    const Insu_Data = _ReleaseNote(sequelize, DataTypes);

    const [updated] = await Insu_Data.update(
      {
        module_name,
        platform,
        release_date,
        description,
        created_by
      },
      {
        where: { id } // Find the release note by id
      }
    );

    res.status(200).send({
      success: true,
      message: 'Release note updated successfully!',
    });

  } catch (e) {
    console.log(e);
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
exports.findrelease = async function (req, res) {
  const sequelize = await dbname("DBCON");
  try {
    const result = await sequelize.query(`select id,module_name, platform, release_date, description from  release_notes order by release_date desc`)
    res.status(200).send(result[0]);

  } catch (e) {
    console.log(e);
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

exports.findreleaseforlogin = async function (req, res) {
  const sequelize = await dbname("DBCON");
  try {
    const result = await sequelize.query(`
    SELECT module_name, platform, release_date, description FROM release_notes ORDER BY platform, release_date DESC      `)
    const releaseNotes = { web: [], mobile: [] };
    result[0].forEach(note => {
      const { module_name, platform, release_date, description } = note;
      const noteData = {
        module_name,
        release_date,
        description: description,  // Assuming features are separated by newline
      };

      if (platform === 'web') {
        releaseNotes.web.push(noteData);
      } else if (platform === 'mobile') {
        releaseNotes.mobile.push(noteData);
      }
    });
    res.status(200).send(releaseNotes);

  } catch (e) {
    console.log(e);
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