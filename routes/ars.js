const {
  Sequelize,
  DataTypes,
  literal,
  QueryTypes,
  Op,
  fn,
  col,
} = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const _Roaster = require("../models/Roaster");
const {
  _AttendanceTable,
  attendanceTableSchema,
} = require("../models/AttendanceTable");
const {
  _AttendanceTableNew,
  AttendanceTableNewSchema,
} = require("../models/atendancetable");
const { _HolidayList, HolidayListSchema } = require("../models/HolidayList");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const fs = require("fs");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);
const FormData = require("form-data");
const axios = require("axios");
exports.shiftChange = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const MiscMst = _MiscMst(sequelize, DataTypes);
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
    const MI_REASON = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 92 },
    });
    const MI_REM = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
      ],
      where: { misc_type: 93 },
    });
    let data = {
      EMP_SHIFT,
      MI_REASON,
      MI_REM,
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

// exports.MissPunchReq = async function (req, res) {
//   const BodyData = req.body;
//   console.log(BodyData);
//   const { error, value: ShiftData } = attendanceTableSchema.validate(
//     BodyData.ShiftTime,
//     {
//       abortEarly: false,
//       stripUnknown: true,
//     }
//   );
//   if (error) {
//     const errorMessage = error.details.map((err) => err.message).join(", ");
//     return res.status(400).send({ success: false, message: errorMessage });
//   } else {
//     const sequelize = await dbname(req.headers.compcode);
//     const t = await sequelize.transaction();
//     const AttendanceTable = _AttendanceTable(sequelize, DataTypes);
//     const EmpMst = _EmpMst(sequelize, DataTypes);

//     console.log(ShiftData);
//     try {
//       const EmpMst1 = await EmpMst.findOne({
//         attributes: ["EMPCODE"],
//         where: { SRNO: ShiftData.SRNO },
//       });
//       const EMP_DOCS_data = await uploadImages(
//         req.files,
//         BodyData.Comp_Code,
//         EmpMst1.EMPCODE,
//         BodyData.Created_by,
//         ShiftData.SRNO
//       );
//       await AttendanceTable.update(
//         {
//           in2: ShiftData.in2,
//           out2: ShiftData.out2,
//           mipunch_reason: ShiftData.mipunch_reason,
//           MI_Remark: ShiftData.MI_Remark,
//           SPL_REMARK: ShiftData.SPL_REMARK,
//         },
//         {
//           where: {
//             [Op.and]: [
//               { SRNO: ShiftData.SRNO },
//               {
//                 dateoffice: {
//                   [Op.between]: [BodyData.startDate, BodyData.endDate],
//                 },
//               },
//             ],
//           },
//         },
//         { transaction: t }
//       );

//       await t.commit();
//       res
//         .status(200)
//         .send({ success: true, Message: "Miss Punch Added Successfully" });
//     } catch (error) {
//       console.log(error);
//       res.status(500).send({
//         success: false,
//         message: "An error occurred while Updating Master.",
//         error,
//       });
//       await t.rollback();
//     } finally {
//       await sequelize.close();
//       console.log("Connection has been closed.");
//     }
//   }
// };

//_AttendanceTableNew, AttendanceTableNewSchema
exports.ChangeShiftTime = async function (req, res) {
  const BodyData = req.body;
  console.log(BodyData, "komalalala");

  const { error, value: ShiftData } = AttendanceTableNewSchema.validate(
    BodyData.ShiftTime,
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
    const AttendanceTable = _AttendanceTableNew(sequelize, DataTypes);

    try {
      const [miscData] = await sequelize.query(
        `SELECT misc_add1, misc_add2
         FROM misc_mst
         WHERE misc_type = 90
           AND misc_code = :shift`,
        {
          replacements: { shift: BodyData.shift },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!miscData) {
        return res.status(400).send({
          success: false,
          message: "No matching misc data found.",
        });
      }

      const { misc_add1, misc_add2 } = miscData;

      const startDate = BodyData.startDate;
      const endDate = BodyData.endDate;

      const shiftStartDateTime = `${misc_add1}`;
      const shiftEndDateTime = `${misc_add2}`;
      await AttendanceTable.update(
        {
          shiftstarttime: shiftStartDateTime,
          shiftendtime: shiftEndDateTime,
        },
        {
          where: {
            emp_code: BodyData.Empcode,
            dateoffice: {
              [Op.between]: [startDate, endDate],
            },
          },
        },
        { transaction: t }
      );

      await t.commit();
      res.status(200).send({ success: true, Message: "Shift Time Updated" });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while updating the shift times.",
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
  const { error, value } = HolidayListSchema.validate(BodyData.HolidayList, {
    abortEarly: false,
    stripUnknown: true,
  });
  const arsData = value;
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const HolidayList = _HolidayList(sequelize, DataTypes);
    try {
      const HolidayList1 = await HolidayList.create(
        { ...BodyData.HolidayList, Created_by: BodyData.Created_by },
        { transaction: t }
      );
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
      console.log("Connection has been closed.");
    }
  }
};

exports.attendance = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const AttendanceTable = _AttendanceTable(sequelize, DataTypes);
    const data = await AttendanceTable.findAll({
      where: {
        SRNO: req.params.id,
      },
    });
    if (!data) {
      return res.status(500).send({ success: false, message: "No data found" });
    }
    return res.status(200).send({ success: true, data });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
    console.log("connection closed");
  }
};

exports.fetchAttendanceData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "dddd");
  const empcode = req.body.empcode;
  const month = req.body.month;

  try {
    let query = "";
    query += `select Misc_Dtl1, Misc_Dtl2 from misc_mst where Misc_Type = 25 and Misc_Code = ${month}`;

    const result = await sequelize.query(query);
    const miscDtl1 = result[0][0]?.Misc_Dtl1;
    const miscDtl2 = result[0][0]?.Misc_Dtl2;

    let attendanceData = [];
    let attendanceQuery = "";

    if (result[0] && result[0].length > 0 && miscDtl1 && miscDtl2) {
      attendanceQuery = `
        SELECT 
        FORMAT(dateoffice, 'dd/MM/yyyy')as formatted_dateoffice,
          (select Misc_abbr from misc_mst where Misc_Type = 92 and Misc_Code = attendancetable.mipunch_reason) AS MP_Status,
          (select Misc_Name from misc_mst where Misc_Type = 92 and Misc_Code = 
            attendancetable.mipunch_reason) AS MISPUNCH_REC,
            (select Misc_Name from misc_mst where Misc_Type = 93 and Misc_Code = 
            attendancetable.MI_Remark) AS MI_REMARK,
          (select CURRENTJOINDATE from EMPLOYEEMASTER where EMPLOYEEMASTER.EMPCODE = attendancetable.Emp_Code) as CURRENTJOINDATE,
          (SELECT top 1 CONCAT(EMPCODE, ' - ', EMPFIRSTNAME, ' ', EMPLASTNAME, ' (', 
                   (SELECT top 1 GODW_NAME 
                    FROM GODOWN_MST 
                    WHERE Godw_Code = EMPLOYEEMASTER.LOCATION), 
                   ')') 
     FROM EMPLOYEEMASTER 
     WHERE EMPLOYEEMASTER.EMPCODE = '${empcode}') AS EMPNAME,
          * 
        FROM attendancetable 
        WHERE Emp_Code = '${empcode}' 
          AND dateoffice BETWEEN CONVERT(DATE, '${miscDtl1}', 103) 
          AND CONVERT(DATE, '${miscDtl2}', 103)
      `;
      attendanceData = await sequelize.query(attendanceQuery);
    } else {
      attendanceQuery = `
        SELECT 
        FORMAT(dateoffice, 'dd/MM/yyyy')as formatted_dateoffice,
          (select Misc_abbr from misc_mst where Misc_Type = 92 and Misc_Code = attendancetable.mipunch_reason) AS MP_Status,
          (select Misc_Name from misc_mst where Misc_Type = 92 and Misc_Code = 
            attendancetable.mipunch_reason) AS MISPUNCH_REC,
            (select Misc_Name from misc_mst where Misc_Type = 93 and Misc_Code = 
            attendancetable.MI_Remark) AS MI_REMARK,
          (select CURRENTJOINDATE from EMPLOYEEMASTER where EMPLOYEEMASTER.EMPCODE = attendancetable.Emp_Code) as CURRENTJOINDATE,
          (SELECT top 1 CONCAT(EMPCODE, ' - ', EMPFIRSTNAME, ' ', EMPLASTNAME, ' (', 
                   (SELECT top 1 GODW_NAME 
                    FROM GODOWN_MST 
                    WHERE Godw_Code = EMPLOYEEMASTER.LOCATION), 
                   ')') 
     FROM EMPLOYEEMASTER 
     WHERE EMPLOYEEMASTER.EMPCODE = '${empcode}') AS EMPNAME,
          * 
        FROM attendancetable 
        WHERE Emp_Code = '${empcode}' 
          AND MONTH(dateoffice) = '${month}' 
          AND YEAR(dateoffice) = YEAR(GETDATE())
      `;
      attendanceData = await sequelize.query(attendanceQuery);
    }

    // Additional query for Leave Balance (outside if-else)
    const leaveQuery = `
      SELECT op_bal as Op_Bal, Gen_Lev as Gen_Lev, Avail_Lev as Avail_Lev, Cl_Bal as Cl_Bal,
      CASE WHEN LEAVE_TYPE = 4 THEN 'Casual Leave'
      WHEN LEAVE_TYPE = 5 THEN 'Paid Leave'
      WHEN LEAVE_TYPE = 6 THEN 'Sick Leave'
      WHEN LEAVE_TYPE = 9 THEN 'Comp. Off (CO)'ELSE 'Other'
      END AS Leave_TypeName,
       Leave_Type
      FROM Leave_Bal 
      WHERE Emp_Code = '${empcode}' 
        AND Leave_Mnth = ${month} 
        AND Leave_Yr = YEAR(GETDATE())
    `;

    const WEEKLYOFF = `select WEEKLYOFF from EMPLOYEEMASTER where empcode = '${empcode}' and Export_Type <3`;

    const EmpNameValue = `SELECT top 1 CONCAT(EMPCODE, ' - ', EMPFIRSTNAME, ' ', EMPLASTNAME, ' (', 
    (SELECT top 1 GODW_NAME 
     FROM GODOWN_MST 
     WHERE Godw_Code = EMPLOYEEMASTER.LOCATION), 
    ')') AS EMPNAME
FROM EMPLOYEEMASTER 
WHERE EMPLOYEEMASTER.EMPCODE = '${empcode}' and Export_Type <3`;

    const leaveData = await sequelize.query(leaveQuery);
    const WEEKLYOFFData = await sequelize.query(WEEKLYOFF);
    const EmpNameValueData = await sequelize.query(EmpNameValue);
    console.log(leaveData, "komalaa");

    // Sending the combined response
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: attendanceQuery,
      Result: attendanceData[0],
      LeaveData: leaveData[0], // Include leave data in the same response
      WEEKLYOFFData: WEEKLYOFFData[0], // Include leave data in the same response
      EmpNameValueData: EmpNameValueData[0], // Include leave data in the same response
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.changeweeklyoff = async function (req, res) {
  try {
    const EMPCODE = req.body.EMPCODE;
    const weekdays = req.body.weekdays;
    const sequelize = await dbname(req.headers.compcode);
    let query = `UPDATE EMPLOYEEMASTER SET WEEKLYOFF = ${weekdays} WHERE EMPCODE = '${EMPCODE}' and export_type<3`;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.UpdateInOutchange = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    const InTime = req.body.InTime;
    const OutTime = req.body.OutTime;
    let query = `UPDATE attendancetable SET in1 = '${InTime}',out1 = '${OutTime}'  WHERE UTD = '${UTD}'`;
    const branch = await sequelize.query(query);
    res.status(200).send({ success: true, Message: " Time Updated" });
  } catch (e) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the  times.",
      error,
    });
  }
};

