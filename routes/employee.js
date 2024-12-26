const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const { _Employeemaster, EmployeemasterSchema } = require("../models/Employeemaster");
const { _AssetIssue, assetIssueSchema } = require("../models/AssetIssue");
const { _EmpEdu, empEduSchema } = require("../models/EmpEdu");
const { _EmpExperience, empExperienceSchema, } = require("../models/EmpExperience");
const { _EmpFamily, empFamilySchema } = require("../models/EmpFamily");
const { _EmpItSkill, empItSkillSchema } = require("../models/EmpItSkill");
const { _EmpLang, empLangSchema } = require("../models/EmpLang");
const { _Salarystructure } = require("../models/SalaryStructure");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { _EmpDocs, empDocsValidationSchema } = require("../models/EmpDocs");

const Joi = require("joi");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");

const employeeDataSchema = Joi.object({
  Created_by: Joi.string().max(30).required(),
  EmpMst: EmployeemasterSchema,
  // AssetIssue: Joi.array().items(assetIssueSchema),
  EmpEdu: Joi.array().items(empEduSchema),
  EmpExperience: Joi.array().items(empExperienceSchema),
  EmpFamily: Joi.array().items(empFamilySchema),
  EmpItSkill: Joi.array().items(empItSkillSchema),
  EmpLang: Joi.array().items(empLangSchema),
});

// const salaryStructureMainSchema = Joi.object({
//   Comp_Code: Joi.string().max(50).required(),
//   Created_by: Joi.string().max(30).required(),
//   SalaryStructure: salaryStructureSchema,
// });

function removeNullKeys(obj) {
  const newObj = {};
  for (const key in obj) {
    if (obj[key] !== null) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
exports.insertDatamini = async function (req, res) {
  try {
    console.log(req.headers.compcode, "asdsadsad");
    const employeeData = req.body;
    console.log(employeeData);
    // console.log({ ...employeeData.EmpMst, Created_by: employeeData.Created_by },'asdsadsad');
    // const { error, value } = employeeDataSchema.validate(employeeData1, {
    //   abortEarly: false,
    //   stripUnknown: true,
    // });
    // const employeeData = value;
    // console.log(employeeData);
    // if (error) {
    //   const errorMessage = error.details.map((err) => err.message).join(", ");
    //   console.log(errorMessage);
    //   return res.status(400).send({ success: false, message: errorMessage });
    // } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const Employeemaster = _Employeemaster(sequelize, DataTypes);
    // const AssetIssue = _AssetIssue(sequelize, DataTypes);
    // const EmpEdu = _EmpEdu(sequelize, DataTypes);
    // const EmpExperience = _EmpExperience(sequelize, DataTypes);
    // const EmpFamily = _EmpFamily(sequelize, DataTypes);
    // const EmpItSkill = _EmpItSkill(sequelize, DataTypes);
    // const EmpLang = _EmpLang(sequelize, DataTypes);
    // const SalaryStructure = _SalaryStructure(sequelize, DataTypes);
    // const EmpDocs = _EmpDocs(sequelize, DataTypes);

    try {
      const existempcode = await sequelize.query(
        `select empcode  from employeemaster where empcode = '${employeeData.EmpMst.EMPCODE}'`
      );
      const asnd = existempcode[0][0]?.empcode;
      if (asnd) {
        res.status(500).send({
          success: false,
          Message: "Employee already exist",
        });
      }

      const srno = await sequelize.query(
        `select isnull(max(srno)+1,1) as srno from employeemaster`
      );
      employeeData.EmpMst.SRNO = srno[0][0]?.srno;
      let maindata = removeNullKeys({ ...employeeData.EmpMst });

      console.log(maindata, "maindataaaasss");
      const data =
        await sequelize.query(`INSERT INTO [dbo].[EMPLOYEEMASTER] ([SRNO],[EMPCODE],[MSPIN],[EMPFIRSTNAME],[EMPLASTNAME],[CORPORATEMAILID],[LOCATION],[EMPLOYEEDESIGNATION],[Export_Type],[ServerId],[MOBILE_NO],[Reporting_1],[Reporting_2],[Reporting_3])
        values
        (
          ${maindata.SRNO ? `'${maindata.SRNO}'` : null},
          ${maindata.EMPCODE ? `'${maindata.EMPCODE}'` : null},
          ${maindata.MSPIN ? `'${maindata.MSPIN}'` : null},
          ${maindata.EMPFIRSTNAME ? `'${maindata.EMPFIRSTNAME}'` : null},
          ${maindata.EMPLASTNAME ? `'${maindata.EMPLASTNAME}'` : null},
          ${maindata.CORPORATEMAILID ? `'${maindata.CORPORATEMAILID}'` : null},
          ${maindata.LOCATION ? `'${maindata.LOCATION}'` : null},
          ${maindata.EMPLOYEEDESIGNATION
            ? `'${maindata.EMPLOYEEDESIGNATION}'`
            : null
          },
          ${maindata.Export_Type ? `'${maindata.Export_Type}'` : null},
          ${maindata.ServerId ? `'${maindata.ServerId}'` : null},
          ${maindata.MOBILE_NO ? `'${maindata.MOBILE_NO}'` : null},
          ${maindata.Reporting_1 ? `'${maindata.Reporting_1}'` : null},
          ${maindata.Reporting_2 ? `'${maindata.Reporting_2}'` : null},
          ${maindata.Reporting_3 ? `'${maindata.Reporting_3}'` : null}
        )`);
      // const EmpMst1 = await Employeemaster.create(
      //   maindata,
      //   { transaction: t }
      // );

      // const SRNO = EmpMst1.SRNO;
      // const EMP_DOCS_data = await uploadImages(
      //   req.files,
      //   employeeData1.Comp_Code,
      //   employeeData1.EmpMst.EMPCODE,
      //   Created_by,
      //   SRNO
      // );

      // if (employeeData.EmpDtl && Object.keys(employeeData.EmpDtl).length > 0)
      //     await EmpDtl.create({
      //         SRNO, Created_by,
      //         ...employeeData.EmpDtl
      //     }, { transaction: t });
      // if (employeeData.EmpRights && Object.keys(employeeData.EmpRights).length > 0)
      //     await EmpRights.create({
      //         SRNO, Created_by,
      //         ...employeeData.EmpRights
      //     }, { transaction: t });
      // if (employeeData.AssetIssue && employeeData.AssetIssue.length > 0) {
      //   await AssetIssue.bulkCreate(
      //     employeeData.AssetIssue.map((assetIssue) => ({
      //       SRNO,
      //       Created_by,
      //       Emp_Code: EmpMst1.EMPCODE,
      //       ...assetIssue,
      //     })),
      //     { transaction: t }
      //   );
      // }
      // for (const data of EMP_DOCS_data) {
      //   console.log(data);
      //   const [record, created] = await EmpDocs.findOrCreate({
      //     where: {
      //       SRNO: data.SRNO,
      //       misspunch_inout: data.misspunch_inout,
      //     },
      //     defaults: data,
      //     transaction: t,
      //   });

      //   if (!created) {
      //     await record.update(
      //       { DOC_PATH: data.DOC_PATH },
      //       { transaction: t }
      //     );
      //   }
      // }
      // // Create EmpEdu if data exists
      // if (employeeData.EmpEdu && employeeData.EmpEdu.length > 0) {
      //   await EmpEdu.bulkCreate(
      //     employeeData.EmpEdu.map((empEdu) => ({
      //       SRNO,
      //       Created_by,
      //       ...empEdu,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Create EmpExperience if data exists
      // if (
      //   employeeData.EmpExperience &&
      //   employeeData.EmpExperience.length > 0
      // ) {
      //   await EmpExperience.bulkCreate(
      //     employeeData.EmpExperience.map((empExperience) => ({
      //       SRNO,
      //       Created_by,
      //       ...empExperience,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Create EmpFamily if data exists
      // if (employeeData.EmpFamily && employeeData.EmpFamily.length > 0) {
      //   await EmpFamily.bulkCreate(
      //     employeeData.EmpFamily.map((empFamily) => ({
      //       SRNO,
      //       Created_by,
      //       ...empFamily,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Create EmpItSkill if data exists
      // if (employeeData.EmpItSkill && employeeData.EmpItSkill.length > 0) {
      //   await EmpItSkill.bulkCreate(
      //     employeeData.EmpItSkill.map((empItSkill) => ({
      //       SRNO,
      //       Created_by,
      //       ...empItSkill,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Create EmpLang if data exists
      // if (employeeData.EmpLang && employeeData.EmpLang.length > 0) {
      //   await EmpLang.bulkCreate(
      //     employeeData.EmpLang.map((empLang) => ({
      //       SRNO,
      //       Created_by,
      //       ...empLang,
      //     })),
      //     { transaction: t }
      //   );
      // }
      // await SalaryStructure.create(
      //   {
      //     SRNO,
      //     Created_by,
      //     Emp_Code: EmpMst1.EMPCODE,
      //     ServerId: 1,
      //   },
      //   { transaction: t }
      // );
      await t.commit();
      res.status(200).send({ success: true, Message: "Date saved" });
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
      // Close the database connection
      console.log("Connection has been closed.");
    }
    // }
  } catch (error) {
    console.log(error);
  }
};
// fs.readFile(`./tmp/uploads/${file.originalname}`, async (err, buffer) => {
//     if (err) {
//         console.error('Error reading file:', err);
//         return;
//     }
//     const formData = new FormData();
//     formData.append('photo', buffer, file.originalname);
//     formData.append('customPath', customPath);
//     try {
//         const response = await axios.post('http://cloud.autovyn.com:3000/upload-photo', formData, {
//             headers: formData.getHeaders(),
//         });
//         await unlinkAsync(`./tmp/uploads/${file.originalname}`);
//         console.log(`Image ${i} uploaded successfully`);
//     } catch (error) {
//         console.error(`Error uploading image ${i}:`, error.message);
//     }
// });
const FormData = require("form-data");
const axios = require("axios");
async function uploadImages(files, Comp_Code, Emp_Code, Created_by, SRNO) {
  let dataArray = [];

  const imageTypes = {
    profile: 1,
    adhar: 2,
    pan: 3,
    salary: 4,
    other: 5,
  };

  for (const [fileKey, misspunch_inout] of Object.entries(imageTypes)) {
    if (files[fileKey]) {
      const file = files[fileKey][0];
      const customPath = `${Comp_Code}/${Emp_Code}/`;
      const formData = new FormData();
      formData.append("photo", file.buffer, file.originalname);
      formData.append("customPath", customPath);

      try {
        const response = await axios.post(
          "http://cloud.autovyn.com:3000/upload-photo",
          formData
        );
        console.log(`${fileKey} image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading ${fileKey} image:`, error.message);
        continue; // Continue to the next file even if one fails
      }

      const data = {
        EMP_CODE: Emp_Code,
        DOC_NAME: file.originalname,
        misspunch_inout: misspunch_inout,
        columndoc_type: "EMPLOYEE",
        DOC_PATH: `${customPath}${file.originalname}`,
      };

      dataArray.push(data);
    }
  }

  return dataArray;
}
exports.updateDatamini = async function (req, res) {
  try {
    console.log(req.body, "alkdsjklasdjlk");
    const employeeData1 = req.body;
    const SRNO = req.params.id;

    console.log(SRNO);
    const { error, value } = employeeDataSchema.validate(employeeData1, {
      abortEarly: false,
      stripUnknown: true,
    });
    console.log(error);
    const employeeData = value;
    const Created_by = employeeData1.Created_by;
    // if (error) {
    //   const errorMessage = error.details.map((err) => err.message).join(", ");
    //   // return res.status(400).send({ success: false, message: errorMessage });
    // } else {
    // const EMP_DOCS_data = await uploadImages(
    //   req.files,
    //   employeeData1.Comp_Code,
    //   employeeData1.EmpMst.EMPCODE,
    //   Created_by,
    //   SRNO
    // );
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const EmpMst = _Employeemaster(sequelize, DataTypes);
    // const AssetIssue = _AssetIssue(sequelize, DataTypes);
    // const EmpEdu = _EmpEdu(sequelize, DataTypes);
    // const EmpExperience = _EmpExperience(sequelize, DataTypes);
    // const EmpFamily = _EmpFamily(sequelize, DataTypes);
    // const EmpItSkill = _EmpItSkill(sequelize, DataTypes);
    // const EmpLang = _EmpLang(sequelize, DataTypes);
    // const EmpDocs = _EmpDocs(sequelize, DataTypes);
    // const HistoryMaster = _HistoryMaster(sequelize, DataTypes);
    try {
      if (!SRNO)
        return res.status(200).send({
          success: false,
          message: "SRNO code is mandatory",
        });
      let EmpMst1;
      if (employeeData.EmpMst) {
        EmpMst1 = await EmpMst.update(
          { ...employeeData.EmpMst, Created_by },
          { where: { SRNO } },
          { transaction: t }
        );
      }

      // for (const data of EMP_DOCS_data) {
      //   const [record, created] = await EmpDocs.findOrCreate({
      //     where: {
      //       SRNO: data.SRNO,
      //       misspunch_inout: data.misspunch_inout,
      //     },
      //     defaults: data,
      //     transaction: t,
      //   });

      //   if (!created) {
      //     await record.update(
      //       { DOC_PATH: data.DOC_PATH },
      //       { transaction: t }
      //     );
      //   }
      // }

      // if (employeeData.AssetIssue && employeeData.AssetIssue.length > 0) {
      //   await AssetIssue.destroy({ where: { SRNO }, transaction: t });
      //   await AssetIssue.bulkCreate(
      //     employeeData.AssetIssue.map((issue) => ({
      //       ...issue,
      //       SRNO,
      //       Created_by,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Update EmpEdu
      // if (employeeData.EmpEdu && employeeData.EmpEdu.length > 0) {
      //   await EmpEdu.destroy({ where: { SRNO }, transaction: t });
      //   await EmpEdu.bulkCreate(
      //     employeeData.EmpEdu.map((edu) => ({ ...edu, SRNO, Created_by })),
      //     { transaction: t }
      //   );
      // }

      // // Update EmpExperience
      // if (
      //   employeeData.EmpExperience &&
      //   employeeData.EmpExperience.length > 0
      // ) {
      //   await EmpExperience.destroy({ where: { SRNO }, transaction: t });
      //   await EmpExperience.bulkCreate(
      //     employeeData.EmpExperience.map((exp) => ({
      //       ...exp,
      //       SRNO,
      //       Created_by,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Update EmpFamily
      // if (employeeData.EmpFamily && employeeData.EmpFamily.length > 0) {
      //   await EmpFamily.destroy({ where: { SRNO }, transaction: t });
      //   await EmpFamily.bulkCreate(
      //     employeeData.EmpFamily.map((family) => ({
      //       ...family,
      //       SRNO,
      //       Created_by,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Update EmpItSkill
      // if (employeeData.EmpItSkill && employeeData.EmpItSkill.length > 0) {
      //   await EmpItSkill.destroy({ where: { SRNO }, transaction: t });
      //   await EmpItSkill.bulkCreate(
      //     employeeData.EmpItSkill.map((skill) => ({
      //       ...skill,
      //       SRNO,
      //       Created_by,
      //     })),
      //     { transaction: t }
      //   );
      // }

      // // Update EmpLang
      // if (employeeData.EmpLang && employeeData.EmpLang.length > 0) {
      //   await EmpLang.destroy({ where: { SRNO }, transaction: t });
      //   await EmpLang.bulkCreate(
      //     employeeData.EmpLang.map((lang) => ({ ...lang, SRNO, Created_by })),
      //     { transaction: t }
      //   );
      // }
      // var HistoryMaster = {

      // }
      // await HistoryMaster.create({
      //     SRNO, Created_by,
      //     ...employeeData.EmpDtl
      // }, { transaction: t });
      await t.commit();
      //     const result = await sequelize.query(`EXEC InsertIntoHistory_Master
      // @Table_Name = 'YourTableName',
      // @Modified_By = 'User123',
      // @Export_type = 1,
      // @Loc_Code = 123,
      // @Primary_Col_Name = 'ColumnName',
      // @Primary_Col_ID = '123456',
      // @Acnt_Type = 'TypeABC'`);
      res.status(200).send({ success: true, Message: "Date Updated" });
    } catch (error) {
      console.log(error);
      await t.rollback();
      res.status(400).send({
        success: false,
        message: "An error occurred while creating user.",
        error,
      });
    } finally {
      // Close the database connection

      await sequelize.close();
      console.log("Connection has been closed.");
    }
    // }
  } catch (e) {
    console.log(e);
    return res.status(400).send({ success: false, message: "errorMessage" });
  }
};


exports.findAll = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EmpMst = _Employeemaster(sequelize, DataTypes);
    // const data = await EmpMst.findAll({
    //   attributes: [
    //     ["EMPCODE", "value"],
    //     [
    //       sequelize.literal("EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME "),
    //       "label",
    //     ],
    //   ],
    // });
    const data = await sequelize.query(`SELECT [EMPCODE] AS [value], concat(EMPCODE ,' ' , EMPFIRSTNAME , ' ' , EMPLASTNAME ) AS [label] FROM [dbo].[EMPLOYEEMASTER] AS [Employeemaster] where  export_type < 3`);

    const Location = await sequelize.query(`SELECT 
    CAST(Misc_Code AS VARCHAR) AS value, 
    Misc_Name AS label  
    FROM 
        Misc_Mst 
    WHERE 
        misc_type = 85 
        AND export_type < 3;
    `)
    if (!data) {
      return res.status(500).send({ success: false, message: "No data found" });
    }

    return res.status(200).send({ success: true, data: data[0], Location: Location[0] });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
    console.log("connection closed");
  }
};

