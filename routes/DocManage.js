const { Sequelize, DataTypes, literal, QueryTypes, Op } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const axios = require("axios");
const { _DocManage } = require("../models/DocManage")


async function uploadImages(files, Comp_Code, Created_by, keywords, RefId, DocType, EmpCode) {
  try {
    let dataArray = [];
    // console.log(files);

    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/DOCMANAGE/`;
      const ext = path.extname(file.originalname);
      // Generate randomUUID
      const randomUUID = uuidv4();

      // Append extension to randomUUID
      const fileName = randomUUID + ext;
      // console.log(fileName);
      const formData = new FormData();
      formData.append("photo", file.buffer, fileName);
      formData.append("customPath", customPath);
      try {
        const response = await axios.post(
          "http://cloud.autovyn.com:3000/upload-photo",
          formData,
          {
            headers: formData.getHeaders(),
          }
        );
        // console.log(`Image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
      }
      const data = {
        SRNO: index,
        EmpCode: EmpCode,
        UploadedBy: Created_by,
        OriginalName: file.originalname,
        Keywords: keywords[index],
        RefId: RefId,
        DocType: DocType,
        SMBPath: `${customPath}${fileName}`,
      };
      console.log(data, 'data');
      dataArray.push(data);
    }));
    console.log(dataArray, 'dataArray');
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}


exports.Masters = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MI_REASON = await sequelize.query(`select cast (misc_Code as varchar) as value , misc_Name as label from misc_mst where misc_type = 629 and export_type < 3`)
    return res.status(200).send({
      Status: "true",
      Result: MI_REASON[0],
      Message: "nothing",
      Query: ""
    });
  } catch (error) {
    await sequelize.close();
    console.log(error);
    return res
      .status(404)
      .send({ success: false, message: "Masters Not found", error });
  }
};
exports.save = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {

    // console.log(req.files)
    console.log(req.body)
    const EMP_DOCS_data = await uploadImages(
      req.files,
      req.headers.compcode.split("-")[0],
      req.body.user_id,
      req.body.keywords,
      req.body.refId,
      req.body.doc_type,
      req.body.EmpCode,
    );

    const DocManage = await _DocManage(sequelize, DataTypes);
    const data = await DocManage.bulkCreate(EMP_DOCS_data, { transaction: t });
    await t.commit();
    return res.status(200).send({
      Status: "true",
      Result: {},
      Message: "nothing",
      Query: ""
    });
  } catch (error) {
    await t.rollback();
    await sequelize.close();
    console.log(error);
    return res
      .status(404)
      .send({ success: false, message: "Masters Not found", error });
  }
};