exports.ChangeMisPunch = async function (req, res) {
  const BodyData = req.body;
  console.log(BodyData, "komalalala");
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  try {
    const startDate = BodyData.startDate;
    const endDate = BodyData.endDate;
    await sequelize.query(
      `UPDATE AttendanceTable
         SET 
           in1 = CAST(CONVERT(DATE, dateoffice) AS DATETIME) + CAST(:InTime AS DATETIME),
           in2 = CAST(CONVERT(DATE, dateoffice) AS DATETIME) + CAST(:InTime AS DATETIME),
           out1 = CAST(CONVERT(DATE, dateoffice) AS DATETIME) + CAST(:OutTime AS DATETIME),
           out2 = CAST(CONVERT(DATE, dateoffice) AS DATETIME) + CAST(:OutTime AS DATETIME),
           mipunch_reason = :MP_Reason,
           MI_Remark = :MP_Remark
         WHERE 
           emp_code = :Empcode
           AND dateoffice BETWEEN :StartDate AND :EndDate`,
      {
        replacements: {
          InTime: BodyData.InTime?.slice(11, 16),
          OutTime: BodyData.OutTime?.slice(11, 16),
          MP_Reason: BodyData.MP_Reason,
          MP_Remark: BodyData.MP_Remark,
          Empcode: BodyData.Empcode,
          StartDate: startDate,
          EndDate: endDate,
        },
        type: QueryTypes.UPDATE,
      }
    );
    await t.commit();
    res.status(200).send({ success: true, Message: "Shift Time Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the shift times.",
      error,
    });
    await t.rollback();
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};

// const FormData = require("form-data");
// const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

async function uploadImages(
  files,
  finalFolderPath,
  Emp_Code,
  Created_by,
  SRNO
) {
  let dataArray = [];

  for (let i = 0; i < 2; i++) {
    let fileKey = "punchOut";
    if (i == 0) {
      fileKey = "punchIn";
    }
    if (files[fileKey]) {
      const file = files[fileKey][0];
      const formData = new FormData();
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;

      formData.append("photo", file.buffer, filename);
      formData.append("customPath", finalFolderPath);
      try {
        const response = await axios.post(
          "http://cloud.autovyn.com:3000/upload-photo",
          formData,
          {
            headers: formData.getHeaders(),
          }
        );
        console.log(`Image ${i} uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${i}:`, error.message);
      }
      data = {
        SRNO: SRNO,
        EMP_CODE: Emp_Code,
        Created_by: Created_by,
        DOC_NAME: file.originalname,
        misspunch_inout: i + 1,
        columndoc_type: "misspunch",
        DOC_PATH: `${finalFolderPath}\\${filename}`,
      };
      dataArray.push(data);
    }
  }
  return dataArray;
}

exports.uploadMisspunch = async function (req, res) {
  console.log(req.body, "bidy");
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.body.empCode;
    const compCode = req.headers.compcode;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    // if (date == "" || date == undefined || date == null) {
    //   return res.status(500).send({
    //     status: false,
    //     Message: "date is mandatory",
    //   });
    // }
    const finalFolderPath = path.join(
      compCode?.split("-")[0]?.toLowerCase(),
      new Date().getFullYear().toString(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      String(new Date().getDate()).padStart(2, "0"),
      "misspunch"
    );
    console.log(finalFolderPath);
    const EMP_DOCS_data = await uploadImages(
      req.files,
      finalFolderPath,
      candCode,
      candCode,
      candCode
    );
    if (!EMP_DOCS_data?.length) {
      return res.status(500).send({
        status: false,
        Message: "No files Uploaded",
      });
    }

    let currentDate = new Date(startDate); // Clone the start date
    while (currentDate <= endDate) {
      // Inner loop: Insert data for each record on the current date
      for (const data of EMP_DOCS_data) {
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        const Result = await sequelize.query(
          `INSERT INTO EMP_DOCS (EMP_CODE, DOC_NAME, DOC_PATH, columndoc_type, dateOffice, misspunch_inout)
           VALUES ('${candCode}', '${data.DOC_NAME}', '${data.DOC_PATH}', 'Misspunch', '${formattedDate}', ${data.misspunch_inout})`
        );
      }

      // Increment the date by 1 day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      status: false,
      Message: "Error Executing action",
    });
  } finally {
    if (sequelize) {
      sequelize.close();
    }
  }
};