exports.findOnemini = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const EmpMst1 = _Employeemaster(sequelize, DataTypes);
    // const AssetIssue1 = _AssetIssue(sequelize, DataTypes);
    // const EmpEdu1 = _EmpEdu(sequelize, DataTypes);
    // const EmpExperience1 = _EmpExperience(sequelize, DataTypes);
    // const EmpFamily1 = _EmpFamily(sequelize, DataTypes);
    // const EmpItSkill1 = _EmpItSkill(sequelize, DataTypes);
    // const EmpLang1 = _EmpLang(sequelize, DataTypes);
    // const SalaryStructure1 = _SalaryStructure(sequelize, DataTypes);
    // const EmpDocs1 = _EmpDocs(sequelize, DataTypes);

    const SRNO = req.params.id;
    const EmpMst = await sequelize.query(
      `select * from employeemaster where srno = ${SRNO} and export_type < 3`
    );
    // const AssetIssue = await AssetIssue1.findAll({ where: { SRNO } });
    // const EmpEdu = await EmpEdu1.findAll({ where: { SRNO } });
    // const EmpExperience = await EmpExperience1.findAll({ where: { SRNO } });
    // const EmpFamily = await EmpFamily1.findAll({ where: { SRNO } });
    // const EmpItSkill = await EmpItSkill1.findAll({ where: { SRNO } });
    // const EmpLang = await EmpLang1.findAll({ where: { SRNO } });
    // const SalaryStructure = await SalaryStructure1.findAll({ where: { SRNO } });
    // const EmpDocs = await EmpDocs1.findAll({
    //   where: { SRNO },
    //   attributes: ["DOC_PATH", "misspunch_inout"], // Specify the attributes you want to include
    //   order: [["misspunch_inout", "ASC"]], // Order by mispunch_inout in ascending order
    // });
    // const docPaths = [];
    // for (let i = 0; i < 7; i++) {
    //   const matchingDoc = EmpDocs.find((doc) => doc.misspunch_inout === i);
    //   if (matchingDoc) {
    //     docPaths.push(
    //       `https://erp.autovyn.com/backend/fetch?filePath=${matchingDoc.DOC_PATH}`
    //     );
    //   } else {
    //     docPaths.push(null);
    //   }
    // }
    // console.log(docPaths);
    if (!EmpMst[0]) {
      return res
        .status(404)
        .send({ success: false, message: "Employee not found" });
    }
    let data = {
      EmpMst: EmpMst[0][0],
      // AssetIssue,
      // EmpEdu,
      // EmpExperience,
      // EmpFamily,
      // EmpItSkill,
      // EmpLang,
      // SalaryStructure,
      // ImgSourseArray1: docPaths,
      // imageSrc1: docPaths.shift(),
    };

    res.status(200).send({ success: true, data });
    await sequelize.close();
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .send({ success: false, message: "Employee not found", error });
  }
};
exports.findMasters = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MiscMst = _MiscMst(sequelize, DataTypes);
    const Sal_Region = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 91 },
    });

    const SECTION = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 81 },
    });

    const DIVISION = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 68 },
    });

    const LOCATION = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 85 },
    });

    const EMP_SHIFT = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        [
          sequelize.literal(
            "misc_name +' - ' + misc_add1 + ' - ' + misc_add2 "
          ),
          "label",
        ],
      ],
      where: { misc_type: 90 },
    });
    const EMPLOYEEDESIGNATION = await MiscMst.findAll({
      attributes: [
        ["Misc_Name", "value"],
        ["Misc_Name", "label"],
      ],
      where: { misc_type: 95 },
    });
    const ASSETS = await MiscMst.findAll({
      attributes: [
        ["Misc_Code", "value"],
        ["Misc_Name", "label"],
      ],
      where: { misc_type: 602 },
    });

    const CITY = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 1 },
    });

    const STATE = await MiscMst.findAll({
      attributes: [
        [Sequelize.cast(Sequelize.col("misc_code"), "VARCHAR"), "value"], // Cast misc_code to INTEGER
        ["misc_name", "label"],
      ],
      where: { misc_type: 3 },
    });
    const CLUSTERS = await sequelize.query(`select cast(misc_Code as varchar) as value , misc_name as label,Misc_Type from misc_mst where export_type < 3 and misc_type in (625,626,627,628)`)
    let data = {
      Sal_Region,
      SECTION,
      DIVISION,
      LOCATION,
      EMP_SHIFT,
      EMPLOYEEDESIGNATION,
      ASSETS,
      CITY,
      STATE, CLUSTERS
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();

    console.log(err);
  }
};
// exports.updateSalary = async function (req, res) {
//   const SRNO = req.params.id;
//   if (!SRNO)
//     return res
//       .status(500)
//       .send({ success: false, message: "SRNO code is mandatory" });

//   const salaryData1 = req.body;

//   const { error, value } = salaryStructureMainSchema.validate(salaryData1, {
//     abortEarly: false,
//     stripUnknown: true,
//   });
//   const salaryData = value;
//   console.log(salaryData);
//   if (error) {
//     const errorMessage = error.details.map((err) => err.message).join(", ");
//     return res.status(400).send({ success: false, message: errorMessage });
//   } else {
//     const sequelize = await dbname(req.headers.compcode);
//     const t = await sequelize.transaction();
//     try {
//       const SalaryStructure = _SalaryStructure(sequelize, DataTypes);
//       await SalaryStructure.update(
//         {
//           ...salaryData.SalaryStructure,
//           Created_by: salaryData.Created_by,
//         },
//         { where: { SRNO } },
//         { transaction: t }
//       );
//       await t.commit();
//       res.status(200).send({ success: true, message: "salary updated" });
//     } catch (error) {
//       await t.rollback();
//       await sequelize.close();
//       res.status(500).send({
//         success: false,
//         message: "An error occurred while updating salary",
//         error,
//       });
//     } finally {
//       await sequelize.close();
//     }
//   }
// };
exports.SmEmplMasters = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MiscMst = _MiscMst(sequelize, DataTypes);
    const EmpMst = _Employeemaster(sequelize, DataTypes);

    const EMPL = await sequelize.query(
      `select concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) as label, empcode as value from employeemaster where location in (${req.body.multi_loc12})`
    );
    const LOCATION = await sequelize.query(
      `select misc_name as label, misc_code as value from misc_mst where misc_type = 85`
    );
    const EMPLOYEEDESIGNATION = await sequelize.query(
      `select misc_name as label, misc_name as value from misc_mst where misc_type = 95`
    );
    let data = {
      EMPL: EMPL[0],
      LOCATION: LOCATION[0],
      EMPLOYEEDESIGNATION: EMPLOYEEDESIGNATION[0],
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();

    console.log(err);
  }
};
exports.SmEmplData = async function (req, res) {
  console.log("gffdsax");
  const sequelize = await dbname(req.headers.compcode);
  try {
    // const EmpMst = _Employeemaster(sequelize, DataTypes);
    // const MiscMst = _MiscMst(sequelize, DataTypes);

    // EmpMst.belongsTo(MiscMst, {
    //   foreignKey: "EMPLOYEEDESIGNATION",
    //   targetKey: "Misc_Code",
    //   as: "Designation",
    // });
    // EmpMst.belongsTo(MiscMst, {
    //   foreignKey: "LOCATION",
    //   targetKey: "Misc_Code",
    //   as: "Location",
    // });

    // const EMP_DATA_SM = await EmpMst.findAll({
    //   attributes: [
    //     "SRNO",
    //     "EMPCODE",
    //     "EMPFIRSTNAME",
    //     "EMPLASTNAME",
    //     "GENDER",
    //     "MOBILE_NO",
    //     "DOB",
    //     "EMPLOYEEDESIGNATION",
    //   ],
    //   include: [
    //     {
    //       model: MiscMst,
    //       attributes: [["Misc_Name", "Designation"]],
    //       where: { MISC_TYPE: 95 },
    //       as: "Designation",
    //     },
    //     {
    //       model: MiscMst,
    //       attributes: [["Misc_Name", "Location"]],
    //       where: { MISC_TYPE: 85 },
    //       as: "Location",
    //     },
    //   ],
    // });
    console.log(req.body, "asdjkldjkljsad");
    const data = await sequelize.query(`
    select SRNO,
    EMPCODE,
    EMPFIRSTNAME,
    EMPLASTNAME,
    GENDER,
    MOBILE_NO,
    DOB,
    (select top 1 misc_name  from misc_mst where misc_type = 95) as EMPLOYEEDESIGNATION,
    (select top 1 misc_name  from misc_mst where misc_type = 85) as LOCATION
      from EMPLOYEEMASTER where location in (${req.body.multi_loc12})`);

    await sequelize.close();
    res.status(200).send({ success: true, data: data[0] });
  } catch (err) {
    await sequelize.close();
    console.log(err);
    res.status(500).send({ success: false, error: err.message });
  }
};
exports.excelimportmini = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Employeemaster = _Employeemaster(sequelize, DataTypes);

    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    if (!data?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    function adjustToIST(dateStr) {
      const date = new Date(dateStr);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 31);
      const ISTDateStr = date.toISOString();
      return ISTDateStr.slice(0, 10);
    }
    // cheking duplicate employeeCode
    const empCodesdata = data.map((obj) => `'${obj.EmpCode}'`);
    const MOBILE_NOdata = data.map((obj) => `'${obj.MOBILE_NO}'`);
    const empcode = await sequelize.query(
      `select distinct(empcode) from employeemaster where empcode in (${empCodesdata.length ? empCodesdata : `''`
      })`
    );
    const MOBILE_NO = await sequelize.query(
      `select distinct(MOBILE_NO),EMpCODE from employeemaster where MOBILE_NO in (${MOBILE_NOdata.length ? MOBILE_NOdata : `''`
      })`
    );
    const location = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 85`
    );
    const designation = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 95`
    );
    const section = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 81`
    );
    const divison = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 68`
    );
    const emp_shift = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 90`
    );
    const MaxxSRNo = await sequelize.query(
      `select isnull(max(srno)+1,1) as srno from employeemaster`
    );
    console.log(MaxxSRNo[0][0]?.srno);
    let abcd = MaxxSRNo[0][0]?.srno;
    function validatePhoneNumber(phoneNumber) {
      const regex = /^[0-9]{10}$/;
      return regex.test(phoneNumber);
    }
    const ErroredData = [];
    const CorrectData = [];

    data.map((obj) => {
      let oldObj = { ...obj };
      obj.PAY_CODE = obj.Punch_code;
      obj.EMPCODE = obj.EmpCode?.toString();
      obj.EMPFIRSTNAME = obj.EmpName;
      obj.Export_Type = 1;
      obj.ServerId = 1;
      const rejectionReasons = [];

      if (
        empcode[0].some(
          (item) => item.empcode?.toString() == obj.EmpCode?.toString()
        )
      ) {
        rejectionReasons.push(`Duplicate Employee Code ${obj.EmpCode}`, " | ");
      }


      if (
        MOBILE_NO[0].some((item) => item.MOBILE_NO == obj.MOBILE_NO?.toString())
      ) {
        rejectionReasons.push(
          `MOBILE_NO Already Exist on EMPLOYEE CODE ${obj.EmpCode}`,
          " | "
        );
      }
      // Check for duplicate EmpCode
      const duplicateEmpCodes = data.filter(
        (item) => item.EmpCode?.toString() === obj.EmpCode?.toString()
      );
      if (duplicateEmpCodes?.length >= 2 && obj.EmpCode) {
        rejectionReasons.push(
          `Duplicate Employee Code  (${obj.EmpCode}) found ${duplicateEmpCodes.length} times in this Excel`,
          " | "
        );
      }
      // Check for duplicate MOBILE_NO
      const duplicateMobileNos = data.filter(
        (item) => item.MOBILE_NO?.toString() === obj.MOBILE_NO?.toString()
      );
      if (duplicateMobileNos?.length >= 2 && obj.MOBILE_NO) {
        rejectionReasons.push(
          `Duplicate MOBILE_NO (${obj.MOBILE_NO}) found ${duplicateMobileNos.length} times in this Excel`,
          " | "
        );
      }




      if (!obj.GENDER) {
        rejectionReasons.push("Gender Mandatory", " | ");
      } else if (
        obj.GENDER?.toUpperCase() == "MALE" ||
        obj.GENDER?.toUpperCase() == "FEMALE"
      ) {
      } else {
        rejectionReasons.push("Invalid Gender", " | ");
      }

      if (!obj.MOBILE_NO) {
        rejectionReasons.push("Phone Mandatory", " | ");
      } else if (!validatePhoneNumber(obj.MOBILE_NO)) {
        rejectionReasons.push("Invalid Phone Number", " | ");
      }
      if (!obj.LOCATION) {
        rejectionReasons.push("Location Mandatory", " | ");
      } else {
        const locationObject = location[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.LOCATION?.toString().toUpperCase()
        );
        if (locationObject) {
          obj.LOCATION = locationObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid Location name", " | ");
        }
      }
      if (!obj.EMPLOYEEDESIGNATION) {
        rejectionReasons.push("EMPLOYEEDESIGNATION Mandatory", " | ");
      } else {
        const designationObject = designation[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.EMPLOYEEDESIGNATION?.toString().toUpperCase()
        );
        if (designationObject) {
          obj.EMPLOYEEDESIGNATION = designationObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid EMPLOYEEDESIGNATION name", " | ");
        }
      }
      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons?.slice(0, -1),
        });
      } else {
        obj.SRNO = abcd++;
        CorrectData.push(obj);
      }
    });
    console.log(CorrectData, "CorrectData");
    // console.log(ErroredData, "ErroredData");
    const EmpMst1 = await Employeemaster.bulkCreate(CorrectData, {
      transaction: t,
    });
    console.log(EmpMst1.length);
    t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErroredData,
      Message: `${EmpMst1.length} Records Inserted`,
    });
    // res.status(200).send("imported Successfully");
  } catch (error) {
    // t.rollback();
    // console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};
exports.excelimport = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Employeemaster = _Employeemaster(sequelize, DataTypes);

    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    if (!data?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const paymentModes = [
      "BANK TRANSFER",
      "CHEQUE",
      "CASH",
      "NEFT",
      "OTHER",
      "SALARY HOLD",
    ]; // Available payment modes
    const WeeklyOff = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };
    const relCode = {
      HINDU: 1,
      MUSLIMS: 2,
      SIKH: 3,
      CHRISTIAN: 4,
      JAIN: 5,
      BUDDHA: 6,
      PERSIANS: 7,
    };

    // cheking duplicate employeeCode
    const empCodesdata = data.map((obj) => `'${obj.EmpCode}'`);
    const AAdharNOdata = data.map((obj) => `'${obj.AADHAR_CARD}'`);
    const BANKACCOUNTNOdata = data.map((obj) => `'${obj.BANKACCOUNTNO}'`);
    const MOBILE_NOdata = data.map((obj) => `'${obj.MOBILE_NO}'`);
    const empcode = await sequelize.query(
      `select distinct(empcode) from employeemaster where empcode in (${empCodesdata.length ? empCodesdata : `''`
      })`
    );
    const ADHARNO = await sequelize.query(
      `select distinct(ADHARNO),EMpCODE from employeemaster where ADHARNO in (${AAdharNOdata.length ? AAdharNOdata : `''`
      })`
    );
    const BANKACCOUNTNO = await sequelize.query(
      `select distinct(BANKACCOUNTNO),EMpCODE from employeemaster where BANKACCOUNTNO in (${BANKACCOUNTNOdata.length ? BANKACCOUNTNOdata : `''`
      })`
    );
    const MOBILE_NO = await sequelize.query(
      `select distinct(MOBILE_NO),EMpCODE from employeemaster where MOBILE_NO in (${MOBILE_NOdata.length ? MOBILE_NOdata : `''`
      })`
    );
    const location = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 85`
    );
    const designation = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 95`
    );
    const section = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 81`
    );
    const divison = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 68`
    );
    const emp_shift = await sequelize.query(
      `select misc_code,Misc_Name from misc_mst where misc_type = 90`
    );
    const MaxxSRNo = await sequelize.query(
      `select isnull(max(srno)+1,1) as srno from employeemaster`
    );
    console.log(MaxxSRNo[0][0]?.srno);
    let abcd = MaxxSRNo[0][0]?.srno;
    function validatePhoneNumber(phoneNumber) {
      const regex = /^[0-9]{10}$/;
      return regex.test(phoneNumber);
    }
    function validatePaymentMode(paymentMode) {
      return paymentModes.includes(paymentMode?.toString().toUpperCase());
    }
    function validateWeekLyOff(weekOff) {
      return WeeklyOff[weekOff];
    }
    function validaterelCode(weekOff) {
      return relCode[weekOff];
    }
    function validatePAN(panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      return panRegex.test(panNumber?.toUpperCase());
    }
    function validateIFSC(ifsc) {
      var regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      return regex.test(ifsc);
    }
    function validateAadhaar(aadhaarNumber) {
      const aadhaarRegex = /^\d{12}$/;
      return aadhaarRegex.test(aadhaarNumber);
    }
    function isValidDate(dateStr) {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }
    function adjustToIST(dateStr) {
      const date = new Date(dateStr);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 31);
      const ISTDateStr = date.toISOString();
      return ISTDateStr.slice(0, 10);
    }
    const ErroredData = [];
    const CorrectData = [];
    data.map((obj) => {
      let oldObj = { ...obj };
      obj.PAY_CODE = obj.Punch_code;
      obj.EMPCODE = obj.EmpCode?.toString();
      obj.EMPFIRSTNAME = obj.EmpName;
      obj.ADHARNO = obj.AADHAR_CARD;
      obj.Export_Type = 1;
      obj.ServerId = 1;
      const rejectionReasons = [];

      if (
        empcode[0].some(
          (item) => item.empcode?.toString() == obj.EmpCode?.toString()
        )
      ) {
        rejectionReasons.push(`Duplicate Employee Code ${obj.EmpCode}`, " | ");
      }
      if (
        ADHARNO[0].some(
          (item) => item.ADHARNO?.toString() == obj.AADHAR_CARD?.toString()
        )
      ) {
        rejectionReasons.push(
          `AADHAR_CARD Already Exist on EMPLOYEE CODE ${obj.EmpCode}`,
          " | "
        );
      }
      if (
        BANKACCOUNTNO[0].some(
          (item) => item.BANKACCOUNTNO == obj.BANKACCOUNTNO?.toString()
        )
      ) {
        rejectionReasons.push(
          `BANKACCOUNTNO Already Exist on EMPLOYEE CODE ${obj.EmpCode}`,
          " | "
        );
      }
      if (
        MOBILE_NO[0].some((item) => item.MOBILE_NO == obj.MOBILE_NO?.toString())
      ) {
        rejectionReasons.push(
          `MOBILE_NO Already Exist on EMPLOYEE CODE ${obj.EmpCode}`,
          " | "
        );
      }
      // Check for duplicate EmpCode
      const duplicateEmpCodes = data.filter(
        (item) => item.EmpCode?.toString() === obj.EmpCode?.toString()
      );
      if (duplicateEmpCodes?.length >= 2 && obj.EmpCode) {
        rejectionReasons.push(
          `Duplicate Employee Code  (${obj.EmpCode}) found ${duplicateEmpCodes.length} times in this Excel`,
          " | "
        );
      }
      // Check for duplicate MOBILE_NO
      const duplicateMobileNos = data.filter(
        (item) => item.MOBILE_NO?.toString() === obj.MOBILE_NO?.toString()
      );
      if (duplicateMobileNos?.length >= 2 && obj.MOBILE_NO) {
        rejectionReasons.push(
          `Duplicate MOBILE_NO (${obj.MOBILE_NO}) found ${duplicateMobileNos.length} times in this Excel`,
          " | "
        );
      }

      // Check for duplicate BANKACCOUNTNO
      const duplicateBankAccountNos = data.filter(
        (item) =>
          item.BANKACCOUNTNO?.toString() === obj.BANKACCOUNTNO?.toString()
      );
      if (duplicateBankAccountNos?.length >= 2 && obj.BANKACCOUNTNO) {
        rejectionReasons.push(
          `Duplicate BANKACCOUNTNO (${obj.BANKACCOUNTNO}) found ${duplicateBankAccountNos.length} times in this Excel`,
          " | "
        );
      }

      // Check for duplicate AADHAR_CARD
      const duplicateAadharCards = data.filter(
        (item) => item.AADHAR_CARD?.toString() === obj.AADHAR_CARD?.toString()
      );
      if (duplicateAadharCards?.length >= 2 && obj.AADHAR_CARD) {
        rejectionReasons.push(
          `Duplicate AADHAR_CARD (${obj.AADHAR_CARD}) found ${duplicateAadharCards.length} times in this Excel`,
          " | "
        );
      }

      if (!obj.GENDER) {
        rejectionReasons.push("Gender Mandatory", " | ");
      } else if (
        obj.GENDER?.toUpperCase() == "MALE" ||
        obj.GENDER?.toUpperCase() == "FEMALE"
      ) {
      } else {
        rejectionReasons.push("Invalid Gender", " | ");
      }
      if (!obj.EMPTYPE) {
        rejectionReasons.push("EMPTYPE Mandatory", " | ");
      } else if (
        obj.EMPTYPE?.toUpperCase() == "REGULAR" ||
        obj.EMPTYPE?.toUpperCase() == "CASUAL"
      ) {
        obj.EmpType = obj.EMPTYPE?.toUpperCase() == "REGULAR" ? 1 : 0;
      } else {
        rejectionReasons.push("Invalid EMPTYPE", " | ");
      }
      if (!obj.MOBILE_NO) {
        rejectionReasons.push("Phone Mandatory", " | ");
      } else if (!validatePhoneNumber(obj.MOBILE_NO)) {
        rejectionReasons.push("Invalid Phone Number", " | ");
      }

      if (!obj.DOB || !isValidDate(obj.DOB)) {
        rejectionReasons.push("Invalid DOB", " | ");
      } else {
        obj.DOB = adjustToIST(obj.DOB);
        oldObj.DOB = adjustToIST(oldObj.DOB);
      }

      if (!obj.DATE_OF_JONING || !isValidDate(obj.DATE_OF_JONING)) {
        rejectionReasons.push("Invalid DATE_OF_JONING", " | ");
      } else {
        obj.DATE_OF_JONING = adjustToIST(obj.DATE_OF_JONING);
        oldObj.DATE_OF_JONING = adjustToIST(oldObj.DATE_OF_JONING);
      }
      if (!obj.LOCATION) {
        rejectionReasons.push("Location Mandatory", " | ");
      } else {
        const locationObject = location[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.LOCATION?.toString().toUpperCase()
        );
        if (locationObject) {
          obj.LOCATION = locationObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid Location name", " | ");
        }
      }

      if (!obj.SECTION) {
        rejectionReasons.push("SECTION Mandatory", " | ");
      } else {
        const sectionObject = section[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.SECTION?.toString().toUpperCase()
        );
        if (sectionObject) {
          obj.SECTION = sectionObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid SECTION name", " | ");
        }
      }
      if (!obj.Department) {
        rejectionReasons.push("DEPARTMENT Mandatory", " | ");
      } else {
        const sectionObject = divison[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.Department?.toString().toUpperCase()
        );
        if (sectionObject) {
          obj.DIVISION = sectionObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid DEPARTMENT name", " | ");
        }
      }
      if (!obj.EMPLOYEEDESIGNATION) {
        rejectionReasons.push("EMPLOYEEDESIGNATION Mandatory", " | ");
      } else {
        const designationObject = designation[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.EMPLOYEEDESIGNATION?.toString().toUpperCase()
        );
        if (designationObject) {
          // obj.EMPLOYEEDESIGNATION = designationObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid EMPLOYEEDESIGNATION name", " | ");
        }
      }
      if (!obj.AADHAR_CARD) {
        rejectionReasons.push("AADHAR Number Mandatory", " | ");
      } else if (!validateAadhaar(obj.AADHAR_CARD)) {
        rejectionReasons.push("Invalid AADHAR CARD Number", " | ");
      }

      if (!validatePAN(obj.PANNO) && obj.PANNO) {
        rejectionReasons.push("Invalid PAN Number", " | ");
      }
      if (!obj.PAYMENTMODE) {
        rejectionReasons.push("Payment Mode Mandatory", " | ");
      } else if (!validatePaymentMode(obj.PAYMENTMODE)) {
        rejectionReasons.push("Invalid Payment Mode", " | ");
      }
      if (!obj.WEEKLYOFF) {
        rejectionReasons.push("WEEKLYOFF Mandatory", " | ");
      } else if (validateWeekLyOff(obj.WEEKLYOFF?.toUpperCase()) == undefined) {
        obj.WEEKLYOFF = -1;
        rejectionReasons.push("Invalid WeeklyOFF", " | ");
      } else {
        obj.WEEKLYOFF = WeeklyOff[obj.WEEKLYOFF?.toUpperCase()];
      }
      if (!obj.RELEGION) {
        rejectionReasons.push("RELEGION Mandatory", " | ");
      } else if (validaterelCode(obj.RELEGION?.toUpperCase()) == undefined) {
        rejectionReasons.push("Invalid RELEGION", " | ");
      } else {
        obj.RELCODE = relCode[obj.RELEGION?.toUpperCase()];
      }

      // if (!obj.EMP_SHIFT) {
      //   rejectionReasons.push("EMP_SHIFT Mandatory", " | ");
      // } else {
      //   const emp_shiftObject = emp_shift[0].find(
      //     (item) =>
      //       item.Misc_Name?.toUpperCase() ==
      //       obj.EMP_SHIFT?.toString().toUpperCase()
      //   );
      //   if (emp_shiftObject) {
      //     obj.EMP_SHIFT = emp_shiftObject.misc_code; // Update obj.LOCATION with misc_code
      //   } else {
      //     rejectionReasons.push("Invalid EMP_Shift Code", " | ");
      //   }
      // }
      if (obj.EMP_SHIFT) {
        const emp_shiftObject = emp_shift[0].find(
          (item) =>
            item.Misc_Name?.toUpperCase() ==
            obj.EMP_SHIFT?.toString().toUpperCase()
        );
        if (emp_shiftObject) {
          obj.EMP_SHIFT = emp_shiftObject.misc_code; // Update obj.LOCATION with misc_code
        } else {
          rejectionReasons.push("Invalid EMP_Shift Code", " | ");
        }
      }

      if (!obj["PF Y/N"]) {
        rejectionReasons.push("PF Y/N Mandatory", " | ");
      } else if (obj["PF Y/N"] == "Y" && !obj.pfper) {
        rejectionReasons.push("Pfper is mandatory", " | ");
      } else if (obj["PF Y/N"] == "Y" && !obj.pfnumber) {
        rejectionReasons.push("pfnumber is mandatory", " | ");
      } else {
        obj.PF = obj["PF Y/N"]?.toUpperCase() == "Y" ? 1 : 0;
      }
      if (!obj["ESI Y/N"]) {
        rejectionReasons.push("ESI Y/N Mandatory", " | ");
      } else {
        obj.ESI = obj["ESI Y/N"]?.toUpperCase() == "Y" ? 1 : 0;
      }
      if (!obj["LWF Y/N"]) {
        rejectionReasons.push("LWF Y/N Mandatory", " | ");
      } else {
        obj.LWF = obj["LWF Y/N"]?.toUpperCase() == "Y" ? 1 : 0;
      }
      if (!obj["Professional Tax Y/N"]) {
        rejectionReasons.push("Professional Tax Y/N Mandatory", " | ");
      } else {
        obj.pro_tax = obj["Professional Tax Y/N"]?.toUpperCase() == "Y" ? 1 : 0;
      }
      if (!validateIFSC(obj.ifsc_code) && obj.ifsc_code) {
        rejectionReasons.push("Invalid ifsc_code", " | ");
      }

      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons?.slice(0, -1),
        });
      } else {
        obj.SRNO = abcd++;
        CorrectData.push(obj);
      }
    });
    console.log(CorrectData[0], "CorrectData");
    // console.log(ErroredData, "ErroredData");
    const EmpMst1 = await Employeemaster.bulkCreate(CorrectData, {
      transaction: t,
    });
    console.log(EmpMst1.length);
    t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErroredData,
      Message: `${EmpMst1.length} Records Inserted`,
    });
    // res.status(200).send("imported Successfully");
  } catch (error) {
    // t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};
exports.importformat = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Employee Master Excel Import";
    const Headeres = [
      "EmpCode",
      "Punch_code",
      "EmpName",
      "GENDER",
      "MSPIN",
      "EMPTYPE",
      "MOBILE_NO",
      "DOB",
      "DATE_OF_JONING",
      "LOCATION",
      "SECTION",
      "Department",
      "EMPLOYEEDESIGNATION",
      "AADHAR_CARD",
      "PANNO",
      "PERMANENTADDRESS1",
      "RELEGION",
      "pfper",
      "PF Y/N",
      "pfnumber",
      "ESI Y/N",
      "LWF Y/N",
      "Professional Tax Y/N",
      "PAYMENTMODE",
      "BANK_NAME",
      "BANKACCOUNTNO",
      "ifsc_code",
      "WEEKLYOFF",
      "EMP_SHIFT",
    ];
    const Headeres2 = [
      "GENDER",
      "EMPTYPE",
      "LOCATION",
      "SECTION",
      "Department",
      "EMPLOYEEDESIGNATION",
      "RELEGION",
      "PAYMENTMODE",
      "WEEKLYOFF",
      "EMP_SHIFT",
      "Shfit timing (only for refrence)",
    ];

    const GENDERARRAY = ["MALE", "FEMALE"]; // Available payment modes
    const EMPTYPEARRAY = ["REGULAR", "CASUAL"]; // Available payment modes
    const paymentModes = [
      "BANK TRANSFER",
      "CHEQUE",
      "CASH",
      "NEFT",
      "OTHER",
      "SALARY HOLD",
    ]; // Available payment modes
    const WeeklyOff = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const relCode = [
      "HINDU",
      "MUSLIMS",
      "SIKH",
      "CHRISTIAN",
      "JAIN",
      "BUDDHA",
      "PERSIANS",
    ];

    const location = await sequelize.query(
      `select Misc_Name from misc_mst where misc_type = 85`
    );
    const locationArray = location[0]?.map((obj) => obj.Misc_Name);

    const designation = await sequelize.query(
      `select Misc_Name from misc_mst where misc_type = 95`
    );
    const designationArray = designation[0]?.map((obj) => obj.Misc_Name);

    const section = await sequelize.query(
      `select Misc_Name from misc_mst where misc_type = 81`
    );
    const sectionArray = section[0]?.map((obj) => obj.Misc_Name);

    const divison = await sequelize.query(
      `select Misc_Name from misc_mst where misc_type = 68`
    );
    const divisonArray = divison[0]?.map((obj) => obj.Misc_Name);

    const emp_shift = await sequelize.query(
      `select Misc_Name,concat(misc_name ,' - ' , misc_add1 , ' - ' , misc_add2) as timimg  from misc_mst where misc_type = 90`
    );
    const emp_shiftArray = emp_shift[0]?.map((obj) => obj.Misc_Name);
    const shift_timingArray = emp_shift[0]?.map((obj) => obj.timimg);

    const twoDArray = [
      GENDERARRAY,
      EMPTYPEARRAY,
      locationArray,
      sectionArray,
      divisonArray,
      designationArray,
      relCode,
      paymentModes,
      WeeklyOff,
      emp_shiftArray,
      shift_timingArray,
    ];
    let maxLength = Math.max(...twoDArray.map((arr) => arr.length));

    // Filling shorter arrays with null values to make them equal in length
    twoDArray.forEach((arr) => {
      while (arr.length < maxLength) {
        arr.push(null);
      }
    });

    // Transposing the 2D array to print in columns
    let transposedArray = [];
    for (let i = 0; i < maxLength; i++) {
      transposedArray.push(twoDArray.map((arr) => arr[i]));
    }

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    }; // Center the text
    worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
    worksheet.mergeCells("A2:E2");
    worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
    worksheet.getCell("A2").alignment = {
      vertical: "middle",
      horizontal: "center",
    }; // Center the text
    worksheet.mergeCells("A3:L3");
    let reportName1 =
      "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
    worksheet.getCell("A3").value = `${reportName1}`;
    // Add headers for the data starting from the 3rd row

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
    const headerRow1 = worksheet.addRow(Headeres2);
    headerRow1.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    console.log(transposedArray, "askdaksdjklj");
    // Add MaxxSRNo data

    transposedArray?.forEach((item) => {
      worksheet.addRow(item);
    });
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
exports.importformatmini = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Employee Master Excel Import";
    const Headeres = [
      "EmpCode",
      "Punch_code",
      "EmpName",
      "GENDER",
      "MSPIN",
      "MOBILE_NO",
      "LOCATION",
      "EMPLOYEEDESIGNATION",

    ];
    const Headeres2 = [
      "GENDER",
      "LOCATION",
      "EMPLOYEEDESIGNATION",
    ];

    const GENDERARRAY = ["MALE", "FEMALE"]; // Available payment modes
    // Available payment modes


    const location = await sequelize.query(
      `select Misc_Name from misc_mst where misc_type = 85`
    );
    const locationArray = location[0]?.map((obj) => obj.Misc_Name);

    const designation = await sequelize.query(
      `select Misc_Name from misc_mst where misc_type = 95`
    );
    const designationArray = designation[0]?.map((obj) => obj.Misc_Name);




    const twoDArray = [
      GENDERARRAY,

      locationArray,

      designationArray,

    ];
    let maxLength = Math.max(...twoDArray.map((arr) => arr.length));

    // Filling shorter arrays with null values to make them equal in length
    twoDArray.forEach((arr) => {
      while (arr.length < maxLength) {
        arr.push(null);
      }
    });

    // Transposing the 2D array to print in columns
    let transposedArray = [];
    for (let i = 0; i < maxLength; i++) {
      transposedArray.push(twoDArray.map((arr) => arr[i]));
    }

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    }; // Center the text
    worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
    worksheet.mergeCells("A2:E2");
    worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
    worksheet.getCell("A2").alignment = {
      vertical: "middle",
      horizontal: "center",
    }; // Center the text
    worksheet.mergeCells("A3:L3");
    let reportName1 =
      "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
    worksheet.getCell("A3").value = `${reportName1}`;
    // Add headers for the data starting from the 3rd row

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
    const headerRow1 = worksheet.addRow(Headeres2);
    headerRow1.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    console.log(transposedArray, "askdaksdjklj");
    // Add MaxxSRNo data

    transposedArray?.forEach((item) => {
      worksheet.addRow(item);
    });
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
exports.importformatsalary = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Employee Master Excel Import";
    const Headeres = [
      "EmpCode",
      "GrossSalary",
      "Basic",
      "HRA",
      "Conveyance",
      "Medical",
      "Other",
      "Uniform",
      "Washing",
      "Effective_date"
    ];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    }; // Center the text
    worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
    worksheet.mergeCells("A2:E2");
    worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
    worksheet.getCell("A2").alignment = {
      vertical: "middle",
      horizontal: "center",
    }; // Center the text
    worksheet.mergeCells("A3:L3");
    let reportName1 =
      "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
    worksheet.getCell("A3").value = `${reportName1}`;
    // Add headers for the data starting from the 3rd row

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

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Salary_import_Tamplate.xlsx"'
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
      'attachment; filename="Salary_import_Tamplate.xlsx"'
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
exports.salaryImport = async function (req, res, next) {

  const Created_By = req.body.Created_By;
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Salarystructure = _Salarystructure(sequelize, DataTypes);
    const currentDate = new Date();

    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    if (!data?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const empCodesdata = data.map((obj) => `'${obj.EmpCode}'`);
    const SALARY = await sequelize.query(
      `select top 1 * from SALARYSTRUCTURE where Emp_Code in (${empCodesdata.length ? empCodesdata : `''`}) and export_type = 1 `
    );
    const empcode = await sequelize.query(
      `select distinct(empcode) from employeemaster where empcode in (${empCodesdata.length ? empCodesdata : `''`
      })`
    );
    const dataWithSalaryDetails = data.map((obj) => {
      const salaryDetail = SALARY[0].find((salary) => salary.Emp_Code == obj.EmpCode);
      return salaryDetail ? { ...obj, salaryDetail } : obj;
    });
    console.log(dataWithSalaryDetails, 'askjdjasdhsajk')
    function isValidDate(dateStr) {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }
    function adjustToIST(dateStr) {

      const date = new Date(dateStr);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 31);
      const ISTDateStr = date.toISOString();
      console.log(ISTDateStr.slice(0, 10))
      return ISTDateStr.slice(0, 10);
    }

    function compareDates(date1, date2) {
      const parsedDate1 = new Date(date1);
      const parsedDate2 = new Date(date2);
      if (isNaN(parsedDate2)) {
        return 'Invalid date format';
      }
      if (parsedDate1 < parsedDate2) {
        return 1;
      } else if (parsedDate1 > parsedDate2) {
        return 2;
      } else {
        return 3;
      }
    }
    function validateGrossSalary(obj) {
      const { GrossSalary, Basic, HRA, Conveyance, Medical, Other, Uniform, Washing } = obj;
      const parsedBasic = parseInt(Basic) || 0;
      const parsedHRA = parseInt(HRA) || 0;
      const parsedConveyance = parseInt(Conveyance) || 0;
      const parsedMedical = parseInt(Medical) || 0;
      const parsedOther = parseInt(Other) || 0;
      const parsedUniform = parseInt(Uniform) || 0;
      const parsedWashing = parseInt(Washing) || 0;
      const sum = parsedBasic + parsedHRA + parsedConveyance + parsedMedical + parsedOther + parsedUniform + parsedWashing;
      const parsedGrossSalary = parseInt(GrossSalary) || 0;
      return sum === parsedGrossSalary;
    }
    const ErroredData = [];
    const CorrectData = [];
    const exp3Utdarr = [];
    dataWithSalaryDetails.map((obj) => {
      let oldObj = { ...obj };
      obj.Emp_Code = obj.EmpCode?.toString();
      obj.Export_Type = 1;
      obj.ServerId = 1;
      const rejectionReasons = [];


      if (!obj.Effective_date || !isValidDate(obj.Effective_date)) {
        rejectionReasons.push("Invalid Effective_date", " | ");
      } else {
        obj.Effective_date = adjustToIST(obj.Effective_date);
        oldObj.Effective_date = adjustToIST(oldObj.Effective_date);
      }

      if (!empcode[0].some((item) => item.empcode?.toString() == obj.EmpCode?.toString())) {
        rejectionReasons.push(`Employeemaster not created for ${obj.EmpCode}`, " | ");
      }
      if (!validateGrossSalary(obj)) {
        rejectionReasons.push("Invalid Sum of Gross Salary", " | ");
      }

      if (obj?.salaryDetail?.Effective_date && compareDates(obj.Effective_date, obj?.salaryDetail?.Effective_date) == 1) {
        rejectionReasons.push(`Effective date can not be smaller than ${obj?.salaryDetail.Effective_date}`, " | ");
      }
      const duplicateEmpCodes = data.filter(
        (item) => item.EmpCode?.toString() === obj.EmpCode?.toString()
      );
      if (duplicateEmpCodes?.length >= 2 && obj.EmpCode) {
        rejectionReasons.push(
          `Duplicate Employee Code  (${obj.EmpCode}) found ${duplicateEmpCodes.length} times in this Excel`,
          " | "
        );
      }
      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons?.slice(0, -1),
        });
      } else {
        if (obj?.salaryDetail?.UTD) {
          obj.Mod_User = Created_By;
          obj.MOD_DATE = adjustToIST(currentDate);
          obj.MOD_TIME = currentDate.toLocaleTimeString().slice(0, 5).replace(':', '.');
          exp3Utdarr.push(obj?.salaryDetail?.UTD);
        } else {
          obj.ENTR_USER = Created_By;
          obj.ENTR_DATE = adjustToIST(currentDate);
          obj.ENTR_TIME = currentDate.toLocaleTimeString().slice(0, 5).replace(':', '.');
        }
        obj.Rec_date = adjustToIST(currentDate);
        obj.Gross_Salary = obj.GrossSalary;
        delete obj.salaryDetail;
        CorrectData.push(obj);
      }
    });
    console.log(exp3Utdarr, "CorrectData");
    console.log(CorrectData, "ErroredData");
    if (exp3Utdarr.length) {
      const update = await sequelize.query(`update salarystructure set export_type = 3 where utd in (${exp3Utdarr})`, { transaction: t })
    }
    const Salarys = await Salarystructure.bulkCreate(CorrectData, {
      transaction: t,
    });
    t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErroredData,
      Message: `Records Inserted`,
    });
    // res.status(200).send("imported Successfully");
  } catch (error) {
    // t.rollback();
    console.log("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};
exports.updateData = async function (req, res) {
  try {
    // const BodyData = JSON.parse(req.body.formData);
    const employeeData = JSON.parse(req.body.formData);

    const EmpCode = req.params.id;
    const sequelize = await dbname(req.headers.compcode);
    const a = await sequelize.query(`SELECT SRNO FROM EMPLOYEEMASTER WHERE EMPCODE = '${EmpCode}' AND EXPORT_TYPE <> 33`)
    const SRNO = a[0][0].SRNO
    // const { error, value: employeeData } = employeeDataSchema.validate(BodyData, {
    //   abortEarly: false,
    //   stripUnknown: true,
    // });
    const Created_by = employeeData.Created_by;
    // if (error) {
    //   const errorMessage = error.details.map((err) => err.message).join(", ");
    //   return res.status(400).send({ success: false, message: errorMessage });
    // } else {
      const EMP_DOCS_data = await uploadImages(
        req.files,
        req.headers.compcode,
        employeeData.EmpMst.EMPCODE,
        Created_by,
        SRNO
      );
      const t = await sequelize.transaction();
      const EmpMst = _Employeemaster(sequelize, DataTypes);
      const AssetIssue = _AssetIssue(sequelize, DataTypes);
      const EmpEdu = _EmpEdu(sequelize, DataTypes);
      const EmpExperience = _EmpExperience(sequelize, DataTypes);
      const EmpFamily = _EmpFamily(sequelize, DataTypes);
      const EmpItSkill = _EmpItSkill(sequelize, DataTypes);
      const EmpLang = _EmpLang(sequelize, DataTypes);
      const EmpDocs = _EmpDocs(sequelize, DataTypes);
      try {
        if (!SRNO)
          return res.status(200).send({
            success: false,
            message: "SRNO code is mandatory",
          });
        let EmpMst1;
        if (employeeData.EmpMst) {
          EmpMst1 = await EmpMst.update(
            { ...employeeData.EmpMst, Created_by: employeeData.Created_by },
            { where: { SRNO }, transaction: t }
          );
        }

        for (const data of EMP_DOCS_data) {
          const [record, created] = await EmpDocs.findOrCreate({
            where: {
              EMP_CODE: employeeData.EmpMst.EMPCODE,
              misspunch_inout: data.misspunch_inout,
            },
            defaults: data,
            transaction: t,
          });

          if (!created) {
            await record.update(
              { DOC_PATH: data.DOC_PATH },
              { transaction: t }
            );
          }
        }

        // if (employeeData.AssetIssue && employeeData.AssetIssue.length > 0) {
        //   await AssetIssue.destroy({ where: { SRNO }, transaction: t });
        //   const filteredAssetIssues = employeeData.AssetIssue.filter(
        //     (assetIssue) => assetIssue.Aset_Code && assetIssue.Aset_Name && assetIssue.Asset_Type && assetIssue.Issue_Date
        //   );
        //   if (filteredAssetIssues.length > 0) {
        //     await AssetIssue.bulkCreate(
        //       filteredAssetIssues.map((issue) => ({
        //         ...issue,
        //         SRNO,
        //         Emp_Code: employeeData.EmpMst.EMPCODE,
        //         Created_by,
        //       })),
        //       { transaction: t }
        //     );
        //   }
        // }

        // Update EmpEdu
        if (employeeData.EmpEdu && employeeData.EmpEdu.length > 0) {
          await EmpEdu.destroy({ where: { SRNO }, transaction: t });
          await EmpEdu.bulkCreate(
            employeeData.EmpEdu.map((edu) => ({ ...edu, SRNO, Created_by })),
            { transaction: t }
          );
        }

        // Update EmpExperience
        if (
          employeeData.EmpExperience &&
          employeeData.EmpExperience.length > 0
        ) {
          await EmpExperience.destroy({ where: { SRNO }, transaction: t });
          await EmpExperience.bulkCreate(
            employeeData.EmpExperience.map((exp) => ({
              ...exp,
              SRNO,
              Created_by,
            })),
            { transaction: t }
          );
        }

        // Update EmpFamily
        if (employeeData.EmpFamily && employeeData.EmpFamily.length > 0) {
          await EmpFamily.destroy({ where: { SRNO }, transaction: t });
          await EmpFamily.bulkCreate(
            employeeData.EmpFamily.map((family) => ({
              ...family,
              SRNO,
              Created_by,
            })),
            { transaction: t }
          );
        }

        // Update EmpItSkill
        if (employeeData.EmpItSkill && employeeData.EmpItSkill.length > 0) {
          await EmpItSkill.destroy({ where: { SRNO }, transaction: t });
          await EmpItSkill.bulkCreate(
            employeeData.EmpItSkill.map((skill) => ({
              ...skill,
              SRNO,
              Created_by,
            })),
            { transaction: t }
          );
        }

        // Update EmpLang
        if (employeeData.EmpLang && employeeData.EmpLang.length > 0) {
          await EmpLang.destroy({ where: { SRNO }, transaction: t });
          await EmpLang.bulkCreate(
            employeeData.EmpLang.map((lang) => ({ ...lang, SRNO, Created_by })),
            { transaction: t }
          );
        }

        await t.commit();

        res.status(200).send({ success: true, Message: "Data Updated" });
      } catch (error) {
        console.log(error);
        await t.rollback();
        res.status(400).send({
          success: false,
          message: "An error occurred while creating user.",
          error,
        });
      } finally {
        // Close the database connection
        await sequelize.close();
        console.log("Connection has been closed.");
      }
    // }
  } catch (e) {
    console.log(e);
    return res.status(400).send({ success: false, message: "errorMessage" });
  }
};
exports.findOne = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const EmpMst1 = _Employeemaster(sequelize, DataTypes);
    const AssetIssue1 = _AssetIssue(sequelize, DataTypes);
    const EmpEdu1 = _EmpEdu(sequelize, DataTypes);
    const EmpExperience1 = _EmpExperience(sequelize, DataTypes);
    const EmpFamily1 = _EmpFamily(sequelize, DataTypes);
    const EmpItSkill1 = _EmpItSkill(sequelize, DataTypes);
    const EmpLang1 = _EmpLang(sequelize, DataTypes);
    // const SalaryStructure1 = _SalaryStructure(sequelize, DataTypes);
    const EmpDocs1 = _EmpDocs(sequelize, DataTypes);

    const EMPCODE = req.params.id;
    const EmpMst = await sequelize.query(
      `select * from employeemaster where empcode = :EMPCODE and export_type < 3`,
      { replacements: { EMPCODE } }
    );
    const SRNO = EmpMst[0][0].SRNO
    const AssetIssue = await AssetIssue1.findAll({ where: { SRNO } });
    const EmpEdu = await EmpEdu1.findAll({ where: { SRNO } });
    const EmpExperience = await EmpExperience1.findAll({ where: { SRNO } });
    const EmpFamily = await EmpFamily1.findAll({ where: { SRNO } });
    const EmpItSkill = await EmpItSkill1.findAll({ where: { SRNO } });
    const EmpLang = await EmpLang1.findAll({ where: { SRNO } });
    // const SalaryStructure = await SalaryStructure1.findAll({ where: { SRNO } });
    // const EmpDocs = await EmpDocs1.findAll({
    //   where: { EMP_CODE : EMPCODE },
    //   attributes: ["DOC_PATH", "misspunch_inout"], // Specify the attributes you want to include
    //   order: [["misspunch_inout", "ASC"]], // Order by mispunch_inout in ascending order
    // });
    // const docPaths = [];
    // for (let i = 0; i < 7; i++) {
    //   const matchingDoc = EmpDocs.find((doc) => doc.misspunch_inout === i);
    //   if (matchingDoc) {
    //     docPaths.push(
    //       `https://test.autovyn.com/backend/fetch?filePath=${matchingDoc.DOC_PATH}`
    //     );
    //   } else {
    //     docPaths.push(null);
    //   }
    // }
    const photos = await sequelize.query(
      `SELECT * FROM EMP_DOCS WHERE EMP_CODE= '${EMPCODE}' and columndoc_type='EMPLOYEE'`
    );
    const abcd = ['', 'profile', 'adhar', 'pan', 'salary', 'other'];
    photos[0].map((p) => {
      EmpMst[0][0][abcd[p['misspunch_inout']]] = `https://erp.autovyn.com/backend/fetch?filePath=${p['DOC_PATH']}`;
    })

    if (!EmpMst[0]) {
      return res
        .status(404)
        .send({ success: false, message: "Employee not found" });
    }
    let data = {
      EmpMst: EmpMst[0][0],
      AssetIssue,
      EmpEdu,
      EmpExperience,
      EmpFamily,
      EmpItSkill,
      EmpLang,
      // SalaryStructure,
      // ImgSourseArray1: photos,
      // profile: EmpMst[0][0].profile,
      // adhar: EmpMst[0][0].adhar,
      // pan: EmpMst[0][0].pan,
      // salary: EmpMst[0][0].salary,
      // other: EmpMst[0][0].other,
    };

    res.status(200).send({ success: true, data });
    await sequelize.close();
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .send({ success: false, message: "Employee not found", error });
  }
};


exports.insertData = async function (req, res) {
  console.log(req.body,'ksdjjdj')
  try {
    const employeeData = JSON.parse(req.body.formData);
    // const BodyData = JSON.parse(req.body.formData);
    // const { error, value: employeeData } = employeeDataSchema.validate(BodyData, {
    //   abortEarly: false,
    //   stripUnknown: true,
    // });
    // if (error) {
    //   const errorMessage = error.details.map((err) => err.message).join(", ");
    //   console.log(errorMessage);
    //   return res.status(400).send({ success: false, message: errorMessage });
    // } else {
      const sequelize = await dbname(req.headers.compcode);
      const t = await sequelize.transaction();
      const Employeemaster = _Employeemaster(sequelize, DataTypes);
      const AssetIssue = _AssetIssue(sequelize, DataTypes);
      const EmpEdu = _EmpEdu(sequelize, DataTypes);
      const EmpExperience = _EmpExperience(sequelize, DataTypes);
      const EmpFamily = _EmpFamily(sequelize, DataTypes);
      const EmpItSkill = _EmpItSkill(sequelize, DataTypes);
      const EmpLang = _EmpLang(sequelize, DataTypes);
      // const SalaryStructure = _SalaryStructure(sequelize, DataTypes);
      const EmpDocs = _EmpDocs(sequelize, DataTypes);

      try {
        const existempcode = await sequelize.query(
          `select empcode  from employeemaster where empcode = '${employeeData.EmpMst.EMPCODE}'`
        );
        const EmpCodeCheck = existempcode[0][0]?.empcode;
        if (EmpCodeCheck) {
          res.status(201).send({
            success: false,
            Message: "Employee already exist",
          });
          await sequelize.close();
          return
        }
        const srno = await sequelize.query(
          `select isnull(max(srno)+1,1) as srno from EMPLOYEEMASTER`
        );
        employeeData.EmpMst.SRNO = srno[0][0]?.srno;
        let maindata = removeNullKeys({ ...employeeData.EmpMst });
        const EmpMstInsert = await Employeemaster.create(
          maindata,
          { transaction: t }
        );
        console.log(req.files, 'req.files')
        const SRNO = EmpMstInsert.SRNO;
        const EMP_DOCS_data = await uploadImages(
          req.files,
          req.headers.compcode,
          maindata.EMPCODE,
          employeeData?.Created_by,
          SRNO
        );

        if (employeeData.EmpDtl && Object.keys(employeeData.EmpDtl).length > 0)
          await EmpDtl.create({
            SRNO, Created_by,
            ...employeeData.EmpDtl
          }, { transaction: t });
        if (employeeData.EmpRights && Object.keys(employeeData.EmpRights).length > 0)
          await EmpRights.create({
            SRNO, Created_by,
            ...employeeData.EmpRights
          }, { transaction: t });

        const currentdate = new Date();
        // if (employeeData.AssetIssue && employeeData.AssetIssue.length > 0) {
        //   const filteredAssetIssues = employeeData.AssetIssue.filter(
        //     (assetIssue) => assetIssue.Aset_Code && assetIssue.Aset_Name && assetIssue.Asset_Type && assetIssue.Issue_Date
        //   );

        //   if (filteredAssetIssues.length > 0) {
        //     await AssetIssue.bulkCreate(
        //       filteredAssetIssues.map((assetIssue) => ({
        //         SRNO,
        //         Emp_Code: EmpMstInsert.EMPCODE,
        //         Created_by: employeeData.Created_by,
        //         ...assetIssue,
        //       })),
        //       { transaction: t }
        //     );
        //   }
        // }

        for (const data of EMP_DOCS_data) {
          console.log(data);
          const [record, created] = await EmpDocs.findOrCreate({
            where: {
              EMP_CODE: employeeData.EmpMst.EMPCODE,
              misspunch_inout: data.misspunch_inout,
            },
            defaults: data,
            transaction: t,
          });

          if (!created) {
            await record.update(
              { DOC_PATH: data.DOC_PATH },
              { transaction: t }
            );
          }
        }
        // Create EmpEdu if data exists
        if (employeeData.EmpEdu && employeeData.EmpEdu.length > 0) {
          await EmpEdu.bulkCreate(
            employeeData.EmpEdu.map((empEdu) => ({
              SRNO,
              Created_by: employeeData.Created_by,
              ...empEdu,
            })),
            { transaction: t }
          );
        }

        // Create EmpExperience if data exists
        if (
          employeeData.EmpExperience &&
          employeeData.EmpExperience.length > 0
        ) {
          await EmpExperience.bulkCreate(
            employeeData.EmpExperience.map((empExperience) => ({
              SRNO,
              Created_by: employeeData.Created_by,
              ...empExperience,
            })),
            { transaction: t }
          );
        }

        // Create EmpFamily if data exists
        if (employeeData.EmpFamily && employeeData.EmpFamily.length > 0) {
          await EmpFamily.bulkCreate(
            employeeData.EmpFamily.map((empFamily) => ({
              SRNO,
              Created_by: employeeData.Created_by,
              ...empFamily,
            })),
            { transaction: t }
          );
        }

        // Create EmpItSkill if data exists
        if (employeeData.EmpItSkill && employeeData.EmpItSkill.length > 0) {
          await EmpItSkill.bulkCreate(
            employeeData.EmpItSkill.map((empItSkill) => ({
              SRNO,
              Created_by: employeeData.Created_by,
              ...empItSkill,
            })),
            { transaction: t }
          );
        }

        // Create EmpLang if data exists
        if (employeeData.EmpLang && employeeData.EmpLang.length > 0) {
          await EmpLang.bulkCreate(
            employeeData.EmpLang.map((empLang) => ({
              SRNO,
              Created_by: employeeData.Created_by,
              ...empLang,
            })),
            { transaction: t }
          );
        }
        // await SalaryStructure.create(
        //   {
        //     SRNO,
        //     Created_by,
        //     Emp_Code: EmpMst1.EMPCODE,
        //     ServerId: 1,
        //   },
        //   { transaction: t }
        // );
        await t.commit();
        res.status(200).send({ success: true, Message: "Date saved" });
      } catch (error) {
        console.log(error);
        res.status(500).send({
          success: false,
          message: "An error occurred while creating Employee",
          error,
        });
        await t.rollback();
      } finally {
        await sequelize.close();
        // Close the database connection
        console.log("Connection has been closed.");
      }
    // }
  } catch (error) {
    console.log(error);
  }
};


exports.AssetDetailsSave = async function (req, res) {
  try {
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const AssetIssue = _AssetIssue(sequelize, DataTypes);
    try {
      console.log('ughjkn')
      const existempcode = await sequelize.query(
        `select empcode,SRNO  from employeemaster where empcode = '${BodyData.EMPCODE}'`
      );
      console.log(existempcode)
      const EmpCodeCheck = existempcode[0][0]?.empcode;
      console.log(EmpCodeCheck, 'EmpCodeCheck')
      if (!EmpCodeCheck) {
        await t.rollback();
        await sequelize.close();
        return res
          .status(500)
          .send({ success: false, message: "Invalid Employee Code" });
      }

      if (BodyData.AssetIssue && BodyData.AssetIssue.length > 0) {
        const filteredAssetIssues = BodyData.AssetIssue.filter(
          (assetIssue) => assetIssue.Aset_Code && assetIssue.Aset_Name && assetIssue.Asset_Type && assetIssue.Issue_Date
        );
        if (filteredAssetIssues.length > 0) {
          await AssetIssue.bulkCreate(
            filteredAssetIssues.map((assetIssue) => ({
              SRNO: existempcode[0][0]?.SRNO,
              Emp_Code: existempcode[0][0]?.empcode,
              Created_by: BodyData.Created_by,
              ...assetIssue,
            })),
            { transaction: t }
          );
        }
      }
      await t.commit();
      res.status(200).send({ success: true, Message: "Date saved" });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while Saving Assets",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  } catch (error) {
    console.log(error);
  }
};
exports.UpdateAssets = async function (req, res) {
  try {
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const AssetIssue = _AssetIssue(sequelize, DataTypes);
    try {
      console.log('ughjkn')
      const existempcode = await sequelize.query(
        `select empcode,SRNO  from employeemaster where empcode = '${BodyData.EMPCODE}'`
      );
      console.log(existempcode)
      const EmpCodeCheck = existempcode[0][0]?.empcode;
      if (!EmpCodeCheck) {
        await t.rollback();
        await sequelize.close();
        return res
          .status(404)
          .send({ success: false, message: "Invalid Employee Code" });
      }

      if (BodyData.AssetIssue && BodyData.AssetIssue.length > 0) {
        const Deleted = await AssetIssue.destroy({ where: { Emp_Code: BodyData.EMPCODE }, transaction: t });
        console.log(Deleted, 'Deleted')
        const filteredAssetIssues = BodyData.AssetIssue.filter(
          (assetIssue) => assetIssue.Aset_Code && assetIssue.Aset_Name && assetIssue.Asset_Type && assetIssue.Issue_Date
        );
        console.log(filteredAssetIssues, 'filteredAssetIssues')
        if (filteredAssetIssues.length > 0) {
          await AssetIssue.bulkCreate(
            filteredAssetIssues.map((issue) => ({
              ...issue,
              SRNO: existempcode[0][0]?.SRNO,
              Emp_Code: existempcode[0][0]?.empcode,
              Created_by: BodyData.Created_by,
            })),
            { transaction: t }
          );
        }
      }
      await t.commit();
      res.status(200).send({ success: true, Message: "Date saved" });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while Saving Assets",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  } catch (error) {
    console.log(error);
  }
};
exports.AssetDetailsEmp = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const AssetIssue1 = _AssetIssue(sequelize, DataTypes);
    const EMPCODE = req.params.id;
    const AssetIssue = await AssetIssue1.findAll({ where: { Emp_Code: EMPCODE } });
    if (!AssetIssue[0]) {
      return res
        .status(404)
        .send({ success: false, message: "No Assets Assigned" });
    }
    let data = {
      AssetIssue,
    };
    res.status(200).send({ success: true, data });
    await sequelize.close();
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .send({ success: false, message: "No Assets Assigned", error });
  }
};


exports.EmployeeMasterView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const data = req.body.Loc_code
  try {
    const results = await sequelize.query(
      `select EMPCODE,CONCAT(TITLE,'',EMPFIRSTNAME,' ',EMPLASTNAME) AS EMPLOYEENAME,GENDER,
        CASE 
        WHEN EmpType = 1 THEN 'Regular'
        when EmpType = 2 Then 'Casual'
        ELSE '' END AS EmployeeType
        , (SELECT TOP 1 Misc_Name FROM Misc_Mst where Misc_Type= 68 and Misc_Code = DIVISION) AS Department,
        (SELECT TOP 1 Misc_Name FROM Misc_Mst where Misc_Type= 81 and Misc_Code = section) AS SECTION,
        EMPLOYEEDESIGNATION,
        (SELECT TOP 1 Misc_Name FROM Misc_Mst where Misc_Type= 85 and Misc_Code = location) AS Location,
        (SELECT TOP 1 Misc_Name FROM Misc_Mst where Misc_Type= 91 and Misc_Code = REGION) AS region1,
        MOBILENO,CURRENTJOINDATE AS JOININGDATE,DOB AS DATEOFBIRTH,PANNO,UID_NO AS AADHARNO,
        case 
        when pfno=1 then 'YES'
        when PFNO='' then 'NO'
        ELSE '' END AS PFNO
        ,PFPER,PFNUMBER,
        case 
        when ESINO=1 then 'YES'
        when ESINO='' then 'NO'
        ELSE '' END AS ESINO
        ,ESINUMBER,
        case 
        when LWFNO=1 then 'YES'
        when LWFNO='' then 'NO'
        ELSE '' END AS LWFNO,
        case 
        when pro_tax=1 then 'YES'
        when pro_tax='' then 'NO'
        ELSE '' END AS pro_tax,FATHERNAME,MOTHERNAME,SPOUSENAME,PERMANENTADDRESS1,PPINCODE AS PINCODE,
        (SELECT TOP 1 Misc_Name FROM Misc_Mst where Misc_Type=3 and Misc_Code = PSTATE) AS STATE,
        PANNO AS PAN_NO,DOB AS DATEOFBIRTH 
        ,PAYMENTMODE,BANKNAME,IFSC_CODE,BANKACCOUNTNO,
        case 
        when Sal_Hold=1 then 'YES'
        when Sal_Hold=0 then 'NO'
        WHEN Sal_Hold='' THEN ''
        ELSE '' END AS SALARYHOLD,
        (SELECT TOP 1 CONCAT( Misc_Add1,'-',MISC_aDD2) FROM Misc_Mst where Misc_Type= 90 and Misc_Code = EMP_SHIFT) AS EMPPLOYEESHIFT,
        case 
        when WEEKLYOFF=-1 then ''
        when WEEKLYOFF=0 then 'SUNDAY'
        when WEEKLYOFF=1 then 'MONDAY'
        when WEEKLYOFF=2 then 'TUESDAY'
        when WEEKLYOFF=3 then 'WEDNESDAY'
        when WEEKLYOFF=4 then 'THURSDAY'
        when WEEKLYOFF=5 then 'FRIDAY'
        when WEEKLYOFF=6 then 'SATURDAY'
        when WEEKLYOFF='' then ''
        ELSE '' END AS WEEKLYOFF
        ,PAY_CODE AS PUNCHCODE,LASTWOR_DATE,
          (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 625 AND Misc_Code = CATEGORY) AS CATEGORY,
          (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 626 AND Misc_Code = CLUSTER) AS CLUSTER,
          (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 627 AND Misc_Code = CHANNEL) AS CHANNEL,
          (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 628 AND Misc_Code = COSTCENTRE) AS COSTCENTRE,Android_id,IEMI
        from EMPLOYEEMASTER
        where LOCATION IN (${data})`
    );
    res.send({
      Status: "true",
      Message: "Success",
      Result: results[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred",
      Error: err.message
    });
  } finally {
    await sequelize.close();
  }
};