const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

function calculateDates(year, monthStart, monthEnd, month) {
  const fiscalYearstart = parseInt(monthStart) >= 4 ? year : year + 1;
  const fiscalYearend = parseInt(monthEnd) >= 4 ? year : year + 1;
  const startDate = new Date(fiscalYearstart, parseInt(monthStart) - 1, 2);
  const yearStart = new Date(year, parseInt(month) - 1, 2);
  const endDate = new Date(fiscalYearend, parseInt(monthEnd), 1);
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
    yearStart: yearStart.toISOString().slice(0, 10),
  };
}
exports.getAttendanceLogNew = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const location = req.query.location;
    const section = req.query.section;
    const division = req.query.division;
    const LogDate = req.query.LogDate;
    const EMPCODE = req.query.EMPCODE;

    let queryString = "";
    if (location) {
      queryString = ` AND location='${location}'`;
    }
    if (section) {
      queryString = ` AND section='${section}'`;
    }
    if (division) {
      queryString = ` AND division='${division}'`;
    }
    const result = await sequelize.query(
      `SELECT TRIM([Flag]) as atn_status,TRIM(str(Count(Flag))) as status_count 
      FROM attendancetable,EMPLOYEEMASTER 
      WHERE DATEOFFICE='${LogDate}' ${queryString} AND  EMP_CODE=EMPCODE and LASTWOR_DATE is null and Emp_Code in (SELECT empcode FROM Approval_Matrix WHERE '${EMPCODE}' 
        IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) and module_code = 'attdence') GROUP BY [Flag]`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getAttendanceDetailsNew = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const location = req.query.location;
    const section = req.query.section;
    const division = req.query.division;
    const LogDate = req.query.LogDate;
    const status = req.query.status;
    const EMPCODE = req.query.EMPCODE;

    let queryString = "";
    if (location) {
      queryString = ` AND location='${location}'`;
    }
    if (section) {
      queryString = ` AND section='${section}'`;
    }
    if (division) {
      queryString = ` AND division='${division}'`;
    }
    //   const result = await sequelize.query(
    //     `SELECT TRIM(Emp_Code) AS Emp_Code,EmpFirstName,
    //     (select top 1 Misc_Name from Misc_Mst where Misc_type=85 and Misc_Code=Location) as Location,
    //     EmployeeDesignation,
    //  IN1,OUT1
    //    FROM attendancetable,EMPLOYEEMASTER WHERE 
    //     DATEOFFICE='${LogDate}' AND 
    //     EMP_CODE=EMPCODE and Flag='${status}' ${queryString}`
    //   );
    const result = await sequelize.query(
      `SELECT TRIM(Emp_Code) AS Emp_Code,EmpFirstName,
      (select top 1 Misc_Name from Misc_Mst where Misc_type=85 and Misc_Code=Location) as Location,
      EmployeeDesignation,
       FORMAT( IN1, 'dd-MM-yyyy hh:mm tt') AS In1, 
       FORMAT( OUT1, 'dd-MM-yyyy hh:mm tt') AS Out1
     FROM attendancetable,EMPLOYEEMASTER
     WHERE DATEOFFICE = '${LogDate}' and EMP_CODE = EMPCODE and Emp_Code in (SELECT empcode FROM Approval_Matrix WHERE '${EMPCODE}' 
	IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) and module_code = 'attdence') and Flag='${status}' ${queryString}`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.updateAppTheme = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empCode = req.body.EMP_CODE;
    const appTheme = req.body.THEME;
    if (empCode == "" || empCode == undefined || empCode == null) {
      return res.status(500).send({
        status: false,
        Message: "empcode is mandatory",
      });
    }

    await sequelize.query(
      `INSERT INTO AppTheme (Emp_Code, App_Theme)
                VALUES (:empCode, :appTheme);`, {
      replacements: {
        appTheme, empCode
      }
    }
    );

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
exports.GetVersionInfo = async function (req, res) {
  // if (req.headers.compcode?.toUpperCase() == 'VMPL') {
  res.status(200).send({
    "Status": true,
    "Message": "Success",
    "Query": "",
    "Result": {},
    "version_code": "3",
    "UpdateDetails": "New Includes:\r\n- Complaints and Suggestions\r\n- Announcements\r\n- Service:\r\n  - Vehicle Pick and Drop (Driver, Guard, Authority)\r\n- Sales:\r\n  - Inquiry and Quotation\r\n- Cashier:\r\n  - Daily Cash Update and Report\r\n- Presales:\r\n  - New Car Stock\r\n  - Payment Tracker\r\n- Document Management\r\n\r\nImprovements:\r\n- Demo Gate Pass\r\n- Banking\r\n- Improve UI\r\n- Improve Navigation\r\n\r\nMiscellaneous:\r\n- Employee ID Cards\r\n- Favorites\r\n- Rights",
    "verison_name": "1.4.27"
  });
  // } else {
  //   res.status(200).send({
  //     "Status": true,
  //     "Message": "Success",
  //     "Query": "",
  //     "Result": {},
  //     "version_code": "3",
  //     "UpdateDetails": "1. Introducing New Leave Module \r\n2. New Offer Module\r\n3. New Announcement feature\r\n4. Improve loading experience",
  //     "verison_name": "1.4.25"
  //   });
  // }
};
exports.getAttendance1 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empCode = req.query.empCode;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    console.log(startDate);
    console.log(endDate);
    console.log("endDate");

    const b = await sequelize.query(`select emp.EMPFIRSTNAME AS EmpName,
    TRIM(CAST(a.shiftstarttime AS CHAR)) AS StTime,
    TRIM(CAST(a.shiftendtime AS CHAR)) AS EndTime,
    CONVERT(VARCHAR, a.dateoffice, 23) AS Date,
    CONVERT(VARCHAR, a.dateoffice, 103) AS DateDisplay,
    a.in1 AS In1,
    CASE
    WHEN a.in1 != '' THEN FORMAT(a.in1, 'HH:mm:ss')
    WHEN a.App_in1 != '' THEN FORMAT(a.App_in1, 'HH:mm:ss')
    WHEN a.in2 != '' THEN FORMAT(a.in2, 'HH:mm:ss')
    ELSE ''
    END AS In1,
    CASE
    WHEN a.out1 != '' THEN FORMAT(a.out1, 'HH:mm:ss')
    WHEN a.App_out1 != '' THEN FORMAT(a.App_out1, 'HH:mm:ss')
    WHEN a.out2 != '' THEN FORMAT(a.out2, 'HH:mm:ss')
    ELSE ''
    END AS Out1,
    CASE
    WHEN a.App_in1 != '' AND a.App_in1 != '1900-01-01T00:00:00.000Z' THEN convert(varchar,a.App_in1, 8)
    ELSE ''
    END AS In1App,
    CASE
    WHEN a.App_out1 != '' AND a.App_out1 != '1900-01-01T00:00:00.000Z' THEN convert(varchar,a.App_out1, 8)
    ELSE ''
    END AS Out1App,
    TRIM(a.status) AS AtnStatus,
    MAN_APPR AS MAN_APPR,
    TRIM(a.status) AS STATUS,
    TRIM(CAST(e.Present AS CHAR)) AS Present,
    TRIM(CAST(e.Absent AS CHAR)) AS Absent,
    TRIM(CAST(e.HalfDay AS CHAR)) AS HalfDay,
    TRIM(CAST(e.WeekOff AS CHAR)) AS WeekOff,
    TRIM(CAST(e.Holiday AS CHAR)) AS Holiday,
    TRIM(CAST(e.Relaxation AS CHAR)) AS Relaxation,    
    e.colorCode AS colorCode,
    TRIM(CAST(e.Value AS CHAR)) AS paidDays
    from attendancetable a
    join Employee_AtnStatus e on e.Status = a.status
    JOIN EMPLOYEEMASTER emp ON emp.EMPCODE = a.Emp_Code
    where a.Emp_Code='${empCode}' AND 
    a.dateoffice >='${startDate}' AND 
    a.dateoffice <='${endDate}'`);
    var FinalData = b[0];
    let presentSum = 0;
    let AbsentSum = 0;
    let HalfDaySum = 0;
    let WeekOffSum = 0;
    let HolidaySum = 0;
    let paidDaysSum = 0.0;
    let RelaxationSum = 0;
    let UnAprMP = 0;
    FinalData.forEach((row) => {
      presentSum += parseInt(row.Present) || 0;
      AbsentSum += parseInt(row.Absent) || 0;
      HalfDaySum += parseInt(row.HalfDay) || 0;
      WeekOffSum += parseInt(row.WeekOff) || 0;
      HolidaySum += parseInt(row.Holiday) || 0;
      RelaxationSum += parseInt(row.Relaxation) || 0;
      paidDaysSum += parseFloat(row.paidDays) || 0;
    });
    FinalData.forEach((row) => {
      if (row.MAN_APPR == "N") {
        UnAprMP += UnAprMP;
      }
    });
    Summary = {
      Presents: presentSum,
      Absents: AbsentSum,
      HalfDays: HalfDaySum,
      Holidays: HolidaySum,
      WO: WeekOffSum,
      Relaxations: RelaxationSum,
      UnAprMP: UnAprMP,
      PaidDays: paidDaysSum,
    };

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Summary: Summary,
      Result: FinalData,
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
exports.GetMStatus = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empCode = req.query.empCode;

    const result = await sequelize.query(
      `SELECT  mPunch,mApprove,mMispunch,mLeave,mDeviceLog,mCalender,
        mAttendanceLog,mLocationLog,mToDoList,mSuggestions,
        mUpdateIMEI,mTrackingReport,mLiveLocation,mAssetScan,
        (iif((select top 1 LEFT(Misc_Dtl1,2)  as date_ from Misc_Mst where Misc_Type = 25 and misc_code = 1) is null ,'0',(select top 1 LEFT(Misc_Dtl1,2)  as date_ from Misc_Mst where Misc_Type = 25 and misc_code = 1))) as CustumDateForCalender,
        mGeofenceSetting FROM EMPLOYEEMASTER where EMPCODE='${empCode}'`
    );
    console.log(result[0][0])
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0][0],
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
exports.getEmpDesignation = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.GEL_EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const Result = await sequelize.query(
      `select top 1 EMPLOYEEDESIGNATION,EMPCODE as EMP_Code from EMPLOYEEMASTER where EMPCODE = '${candCode}' and export_type < 3`
    );


    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      DesignationResult: Result[0],
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
exports.getGatePassEmployeeGuard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const empCode = req.query.empCode;
    if (empCode == "" || empCode == undefined || empCode == null) {
      return res.status(500).send({
        status: false,
        Message: "empCode is mandatory",
      });
    }
    const result = await sequelize.query(`SELECT * from( 
      SELECT dg.*,(select top 1 LOCATION from EMPLOYEEMASTER where empcode = dg.EMPCODE) as Location FROM DIG_GP dg INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = dg.EmpCode collate database_default WHERE CAST(dg.REQ_DATE AS DATE) = CAST(GETDATE() AS DATE) 
              AND FINAL_STAT = 'Y' 
              )as h where Location = (select top 1 LOCATION from EMPLOYEEMASTER where empcode = '${empCode}') order by utd desc`);


    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getGatePassEmployee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const MANAGER_CODE = req.query.MANAGER_CODE;
    const result =
      await sequelize.query(`SELECT 
      IIF(final_stat is not null, 4, IIF(Appr_Stat_1 IS NULL, 1, IIF(Appr_Stat_2 IS NULL, 2, IIF(Appr_Stat_3 IS NULL, 3, 3)))) AS stat
    ,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${MANAGER_CODE}' 
           IN (approver1_A, approver1_B) and module_code = 'gatepass' and dg.empcode collate database_default = empcode collate database_default) is not null ,Appr_Stat_1,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${MANAGER_CODE}' 
           IN (approver2_A, approver2_B) and module_code = 'gatepass' and dg.empcode collate database_default = empcode collate database_default) is not null , Appr_Stat_2,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${MANAGER_CODE}' 
           IN (approver3_A, approver3_B) and module_code = 'gatepass' and dg.empcode collate database_default = empcode collate database_default) is not null,Appr_Stat_3,null))) as status_khud_ka
    , dg.* FROM  dig_gp AS dg INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = dg.EmpCode collate database_default  
      WHERE (FINAL_STAT is null) and 
      ((dg.empcode in (SELECT empcode FROM Approval_Matrix WHERE '${MANAGER_CODE}' 
      IN (approver1_A, approver1_B) and module_code = 'gatepass'))
      or (dg.empcode in (SELECT empcode FROM Approval_Matrix WHERE '${MANAGER_CODE}' 
      IN (approver2_A, approver2_B) and module_code = 'gatepass') and  dg.utd in (select utd from dig_gp where FINAL_STAT is null) and 
        dg.utd not in (select utd from dig_gp where APPR_STAT_1 is null and FINAL_STAT is null)) or
      (dg.empcode in (SELECT empcode FROM Approval_Matrix WHERE '${MANAGER_CODE}' 
      IN (approver3_A	,approver3_B) and module_code = 'gatepass')  and dg.utd in (select utd from dig_gp where FINAL_STAT is null) and 
        dg.utd not in (select utd from dig_gp where APPR_STAT_2 is null and FINAL_STAT is null)))
        and cast(dg.REQ_DATE as date) = cast(getdate() as date)
      ORDER BY dg.REQ_DATE desc`)

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
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
exports.getGatePassInfoSelf = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const candCode = req.query.EMPCODE;

    const result =
      await sequelize.query(`SELECT UTD, GP_TYPE, RETURN_STAT, OUT_TIME, IN_TIME, REASON, REQ_DATE, APPR_1_CODE_A, APPR_1_CODE_B,
      APPR_2_CODE_A, APPR_2_CODE_B, APPR_3_CODE_A, APPR_3_CODE_B, APPR_BY_CODE_1, APPR_BY_CODE_2,
      APPR_BY_CODE_3, APPR_STAT_1, APPR_STAT_2, APPR_STAT_3, ACT_OUT_TIME, ACT_IN_TIME, EMPCODE , EMP_NAME, FINAL_STAT
      FROM DIG_GP
      WHERE EMPCODE = '${candCode}'
       AND CAST(REQ_DATE AS DATE) = CAST(GETDATE() AS DATE) order by utd desc`);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.approveGatePass = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const Appr_Code = req.query.RPA_Managercode;
    const APPROVE = req.query.APPROVE;
    const UTDArray = req.query.UTD.toString(); // Assuming UTD is '431,432,433'
    const UTD = UTDArray.split(","); // Split the string by comma
    console.log(UTDArray);
    const a = await sequelize.query(
      `SELECT top 1 * from Approval_Matrix where empcode = (select top 1 empcode from dig_gp where utd =  '${UTD}') and module_code='gatepass'`
    );
    console.log(a, 'Check here')
    if (a[0]?.length > 0) {
      let ApprovalLevel = 0;
      const approver1_A = a[0][0].approver1_A?.toUpperCase();
      const approver2_A = a[0][0].approver2_A?.toUpperCase();
      const approver3_A = a[0][0].approver3_A?.toUpperCase();
      const approver1_B = a[0][0].approver1_B?.toUpperCase();
      const approver2_B = a[0][0].approver2_B?.toUpperCase();
      const approver3_B = a[0][0].approver3_B?.toUpperCase();

      if (
        approver1_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver1_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 1;
      } else if (
        approver2_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver2_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 2;
      } else if (
        approver3_A?.toUpperCase() == Appr_Code.toUpperCase() ||
        approver3_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 3;
      }

      if (APPROVE == 'Y') {
        var asd = ApprovalLevel == 1 ? 1 : ApprovalLevel - 1;
        let result1 = ``;
        if (ApprovalLevel == 1) {
          result1 = `UPDATE dig_gp 
          SET Appr_Stat_${ApprovalLevel} = 1,
              appr_${ApprovalLevel}_code_A = '${Appr_Code}'
          WHERE  Utd IN (${UTD}) and Appr_Stat_${ApprovalLevel} is null and FINAL_STAT is null`
        } else {
          result1 = `UPDATE dig_gp 
          SET Appr_Stat_${ApprovalLevel} = 1,
              appr_${ApprovalLevel}_code_A = '${Appr_Code}'
          WHERE  Utd IN (${UTD}) and Appr_Stat_${ApprovalLevel} is null and FINAL_STAT is null and Appr_Stat_${asd} is not null`;
        }
        await sequelize.query(result1);
        if (ApprovalLevel == 1) {
          response.Message = "Approval 1 Updated Successfully";
        } else if (ApprovalLevel == 2) {
          response.Message = "Approval 2 Updated Successfully";
        } else if (ApprovalLevel == 3) {
          response.Message = "Approval 3 Updated Successfully";
        }
        let Finalresult = ``;
        if (ApprovalLevel == 3) {
          Finalresult = await sequelize.query(`UPDATE dig_gp 
          SET FINAL_STAT = 'Y'
           WHERE  Utd IN (${UTD})`);

          response.Message = "Final Approval Done";
        } else if (
          ApprovalLevel == 2 &&
          !a[0][0].approver3_A &&
          !a[0][0].approver3_B
        ) {
          Finalresult = await sequelize.query(`UPDATE dig_gp 
          SET FINAL_STAT = 'Y'
           WHERE  Utd IN (${UTD})`);
          response.Message = "Final Approval Done";
        } else if (
          ApprovalLevel == 1 &&
          !a[0][0].approver3_A &&
          !a[0][0].approver3_B &&
          !a[0][0].approver2_A &&
          !a[0][0].approver2_B
        ) {
          Finalresult = await sequelize.query(`UPDATE dig_gp 
          SET FINAL_STAT = 'Y'
           WHERE  Utd IN (${UTD})`);
          response.Message = "Final Approval Done";
        }
      } else {
        var asd = ApprovalLevel == 1 ? 1 : ApprovalLevel - 1;
        let result2 = ``;
        if (ApprovalLevel == 1) {
          result2 = `UPDATE dig_gp 
          SET Appr_Stat_${ApprovalLevel} = 0,FINAL_STAT = 'N',
              appr_${ApprovalLevel}_code_A = '${Appr_Code}'
          WHERE  Utd IN (${UTD}) and Appr_Stat_${ApprovalLevel} is null and FINAL_STAT is null`
        } else {
          result2 = `UPDATE dig_gp 
          SET Appr_Stat_${ApprovalLevel} = 0,FINAL_STAT = 'N',
              appr_${ApprovalLevel}_code_A = '${Appr_Code}'
          WHERE  Utd IN (${UTD}) and Appr_Stat_${ApprovalLevel} is null and FINAL_STAT is null Appr_Stat__${asd} is not null`;
        }
        await sequelize.query(result2);
        response.Message = "Final Rejection completed";
      }
    }
    res.status(200).send({ ...response, Status: true });
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
exports.applyGatePass = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const GP_TYPE = req.query.GP_TYPE;
    const RETURN_STAT = req.query.RETURN_STAT;
    const OUT_TIME = req.query.OUT_TIME;
    const IN_TIME = req.query.IN_TIME;
    const REASON = req.query.REASON;
    const empCode = req.query.EMPCODE;
    const EMP_NAME = req.query.EMP_NAME;
    const EMPFROM_LIST = req.query.EMPFROM_LIST;
    const TEAM_FLAG = req.query.TEAM_FLAG;

    if (
      GP_TYPE !== null &&
      RETURN_STAT !== null &&
      OUT_TIME !== null &&
      REASON !== null &&
      EMP_NAME !== null
    ) {
      let result;
      if (TEAM_FLAG == 1 && EMPFROM_LIST) {
        result =
          await sequelize.query(`INSERT INTO DIG_GP (EMPCODE, GP_TYPE, RETURN_STAT, OUT_TIME, IN_TIME,ACT_IN_TIME, REASON, EMP_NAME,APPR_3_CODE_B) 
                VALUES (:EMPFROM_LIST, :GP_TYPE, :RETURN_STAT, :OUT_TIME, :IN_TIME,:ACT_IN_TIME, :REASON, (select concat(title,' ',empfirstname,' ',EMPLASTNAME) from EMPLOYEEMASTER where empcode=:EMPFROM_LIST),:empCode)`,
            {
              replacements: {
                EMPFROM_LIST, GP_TYPE, RETURN_STAT, OUT_TIME, IN_TIME, ACT_IN_TIME: RETURN_STAT == 1 ? null : IN_TIME, REASON, EMPFROM_LIST, empCode
              }
            });
      } else {
        result = await sequelize.query(`INSERT INTO DIG_GP (EMPCODE, GP_TYPE, RETURN_STAT, OUT_TIME, IN_TIME,ACT_IN_TIME, REASON, EMP_NAME) 
        VALUES(:empCode, :GP_TYPE, :RETURN_STAT, :OUT_TIME, :IN_TIME,:ACT_IN_TIME, :REASON, :EMP_NAME)`
          , {
            replacements: {
              empCode, GP_TYPE, RETURN_STAT, OUT_TIME, IN_TIME, ACT_IN_TIME: RETURN_STAT == 1 ? null : IN_TIME, REASON, EMP_NAME
            }
          });
      }
      response.Status = true;
      response.Message = "GatePass Requested Successfully";

      console.log(result);
      res.status(200).send({
        Status: true,
        Message: "Success",
        Query: "",
        Result: result[0][0],
      });
    }
  } catch (e) {
    console.log(e);
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
exports.gatePassInOut = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const UTD = req.query.UTD;
    const candCode = req.query.GEL_EMPCODE;
    const TYPE = req.query.TYPE;

    if (TYPE == "IN") {
      result = await sequelize.query(
        `update DIG_GP set ACT_IN_TIME = getdate(),APPR_1_CODE_B = '${candCode}' where utd ='${UTD}' AND ACT_IN_TIME IS NULL`
      );
    } else if (TYPE == "OUT") {
      result = await sequelize.query(
        `update DIG_GP set ACT_OUT_TIME = getdate(),APPR_2_CODE_B = '${candCode}' where utd ='${UTD}' AND ACT_OUT_TIME IS NULL`
      );
    }

    console.log(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0][0],
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
exports.demogetpassguardview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    console.log(req.query);
    const { query } = req;
    let { start_date, end_date } = query;

    const currentDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD

    if (!start_date) {
      start_date = currentDate;
    }

    if (!end_date) {
      end_date = currentDate;
    }
    const result =
      await sequelize.query(`SELECT UTD, IIF(GP_TYPE = 0, 'DEMO', 'PERSONAL') AS GP_TYPE, REQ_DATE, EMP_NAME, CUSTOMER_NAME, CUSTOMER_MOBILE, DRIVER_CODE,(SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name, MODEL_CODE,(SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name, LAST_KM, KM, VEH_REG, EMPCODE, FINAL_STATUS, APPR1_CODE, APPR2_CODE, ACT_OUT_TIME, ACT_IN_TIME, OUT_TIME, IN_TIME 
    FROM Demo_Car_Gatepass  
    WHERE FINAL_STATUS = '1' AND
    CAST(REQ_DATE AS DATE) BETWEEN '${start_date}' AND '${end_date}' 
    ORDER BY UTD DESC`);
    response.Status = true;
    response.Message = "GatePass Requested Successfully";
    // console.log(result);
    res.status(200).send({
      Status: true,
      Message: response.Message,
      Query: "",
      Result: result[0],
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
exports.IsProfileFilled = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empCode = req.query.empCode;
  try {
    const result = await sequelize.query(
      `EXEC CheckMandatoryFields @empCode = '${empCode}'`
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(201).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: {},
    });
  } finally {

    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.GetCompanyBranches = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT  Misc_Code ,  Misc_Name, SPL_REM as Geo_Location FROM misc_mst where export_type < 3 and misc_type = 85 ORDER BY misc_name`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetCities = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT Misc_Code, Misc_Name FROM misc_mst where misc_type=1 ORDER BY Misc_Name`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetStates = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT * FROM misc_mst where misc_type=3 ORDER BY Misc_Name`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetOccupations = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT * FROM misc_mst where misc_type=11 ORDER BY Misc_Name`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.log(e);
  }
};
exports.getMPList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT Misc_Code as value, Misc_Name as label, 'MP' AS Is_MP
      FROM misc_mst 
      WHERE misc_type = 92 AND EXPORT_TYPE < 2
      ORDER BY Misc_Code`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getMPRemarksList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT Misc_Code as value, Misc_Name as label, 'MP' AS Is_MP
      FROM misc_mst 
      WHERE misc_type = 93 AND EXPORT_TYPE < 2
      ORDER BY Misc_Code`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.AddMispunchRequest_New = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  console.log(req.query);
  const MP_Date = req.query.MP_Date;
  let In_Time = req.query.In_Time;
  const Out_Time = req.query.Out_Time;
  const MP_Reason = req.query.MP_Reason;
  const MP_Remark = req.query.MP_Remark;
  const Spl_Remark = req.query.Spl_Remark;
  const candCode = req.query.AMR_EMPCODE;
  var response = {
    Status: false,
    Message: "",
  };

  try {
    const result = await sequelize.query(
      `SELECT CC_Ledg, CC_Group , misc_abbr FROM misc_mst WHERE misc_type = 92 AND misc_code = '${MP_Reason}'`
    );

    var errorflag;
    if (result[0][0].CC_Ledg != null || result[0][0].CC_Group != null) {
      const CC_Ledg = result[0][0].CC_Ledg;
      const CC_Group = result[0][0].CC_Group;
      const CC_LedgInt = parseInt(CC_Ledg);
      const CC_GroupInt = parseInt(CC_Group);
      const mpDateObj = new Date(MP_Date);
      const currentDate = new Date();
      const differenceInMilliseconds = currentDate - mpDateObj;
      const millisecondsInDay = 1000 * 60 * 60 * 24;
      const differenceInDays = Math.floor(
        differenceInMilliseconds / millisecondsInDay
      );
      const ledgIntText = isNaN(CC_LedgInt) ? '∞' : CC_LedgInt;
      const groupIntText = isNaN(CC_GroupInt) ? '∞' : CC_GroupInt;

      switch (true) {
        case (CC_GroupInt == 0 && differenceInDays > 0):
          response.Message = `Misspunch date is out of range! Only ${ledgIntText} days before and ${groupIntText} days after Misspunch are allowed`;
          errorflag = true;
          break;

        case (mpDateObj > currentDate && differenceInDays * -1 > CC_GroupInt):
          response.Message = `Misspunch date is out of range! Only ${ledgIntText} days before and ${groupIntText} days after Misspunch are allowed`;
          errorflag = true;
          break;

        case (mpDateObj <= currentDate && differenceInDays > CC_LedgInt):
          response.Message = `Misspunch date is out of range! Only ${ledgIntText} days before and ${groupIntText} days after Misspunch are allowed`;
          errorflag = true;
          break;
        case (CC_LedgInt == 0 && differenceInDays > 0):
          response.Message = `Misspunch date is out of range!. Only ${ledgIntText} days before and ${groupIntText} days after Misspunch are allowed`;
          errorflag = true;
          break;
        default:
          // No error
          break;
      }
      console.log(differenceInDays)
      console.log(CC_GroupInt, CC_LedgInt, 'CC_LedgInt')
      console.log(response.Message)


    }
    console.log(errorflag, 'errorflag');
    if (errorflag) {
      return res.status(201).send({
        Status: "false",
        Message: response.Message,
        Query: "",
      });
    } else {

      const result1 = await sequelize.query(
        `Select top 1 Man_Appr ,in1mannual,out1mannual from  Attendancetable where Emp_Code='${candCode}' AND DateOffice = '${MP_Date}'`
      );
      // if (result1[0][0].Man_Appr == null || result1[0][0].Man_Appr == '') {
      // } else {
      //   response.Message = "Mispunch Request already raised on this day. can not raise Mispunch request";
      //   return res.status(201).send({
      //     Status: "false",
      //     Message: response.Message,
      //     Query: "",
      //   });
      // }
      if (result1[0]?.length) {
        if (In_Time != "" && In_Time != "0" && Out_Time != "" && Out_Time != "0") {
          if (result1[0][0].in1mannual == "Y" && result1[0][0].out1mannual == "Y") {
            response.Message = "Request Already processed for Both time on this Date!";
            return res.status(401).send("Request Already processed for Both time on this Date!");
          } else if (result1[0][0].in1mannual == "Y" && result1[0][0].out1mannual == null) {
            response.Message = "Request Already processed for in time on this Date! select Out time only";
            return res.status(401).send("Request Already processed for in time on this Date! select Out time only");
          } else if (result1[0][0].in1mannual == null && result1[0][0].out1mannual == "Y") {
            response.Message = "Request Already processed for Out time on this Date! select In time only";
            return res.status(401).send("Request Already processed for Out time on this Date! select In time only");
          } else {
            if (In_Time != "" && In_Time != "0" && In_Time) {
              const In1 = MP_Date + " " + In_Time;
              await sequelize.query(`Update attendanceTable set 
                              Status='A',
                              Man_Appr='N',
                              In1Mannual='N',
                              Man_Recomend='N',
                              man_rej='N',
                              In2=:In1, 
                              In1=:In1, 
                              Mipunch_Reason=:MP_Reason,
                              MI_Remark=:MP_Remark ,
  														Spl_Remark=:Spl_Remark,
                              Appr_1_Code=null,
                              Appr_2_Code=null,
                              Appr_3_Code=null,
                              Appr_3_Stat=null,
                              Appr_2_Stat=null,
                              Appr_1_Stat=null,
                              Appr_1_Rem =null,
                              Appr_2_Rem =null,
                              Appr_3_Rem =null,
                              Mi_type=2
                              where DateOffice=:MP_Date and Emp_Code=:candCode`, {
                replacements: {
                  In1, MP_Reason, MP_Remark, Spl_Remark: Spl_Remark ? Spl_Remark : '', MP_Date, candCode
                }
              });
            }
            if (Out_Time != "" && Out_Time != "0" && Out_Time) {
              const Out1 = MP_Date + " " + Out_Time;
              const updateresult =
                await sequelize.query(`Update  attendanceTable set 
                                                  Status='A',
                                                  Man_Appr='N',
                                                  out1Mannual='N',
                                                  Man_Recomend='N',
                                                  man_rej='N',
                                                  Out2=:Out1, 
                                                  Out1=:Out1, 
                                                  Mipunch_Reason=:MP_Reason,
                                                  MI_Remark=:MP_Remark ,
                                                  Spl_Remark=:Spl_Remark,
                                                  Appr_1_Code=null,
                                                  Appr_2_Code=null,
                                                  Appr_3_Code=null,
                                                  Appr_3_Stat=null,
                                                  Appr_2_Stat=null,
                                                  Appr_1_Stat=null,
                                                  Appr_1_Rem =null,
                                                  Appr_2_Rem =null,
                                                  Appr_3_Rem =null,
                                                  Mi_type=2
                                                  where DateOffice=:MP_Date and Emp_Code=:candCode `, {
                  replacements: {
                    Out1, MP_Reason, MP_Remark, Spl_Remark: Spl_Remark ? Spl_Remark : '', MP_Date, candCode
                  }
                });
            }
            response.Message = "Record updated successfully!";
          }
        }
        console.log(result[0][0].misc_abbr);
        console.log(result[0]);
        if (result[0][0].misc_abbr == 'LWP') {
          In_Time = '10:00';
        }
        console.log(In_Time);

        if (In_Time != "" && In_Time != "0" && In_Time) {
          if (result[0][0]?.misc_abbr == 'LWP') {
            In_Time = '00:00';
          }
          console.log(In_Time)
          if (result1[0][0].in1mannual != "Y") {
            const In1 = MP_Date + " " + In_Time;
            const updateresult =
              await sequelize.query(`Update attendanceTable set 
												Status='A',
												Man_Appr='N',
												In1Mannual='N',
												Man_Recomend='N',
												man_rej='N',
												In2=:In1, 
												In1=:In1, 
												Mipunch_Reason=:MP_Reason,
												MI_Remark=:MP_Remark,
                        Spl_Remark=:Spl_Remark,
												Appr_1_Code=null,
												Appr_2_Code=null,
												Appr_3_Code=null,
												Appr_3_Stat=null,
												Appr_2_Stat=null,
												Appr_1_Stat=null,
												Appr_1_Rem =null,
												Appr_2_Rem =null,
                        Appr_3_Rem =null,
                        Mi_type=2
												where DateOffice=:MP_Date and Emp_Code=:candCode `, {
                replacements: {
                  In1, MP_Reason, MP_Remark: MP_Remark ? MP_Remark : null, Spl_Remark: Spl_Remark ? Spl_Remark : '', MP_Date, candCode
                }
              });

            response.Message = "Record updated successfully!";
          } else {
            response.Message =
              "Request Already processed for In time for this Date!";
            return;
          }
        }
        if (Out_Time != "" && Out_Time != "0" && Out_Time) {
          if (result1[0][0].out1mannual != "Y") {
            const Out1 = MP_Date + " " + Out_Time;

            const updateresult =
              await sequelize.query(`Update  attendanceTable set 
												Status='A',
												Man_Appr='N',
												out1Mannual='N',
												Man_Recomend='N',
												man_rej='N',
												Out2=:Out1, 
												Out1=:Out1, 
												Mipunch_Reason=:MP_Reason,
												MI_Remark=:MP_Remark,
                        Spl_Remark=:Spl_Remark,
												Appr_1_Code=null,
												Appr_2_Code=null,
												Appr_3_Code=null,
												Appr_3_Stat=null,
												Appr_2_Stat=null,
												Appr_1_Stat=null,
												Appr_1_Rem =null,
												Appr_2_Rem =null,
                        Appr_3_Rem =null,
                        Mi_type=2
												where DateOffice=:MP_Date and Emp_Code=:candCode `, {
                replacements: {
                  Out1, MP_Reason, MP_Remark, Spl_Remark: Spl_Remark ? Spl_Remark : '', MP_Date, candCode
                }
              });

            response.Message = "Record updated successfully!";
          } else {
            response.Message =
              "Request Already processed for Out time for this Date!";
            return;
          }
        }
      }
      return res.status(200).send({
        Status: true,
        Message: response.Message,
        Query: "",
        Result: {}
      });
    }


  } catch (error) {
    console.error("Error:", error);
    response.Message = error.message;
    res.status(500).json(response);
  }
};

exports.getCandidateList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const emp_code = req.query.empCode;
    let sql =
      `select (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em1 where em1.EMPCODE collate database_default = (	 SELECT TOP 1 approver1_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_1name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em3 where em3.EMPCODE collate database_default = (SELECT TOP 1 approver2_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default)as reporting_2name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default)from EMPLOYEEMASTER em4 where em4.EMPCODE collate database_default = (SELECT TOP 1 approver3_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_3name,
	 1 as is_profile_filled,
	 concat(EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) as Emp_Name,
	 EMPCODE as EMP_Code,
	 Section as Section,
	 Location as Location,
	 MOBILE_NO as Mobile,
	 branch as BranchCode from EMPLOYEEMASTER em2 WHERE EMPCODE='${emp_code}'`;

    const result = await sequelize.query(sql);
    if (result[0][0]) {
      const payload = { User: emp_code, User: "Mobile App user" };
      const email = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "8h",
      });
      return res.status(200).send({
        Status: "true",
        Message: "Success",
        Query: "",
        Result: { ...result[0][0], compCode: req.headers.compcode, token: email },
      });
    }

  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.uploadMisspunch = async function (req, res) {
  console.log(req.body, 'bidy');
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.body.empCode;
    const compCode = req.headers.compcode;
    const date = req.body.date;

    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (date == "" || date == undefined || date == null) {
      return res.status(500).send({
        status: false,
        Message: "date is mandatory",
      });
    }
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
    for (const [index, data] of EMP_DOCS_data.entries()) {
      const Result = await sequelize.query(
        `INSERT INTO EMP_DOCS(EMP_CODE,DOC_NAME,DOC_PATH,columndoc_type,dateOffice,misspunch_inout)VALUES('${candCode}','${data.DOC_NAME
        }','${data.DOC_PATH}','Misspunch','${date}',${data.misspunch_inout})`
      );
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
exports.getMispunch_Employee_new = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EMPCODE = req.query.EMPCODE ? req.query.EMPCODE : "";
    const Appr_Code = req.query.Appr_Code;
    const StartDate = req.query.StartDate;
    const EndDate = req.query.EndDate;
    const result =
      await sequelize.query(`SELECT top 1  EMPCODE, approver1_A	,approver1_B	,approver2_A	,approver2_B, approver3_A,	approver3_B,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver1_A collate database_default) as r1AName , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver1_B collate database_default) as r1BName ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver2_A collate database_default) as r2AName , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver2_B collate database_default) as r2BName  ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver3_A collate database_default) as r3AName  ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver3_B collate database_default) as r3BName  
    FROM Approval_Matrix e WHERE EMPCODE = '${EMPCODE}' and module_code='attdence'`);
    let allreq;
    if (EMPCODE && EMPCODE !== "") {
      allreq = 1;
    } else {
      allreq = 2;
    }
    let b = "";
    if (result && allreq === 1) {
      let ApprovalLevel = 0;
      const approver1_A = result[0][0]?.approver1_A?.toUpperCase();
      const approver2_A = result[0][0]?.approver2_A?.toUpperCase();
      const approver3_A = result[0][0]?.approver3_A?.toUpperCase();
      const approver1_B = result[0][0]?.approver1_B?.toUpperCase();
      const approver2_B = result[0][0]?.approver2_B?.toUpperCase();
      const approver3_B = result[0][0]?.approver3_B?.toUpperCase();

      if (
        approver1_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver1_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 1;
      } else if (
        approver2_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver2_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 2;
      } else if (
        approver3_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver3_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        console.log(approver3_A?.toUpperCase());
        console.log(Appr_Code?.toUpperCase());

        ApprovalLevel = 3;
      }
      let q = ``;
      if (StartDate && StartDate != "" && EndDate && EndDate != "") {
        q = `AND at.dateoffice between '${StartDate}' and '${EndDate}'`;
      }

      b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
      (Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
      (Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
       ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
       at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
       at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,
       at.LeaveValue,em.Prob_Period,at.MAN_APPR,1 as status_khud_ka,at.Man_Rej,
       IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
       (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
       (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
       iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
       iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
       iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
       iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by
       FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
       WHERE (in2 is not null or out2 is not null) and at.emp_code = '${EMPCODE}' ${q} ORDER BY at.DateOffice desc`;

      if (Appr_Code && Appr_Code != "") {
        b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
				(Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
				(Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
				 ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
				 at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
				 at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,at.Man_Rej,
				 at.LeaveValue,em.Prob_Period,at.MAN_APPR,Appr_${ApprovalLevel}_Stat as status_khud_ka,
				 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
				 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
				 iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
				 iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
				 iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
				 iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
				 IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat
				 FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
				 WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and (in2 is not null or out2 is not null) and at.emp_code = '${EMPCODE}' ORDER BY at.DateOffice desc`;

        if (ApprovalLevel > 1) {
          b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
          (Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
          (Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
           ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
           at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
           at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,at.Man_Rej,
           at.LeaveValue,em.Prob_Period,at.MAN_APPR,Appr_${ApprovalLevel}_Stat as status_khud_ka,
           (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
           (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
           iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
           iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
           iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
           iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
           IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat
           FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
           WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and (in2 is not null or out2 is not null) 
           and at.emp_code = '${EMPCODE}' and at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
           at.utd not in (select utd from attendancetable where Appr_${ApprovalLevel - 1
            }_Stat is null and man_appr='N' and man_rej = 'N')
            ORDER BY at.DateOffice desc`;
        }
      }
    }

    if (allreq == 2 && Appr_Code && Appr_Code != "") {
      b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
			(Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
			(Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
			 ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
			 at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
			 at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,
			 at.LeaveValue,em.Prob_Period,at.MAN_APPR,at.Man_Rej,
			 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
			 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
			 iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
			 iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
			 iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
			 iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
    		 IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
			 iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver1_A, approver1_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver2_A, approver2_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver3_A, approver3_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka
			 FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
			 WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and (in2 is not null or out2 is not null) and 
			 ((at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver1_A, approver1_B) and module_code = 'attdence'))
			 or (at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver2_A, approver2_B) and module_code = 'attdence') and  at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
				 at.utd not in (select utd from attendancetable where Appr_1_Stat is null and man_appr='N' and man_rej = 'N')) or
			 (at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver3_A	,approver3_B) and module_code = 'attdence')  and at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
				 at.utd not in (select utd from attendancetable where Appr_2_Stat is null and man_appr='N' and man_rej = 'N')))
			 ORDER BY at.DateOffice desc`;
    }

    const a = await sequelize.query(b);
    let data = [];

    a[0].forEach((rowData) => {
      let row = {
        EmpCode: rowData.Code_ ? rowData.Code_.trim() : "",
        EmpName: rowData.EmpName ? rowData.EmpName.trim() : "",
        EmployeeDesignation: rowData.EmployeeDesignation
          ? rowData.EmployeeDesignation.trim()
          : "",
        StTime: rowData.StTime ? rowData.StTime.toString() : "",
        EndTime: rowData.EndTime ? rowData.EndTime.toString() : "",
        Date: new Date(rowData.Date_).toLocaleDateString("en-IN"),
        In1: new Date(rowData.In2).toISOString().substr(11, 5),
        Out1: new Date(rowData.Out2).toISOString().substr(11, 5),
        In1Mannual: rowData.In1Mannual ? rowData.In1Mannual : null,
        Out1Mannual: rowData.Out1Mannual ? rowData.Out1Mannual : null,
        MAN_APPR: rowData.MAN_APPR,
        Man_Rej: rowData.Man_Rej ? rowData.Man_Rej : null,
        AtnStatus: rowData.Status,
        fileIn: rowData.fileIn
          ? `https://erp.autovyn.com/backend/fetch?filePath=${rowData.fileIn}`
          : null,
        fileOut: rowData.fileOut
          ? `https://erp.autovyn.com/backend/fetch?filePath=${rowData.fileOut}`
          : null,
        MI_Remark: rowData.MI_Remark,
        Mipunch_Reason: rowData.Mipunch_Reason,
        Utd: rowData.Utd,
        head_remark: rowData.head_remark,
        head_remark_by: rowData.Head_remark_by,
        stat: rowData.stat,
        status_khud_ka: rowData.status_khud_ka,
        Spl_Remark: rowData.spl_remark,
        spl_remark: rowData.spl_remark,
      };
      data.push(row);
    });
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: data,
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
exports.ApproveAttendance_New = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const EMPCODE = req.query.EMPCODE;
    const Appr_Code = req.query.Appr_Code;
    const Utd = req.query.Utd;
    const ApproveOrRej = req.query.ApproveOrRej;
    const Remark = req.query.Remark;

    const a = await sequelize.query(
      `SELECT top 1 * from Approval_Matrix where empcode = '${EMPCODE}' and module_code='attdence'`
    );
    if (a[0]?.length > 0) {
      let ApprovalLevel = 0;
      const approver1_A = a[0][0].approver1_A?.toUpperCase();
      const approver2_A = a[0][0].approver2_A?.toUpperCase();
      const approver3_A = a[0][0].approver3_A?.toUpperCase();
      const approver1_B = a[0][0].approver1_B?.toUpperCase();
      const approver2_B = a[0][0].approver2_B?.toUpperCase();
      const approver3_B = a[0][0].approver3_B?.toUpperCase();

      if (approver1_A?.toUpperCase() == Appr_Code?.toUpperCase() || approver1_B?.toUpperCase() == Appr_Code?.toUpperCase()) {
        ApprovalLevel = 1;
      } else if (approver2_A?.toUpperCase() == Appr_Code?.toUpperCase() || approver2_B?.toUpperCase() == Appr_Code?.toUpperCase()) {
        ApprovalLevel = 2;
      } else if (approver3_A?.toUpperCase() == Appr_Code.toUpperCase() || approver3_B?.toUpperCase() == Appr_Code?.toUpperCase()) {
        ApprovalLevel = 3;
      }

      if (ApproveOrRej == 1) {
        var asd = ApprovalLevel == 1 ? 1 : ApprovalLevel - 1;
        let result1 = ``;
        if (ApprovalLevel == 1) {
          result1 = `UPDATE attendancetable 
        SET Appr_${ApprovalLevel}_Stat = 1,
        Appr_${ApprovalLevel}_Code = '${Appr_Code}', 
        Appr_${ApprovalLevel}_Rem = '${Remark}' ,mi_type = 1
        WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat IS NULL and man_appr !='Y'`;
        } else {
          result1 = `UPDATE attendancetable 
        SET Appr_${ApprovalLevel}_Stat = 1,
         Appr_${ApprovalLevel}_Code = '${Appr_Code.toUpperCase()}', 
        Appr_${ApprovalLevel}_Rem = '${Remark}' 
        WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat IS NULL and Appr_${asd}_Stat is not null`;
        }
        await sequelize.query(result1);
        if (ApprovalLevel == 1) {
          response.Message = "Approval 1 Updated Successfully";
        } else if (ApprovalLevel == 2) {
          response.Message = "Approval 2 Updated Successfully";
        } else if (ApprovalLevel == 3) {
          response.Message = "Approval 3 Updated Successfully";
        }
        let Finalresult = ``;
        if (ApprovalLevel == 3) {
          Finalresult = await sequelize.query(`UPDATE attendancetable 
                                    SET man_appr = 'Y'
                                    WHERE  Utd IN (${Utd}) and man_appr = 'N'`);

          response.Message = "Final Approval Done";
        } else if (
          ApprovalLevel == 2 &&
          !a[0][0].approver3_A &&
          !a[0][0].approver3_B
        ) {
          Finalresult = await sequelize.query(`UPDATE attendancetable 
                                    SET man_appr = 'Y'  
                                    WHERE  Utd IN (${Utd}) and man_appr = 'N'`);

          response.Message = "Final Approval Done";
        } else if (
          ApprovalLevel == 1 &&
          !a[0][0].approver3_A &&
          !a[0][0].approver3_B &&
          !a[0][0].approver2_A &&
          !a[0][0].approver2_B
        ) {
          Finalresult = await sequelize.query(`UPDATE attendancetable 
                                    SET man_appr = 'Y'  
                                    WHERE  Utd IN (${Utd}) and man_appr = 'N'`);

          response.Message = "Final Approval Done";
        }
      } else {
        var asd = ApprovalLevel == 1 ? 1 : ApprovalLevel - 1;
        let result2 = ``;
        if (ApprovalLevel == 1) {
          result2 = `UPDATE attendancetable 
          SET Appr_${ApprovalLevel}_Stat = 0,
          Appr_${ApprovalLevel}_Code = '${Appr_Code.toUpperCase()}', 
          Appr_${ApprovalLevel}_Rem = '${Remark}',
          man_appr = null, in1mannual = null, out1mannual = null,  Man_Rej='Y',        
          Reject_By = '${Appr_Code.toUpperCase()}'
          WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat is null and man_appr !='Y'`;
        } else {
          result2 = `UPDATE attendancetable 
              SET Appr_${ApprovalLevel}_Stat = 0,
              Appr_${ApprovalLevel}_Code = '${Appr_Code.toUpperCase()}', 
              Appr_${ApprovalLevel}_Rem = '${Remark}',
              man_appr = null, in1mannual = null, out1mannual = null,  Man_Rej='Y',
              Reject_By='${Appr_Code.toUpperCase()}'
              WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat is null and Appr_${asd}_Stat is not null`;
        }
        await sequelize.query(result2);
        const Reject =
          await sequelize.query(`INSERT INTO Man_Reject SELECT att.EMP_CODE, att.dateoffice, 
            SUBSTRING(REPLACE(CONVERT(VARCHAR, att.In1, 108), ':', '.'),0,5) AS In1_Time, 
            SUBSTRING(REPLACE(CONVERT(VARCHAR, att.In1, 108), ':', '.'),0,5) AS In2_Time, 
            '${Appr_Code.toUpperCase()}' AS Some_Column FROM attendancetable AS att WHERE att.Utd IN (${Utd})`);
        response.Message = "Final Rejection completed";
      }
    }
    res.status(200).send({
      Status: true,
      Message: response.Message,
      Query: "",
      Result: {},
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while Updating Status data",
      Query: "",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.checkLogin = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.query, 'askdjlkasjd');
  try {
    const emp_code = req.query.empCode;
    const mobimei = req.query.mobimei;
    const mobandid = req.query.mobandid;
    let abcd = 1;
    if (mobimei && mobimei !== "") {
      abcd = 0;
    } else if (mobandid && mobandid !== "") {
      abcd = 0;
    }
    if (abcd) {
      return res.status(200).send({
        Status: "false",
        Message: "Device permission needed please give the requested permissions",
        Query: "",
        Result: {},
      });
    }
    let sql =
      `select (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em1 where em1.EMPCODE collate database_default = (	 SELECT TOP 1 approver1_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_1name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em3 where em3.EMPCODE collate database_default = (SELECT TOP 1 approver2_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default)as reporting_2name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default)from EMPLOYEEMASTER em4 where em4.EMPCODE collate database_default = (SELECT TOP 1 approver3_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_3name,
	 1 as is_profile_filled,
	 concat(EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) as Emp_Name,
	 EMPCODE as EMP_Code,
	 Section as Section,
	 IEMI as IMEI,
	 ANDROID_ID as ANDROIDID,
	 CORPORATEMAILID as Email,
	 Location as Location,
	 MOBILE_NO as Mobile,
	 branch as BranchCode from EMPLOYEEMASTER em2 WHERE EMPCODE='${emp_code}'`;

    if (mobimei && mobimei !== "") {
      sql += ` AND IEMI=trim('${mobimei}')`;
    } else if (mobandid && mobandid !== "") {
      sql += ` AND Android_ID=trim('${mobandid}')`;
    }

    if (
      mobandid.trim() === "590513be7fcf70cd" ||
      mobandid.trim() === "6ba7d0742894b2de" ||
      mobandid.trim() === "590513be7fcf70cd" ||
      mobimei.trim() === "860252043969654" ||
      mobandid.trim() === "1422b35be400a146" ||
      mobandid.trim() === "a4493269d5764d90" ||
      mobandid.trim() === "b9147e7853378da7" ||
      mobimei.trim() === "869897040171851" ||
      mobandid.trim() === "a4493269d5764d90" ||
      mobandid.trim() === "ebf57f81b0e572fd" ||
      mobandid.trim() === "0e5bb56fdff2a767" ||
      mobandid.trim() === "30980c24cc127d97" ||
      mobandid.trim() === "39abf50e851a94d9" ||
      mobandid.trim() === "1a61362967f609be" ||
      mobandid.trim() === "92ec280de1d7e21f" ||
      mobandid.trim() === "65485a4bb337a2e2" ||
      mobandid.trim() === "a7662eb664564664" ||
      mobandid.trim() === "0938749fdb40614f" ||
      mobandid.trim() === "9da374901d164294" ||
      mobandid.trim() === "e57e421b0521fbe2" || // yuvraj sir
      mobandid.trim() === "d066a558296448ca" || // Khushi Maheshwari
      mobandid.trim() === "f4eb73f67ce3b1d7" ||
      mobandid.trim() === "05095936ac40ebc9" || // Komal Mam

      emp_code == "3080"
    ) {
      const result =
        await sequelize.query(`select (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em1 where em1.EMPCODE collate database_default = (	 SELECT TOP 1 approver1_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_1name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em3 where em3.EMPCODE collate database_default = (SELECT TOP 1 approver2_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default)as reporting_2name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default)from EMPLOYEEMASTER em4 where em4.EMPCODE collate database_default = (SELECT TOP 1 approver3_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_3name,
	 1 as is_profile_filled,
	 concat(EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) as Emp_Name,
	 EMPCODE as EMP_Code,
	 Section as Section,
	 IEMI as IMEI,
	 ANDROID_ID as ANDROIDID,
	 CORPORATEMAILID as Email,
	 Location as Location,
	 MOBILE_NO as Mobile,
	 branch as BranchCode
	 from EMPLOYEEMASTER em2 where EMPCODE='${emp_code}'`);
      if (result[0][0]) {
        const payload = { User: emp_code, User: "Mobile App user" };
        const email = jwt.sign(payload, process.env.SECRET_KEY, {
          expiresIn: "8h",
        });
        return res.status(200).send({
          Status: "true",
          Message: "Success",
          Query: "",
          Result: { ...result[0][0], compCode: req.headers.compcode, token: email },
        });
      } else {
        return res.status(200).send({ "Status": "false", "Message": "No Records Available", "Query": "", "Result": {} });
      }
    }
    const result = await sequelize.query(sql);
    if (result[0][0]) {
      const payload = { User: emp_code, User: "Mobile App user" };
      const email = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "8h",
      });
      return res.status(200).send({
        Status: "true",
        Message: "Success",
        Query: "",
        Result: { ...result[0][0], compCode: req.headers.compcode, token: email },
      });
    } else {
      let sql1 =
        `select (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em1 where em1.EMPCODE collate database_default = (	 SELECT TOP 1 approver1_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_1name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) from EMPLOYEEMASTER em3 where em3.EMPCODE collate database_default = (SELECT TOP 1 approver2_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default)as reporting_2name,
      (select top 1 concat(Empcode collate database_default,' ',EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default)from EMPLOYEEMASTER em4 where em4.EMPCODE collate database_default = (SELECT TOP 1 approver3_A FROM Approval_Matrix WHERE EMPCODE = '${emp_code}' AND module_code = 'attdence') collate database_default) as reporting_3name,
	 1 as is_profile_filled,
	 concat(EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) as Emp_Name,
	 EMPCODE as EMP_Code,
	 Section as Section,
	 IEMI as IMEI,
	 ANDROID_ID as ANDROIDID,
	 CORPORATEMAILID as Email,
	 Location as Location,
	 MOBILE_NO as Mobile,
	 branch as BranchCode from EMPLOYEEMASTER em2 WHERE EMPCODE='${emp_code}'`;
      const result = await sequelize.query(sql1);

      if (result[0][0]) {
        if (!result[0][0].ANDROIDID && !result[0][0].IMEI) {
          let checkiemi;
          if (mobandid.trim()) {
            checkiemi = await sequelize.query(`select * from employeemaster where android_id = '${mobandid.trim()}'`)
          } else {
            checkiemi = await sequelize.query(`select * from employeemaster where IEMI='${mobimei.trim()}' `)
          }
          if (!checkiemi[0][0]) {
            if (mobandid.trim()) {
              await sequelize.query(`update employeemaster set ANDROID_ID = '${mobandid.trim()}' where empcode = '${emp_code}'`)
            } else {
              await sequelize.query(`update employeemaster set IEMI = '${mobimei.trim()}' where empcode = '${emp_code}'`)
            }
            const payload = { User: emp_code, User: "Mobile App user" };
            const email = jwt.sign(payload, process.env.SECRET_KEY, {
              expiresIn: "8h",
            });
            result[0][0].ANDROIDID = mobandid.trim();
            result[0][0].IMEI = mobimei.trim();

            return res.status(200).send({
              Status: "true",
              Message: "Success",
              Query: "",
              Result: { ...result[0][0], compCode: req.headers.compcode, token: email },
            });
          } else {
            return res.status(200).send({ "Status": "false", "Message": "Your Id is not verified on this mobile Phone", "Query": "", "Result": {} });
          }

        } else {
          return res.status(200).send({ "Status": "false", "Message": "Your Id is not verified on this mobile Phone", "Query": "", "Result": {} });
        }

      } else {
        return res.status(200).send({ "Status": "false", "Message": "Employee Id is not Available", "Query": "", "Result": {} });
      }

    }

  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.updateFcm = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    const FCM_TOKEN = req.query.FCM_TOKEN;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (FCM_TOKEN == "" || FCM_TOKEN == undefined || FCM_TOKEN == null) {
      return res.status(500).send({
        status: false,
        Message: "FCM_TOKEN  is mandatory",
      });
    }
    await sequelize.query(
      `update employeemaster set FCM_TockenId ='${FCM_TOKEN}' where empcode = '${candCode}' and export_type < 3`
    );
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
exports.getPendingAppList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EMPCODE = req.query.EMPCODE ? req.query.EMPCODE : "";
    const Appr_Code = req.query.Appr_Code;
    const StartDate = req.query.StartDate;
    const EndDate = req.query.EndDate;
    const result =
      await sequelize.query(`SELECT top 1  EMPCODE, approver1_A	,approver1_B	,approver2_A	,approver2_B, approver3_A,	approver3_B,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver1_A collate database_default) as r1AName , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver1_B collate database_default) as r1BName ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver2_A collate database_default) as r2AName , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver2_B collate database_default) as r2BName  ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver3_A collate database_default) as r3AName  ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver3_B collate database_default) as r3BName  
    FROM Approval_Matrix e WHERE EMPCODE = '${EMPCODE}' and module_code='attdence'`);
    let allreq;
    if (EMPCODE && EMPCODE !== "") {
      allreq = 1;
    } else {
      allreq = 2;
    }
    let b = "";
    if (result && allreq === 1) {
      let ApprovalLevel = 0;
      const approver1_A = result[0][0]?.approver1_A?.toUpperCase();
      const approver2_A = result[0][0]?.approver2_A?.toUpperCase();
      const approver3_A = result[0][0]?.approver3_A?.toUpperCase();
      const approver1_B = result[0][0]?.approver1_B?.toUpperCase();
      const approver2_B = result[0][0]?.approver2_B?.toUpperCase();
      const approver3_B = result[0][0]?.approver3_B?.toUpperCase();

      if (
        approver1_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver1_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 1;
      } else if (
        approver2_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver2_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 2;
      } else if (
        approver3_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver3_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        console.log(approver3_A?.toUpperCase());
        console.log(Appr_Code?.toUpperCase());

        ApprovalLevel = 3;
      }
      let q = ``;
      if (StartDate && StartDate != "" && EndDate && EndDate != "") {
        q = `AND at.dateoffice between '${StartDate}' and '${EndDate}'`;
      }

      b = `SELECT at.Utd,at.In_Latitude,at.In_Longitude,at.Out_Latitude,at.Out_Longitude, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
      (Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
      (Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
       ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
       at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
       at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,
       at.LeaveValue,em.Prob_Period,at.MAN_APPR,1 as status_khud_ka,at.Man_Rej,at.App_in1,at.App_out1,
       IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
      at.in_photo,at.out_photo, iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
       iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
       iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
       iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by
       FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
       WHERE (app_in1 is not null or app_out1 is not null) and at.emp_code = '${EMPCODE}' ${q} ORDER BY at.DateOffice desc`;

      if (Appr_Code && Appr_Code != "") {
        b = `SELECT at.Utd,at.In_Latitude,at.In_Longitude,at.Out_Latitude,at.Out_Longitude, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
				(Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
				(Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
				 ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
				 at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
				 at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,at.Man_Rej,at.App_in1,at.App_out1,
				 at.LeaveValue,em.Prob_Period,at.MAN_APPR,Appr_${ApprovalLevel}_Stat as status_khud_ka,
				at.in_photo,at.out_photo, iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
				 iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
				 iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
				 iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
				 IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat
				 FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
				 WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and (app_in1 is not null or app_out1 is not null) and at.emp_code = '${EMPCODE}' ORDER BY at.DateOffice desc`;

        if (ApprovalLevel > 1) {
          b = `SELECT at.Utd,at.In_Latitude,at.In_Longitude,at.Out_Latitude,at.Out_Longitude, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
          (Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
          (Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
           ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
           at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
           at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,at.Man_Rej,at.App_in1,at.App_out1,
           at.LeaveValue,em.Prob_Period,at.MAN_APPR,Appr_${ApprovalLevel}_Stat as status_khud_ka,
          at.in_photo,at.out_photo,  iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
           iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
           iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
           iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
           IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat
           FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
           WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and (app_in1 is not null or app_out1 is not null)  
           and at.emp_code = '${EMPCODE}' and at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
           at.utd not in (select utd from attendancetable where Appr_${ApprovalLevel - 1
            }_Stat is null and man_appr='N' and man_rej = 'N')
            ORDER BY at.DateOffice desc`;
        }
      }
    }

    if (allreq == 2 && Appr_Code && Appr_Code != "") {
      b = `SELECT at.Utd,at.In_Latitude,at.In_Longitude,at.Out_Latitude,at.Out_Longitude, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
			(Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
			(Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
			 ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
			 at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
			 at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,
			 at.LeaveValue,em.Prob_Period,at.MAN_APPR,at.Man_Rej,at.App_in1,at.App_out1,
			at.in_photo,at.out_photo, iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
			 iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
			 iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
			 iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
    		 IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
			 iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver1_A, approver1_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver2_A, approver2_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver3_A, approver3_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka
			 FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
			 WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and (app_in1 is not null or app_out1 is not null)  and 
			 ((at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver1_A, approver1_B) and module_code = 'attdence'))
			 or (at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver2_A, approver2_B) and module_code = 'attdence') and  at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
				 at.utd not in (select utd from attendancetable where Appr_1_Stat is null and man_appr='N' and man_rej = 'N')) or
			 (at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver3_A	,approver3_B) and module_code = 'attdence')  and at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
				 at.utd not in (select utd from attendancetable where Appr_2_Stat is null and man_appr='N' and man_rej = 'N')))
			 ORDER BY at.DateOffice desc`;
    }

    const a = await sequelize.query(b);
    let data = [];

    a[0].forEach((rowData) => {
      let row = {
        EmpCode: rowData.Code_ ? rowData.Code_.trim() : "",
        EmpName: rowData.EmpName ? rowData.EmpName.trim() : "",
        EmployeeDesignation: rowData.EmployeeDesignation
          ? rowData.EmployeeDesignation.trim()
          : "",
        StTime: rowData.StTime ? rowData.StTime.toString() : "",
        EndTime: rowData.EndTime ? rowData.EndTime.toString() : "",
        Date: new Date(rowData.Date_).toLocaleDateString("en-IN"),
        In1: new Date(rowData.App_in1).toISOString().substr(11, 5),
        Out1: new Date(rowData.App_out1).toISOString().substr(11, 5),
        In1Mannual: rowData.In1Mannual ? rowData.In1Mannual : null,
        Out1Mannual: rowData.Out1Mannual ? rowData.Out1Mannual : null,
        MAN_APPR: rowData.MAN_APPR,
        Man_Rej: rowData.Man_Rej ? rowData.Man_Rej : null,
        AtnStatus: rowData.Status,
        fileIn: rowData.in_photo
          ? `https://erp.autovyn.com/backend/fetch?filePath=${rowData.in_photo}`
          : null,
        fileOut: rowData.out_photo
          ? `https://erp.autovyn.com/backend/fetch?filePath=${rowData.out_photo}`
          : null,
        MI_Remark: rowData.MI_Remark,
        Mipunch_Reason: rowData.Mipunch_Reason,
        Utd: rowData.Utd,
        head_remark: rowData.head_remark,
        head_remark_by: rowData.Head_remark_by,
        stat: rowData.stat,
        status_khud_ka: rowData.status_khud_ka,
        Spl_Remark: rowData.spl_remark,
        In_Latitude: rowData.In_Latitude,
        In_Longitude: rowData.In_Longitude,
        Out_Latitude: rowData.Out_Latitude,
        Out_Longitude: rowData.Out_Longitude,
      };
      data.push(row);
    });
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: data,
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
exports.AddPunchIN = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  const { empCode, date, time, in_address, latitude, longitude } = req.query;

  let response = {
    Status: false,
    Message: "",
  };

  try {
    if (!empCode) {
      response.Message = "Emp Code Is Mandatory";
    }

    if (!date) {
      response.Message = "Date Field Is Mandatory";
    }

    if (!time) {
      response.Message = "Time field Is Mandatory";
    }


    const attendanceDate = new Date(date);
    const formattedDate = `${attendanceDate.getFullYear()}-${attendanceDate.getMonth() + 1
      }-${attendanceDate.getDate()}`;

    const attendanceQuery = `SELECT App_In1 FROM attendancetable WHERE Emp_Code='${empCode}' AND dateoffice='${formattedDate}'`;
    const attendanceResult = await sequelize.query(attendanceQuery);

    if (attendanceResult[0].length > 0) {
      const tokenCheckQuery = `select * from Mobile_Rights where Emp_Code = '${empCode}' and Optn_Name = '1.1.5'`;
      const tokenCheckResult = await sequelize.query(tokenCheckQuery);
      
      if (tokenCheckResult[0].length > 0) {
        if (!attendanceResult[0][0].App_In1) {
          const updateQuery = `UPDATE attendancetable SET
              in1 = getDate(),
              App_In1 = GETDATE(), Device_in1 = GETDATE(), In_Latitude = '${latitude}', In_Longitude = '${longitude}', In_Add = '${in_address}',
              Mi_Type = 1,Man_Appr = 'Y',Man_Rej = 'N'
              WHERE Emp_Code ='${empCode}' AND dateoffice='${formattedDate}'`;
          await sequelize.query(updateQuery);
          response.Status = true;
          response.Message = "Record updated successfully!";
        } else {
          response.Message = "Already punched in.";
        }
      } else {
        if (!attendanceResult[0][0].App_In1) {
          const updateQuery = `UPDATE attendancetable SET
              in1 = getDate(),
              App_In1 = GETDATE(), Device_in1 = GETDATE(), In_Latitude = '${latitude}', In_Longitude = '${longitude}', In_Add = '${in_address}',
              MAN_APPR = 'N',
              gatepass = '0',
              man_rej='N',
              Appr_1_Code=null,
              Appr_2_Code=null,
              Appr_3_Code=null,
              Appr_3_Stat=null,
              Appr_2_Stat=null,
              Appr_1_Stat=null,
              Appr_1_Rem =null,
              Appr_2_Rem =null,
              Appr_3_Rem =null,
              Mi_Type =1
              WHERE Emp_Code ='${empCode}' AND dateoffice='${formattedDate}'`;
          await sequelize.query(updateQuery);
          response.Status = true;
          response.Message = "Record updated successfully!";
        } else {
          response.Message = "Already punched in.";
        }
      }


    } else {
      response.Message = "No Records Available";
    }

    res.status(200).json(response);
    await sequelize.close();
  } catch (error) {
    console.error("Error:", error);
    response.Message = error.message;
    res.status(500).json(response);
  }
};
exports.AddPunchOUT = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  const { empCode, date, time, out_address, latitude, longitude } = req.query;

  let response = {
    Status: false,
    Message: "",
  };

  try {
    if (!empCode) {
      response.Message = "Emp Code Is Mandatory";
    }

    if (!date) {
      response.Message = "Date Field Is Mandatory";
    }

    if (!time) {
      response.Message = "Time field Is Mandatory";
    }



    const attendanceDate = new Date(date);
    const formattedDate = `${attendanceDate.getFullYear()}-${attendanceDate.getMonth() + 1
      }-${attendanceDate.getDate()}`;

    const attendanceQuery = `SELECT App_Out1 FROM attendancetable WHERE Emp_Code='${empCode}' AND dateoffice='${formattedDate}'`;
    const attendanceResult = await sequelize.query(attendanceQuery);

    if (attendanceResult[0].length > 0) {
      const tokenCheckQuery = `select * from Mobile_Rights where Emp_Code = '${empCode}' and Optn_Name = '1.1.5'`;
      const tokenCheckResult = await sequelize.query(tokenCheckQuery);

      if (tokenCheckResult[0].length > 0) {
        if (!attendanceResult[0][0].App_Out1) {
          const updateQuery = `update attendancetable set
            Out1 = getDate(),Man_appr = 'Y',Man_Rej = 'N',
            App_Out1 = getdate(),Device_out1=getdate(),Out_Latitude = '${latitude}', Out_Longitude = '${longitude}', Out_Add = '${out_address}',
						Mi_Type =1 where Emp_Code='${empCode}' AND dateoffice='${formattedDate}'`;

          await sequelize.query(updateQuery);
          response.Status = true;
          response.Message = "Record updated successfully!";
        } else {
          response.Message = "Already punched Out.";
        }
      } else {

        if (!attendanceResult[0][0].App_Out1) {
          const updateQuery = `update attendancetable set
            Out1 = getDate(),
            App_Out1 = getdate(),Device_out1=getdate(),Out_Latitude = '${latitude}', Out_Longitude = '${longitude}', Out_Add = '${out_address}',
						MAN_APPR='N',
						man_rej='N',
						Appr_1_Code=null,
						Appr_2_Code=null,
						Appr_3_Code=null,
						Appr_3_Stat=null,
						Appr_2_Stat=null,
						Appr_1_Stat=null,
						Appr_1_Rem =null,
						Appr_2_Rem =null,
						Appr_3_Rem =null, 
						Mi_Type =1,
						gatepass='0' where Emp_Code='${empCode}' AND dateoffice='${formattedDate}'`;
          await sequelize.query(updateQuery);
          response.Status = true;
          response.Message = "Record updated successfully!";
        } else {
          response.Message = "Already punched Out.";
        }
      }

    } else {
      response.Message = "No Records Available";
    }

    res.status(200).json(response);
    await sequelize.close();
  } catch (error) {
    console.error("Error:", error);
    response.Message = error.message;
    res.status(500).json(response);
  }
};
exports.uploadAttendance = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.body.empCode;
    const compCode = req.headers.compcode;

    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const finalFolderPath = path.join(
      compCode?.split("-")[0]?.toLowerCase(),
      new Date().getFullYear().toString(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      String(new Date().getDate()).padStart(2, "0"),
      "punching"
    );
    console.log(finalFolderPath);
    const EMP_DOCS_data = await uploadImages(
      req.files,
      finalFolderPath,
      candCode,
      candCode,
      candCode
    );
    for (const [index, data] of EMP_DOCS_data.entries()) {
      if (data.misspunch_inout == 1) {
        const Result = await sequelize.query(
          `update attendancetable set in_photo = '${data.DOC_PATH}' where Emp_Code='${candCode}' and CONVERT(date, dateoffice) = CONVERT(date, GETDATE())`
        );
      } else {
        const Result = await sequelize.query(
          `update attendancetable set out_photo = '${data.DOC_PATH}' where Emp_Code='${candCode}' and CONVERT(date, dateoffice) = CONVERT(date, GETDATE())`
        );
      }
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
exports.GetDeviceLog = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const LogDate = req.query.LogDate;
    const RAppDateArr = LogDate.split("-");
    const Logday = RAppDateArr[2];
    const Logmnth = RAppDateArr[1];
    const Logyear = RAppDateArr[0];
    const result = await sequelize.query(
      `SELECT (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) AS location,
      cast((SELECT MISC_CODE FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) as varchar) AS location_code,
      iif(max(out1) is null,max(in1),iif(MAX(IN1)>MAX(OUT1),MAX(IN1),MAX(OUT1))) as last_ping , '${LogDate}' as LogDate
      FROM attendancetable,EMPLOYEEMASTER 
      WHERE emp_code=empcode and MONTH(DATEOFFICE)='${Logmnth}'  and day(dateoffice)='${Logday}' and year(dateoffice)='${Logyear}' GROUP BY LOCATION order by LAST_Ping DESC`
    );
    result[0][0].LogDate = LogDate;
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetDeviceLogDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const LogDate = req.query.LogDate;
    const location_code = req.query.location_code;
    // const result = await sequelize.query(
    //   `SELECT (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) AS location, 
    //   emp_code,EMPFIRSTNAME as emp_name, IN1, OUT1 FROM attendancetable,EMPLOYEEMASTER 
    //   WHERE DATEOFFICE='${LogDate}' 
    //   AND EMP_CODE=EMPCODE 
    //   AND LOCATION = '${location_code}'`
    // );
    const result = await sequelize.query(
      `SELECT 
    (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE = 85 AND LOCATION = MISC_CODE) AS location, 
    emp_code,
    EMPFIRSTNAME AS emp_name, 
    DATEADD(HOUR, -5, DATEADD(MINUTE, -30, IN1)) AS IN1, 
    DATEADD(HOUR, -5, DATEADD(MINUTE, -30, OUT1)) AS OUT1
  FROM 
    attendancetable,EMPLOYEEMASTER 
      WHERE DATEOFFICE='${LogDate}' 
      AND EMP_CODE=EMPCODE 
      AND LOCATION = '${location_code}'`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.updateEmpLocation = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const { empCode, latitude, longitude, deviceSpeed, gpsAccuracy, address } =
    req.query;
  let response = {
    Status: false,
    Message: "",
  };
  try {

    let error_flag = false;
    let error_message = "";

    if (!empCode) {
      error_flag = true;
      error_message = "Emp Code Is Mandatory";
    }

    if (error_flag) {
      response.Status = false;
      response.Message = error_message;
    } else {
      const sqlupdateAtt = `INSERT INTO EMP_TRACK (EMP_CODE, LATITUDE, LONGITUDE, DEVICESPEED, GPSACCURACY, GEO_LOCATION) VALUES ('${empCode}', '${latitude}', '${longitude}', '${deviceSpeed}', '${gpsAccuracy}', '${address}')`;
      await sequelize.query(sqlupdateAtt);

      response.Status = true;
      response.Message = "Record inserted successfully!";
    }
    res.status(200).send(response);
  } catch (error) {
    console.error("Error:", error);
    response.Message = error.message;
    res.status(500).json(response);
  }
};
exports.viewTravelExpence = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    const Appr_Code = req.query.Appr_Code;
    console.log(req.query)
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }

    const Result1 =
      await sequelize.query(`SELECT EMPCODE, Reporting_1, Reporting_2, Reporting_3,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.Reporting_1 collate database_default) as r1Name , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.Reporting_2 collate database_default) as r2Name ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.Reporting_3 collate database_default) as r3Name  
    FROM EMPLOYEEMASTER e WHERE EMPCODE = '${candCode}'`);
    const employee = Result1[0][0];
    let ApprovalLevel = 0;

    if (
      employee.Reporting_1.localeCompare(Appr_Code, undefined, {
        sensitivity: "base",
      }) === 0 &&
      Appr_Code !== ""
    ) {
      ApprovalLevel = 1;
    } else if (
      employee.Reporting_2.localeCompare(Appr_Code, undefined, {
        sensitivity: "base",
      }) === 0 &&
      Appr_Code !== ""
    ) {
      ApprovalLevel = 2;
    } else if (
      employee.Reporting_3.localeCompare(Appr_Code, undefined, {
        sensitivity: "base",
      }) === 0 &&
      Appr_Code !== ""
    ) {
      ApprovalLevel = 3;
    }
    console.log(ApprovalLevel);
    let QUERY = `SELECT tran_id,Inv_Date,Emp_Name,spl_remark,
			(select count(*) from TRAVEL_DTL where tran_id = t.tran_id) as exp_count,
			(select top 1 loc_code from TRAVEL_DTL where tran_id = t.tran_id) as loc_code,
			(select cast(sum(Expenses)as varchar) from TRAVEL_DTL where tran_id = t.tran_id) as exp_sum,
			(select top 1 status  from (
			select iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4)status,SrNo,Tran_Id from TRAVEL_DTL
			) as q  where tran_id = t.Tran_Id order by status) as stat
			from TRAVEL_MST t where empcode = '${candCode}' order by tran_id desc;
			`;
    if (Appr_Code !== undefined && Appr_Code !== "") {
      QUERY = `SELECT tran_id,Inv_Date,Emp_Name,spl_remark,
				(select count(*) from TRAVEL_DTL where tran_id = t.tran_id) as exp_count,
				(select top 1 loc_code from TRAVEL_DTL where tran_id = t.tran_id) as loc_code,
				(select cast(sum(Expenses)as varchar) from TRAVEL_DTL where tran_id = t.tran_id) as exp_sum,
				(select top 1 status  from (
				select iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4)status,SrNo,Tran_Id from TRAVEL_DTL
				) as q  where tran_id = t.Tran_Id order by status) as stat
				from TRAVEL_MST t where empcode = '${candCode}' 
				AND tran_id IN (SELECT tran_id FROM TRAVEL_DTL WHERE fin_appr IS NULL) order by tran_id desc;
				`;
      if (ApprovalLevel > 1) {
        QUERY = `SELECT tran_id,Inv_Date,Emp_Name,spl_remark,
			(select count(*) from TRAVEL_DTL where tran_id = t.tran_id) as exp_count,
				(select top 1 loc_code from TRAVEL_DTL where tran_id = t.tran_id) as loc_code,
			(select cast(sum(Expenses)as varchar) from TRAVEL_DTL where tran_id = t.tran_id) as exp_sum,
			(select top 1 status  from (
				select iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4)status,SrNo,Tran_Id from TRAVEL_DTL
				) as q  where tran_id = t.Tran_Id order by status) as stat
			from TRAVEL_MST t where empcode = '${candCode}' 
			AND tran_id IN (SELECT tran_id FROM TRAVEL_DTL WHERE fin_appr IS NULL )
			AND tran_id NOT IN (SELECT tran_id FROM TRAVEL_DTL WHERE  Appr_${ApprovalLevel - 1
          }_Stat is null and Fin_Appr is null) order by tran_id desc
			`;
      }
    }
    const Result = await sequelize.query(QUERY);

    const originalResult = await Promise.all(
      Result[0].map(async (obj) => {
        let NEXT_QUERY = `select SrNo,Tran_Id,Exp_Date,(select top 1 misc_name from misc_mst where misc_code = Exp_Type and Misc_Type = 611) as Exp_Type,cast(Expenses as varchar)as Expenses,cast (Exp_Limit as varchar) as Exp_Limit,
			 Loc_Code as loc_name,Remark,Fin_Appr as status,Fin_Appr as act_status,
			iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
 			iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
			iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
			iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
			(select top 1 doc_path from emp_docs where emp_code =cast (tran_id as varchar ) and misspunch_inout=srno) as image
			from travel_dtl where emp_code = '${candCode}' and tran_id = '${obj.tran_id}' order by srno`;
        if (Appr_Code !== undefined && Appr_Code !== "") {
          if (ApprovalLevel > 0) {
            NEXT_QUERY = `select SrNo,Tran_Id,Exp_Date,(select top 1 misc_name from misc_mst where misc_code = Exp_Type and Misc_Type = 611)as Exp_Type,cast(Expenses as varchar) as Expenses,cast (Exp_Limit as varchar) as Exp_Limit,
				Loc_Code as loc_name,Remark,Appr_${ApprovalLevel}_Stat as status,Fin_Appr as act_status,
				iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,
				iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
				iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
				iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
				(select top 1 doc_path from emp_docs where emp_code =cast (tran_id as varchar ) and misspunch_inout=srno) as image
				from travel_dtl where emp_code = '${candCode}' and tran_id = '${obj.tran_id}' order by srno`;
          }
          if (ApprovalLevel > 1) {
            NEXT_QUERY = `SELECT SrNo, Tran_Id, Exp_Date,
                (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_code = Exp_Type AND Misc_Type = 611) AS Exp_Type,
                cast(Expenses as varchar) as Expenses, cast (Exp_Limit as varchar) as Exp_Limit, Loc_Code AS loc_name,Fin_Appr as act_status,
                Remark,
				iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
				iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
				iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
				iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,
                CASE
                    WHEN Fin_Appr = 0 THEN 0
                    ELSE Appr_${ApprovalLevel}_Stat
                END AS status,
                (SELECT TOP 1 doc_path FROM emp_docs WHERE emp_code = CAST(tran_id AS VARCHAR) AND misspunch_inout = SrNo) AS image
            FROM travel_dtl
            WHERE emp_code = '${candCode}' AND tran_id = '${obj.tran_id}'
            ORDER BY SrNo`;
          }
        }
        const Result = await sequelize.query(NEXT_QUERY);

        return {
          Inv_Date: parseDate(obj.Inv_Date),
          exp_count: obj.exp_count,
          exp_sum: obj.exp_sum,
          Emp_Name: obj.Emp_Name,
          tran_id: obj.tran_id,
          loc_name: obj.loc_code,
          stat: obj.stat,
          Reporting_1: employee.r1Name,
          Reporting_2: employee.r2Name,
          Reporting_3: employee.r3Name,
          spl_remark: obj.spl_remark,
          TRAVEL_DTL: Result[0].map((obj1) => {
            return {
              ...obj1,
              Exp_Date: parseDate(obj1.Exp_Date),
            };
          }),
        };
      })
    );
    return res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: originalResult,
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
async function uploadImagesTravel(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    console.log(files);

    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/TRAVEL/`;
      const ext = path.extname(file.originalname);
      // Generate randomUUID
      const randomUUID = uuidv4();

      // Append extension to randomUUID
      const fileName = randomUUID + ext;
      console.log(fileName);
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
        console.log(`Image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
      }
      const data = {
        SRNO: index,
        EMP_CODE: Created_by,
        Created_by: Created_by,
        DOC_NAME: file.originalname,
        misspunch_inout: index,
        columndoc_type: "TRAVEL",
        DOC_PATH: `${customPath}${fileName}`,
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
exports.addTravelExpense = async function (req, res) {
  console.log("jiiiiiiii")
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {

    const empCode = req.body.empCode;
    const empName = req.body.empName;
    const remark = req.body.remark;
    const date = req.body.date;
    const expenseArray = JSON.parse(req.body.expenseArray);
    const missingFields = [];
    if (!empCode) missingFields.push("empCode");
    if (!empName) missingFields.push("empName");
    if (!remark) missingFields.push("remark");
    if (!date) missingFields.push("date");
    if (!expenseArray) missingFields.push("expenseArray");

    if (missingFields.length > 0) {
      return res.status(500).json({ error: "One or more required fields are missing.", missingFields });
    }
    const maxTranIdResult = await sequelize.query(`SELECT ISNULL(MAX(tran_id), 0)+1 AS max_tran_id FROM TRAVEL_MST;`);
    const maxTranId = maxTranIdResult[0][0].max_tran_id;
    const EMP_DOCS_data = await uploadImagesTravel(
      req.files,
      req.headers?.compcode?.split("-")[0],
      req.body.empCode,
    );
    console.log(EMP_DOCS_data);
    const values = EMP_DOCS_data.map((doc, index) => (
      `('${maxTranId}', '${doc.DOC_NAME}', '${doc.DOC_PATH}', '${doc.columndoc_type}', '${req.body.date}', ${parseInt(doc.misspunch_inout) + 1})`
    )).join(',');

    // Construct the query
    const query = `
      INSERT INTO EMP_DOCS (EMP_CODE, DOC_NAME, DOC_PATH, columndoc_type, dateOffice, misspunch_inout)
      VALUES ${values};
    `;
    console.log(query, 'query');

    await sequelize.query(`INSERT INTO TRAVEL_MST
      (tran_id, empcode, emp_name,
      desig_code,
      Created_By, Created_Date, Export_Type, Spl_Remark, inv_Date)
      VALUES
      (${maxTranId}, '${empCode}', '${empName}',
      (SELECT TOP 1 misc_code FROM misc_mst WHERE misc_name = (SELECT TOP 1 EMPLOYEEDESIGNATION FROM EMPLOYEEMASTER WHERE empcode = '${empCode}') AND misc_type = 95),
      '${empName}', GETDATE(), 1, '${remark}', '${date}');`, { transaction: t });

    for (let i = 0; i < expenseArray.length; i++) {
      const expense = expenseArray[i];
      console.log(expense)
      var jj = i + 1;
      await sequelize.query(`INSERT INTO travel_dtl
          (Tran_id, SrNo, Emp_Code, Exp_Date, Exp_Type,
          Exp_Limit, Expenses, Loc_Code, ServerId,
          Export_Type, Remark)
          VALUES
          (${maxTranId}, ${jj}, '${empCode}', '${expense.expenseDate}', '${expense.miscCode}',
          '${expense.expLimit}','${expense.expenseAmount}', '${expense.expenseLocation}', 1,
          1, '${expense.expenseRemark}');`, { transaction: t });
    }
    await sequelize.query(query, { transaction: t });
    await t.commit();
    // return;
    res.status(200).send({ Status: true, Message: "DATA SAVED" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ Status: false, Message: e.message });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}
exports.getExpenseTypeList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.candCode;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }

    const Result =
      await sequelize.query(`select Misc_Code,Misc_Name ,ISNULL((select top 1 MISC_NAME from misc_mst where misc_type=613 and m.Misc_Code = misc_hod 
      and
       Misc_Desig = (
          SELECT TOP 1 CAST(misc_code AS VARCHAR(255)) -- Adjust the length as needed
          FROM MISC_MST m1
          WHERE MISC_TYPE = '95'
          AND m1.MISC_NAME = (
              SELECT TOP 1 EMPLOYEEDESIGNATION
              FROM EMPLOYEEMASTER
              WHERE EMPCODE = '${candCode}'
          ))),m.misc_abbr) as exp_limit,'TE' as Is_MP from misc_mst m where misc_type=611`);

    const EMPLOYEEDATA = await sequelize.query(`SELECT TOP 1 EMPLOYEEDESIGNATION , concat(EMPFIRSTNAME collate database_default,' ',EMPLASTNAME collate database_default) as empName
    FROM EMPLOYEEMASTER
    WHERE EMPCODE = '${candCode}'`);


    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: Result[0],
      EMPLOYEEDATA: EMPLOYEEDATA[0][0]
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
exports.getEmpProfile = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const error_flag = false;
  let error_message = "";
  let emp_code = "";
  let result = {};
  let date_format = "DD-MM-YYYY";

  if (req.query.is_edit && req.query.is_edit === "1") {
    date_format = "MM/DD/YYYY";
  }
  try {
    if (req.query.empCode && req.query.empCode !== "") {
      emp_code = req.query.empCode;
    } else {
      error_flag = true;
      error_message = "Emp Code Is Mandatory \n";
    }
    if (error_flag === true) {
      result.Status = false;
      result.Message = error_message;
    } else {
      const sql_token_check = await sequelize.query(
        `SELECT * FROM EMPLOYEEMASTER where EMPCODE='${emp_code}' AND export_type < 3`
      );
      const resultData = sql_token_check[0][0];

      const lowerCaseResult = Object.keys(resultData).reduce((acc, key) => {
        acc[key.toLowerCase()] = resultData[key];
        return acc;
      }, {});
      const photos = await sequelize.query(
        `SELECT * FROM EMP_DOCS WHERE EMP_CODE= '${emp_code}' and columndoc_type='EMPLOYEE'`
      );
      const abcd = ['', 'profile', 'adhar', 'pan', 'salary', 'other'];
      photos[0].map((p) => {
        lowerCaseResult[abcd[p['misspunch_inout']]] = `http://cloud.autovyn.com:3000/fetch?filePath=${p['DOC_PATH']}`;
      })
      lowerCaseResult.compCode = req.headers.compCode;
      lowerCaseResult['p_city_name'] = await get_master_name(sequelize, lowerCaseResult['pcity'], 1);
      lowerCaseResult['c_city_name'] = await get_master_name(sequelize, lowerCaseResult['ccity'], 1);
      lowerCaseResult['p_state_name'] = await get_master_name(sequelize, lowerCaseResult['pstate'], 3);
      lowerCaseResult['c_state_name'] = await get_master_name(sequelize, lowerCaseResult['cstate'], 3);
      lowerCaseResult['f_occupation_name'] = await get_master_name(sequelize, lowerCaseResult['fatheroccupation'], 11);
      lowerCaseResult['division_name'] = await get_master_name(sequelize, lowerCaseResult['division'], 81);
      lowerCaseResult['region_name'] = await get_master_name(sequelize, lowerCaseResult['region'], 91);
      lowerCaseResult['section_name'] = await get_master_name(sequelize, lowerCaseResult['section'], 68);
      lowerCaseResult['location_name'] = await get_master_name(sequelize, lowerCaseResult['location'], 85);
      lowerCaseResult['precompcity_name'] = await get_master_name(sequelize, lowerCaseResult['precompcity'], 1);
      lowerCaseResult['emp_shift_name'] = await get_master_name(sequelize, lowerCaseResult['emp_shift'], 90);
      result.Status = true;
      result.Message = "Success";
      result.Query = "";
      result.Result = lowerCaseResult;
    }
  } catch (error) {
    result.Status = false;
    result.Message = "Token Expired";
  }

  res.json(result);
};
async function get_master_name(sequelize, master_code, misc_type) {

  if (master_code > 0) {
    const sql_misc = `SELECT * FROM misc_mst where misc_type=${misc_type} and Misc_Code='${master_code}' ORDER BY Misc_Name`;
    const stmt_misc = await sequelize.query(sql_misc);
    const a_misc = stmt_misc[0][0];
    if (a_misc) {
      return a_misc["Misc_Name"];
    } else {
      return "";
    }
  } else {
    return "";
  }
};
exports.updateEmpProfile = async function (req, res) {
};
exports.getCandidateDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    let error_flag = false;
    let error_message = "";
    let candCode = "";
    let result = [];
    let date_format = "DD-MM-YYYY";

    if (req.query.is_edit && req.query.is_edit === "1") {
      date_format = "MM/DD/YYYY";
    }

    if (req.query.candCode && req.query.candCode !== "") {
      candCode = req.query.candCode;
    } else {
      error_flag = true;
      error_message = "Can Code Is Mandatory";
    }

    if (error_flag) {
      res.status(400).json({
        status: false,
        message: error_message,
      });
    } else {
      const result = await sequelize.query(
        `SELECT * FROM Interview_Mst WHERE Candidate_Code='${candCode}'`
      );

      if (result[0].length > 0) {
        const candidateData = result[0][0];
        // Formatting date fields
        const dateFields = [
          "Pre_From1",
          "Pre_To1",
          "Pre_From2",
          "Pre_To2",
          "Pre_From3",
          "Pre_To3",
          "Pre_From4",
          "Pre_To4",
        ];
        dateFields.forEach((field) => {
          if (candidateData[field]) {
            candidateData[field] = candidateData[field]
              .toISOString()
              .split("T")[0];
          }
        });

        const docResult = await sequelize.query(
          `SELECT * FROM Candidate_Doc WHERE EMP_CODE='${candCode}'`
        );
        docResult[0].forEach((doc) => {
          candidateData[
            doc.columndoc_type.toLowerCase()
          ] = `http://103.74.65.54/${doc.DOC_PATH}`;
        });

        // Convert all keys to lower case
        const candidateDataLowerCase = {};
        Object.keys(candidateData).forEach((key) => {
          candidateDataLowerCase[key.toLowerCase()] = candidateData[key];
        });

        // Delete unnecessary keys
        delete candidateDataLowerCase.id;
        delete candidateDataLowerCase.token;
        delete candidateDataLowerCase.tokentimestamp;

        res.status(200).json({
          status: true,
          result: candidateDataLowerCase,
          message: "Success",
        });
      } else {
        res.status(404).json({
          status: false,
          message: "Invalid Candidate Code",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};
exports.updateCandidateDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    let error_flag = false;
    let error_message = "";
    let candCode = "";

    if (req.body.candCode && req.body.candCode !== "") {
      candCode = req.body.candCode;
    } else {
      error_flag = true;
      error_message = "Can Code Is Mandatory";
    }

    if (error_flag) {
      res.status(400).json({
        Status: false,
        Message: error_message,
      });
    } else {
      const result = await sequelize.query(
        `SELECT * FROM Interview_Mst WHERE Candidate_Code='${candCode}'`
      );

      if (result[0].length > 0) {
        const updateValues = {
          CANDIDATE_NAME: req.body.candidate_name,
          Mobile_No: req.body.mobile_no,
          Email: req.body.email,
          Position: req.body.position,
          Location: req.body.location,
          Last_Salary: req.body.last_salary,
          Expected_Salary: req.body.expected_salary,
          Last_Designation: req.body.last_designation,
          Last_Company: req.body.last_company,
          Tot_Exp: req.body.tot_exp,
          Tot_Ind_Exp: req.body.tot_ind_exp,
          Pre_Comp1: req.body.pre_comp1,
          Pre_Desig1: req.body.pre_desig1,
          Pre_From1: req.body.pre_from1,
          Pre_To1: req.body.pre_to1,
          Pre_Sal1: req.body.pre_sal1,
          Pre_Comp2: req.body.pre_comp2,
          Pre_Desig2: req.body.pre_desig2,
          Pre_From2: req.body.pre_from2,
          Pre_To2: req.body.pre_to2,
          Pre_Sal2: req.body.pre_sal2,
          Pre_Comp3: req.body.pre_comp3,
          Pre_Desig3: req.body.pre_desig3,
          Pre_From3: req.body.pre_from3,
          Pre_To3: req.body.pre_to3,
          Pre_Sal3: req.body.pre_sal3,
          Pre_Comp4: req.body.pre_comp4,
          Pre_Desig4: req.body.pre_desig4,
          Pre_From4: req.body.pre_from4,
          Pre_To4: req.body.pre_to4,
          Pre_Sal4: req.body.pre_sal4,
          Last_Mgr_Name: req.body.last_mgr_name,
          Last_Mgr_Desig: req.body.last_mgr_desig,
          Last_Mgr_Mob: req.body.last_mgr_mob,
          Prof_Ref_1: req.body.prof_ref_1,
          Prof_Ref_2: req.body.prof_ref_2,
          Prof_Ref_3: req.body.prof_ref_3,
        };

        const updateQuery = `UPDATE Interview_Mst SET ${Object.keys(
          updateValues
        )
          .map((key) => `${key}='${updateValues[key]}'`)
          .join(",")} WHERE Candidate_Code='${candCode}'`;

        await sequelize.query(updateQuery);

        const ftpClient = new ftp.Client();
        await ftpClient.access({
          host: "103.74.65.54",
          user: "bhawani1",
          password: "India@#5010",
        });

        // Create necessary directories
        const compCode = req.body.compCode.toLowerCase();
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const finalFolderPath = `/${compCode}/${year}/${month}/${day}`;

        await ftpClient.ensureDir(finalFolderPath);

        // Upload files
        const uploadPromises = [];
        const fileFields = [
          "adharImage",
          "panImage",
          "profileImage",
          "salarySlip",
          "otherDocument",
        ];
        for (const field of fileFields) {
          if (req.files[field]) {
            const file = req.files[field];
            const fileName = `${candCode}_${compCode}${year}${month}${day}_${field}_${Date.now()}${file.name.substring(
              file.name.lastIndexOf(".")
            )}`;
            uploadPromises.push(
              moveFile(file.tempFilePath, `${finalFolderPath}/${fileName}`)
            );
            uploadPromises.push(
              ftpClient.uploadFrom(
                file.tempFilePath,
                `${finalFolderPath}/${fileName}`
              )
            );
          }
        }

        await Promise.all(uploadPromises);

        res.status(200).json({
          Status: true,
          Message: "Success",
        });

        await ftpClient.close();
      } else {
        res.status(404).json({
          Status: false,
          Message: "Invalid Candidate Code",
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      Status: false,
      Message: "Internal Server Error",
    });
  }
};
exports.getMasterData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const miscTypeCode = req.query.miscTypeCode;
    const result = await sequelize.query(
      `SELECT * FROM misc_mst where misc_type='${miscTypeCode}' ORDER BY Misc_Name`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.EditMispunchRequest = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT Misc_Code, Misc_Name, 'MP' AS Is_MP
      FROM misc_mst 
      WHERE misc_type = 93 AND EXPORT_TYPE < 2
      ORDER BY Misc_Code`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.MispunchRequestList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT Misc_Code, Misc_Name, 'MP' AS Is_MP
      FROM misc_mst 
      WHERE misc_type = 93 AND EXPORT_TYPE < 2
      ORDER BY Misc_Code`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetEmployeeList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empCode = req.query.GEL_EMPCODE;
    const result = await sequelize.query(
      `Select EmpCode,EmpCode as EMP_Code,
      concat(EmpCode,' - ',EmpFirstName,' - ',EmpLastName)as Emp_Name,
      Reporting_1,Reporting_2,Reporting_3,FCM_TockenId from EmployeeMaster where Reporting_1='${empCode}' or Reporting_2='${empCode}' or Reporting_3='${empCode}'`
    );
    console.log(result[0])
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetAllEmployeeList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `Select EmpCode as EMP_Code,concat(EmpFirstName,' ',EmpLastName) as Emp_Name,Reporting_1,Reporting_2,Reporting_3,FCM_TockenId from EmployeeMaster`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getMispunch_Employee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const StartDate = req.query.StartDate;
    const EndDate = req.query.EndDate;
    const GMPE_Manager = req.query.GMPE_Manager;

    const result = await sequelize.query(
      `SELECT at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
      isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
      at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,
      at.In2,at.Out2,at.Status,at.iN1mANNUAL,at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,
      em.CurrentJoinDate,em.Region,at.MI_REMARK,at.MIPUNCH_REASON,at.WO_Value,at.LeaveValue,
      em.Prob_Period,at.MAN_APPR,at.Mis_AprBy,at.Man_Recomend,at.Man_Rej,
      at.Reject_By,(select top 1 DOC_PATH from EMP_DOCS 
      where EMP_CODE collate database_default =empcode collate database_default  and 
      misspunch_inout = 1 and dateoffice = at.dateoffice ORDER BY UTD DESC) as fileIn,
      (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and 
      misspunch_inout = 2 and dateoffice = at.dateoffice ORDER BY UTD DESC) as fileOut FROM  
      attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
      WHERE at.DateOffice >= '${StartDate}' AND at.DateOffice <= '${EndDate}' AND at.MAN_APPR = 'N' AND  
      (em.Reporting_1 = '${GMPE_Manager}' OR em.Reporting_2 = '${GMPE_Manager}'  OR 
      em.Reporting_3 = '${GMPE_Manager}') and (in2 is not null or out2 is not null) ORDER BY at.DateOffice desc`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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


exports.LeaveList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const LL_EMPCODE = req.query.LL_EMPCODE;
    const EndDate = req.query.EndDate;
    const StartDate = req.query.StartDate;
    const result = await sequelize.query(
      `SELECT TRIM(attendancetable.Emp_Code) AS EmpCode,
      (Title+' '+EmpFirstName+' ('+Location+')') as EmpName,
      CONVERT(VARCHAR, DateOffice, 103) as Date_,
      CONVERT(VARCHAR, CAST(ShiftStartTime AS DECIMAL(18, 4))) as StTime,
      CONVERT(VARCHAR, CAST(ShiftEndTime AS DECIMAL(18, 4))) as EndTime,
      CONVERT(VARCHAR(5), In1, 108) as In1,
      CONVERT(VARCHAR(5), Out1, 108) as Out1,
      TRIM(Status) AS Status,
      Leavevalue,
      In1Mannual,
      Out1Mannual,
      MAN_APPR,
      Mis_AprBy,
      Man_Recomend,
      Man_Rej,
      Reject_By,
      '' as MP_Reason,
      (SELECT MAX(MISC_ABBR) FROM MISC_MST WHERE Misc_type=92 AND Misc_code= Mipunch_Reason) as Mipunch_Reason,
      Region
      FROM attendancetable, EmployeeMaster
      WHERE EmployeeMaster.EmpCode=attendancetable.Emp_Code 
      AND Emp_Code='${LL_EMPCODE}' 
      AND DateOffice >= '${StartDate}' 
      AND DateOffice <= '${EndDate}' 
      ORDER BY DateOffice`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetLocationLog = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const LogDate = req.query.LogDate;
    const location = req.query.location;

    let result;
    if (!location) {
      result = `select Location,MAx(P_Cnt) as P_Cnt,Max(Tot_Cnt) as Tot_Cnt from (
        SELECT (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) AS LOCATION,0 as Tot_Cnt,Count(Emp_Code) as P_Cnt FROM attendancetable,EMPLOYEEMASTER WHERE lastwor_date is null and DATEOFFICE='${LogDate}' AND EMP_CODE=EMPCODE and presentvalue>0 GROUP BY LOCATION
        union all
        SELECT (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) AS LOCATION,Count(EmpCode) as Tot_Cnt, 0 as P_Cnt FROM EMPLOYEEMASTER WHERE empcode<>''  and  lastwor_date is null GROUP BY LOCATION
        ) A group by Location`;
    } else {
      result = `select Location,MAx(P_Cnt) as P_Cnt,Max(Tot_Cnt) as Tot_Cnt from (
        SELECT (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) AS LOCATION,0 as Tot_Cnt,Count(Emp_Code) as P_Cnt FROM attendancetable,EMPLOYEEMASTER WHERE lastwor_date is null and DATEOFFICE='${LogDate}' and location = '${location}' AND EMP_CODE=EMPCODE and presentvalue>0 GROUP BY LOCATION
        union all
        SELECT (SELECT MISC_NAME FROM MISC_MST WHERE MISC_TYPE=85 AND LOCATION=MISC_CODE) AS LOCATION,Count(EmpCode) as Tot_Cnt, 0 as P_Cnt FROM EMPLOYEEMASTER WHERE empcode<>'' and location = '${location}'  and  lastwor_date is null GROUP BY LOCATION
        ) A group by Location`;
    }
    const result1 = await sequelize.query(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result1[0],
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
exports.getLeave_Employee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const GLPE_Manager = req.query.GLPE_Manager;
    const GLPE_EMPCODE = req.query.GLPE_EMPCODE;
    const EndDate = req.query.EndDate;
    const StartDate = req.query.StartDate;
    const result = await sequelize.query(
      `Select attendancetable.Emp_Code AS Code_,(Title+' '+EmpFirstName+' '+EmpLastName) as EmpName,
      EmployeeDesignation,DateOffice as Date_,ShiftStartTime as StTime,ShiftEndTime as EndTime,
      In1,Out1,Status,iN1mANNUAL,iN2mANNUAL,out1mANNUAL,out2mANNUAL,CurrentJoinDate,Region,MI_REMARK,
      MIPUNCH_REASON,WO_Value,LeaveValue,Prob_Period,MAN_APPR,Mis_AprBy,Man_Recomend,Man_Rej,
      Reject_By from attendancetable,EmployeeMaster where EmployeeMaster.EmpCode=attendancetable.Emp_Code 
      and DateOffice >= '${StartDate}' and DateOffice <= '${EndDate}'  and 
      Emp_Code='${GLPE_EMPCODE}' and 
      (Reporting_1='${GLPE_Manager}' or Reporting_2='${GLPE_Manager}' or Reporting_3='${GLPE_Manager}')  and 
      IsNull(Leavevalue,0)>0  order by EmpCode,DateOffice`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getLocations = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `select Misc_code,Misc_name,Misc_code as value,Misc_name as label from misc_mst where misc_type=85 and export_type < 3`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getDept = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `select Misc_code,Misc_name from misc_mst where misc_type=68`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getGroup = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `select Misc_code,Misc_name from misc_mst where misc_type=81`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getAttendanceLog = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const location = req.query.location;
    const section = req.query.section;
    const division = req.query.division;
    const LogDate = req.query.LogDate;
    let queryString = "";
    if (location) {
      queryString = ` AND location='${location}'`;
    }
    if (section) {
      queryString = ` AND section='${section}'`;
    }
    if (division) {
      queryString = ` AND division='${division}'`;
    }
    const result = await sequelize.query(
      `SELECT TRIM([Flag]) as atn_status,TRIM(str(Count(Flag))) as status_count 
      FROM attendancetable,EMPLOYEEMASTER 
      WHERE DATEOFFICE='${LogDate}' ${queryString} AND  EMP_CODE=EMPCODE and LASTWOR_DATE is null GROUP BY [Flag]`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getAttendanceDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const location = req.query.location;
    const section = req.query.section;
    const division = req.query.division;
    const LogDate = req.query.LogDate;
    const status = req.query.status;
    let queryString = "";
    if (location) {
      queryString = ` AND location='${location}'`;
    }
    if (section) {
      queryString = ` AND section='${section}'`;
    }
    if (division) {
      queryString = ` AND division='${division}'`;
    }
    //   const result = await sequelize.query(
    //     `SELECT TRIM(Emp_Code) AS Emp_Code,EmpFirstName,
    //     (select top 1 Misc_Name from Misc_Mst where Misc_type=85 and Misc_Code=Location) as Location,
    //     EmployeeDesignation,
    //  IN1,OUT1
    //    FROM attendancetable,EMPLOYEEMASTER WHERE 
    //     DATEOFFICE='${LogDate}' AND 
    //     EMP_CODE=EMPCODE and Flag='${status}' ${queryString}`
    //   );
    const result = await sequelize.query(
      `SELECT TRIM(Emp_Code) AS Emp_Code,EmpFirstName,
      (select top 1 Misc_Name from Misc_Mst where Misc_type=85 and Misc_Code=Location) as Location,
      EmployeeDesignation,
       FORMAT( IN1, 'dd-MM-yyyy hh:mm tt') AS In1, 
       FORMAT( OUT1, 'dd-MM-yyyy hh:mm tt') AS Out1
     FROM attendancetable,EMPLOYEEMASTER WHERE 
      DATEOFFICE='${LogDate}' AND 
      EMP_CODE=EMPCODE and Flag='${status}' ${queryString}`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
function parseDate(dateString) {
  const date = new Date(dateString);
  return {
    date: date.toISOString().replace("T", " ").replace("Z", ""),
    timezone_type: 3,
    timezone: "Asia/Kolkata",
  };
}
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
exports.GetMsgEmployeeList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.GEL_EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "cand Code is mandatory",
      });
    }
    const Result = await sequelize.query(`WITH Conversations AS (
      SELECT 
        CASE 
          WHEN msgSenderId = '${candCode}' THEN msgReceiverId 
          ELSE msgSenderId 
        END AS EmpCode,
        MAX(msg_id) AS LastMsgId
      FROM 
        MessageLog 
      WHERE 
        msgSenderId = '${candCode}' OR msgReceiverId = '${candCode}'
      GROUP BY 
        CASE 
          WHEN msgSenderId = '${candCode}' THEN msgReceiverId 
          ELSE msgSenderId 
        END
    )
    
    SELECT 
      EM.EmpCode as EMP_Code,
      concat(EM.EmpFirstName,' ',EM.EmpLastName) as Emp_Name,
      EM.Reporting_1,
      EM.Reporting_2,
      EM.Reporting_3,
      EM.FCM_TockenId,
      CL.LastMsgId
    FROM 
      EmployeeMaster EM
    JOIN 
      Conversations CL ON EM.EmpCode = CL.EmpCode
    WHERE 
    EM.EmpCode != '${candCode}' AND
      EM.EmpCode IN (SELECT EmpCode FROM Conversations)
      order by LastMsgId desc
    `);
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: Result[0],
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
exports.getMsgDtl = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.GEL_EMPCODE;
    const sender = req.query.GEL_SENDER;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (sender == "" || sender == undefined || sender == null) {
      return res.status(500).send({
        status: false,
        Message: "Sender Code is mandatory",
      });
    }
    const Result = await sequelize.query(
      `Select messageDesc,msg_Id as msgId,msgReceiverId,msgSenderId,msgTime,msgTitle,msgSenderName,msgReceiverName from MessageLog where (msgSenderId ='${candCode}' and msgReceiverId = '${sender}') or (msgReceiverId ='${candCode}' and msgSenderId = '${sender}') order by msg_id`
    );
    console.log(Result[0])
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: Result[0],
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
exports.addMsg = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    const reciver_emp = req.query.Reciver_EMP;
    const title = req.query.title ? `'${req.query.title}'` : null;
    const msgDesc = req.query.msgDesc;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (reciver_emp == "" || reciver_emp == undefined || reciver_emp == null) {
      return res.status(500).send({
        status: false,
        Message: "reciver emp Code is mandatory",
      });
    }
    await sequelize.query(`INSERT INTO MessageLog (messageDesc, msgReceiverId, msgSenderId, msgTitle) VALUES
    ('${msgDesc}', '${reciver_emp}', '${candCode}', ${title})`);
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
exports.getLiveLocation = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const Result = await sequelize.query(
      `select top 1 LATITUDE ,LONGITUDE,DEVICESPEED,GPSACCURACY,GEO_LOCATION,TRACK_DATETIME from EMP_TRACK where emp_code = '${candCode}' order by id desc`
    );
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: Result[0],
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
exports.updateGeofence = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchCode = req.query.BranchId;
    const latlong = req.query.latlong;
    if (branchCode == "" || branchCode == undefined || branchCode == null) {
      return res.status(500).send({
        status: false,
        Message: "branchCode is mandatory",
      });
    }
    if (latlong == "" || latlong == undefined || latlong == null) {
      return res.status(500).send({
        status: false,
        Message: "latlong  is mandatory",
      });
    }
    await sequelize.query(
      `update misc_mst set spl_rem ='${latlong}' where misc_code = '${branchCode}' and misc_type = 85 and export_type < 3`
    );
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
exports.checkLocationInOut = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    const lat = req.query.Latitude;
    const long = req.query.Longitude;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (long == "" || long == undefined || long == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (lat == "" || lat == undefined || lat == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const Result = await sequelize.query(
      `Exec GetEmployeeLocation  @EmployeeCode = '${candCode}' , @Latitude = '${lat}', @Longitude ='${long}'`
    );
    Result[0][0].Result = Result[0][0].Result == true ? 1 : Result[0][0].Result == false ? 0 : Result[0][0].Result;
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: Result[0],
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
exports.getPunchingInfo = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const Result = await sequelize.query(`SELECT App_In1,App_Out1,In_Add,Out_Add
        FROM attendancetable
        WHERE emp_code = '${candCode}'
        AND CONVERT(date, dateoffice) = CONVERT(date, GETDATE())`);

    // Iterate over each object in the array
    const originalResult = Result[0].map((obj) => {
      return {
        App_In1: parseDate(obj.App_In1),
        App_Out1: parseDate(obj.App_Out1),
        In_Add: obj.In_Add,
        Out_Add: obj.Out_Add,
      };
    });
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: originalResult,
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
exports.GetEmpDed = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.empCode;
    const st_date = req.query.st_date;
    const end_date = req.query.end_date;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (st_date == "" || st_date == undefined || st_date == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    if (end_date == "" || end_date == undefined || end_date == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const Result =
      await sequelize.query(`select emp_id as EMP_Code,Emp_Name,Rec_date,
      CASE 
        WHEN Ded_Type = 7 THEN Basic_Arr
        WHEN Ded_type = 15 THEN INCENTIVE_AMT
      ELSE Ded_Amt
      END AS Amount ,(select top 1 misc_name from misc_mst where misc_type=610 and misc_code=ded_type ) as Category,
    (select top 1 doc_path from emp_docs where emp_code collate database_default = emp_id collate database_default and columndoc_type='ded' and dateoffice=rec_date) as photos from emp_ded
    where emp_id ='${candCode}'
    AND Mnth	 = MONTH('${st_date}') 
      	 AND Yr = YEAR('${st_date}')`);

    const originalResult = Result[0].map((obj) => {
      return {
        Emp_Name: obj.Emp_Name,
        EMP_Code: obj.EMP_Code,
        Rec_date: parseDate(obj.Rec_date),
        Amount: obj.Amount,
        Category: obj.Category,
        image: obj.photos,
      };
    });
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: originalResult,
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
// exports.getPendingAppList = async function (req, res) {
//   const sequelize = await dbname(req.headers.compcode);
//   try {
//     const P_Emp_Code = req.query.P_Emp_Code;
//     const Start_Date = req.query.Start_Date;
//     const End_Date = req.query.End_Date;
//     if (P_Emp_Code == "" || P_Emp_Code == undefined || P_Emp_Code == null) {
//       return res.status(500).send({
//         status: false,
//         Message: "Emp Code is mandatory",
//       });
//     }
//     if (Start_Date == "" || Start_Date == undefined || Start_Date == null) {
//       return res.status(500).send({
//         status: false,
//         Message: "START DATE is mandatory",
//       });
//     }
//     if (End_Date == "" || End_Date == undefined || End_Date == null) {
//       return res.status(500).send({
//         status: false,
//         Message: "END DATE is mandatory",
//       });
//     }
//     const Result = await sequelize.query(`SELECT trim(at.Emp_Code) AS EmpCode ,
//     trim((isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' ))) AS EmpName,
//     isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
//     FORMAT(at.DateOffice, 'dd/MM/yyyy') AS Date,cast(at.ShiftStartTime as varchar(30)) AS StTime,
//     cast(at.ShiftEndTime as varchar(30)) AS EndTime,FORMAT(at.App_in1, 'HH:MM')as In1,
//     FORMAT(at.App_out1, 'HH:MM')as Out1,at.In1Mannual,at.Out1Mannual,
//     at.MAN_APPR,at.Mis_AprBy,at.Man_Recomend,at.Man_Rej,at.Reject_By,trim(at.Status) as AtnStatus,
//     In_Photo as fileIn,Out_Photo as fileOut,em.Reporting_1,em.Reporting_2,em.Reporting_3
//     FROM  attendancetable AS at 
//     INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default 
//     WHERE at.dateoffice between '${Start_Date}' and '${End_Date}' AND at.MAN_APPR = 'Y' 
//     AND (em.Reporting_1 = '${P_Emp_Code}'OR em.Reporting_2 = '${P_Emp_Code}'  OR em.Reporting_3 = '${P_Emp_Code}') 
//     and (App_in1 is not null  or App_out1 is not null)  ORDER BY at.DateOffice desc`);

//     res.status(200).send({
//       Status: true,
//       Query: "",
//       Message: "Success",
//       Result: Result[0],
//     });
//   } catch (e) {
//     console.log(e);
//     return res.status(500).send({
//       status: false,
//       Message: "Error Executing action",
//     });
//   } finally {
//     if (sequelize) {
//       sequelize.close();
//     }
//   }
// };


exports.demogetpassview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    console.log(req.query, "gh")
    const empcode = req.query.empcode;
    const result = await sequelize.query(
      `select empcode,customer_name,customer_mobile,driver_code,last_km,model_code,
      (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name,
      (SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name,
            act_out_time,iif(gp_type=0,'DEMO','PERSONAL') AS gp_type,veh_reg ,utd,appr1_code,appr2_code,  
            APPR1_STATUS,FINAL_STATUS ,APPR2_STATUS  from Demo_Car_Gatepass  where empcode= '${empcode}'  order by UTD desc
      `
    );
    console.log(result)
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.demogetpassapprove = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.query, "hjhgfd");
  try {
    const utd = req.query.utd;
    const RPA_Managercode = req.query.RPA_Managercode;
    const buttonclicked = req.query.buttonclicked;



    let result = [];

    // Loop through each utd and collect results
    for (let i = 0; i < utd.length; i++) {
      const queryResult = await sequelize.query(
        `SELECT appr1_code, appr2_code, APPR1_STATUS, APPR2_STATUS FROM Demo_Car_Gatepass WHERE utd= ${utd[i]}`
      );
      result.push(queryResult[0][0]);
    }

    if (buttonclicked === "1") {
      // Approve the request
      for (let i = 0; i < result.length; i++) {
        const resItem = result[i];
        if (
          resItem.appr1_code == RPA_Managercode &&
          resItem.APPR1_STATUS == 0
        ) {
          await sequelize.query(
            `UPDATE Demo_Car_Gatepass SET APPR1_STATUS = 1, APPR2_STATUS = 0 WHERE utd= ${utd[i]} AND ISNULL(appr1_status, '') = 0 AND appr1_code = '${RPA_Managercode}'`
          );
          response.Status = true;
          response.Message = "1st Approval done";
        } else if (
          resItem.appr2_code == RPA_Managercode &&
          resItem.APPR1_STATUS == 1 &&
          resItem.APPR2_STATUS == 0
        ) {
          await sequelize.query(
            `UPDATE Demo_Car_Gatepass SET APPR2_STATUS = 1, FINAL_STATUS = 1 WHERE utd= ${utd[i]} AND appr2_status = 0 AND appr2_code='${RPA_Managercode}' AND appr1_status=1`
          );
          response.Status = true;
          response.Message = "Final Approval done";
        } else {
          if (
            resItem.appr2_code == RPA_Managercode &&
            resItem.APPR1_STATUS == 0
          ) {
            response.Status = false;
            response.Message = "Approval 1 is pending";
          } else if (
            (resItem.appr1_code == RPA_Managercode ||
              resItem.appr2_code == RPA_Managercode) &&
            (resItem.APPR1_STATUS == 1 || resItem.APPR2_STATUS == 1)
          ) {
            response.Message = "Already approved";
          } else if (
            resItem.APPR1_STATUS == 2 &&
            resItem.APPR2_STATUS == 0
          ) {
            response.Message = "This Entry rejected at Level 1";
          } else if (
            resItem.APPR1_STATUS == 1 &&
            resItem.APPR2_STATUS == 2
          ) {
            response.Message = "This Entry rejected at Level 2";
          }
        }
      }
    } else if (buttonclicked == "2") {
      // Reject the request
      for (let i = 0; i < result.length; i++) {
        const resItem = result[i];
        if (
          resItem.appr1_code == RPA_Managercode &&
          resItem.APPR1_STATUS == 0
        ) {
          await sequelize.query(
            `UPDATE Demo_Car_Gatepass SET APPR1_STATUS = 2, FINAL_STATUS = 2 WHERE utd= ${utd[i]} AND appr1_status = 0 AND appr1_code= '${RPA_Managercode}'`
          );
          response.Status = true;
          response.Message = "1st Approval rejected";
        } else if (
          resItem.appr2_code == RPA_Managercode &&
          resItem.APPR1_STATUS == 1 &&
          resItem.APPR2_STATUS == 0
        ) {
          await sequelize.query(
            `UPDATE Demo_Car_Gatepass SET APPR2_STATUS = 2, FINAL_STATUS = 2 WHERE utd= ${utd[i]} AND appr2_status= 0 AND appr2_code= '${RPA_Managercode}' AND appr1_status=1`
          );
          response.Status = true;
          response.Message = "Final Approval rejected";
        } else {
          response.Status = false;
          if (
            resItem.appr2_code == RPA_Managercode &&
            resItem.APPR1_STATUS == 0
          ) {
            response.Message = "Approval 1 rejection is pending";
          } else if (
            (resItem.appr1_code == RPA_Managercode ||
              resItem.appr2_code == RPA_Managercode) &&
            (resItem.APPR1_STATUS == 2 || resItem.APPR2_STATUS == 2)
          ) {
            response.Message = "Already rejected";
          } else if (
            resItem.APPR1_STATUS == 1 &&
            resItem.APPR2_STATUS == 0
          ) {
            response.Message = "This Entry approved at Level 1";
          } else if (
            resItem.APPR1_STATUS == 1 &&
            resItem.APPR2_STATUS == 2
          ) {
            response.Message = "This Entry rejected at Level 2";
          }
        }
      }
    } else {
      response.Status = false;
      response.Message = "Unknown Status";
    }

    res.status(200).send({
      Status: true,
      Message: response.Message,
      Query: "",
      Result: result,
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
exports.demogetpassinout = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.query, 'jhgfd')
  try {
    const utd = req.query.utd;
    const empcode = req.query.empcode;
    const TYPE = req.query.TYPE;
    const result = await sequelize.query(
      `SELECT FINAL_STATUS FROM Demo_Car_Gatepass WHERE utd= ${utd} `
    );

    if (result[0][0].FINAL_STATUS == 1) {
      if (TYPE == "OUT") {
        const VEH_REG = req.query.VEH_REG;
        const LAST_KM = req.query.LAST_KM;

        await sequelize.query(
          `UPDATE Demo_Car_Gatepass SET OUT_TIME = GETDATE(), GUARD_CODE = '${empcode}', LAST_KM = '${LAST_KM}' WHERE utd= '${utd}'`
        );

        await sequelize.query(
          `UPDATE DemoCarMaster SET KM_DRIVEN = '${LAST_KM}' WHERE VEH_REGNO= '${VEH_REG}'`
        );
      } else if (TYPE == "IN") {
        const VEH_REG = req.query.VEH_REG;
        const KM = req.query.KM;

        const LAST_KM = req.query.LAST_KM;
        await sequelize.query(
          `UPDATE Demo_Car_Gatepass SET IN_TIME = GETDATE(), GUARD_CODE_IN = '${empcode}', KM = '${KM}' WHERE utd= '${utd}'`
        );

        await sequelize.query(
          `UPDATE DemoCarMaster SET KM_DRIVEN = '${KM}' WHERE VEH_REGNO= '${VEH_REG}'`
        );
      }
    }

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.demogetpassadd = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  let response = {
    Status: false,
    Message: "",
  };
  const { OutTime, gatepass, CustomerName, Customer_Mobileno, Remark, ModelName, DriverName, veh_regno, km_driven, EMPCODE } = req.query.formdata;
  try {
    const result =
      await sequelize.query(`INSERT INTO Demo_Car_Gatepass (empcode,GP_TYPE,Customer_Name,Customer_Mobile,Driver_code,model_code,ACT_out_time,APPR1_CODE,APPR2_CODE,Remark,VEH_REG,last_km,APPR1_STATUS)
       VALUES('${EMPCODE}','${gatepass}','${CustomerName}','${Customer_Mobileno}','${DriverName}','${ModelName}','${OutTime}',(SELECT TOP 1 REPORTING_1 FROM EMPLOYEEMASTER WHERE EMPCODE='${EMPCODE}'),(SELECT TOP 1 REPORTING_2 FROM EMPLOYEEMASTER WHERE EMPCODE='${EMPCODE}') ,'${Remark}','${veh_regno}','${km_driven}','0')`);

    console.log(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.modelnamefetch = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const result = await sequelize.query(
      `SELECT (SELECT MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE=MODEL_NAME) AS label ,MODEL_NAME as value,veh_regno,km_driven FROM DemoCarMaster`
    );

    const driver = await sequelize.query(`select EMPCODE as value ,
    concat(EMPFIRSTNAME,'',EMPLASTNAME)as label from EMPLOYEEMASTER where EMPLOYEEDESIGNATION in 
    (select top 1 Misc_Name from misc_mst where Misc_Name = 'driver' and Misc_Type=95 )`)

    console.log(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
      Driver: driver[0],
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
exports.demogetpassapr1 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const empcode = req.query.empcode;
    const status = req.query.status;
    const result =
      await sequelize.query(`SELECT empcode, emp_name, customer_name, customer_mobile, driver_code, (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name,
      (SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name,last_km, model_code, act_out_time, 
          IIF(gp_type = 0, 'DEMO', 'PERSONAL') AS gp_type, veh_reg, utd, appr1_code, appr2_code, APPR1_STATUS, 
          FINAL_STATUS, APPR2_STATUS  
          FROM Demo_Car_Gatepass 
          WHERE appr1_code = '${empcode}'  AND APPR1_STATUS = '${status}'
          union all
      SELECT empcode, emp_name, customer_name, customer_mobile, driver_code,(SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name,
      (SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name, last_km, model_code, act_out_time, 
      IIF(gp_type = 0, 'DEMO', 'PERSONAL') AS gp_type, veh_reg, utd, appr1_code, appr2_code, APPR1_STATUS,
      FINAL_STATUS, APPR2_STATUS  
      FROM Demo_Car_Gatepass 
      WHERE appr2_code = '${empcode}' AND APPR1_STATUS = 1 AND APPR2_STATUS = '${status}'`);

    console.log(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getGetFCMTokenOfManager = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const candCode = req.query.GEL_EMPCODE;

    const result =
      await sequelize.query(`select FCM_TockenId ,EMPCODE from EMPLOYEEMASTER where EMPCODE in ( 
        (select Reporting_1 from EMPLOYEEMASTER where empcode = '${candCode}'),
        (select Reporting_2 from EMPLOYEEMASTER where empcode = '${candCode}'),
        (select Reporting_3 from EMPLOYEEMASTER where empcode = '${candCode}')
        )`);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.rejectExpense = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const EMPCODE = req.query.EMPCODE;
    const Appr_Code = req.query.Appr_Code;
    const Tran_Id = req.query.Tran_Id;
    const SrNo = req.query.SrNo;
    const Remark = req.query.Remark;

    const employeeResult = await sequelize.query(
      `SELECT EMPCODE, Reporting_1, Reporting_2, Reporting_3 FROM EMPLOYEEMASTER WHERE EMPCODE = '${EMPCODE}'`
    );

    if (employeeResult) {
      let ApprovalLevel = 0;
      if (employeeResult[0][0].Reporting_1 === Appr_Code) {
        ApprovalLevel = 1;
      } else if (employeeResult[0][0].Reporting_2 === Appr_Code) {
        ApprovalLevel = 2;
      } else if (employeeResult[0][0].Reporting_3 === Appr_Code) {
        ApprovalLevel = 3;
      }

      const updateResult = await sequelize.query(`
        UPDATE TRAVEL_DTL 
        SET Appr_${ApprovalLevel}_Stat = 0, 
            Fin_Appr = 0, 
            Appr_${ApprovalLevel}_Code ='${employeeResult[0][0]["Reporting_" + ApprovalLevel]
        }',
            Appr_${ApprovalLevel}_Rem = '${Remark}' 
        WHERE Tran_Id = ${Tran_Id} 
        AND SrNo IN (${SrNo}) 
        AND Appr_${ApprovalLevel}_Stat IS NULL
      `);

      if (ApprovalLevel === 1) {
        response.Message = "Approval 1 Rejected";
      } else if (ApprovalLevel === 2) {
        response.Message = "Approval 2 Rejected";
      } else if (ApprovalLevel === 3) {
        response.Message = "Approval 3 Rejected";
      }

      if (
        ApprovalLevel === 3 ||
        (ApprovalLevel === 2 && !employeeResult[0][0].Reporting_3) ||
        (ApprovalLevel === 1 &&
          !employeeResult[0][0].Reporting_3 &&
          !employeeResult[0][0].Reporting_2)
      ) {
        const UpdateResult1 = await sequelize.query(
          `UPDATE TRAVEL_DTL SET Fin_Appr = 0 WHERE  Tran_Id = '${Tran_Id}' AND SrNo IN (${SrNo})`
        );
        response.Message = "Final Rejected";
      }

      console.log(updateResult);
      res.status(200).send({
        Status: true,
        Message: "Success",
        Query: "",
        Result: {},
      });
    } else {
      response.Message = "Invalid Credentials";
    }
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
exports.approveExpense = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const EMPCODE = req.query.EMPCODE;
    const Appr_Code = req.query.Appr_Code;
    const Tran_Id = req.query.Tran_Id;
    const SrNo = req.query.SrNo;
    const Remark = req.query.Remark;
    console.log(req.query)
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
    if (Tran_Id == "" || Tran_Id == undefined || Tran_Id == null) {
      return res.status(500).
        send({
          status: false,
          Message: "Tran_Id is mandatory",
        });
    }
    if (SrNo == "" || SrNo == undefined || SrNo == null) {
      return res.status(500).send({
        status: false,
        Message: "SrNo is mandatory",
      });
    }
    const employeeResult = await sequelize.query(
      `SELECT EMPCODE, Reporting_1, Reporting_2, Reporting_3 FROM EMPLOYEEMASTER WHERE EMPCODE = '${EMPCODE}'`
    );

    if (employeeResult) {
      let ApprovalLevel = 0;

      if (employeeResult[0][0].Reporting_1 === Appr_Code) {
        ApprovalLevel = 1;
      } else if (employeeResult[0][0].Reporting_2 === Appr_Code) {
        ApprovalLevel = 2;
      } else if (employeeResult[0][0].Reporting_3 === Appr_Code) {
        ApprovalLevel = 3;
      }

      if (ApprovalLevel == 0) {
        return res.status(500).send({
          status: false,
          Message: "May be Appr_Code Or EmpCode is Invalid",
        });
      }
      const updateResult = await sequelize.query(`
        UPDATE TRAVEL_DTL 
        SET Appr_${ApprovalLevel}_Stat = 1, 
            Appr_${ApprovalLevel}_Code ='${employeeResult[0][0]["Reporting_" + ApprovalLevel]
        }',
            Appr_${ApprovalLevel}_Rem = '${Remark}'
        WHERE Tran_Id = ${Tran_Id} AND SrNo IN (${SrNo}) AND Appr_${ApprovalLevel}_Stat IS NULL`);

      if (ApprovalLevel === 1) {
        response.Message = "Approval 1 Updated Successfully";
      } else if (ApprovalLevel === 2) {
        response.Message = "Approval 2 Updated Successfully";
      } else if (ApprovalLevel === 3) {
        response.Message = "Approval 3 Updated Successfully";
      }

      if (
        ApprovalLevel === 3 ||
        (ApprovalLevel === 2 && !employeeResult[0][0].Reporting_3) ||
        (ApprovalLevel === 1 &&
          !employeeResult[0][0].Reporting_3 &&
          !employeeResult[0][0].Reporting_2)
      ) {
        const UpdateResult1 = await sequelize.query(
          `UPDATE TRAVEL_DTL SET Fin_Appr = 1 WHERE  Tran_Id = '${Tran_Id}' AND SrNo IN (${SrNo})`
        );
        response.Message = "Final Approval Done";
      }

      console.log(updateResult);
      res.status(200).send({
        Status: true,
        Message: "Success",
        Query: "",
      });
    } else {
      response.Message = "Invalid Credentials";
    }
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
exports.MonthMaster = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    let result = await sequelize.query(`SELECT
      CONVERT(VARCHAR, CONVERT(DATE, Misc_Dtl1, 105), 23) AS Misc_Dtl1_Date,
      CONVERT(VARCHAR, CONVERT(DATE, Misc_Dtl2, 105), 23) AS Misc_Dtl2_Date
  FROM
      Misc_Mst
  WHERE
      Misc_Type = 25
      AND MONTH(CONVERT(DATE, Misc_Dtl2, 105)) = MONTH(GETDATE());`);
    if (!result[0][0]) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const datesforprev = calculateDates(
        currentYear,
        currentMonth,
        currentMonth,
        4
      );
      result = [[{
        Misc_Dtl1_Date: datesforprev.start,
        Misc_Dtl2_Date: datesforprev.end
      }]];
    }
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.MonthMasterRange = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    let month = req.body.month;
    let result = await sequelize.query(`SELECT
      CONVERT(VARCHAR, CONVERT(DATE, Misc_Dtl1, 105), 23) AS Misc_Dtl1_Date,
      CONVERT(VARCHAR, CONVERT(DATE, Misc_Dtl2, 105), 23) AS Misc_Dtl2_Date
  FROM
      Misc_Mst
  WHERE
      Misc_Type = 25
      AND MONTH(CONVERT(DATE, Misc_Dtl2, 105)) = ${month};`);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    if (!result[0][0]) {
      const datesforprev = calculateDates(
        currentYear,
        month,
        month,
        4
      );
      result = [[{
        Misc_Dtl1_Date: datesforprev.start,
        Misc_Dtl2_Date: datesforprev.end
      }]];
    }
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetEmployeeListGatePass = async function (req, res) {
  console.log(req.query, "GetEmployeeListNew");
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.GEL_EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const result = await sequelize.query(
      `SELECT concat(EmpCode,' - ',EmpFirstName,' - ',EmpLastName) as Emp_Name, EmpCode as EMP_Code from EmployeeMaster where empcode in (SELECT empcode FROM Approval_Matrix WHERE '${candCode}' 
      IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) and module_code = 'gatepass')`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetEmployeeListNew = async function (req, res) {
  console.log(req.query, "GetEmployeeListNew");
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.GEL_EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const result = await sequelize.query(
      `SELECT concat(EmpCode,' - ',EmpFirstName,' - ',EmpLastName) as Emp_Name, EmpCode as EMP_Code from EmployeeMaster where empcode in (SELECT empcode FROM Approval_Matrix WHERE '${candCode}' 
      IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) and module_code = 'attdence')`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.getEmpTrack = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.EMPCODE;
    const date = req.query.date;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const Result = await sequelize.query(
      `select  LATITUDE ,LONGITUDE,DEVICESPEED,GPSACCURACY,GEO_LOCATION,TRACK_DATETIME from EMP_TRACK where emp_code = '${candCode}' and cast(TRACK_DATETIME as date) = '${date}' order by TRACK_DATETIME desc`
    );
    res.status(200).send({
      Status: true,
      Query: "",
      Message: "Success",
      Result: Result[0],
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
exports.GetEmployeeListGatePassForNotification = async function (req, res) {
  console.log(req.query, "GetEmployeeListNew");
  const sequelize = await dbname(req.headers.compcode);
  const branch = req.query.branch;
  const division = req.query.division;
  try {
    const candCode = req.query.GEL_EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    let result = [];
    let query = `SELECT concat(EmpCode,' - ',EmpFirstName,' - ',EmpLastName) as Emp_Name, EmpCode as EMP_Code,FCM_TockenId from EmployeeMaster where FCM_TockenId is not null  `;

    if (branch)
      query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${branch})) `;
    if (division) query += `and DIVISION in (${division}) `;
    if (!branch && !division) {
      result = await sequelize.query(
        `SELECT concat(EmpCode,' - ',EmpFirstName,' - ',EmpLastName) as Emp_Name, EmpCode as EMP_Code,FCM_TockenId from EmployeeMaster where empcode in (SELECT empcode FROM Approval_Matrix WHERE '${candCode}' 
      IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) and module_code = 'gatepass')`
      );
    } else {
      result = await sequelize.query(query);
    }

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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
exports.GetFcmOfManagerInGatepass = async function (req, res) {
  console.log(req.query, "GetEmployeeListNew");
  const sequelize = await dbname(req.headers.compcode);
  try {
    const candCode = req.query.GEL_EMPCODE;
    if (candCode == "" || candCode == undefined || candCode == null) {
      return res.status(500).send({
        status: false,
        Message: "Emp Code is mandatory",
      });
    }
    const result = await sequelize.query(
      `select EmpCode as EMPCODE,FCM_TockenId from EmployeeMaster where
      empcode in (SELECT approver1_A FROM Approval_Matrix WHERE EMPCODE = '${candCode}'and module_code = 'gatepass')  or
      empcode in (SELECT approver1_B FROM Approval_Matrix WHERE EMPCODE = '${candCode}'and module_code = 'gatepass')  or
      empcode in (SELECT approver2_A FROM Approval_Matrix WHERE EMPCODE = '${candCode}'and module_code = 'gatepass')  or
      empcode in (SELECT approver2_B FROM Approval_Matrix WHERE EMPCODE = '${candCode}'and module_code = 'gatepass')  or
      empcode in (SELECT approver3_A FROM Approval_Matrix WHERE EMPCODE = '${candCode}'and module_code = 'gatepass')  or
      empcode in (SELECT approver3_B FROM Approval_Matrix WHERE EMPCODE = '${candCode}'and module_code = 'gatepass') `
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
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

exports.getShiftTime = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empCode = req.body.empCode;
  const date = req.body.date;
  try {
    // const result = await sequelize.query(
    //   `select shiftstarttime , shiftendtime from attendancetable where Emp_Code = '${empCode}' and dateoffice = '${date}'`
    // );
    const result = await sequelize.query(
      `SELECT ${req.headers.compcode?.split("-")[0]?.toUpperCase() == "SEVA" ? 'top 0' : ''}
    FORMAT(shiftstarttime, 'N2') AS shiftstarttime,
    FORMAT(shiftendtime, 'N2') AS shiftendtime
FROM 
    attendancetable 
WHERE 
    Emp_Code = '${empCode}' 
    AND dateoffice = '${date}';
`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0][0],
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
function getLaterMonthYear(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const laterDate = d1 > d2 ? d1 : d2;
  const month = laterDate.getMonth() + 1; // getMonth() returns 0-11, so we add 1
  const year = laterDate.getFullYear();
  return { month, year };
}
exports.PaySlipData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  if (req.headers.compcode?.toUpperCase() == "SEVA") {
    return res.status(500).send({});
  }
  const data = req.body;
  const dateto = data.dateto;
  const dateFrom = data.dateFrom;
  const region = data.region;
  const location = data.location;
  const department = data.department;
  const empcode = data.empcode;

  const result = getLaterMonthYear(dateFrom, dateto);
  var query;

  query = `select empcode from employeemaster where export_type < 3 ${empcode ? `and empcode = '${empcode}'` : ""
    }`;

  if (region) query += ` and sal_region in (${region}) `;
  if (location)
    query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
  if (department) query += `and section in (${department}) `;

  try {
    const txnDetails = await sequelize.query(
      `WITH EmployeeInfo AS (
            SELECT 
                e.EMPCODE,
                CONCAT(e.title, ' ', e.empfirstname, ' ', e.EMPLASTNAME) AS EmployeeName,
                e.EMPLOYEEDESIGNATION AS Designation,
                e.EmpType,
                e.FATHERNAME,
                loc.misc_name AS Location,
                reg.misc_name AS Region,
                dept.misc_name AS Department,
                sect.misc_name AS Section,
                e.BANKNAME,
                e.BANKACCOUNTNO,
                e.ifsc_code,
                e.GENDER,e.pfnumber,e.UAN_NO,
            e.PAYMENTMODE,e.esinumber,
            e.CURRENTJOINDATE,
            e.LASTWOR_DATE
            FROM EMPLOYEEMASTER e
            LEFT JOIN misc_mst loc ON loc.misc_type = 85 AND loc.misc_code = e.location
            LEFT JOIN misc_mst reg ON reg.misc_type = 91 AND reg.misc_code = e.sal_region
            LEFT JOIN misc_mst dept ON dept.misc_type = 68 AND dept.misc_code = e.division
            LEFT JOIN misc_mst sect ON sect.misc_type = 81 AND sect.misc_code = e.section
            WHERE e.export_type < 3
          ),

          SalaryDetails AS (
              SELECT 			 
               s.ABSENTVALUE,s.LEAVEVALUE,s.Holiday_Leaves,s.off_days,
                  s.Emp_Code,
                  e.EmployeeName,
                  e.Designation,
                  e.EmpType,
                  e.Location,
                  e.Region,
                  e.Department,
                  e.Section,
                  s.Present_days,
                  s.Monthdays,
                  s.Gross AS SalaryMonthlyRate,
                  s.Basic AS BasicDa,
                  s.Basic_Earn AS BasicDaCalc,
                  s.HRA,
                  s.HRA_Earn AS hraCalc,
                  s.Washing AS wa,
                  s.Washing_Earn AS WaCalc,
                  s.CONVEN,
                  s.MISC_EARN,
                  s.lwf_employee,
                  s.Sal_Unpaid,
                  s.CONVEN_Earn,
                  s.Advance,
                  s.Total_Earn AS SalAmt,
                  s.Arrear AS ExtraDaysVar,
                  s.pf_employee,
                  s.Total_Days,
                  s.Deducation,
                  s.PROF_TAX,
                  s.tds,
                  s.oth_Ded,
                  s.final_payment,
                  e.BANKNAME AS bankName,
                  e.BANKACCOUNTNO AS BankAcntNo,
                  e.ifsc_code AS IfscCode,
                  e.GENDER AS Gender,
                  e.FATHERNAME,
                  e.pfnumber,
                  e.UAN_NO,s.Loan,
              e.PAYMENTMODE,
              e.CURRENTJOINDATE,
              e.LASTWOR_DATE,e.esinumber,
                  COALESCE(d.INCENTIVE_AMT, 0) AS VariablePay,
                  s.esic_employee AS esic
              FROM SALARYFILE s
              LEFT JOIN EmployeeInfo e ON e.EMPCODE = s.Emp_Code
              LEFT JOIN Emp_Ded d ON d.Emp_id = s.Emp_Code AND d.Ded_Type = 15 and d.Mnth=s.SalMnth
              WHERE s.SalMnth = '${result.month}' and s.salyear = '${result.year}' AND s.Emp_Code IN (${query})
          )--,

         -- AttendanceDetails AS (
         --     SELECT 
         --         Emp_Code, 
         --         SUM(value) AS paidDays 
         --     FROM attendancetable a
         --     JOIN Employee_AtnStatus e ON e.status = a.status
         --     WHERE Emp_Code IN (${query}) 
         --     AND a.dateoffice BETWEEN '${dateFrom}' AND '${dateto}'
         --     GROUP BY Emp_Code
         -- )

          SELECT 
              s.Emp_Code AS [Employee Code],
              s.EmployeeName AS [Employee Name],
              s.Gender,s.Present_days,s.ABSENTVALUE,s.LEAVEVALUE,s.Holiday_Leaves,s.off_days,
              s.Location AS Branch,
              IIF(s.EmpType = 1, 'REGULAR', 'CASUAL') AS Category,
              s.Department,
              s.Designation,
              s.Section,
              s.SalaryMonthlyRate AS [Salary Monthly Rate],
            s.CURRENTJOINDATE as [Joining Date],
            s.LASTWOR_DATE as [Last Working Date],
              s.Monthdays,
              --a.paidDays AS [Days Paid],
              s.Total_Days AS [Days Paid],
              s.BasicDa AS [Basic DA],
              s.BasicDaCalc AS [Basic DA Calc],
              s.HRA,
              s.hraCalc AS [HRA Calc],
              s.wa,
              s.WaCalc,
              s.CONVEN,
              s.CONVEN_Earn,
              COALESCE(s.VariablePay, 0) AS [Variable Pay],
              s.ExtraDaysVar AS [Extra Days Pay],    
              COALESCE(s.Sal_Unpaid, 0) AS [Spl Allowance],
              (s.SalAmt + COALESCE(s.VariablePay, 0)) AS [total Wages],   
              s.pf_employee AS [PROV. FUND],
              s.PROF_TAX AS [P.Tax],
              s.lwf_employee AS [LWF],
              s.esic,
              s.tds,
       			  (s.Advance+s.Loan )as Advance,
              (s.oth_ded + s.Advance) AS [Other ded.],
              s.Deducation AS [Total Deductions],
              s.final_payment AS [Net Salary],  
            s.PAYMENTMODE as [Payment Mode],
              s.bankName AS [Bank Name],
              s.BankAcntNo AS [Account No],
              s.IfscCode AS [IFSC Code],
              s.FATHERNAME,s.pfnumber,s.UAN_NO,s.esinumber
          FROM SalaryDetails s 
          --LEFT JOIN AttendanceDetails a ON s.Emp_Code = a.Emp_Code
          where Final_Payment > 0 or (LASTWOR_DATE is null and Final_Payment <= 0) `
    );
    const Company_Name = await sequelize.query(
      `select top 1 cm.comp_name, ck.Comp_Logo from Comp_Mst cm
      	  join COMP_KEYDATA ck on ck.Comp_Code = cm.Comp_Code`
    );

    res.status(200).send({
      data: { ...txnDetails[0][0], ...Company_Name[0][0] }
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({});
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.UpdateAtnStatus = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {

    console.log(req.body)
    if (req.body.Utd) {
      await sequelize.query(`update employee_atnstatus
      set  
          Present=:Present,
          Absent=:Absent,
          HalfDay=:HalfDay,
          WeekOff=:WeekOff,
          Relaxation=:Relaxation,
          Holiday=:Holiday,
          colorCode=:colorCode,
          Value=:Value,
          Created_By=:Created_By
          where Utd = :Utd
      `, {
        replacements: {
          ...req.body
        }
      });
    } else {
      const data = await sequelize.query(`select distinct status from (
            select [Desc] as status from statusmaster
            union all
            select Misc_Abbr as status from Misc_Mst where Misc_Type in (91,92)
            union all
            select distinct status from attendancetable where status is not null
            ) as dasd`);
      const check = data[0].find(item => item.status?.trim()?.toUpperCase() == req.body.Status?.trim()?.toUpperCase());

      if (!check) {
        return res.status(400).send({
          Status: "false",
          Message: "Status not available in the masters please recheck Status",
          Resul: {},
        });
      }
      await sequelize.query(`	IF NOT EXISTS (SELECT 1 FROM employee_atnstatus WHERE Status = :Status)
                        BEGIN
                          INSERT INTO employee_atnstatus (
                          Status, Present, Absent, HalfDay, WeekOff, Relaxation, Holiday, colorCode, Value,Created_By
                          ) VALUES (
                          :Status, :Present, :Absent, :HalfDay, :WeekOff, :Relaxation, :Holiday, :colorCode, :Value,:Created_By
                          )
                        END     
        `, {
        replacements: {
          Status: req.body.Status?.toUpperCase(),
          ...req.body
        }
      });
    }

    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: {},
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while updating data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.AtnStatus = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);


  try {
    const data = await sequelize.query(`select * from employee_atnstatus order by utd desc`);

    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: data[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while updating data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.DeleteAtnStatus = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);


  try {
    const dat1a = await sequelize.query(`update employee_atnstatus set created_by = '${req.body.Created_By}'  where utd = ${req.body.Utd}`);
    const data = await sequelize.query(`delete from employee_atnstatus where utd = ${req.body.Utd}`);
    res.status(200).send({
      Status: "true",
      Message: "records deleted successfully",
      Result: data[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while updating data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.LeaveTypes = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body);
  try {
    const empCode = req.body.empcode;
    if (empCode == "" || empCode == undefined || empCode == null) {
      return res.status(500).send({
        status: false,
        Message: "empCode is mandatory",
      });
    }
    //misc_code 4 = casual leave
    //misc_code 5 = paid leave
    //misc_code 6 = sick leave
    //misc_code 10 = half casual leave
    //misc_code 102 = half paid leave
    //misc_code 103 = half sick leave

    // const leaves = await sequelize.query(`
    //   select misc_Code from misc_mst where assessable_column = 1 and misc_type = 92 and export_type = 1` , {
    //   replacements: {
    //     empCode,
    //   },
    // });
    const UpdateLeveBal = await sequelize.query(`
      DECLARE @currentMonth INT;
      SET @currentMonth = MONTH(GETDATE());
      EXEC UpdateOrInsertLeaveBalance @emp_code = :empCode, @leave_type = 4, @leave_mnth = @currentMonth;      
      EXEC UpdateOrInsertLeaveBalance @emp_code = :empCode, @leave_type = 9, @leave_mnth = @currentMonth;      
      ` , {
      replacements: {
        empCode,
      },
    });
    const data = await sequelize.query(
      `select Misc_Code,Misc_Code as value, concat(Misc_Name ,'\n',FORMAT(GETDATE(), 'MMM/yyyy')) as Misc_Name ,concat(Misc_Name ,'\n',FORMAT(GETDATE(), 'MMM/yyyy'))as label, Misc_Abbr,
 Misc_Code as Leave_Type ,
  (select top 1 Op_Bal  from leave_bal where Emp_Code = :empCode and Leave_Type = Misc_Code and Leave_Yr = year(getdate())  and Leave_Mnth = month(getdate()) ) as Op_Bal ,
  (select top 1 Gen_Lev  from leave_bal where Emp_Code = :empCode and Leave_Type = Misc_Code and Leave_Yr = year(getdate())  and Leave_Mnth = month(getdate()) ) as Gen_Lev ,
  (select top 1 Avail_Lev  from leave_bal where Emp_Code = :empCode and Leave_Type = Misc_Code and Leave_Yr = year(getdate())  and Leave_Mnth = month(getdate()) ) as Avail_Lev ,
  (select top 1 Cl_Bal  from leave_bal where Emp_Code = :empCode and Leave_Type = Misc_Code and Leave_Yr = year(getdate())  and Leave_Mnth = month(getdate()) ) as Cl_Bal 
  from  misc_mst where Misc_Type =92 and  Misc_Code in (4,5,6,9)  and Assessable_Column = 1`,
      {
        replacements: {
          empCode,
        },
      }
    );
    res.status(200).send({
      Status: "true",
      Message: "",
      Result: data[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while updating data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.AddLeave = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body);

  const MP_Date = req.body.MP_Date;
  const MP_To_Date = req.body.MP_To_Date ? req.body.MP_To_Date : req.body.MP_Date;
  // if(MP_To_Date)
  const startDate = new Date(MP_Date);
  const endDate = new Date(MP_To_Date);
  const differenceInTime = endDate.getTime() - startDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);


  var response = {
    Status: false,
    Message: "",
  };
  var errorflag = false;

  var half_full = req.body.half_full;
  var MP_Reason = req.body.MP_Reason?.toString();
  var LeaveValue = differenceInDays + 1;
  console.log(LeaveValue)
  if (LeaveValue <= 0) {
    response.Message = "Please select correct from and to days";
    errorflag = true;
    return res.status(201).send({
      Status: "false",
      Message: response.Message,
      Query: "",
    });
  }
  if (LeaveValue >= 5) {
    response.Message = "Can not apply leave more than 4 days";
    errorflag = true;
    return res.status(201).send({
      Status: "false",
      Message: response.Message,
      Query: "",
    });
  }
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth(); // Month is 0-indexed (0 for January, 11 for December)
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  // if (
  //   startYear === currentYear &&
  //   startMonth === currentMonth &&
  //   endYear === currentYear &&
  //   endMonth === currentMonth
  // ) {
  // } else {
  //   response.Message = "Can not apply leave other than current month";
  //   errorflag = true;
  //   return res.status(201).send({
  //     Status: "false",
  //     Message: response.Message,
  //     Query: "",
  //   });
  // }
  if (startYear != endYear || startMonth != endMonth) {
    response.Message = "Can not apply leave In 2 diffrent Months";
    errorflag = true;
    return res.status(201).send({
      Status: "false",
      Message: response.Message,
      Query: "",
    });
  }
  var MP_Reason2 = req.body.MP_Reason?.toString();
  var MP_Reason3 = req.body.MP_Reason?.toString();
  switch (MP_Reason) {
    case "4":
      if (half_full == 0) {
        MP_Reason2 = "10";
        MP_Reason3 = "10";
        LeaveValue = 0.5;
      } else {
        MP_Reason3 = "10";
      }
      break;
    case "5":
      if (half_full == 0) {
        MP_Reason2 = "102";
        MP_Reason3 = "102";
        LeaveValue = 0.5;
      } else {
        MP_Reason3 = "102";
      }
      break;
    case "6":
      if (half_full == 0) {
        LeaveValue = 0.5;
        MP_Reason2 = "103";
        MP_Reason3 = "103";
      } else {
        MP_Reason3 = "103";
      }
      break;
    case "9":
      if (half_full == 0) {
        LeaveValue = 0.5;
        MP_Reason2 = "104";
        MP_Reason3 = "104";
      } else {
        MP_Reason3 = "104";
      }
      break;
    default:
      break;
  }

  const Spl_Remark = req.body.Spl_Remark;
  const candCode = req.body.empcode;


  try {
    // query = ` select count(*) as count_,(select top 1 Cl_Bal  from leave_bal where Emp_Code = '${candCode}' and Leave_Type = ${MP_Reason} order by Leave_Yr desc,Leave_Mnth desc) as closing from attendancetable where emp_code = '${candCode}' and Mipunch_Reason = ${MP_Reason} and man_appr= 'N' and month(dateoffice) >=  (select top 1 Leave_Mnth  from leave_bal where Emp_Code = '${candCode}' and Leave_Type = ${MP_Reason} order by Leave_Yr desc,Leave_Mnth desc)
    //     union all
    //     select count(*) as count_,(select top 1 Cl_Bal  from leave_bal where Emp_Code = '${candCode}' and Leave_Type = ${MP_Reason} order by Leave_Yr desc,Leave_Mnth desc) as closing from attendancetable where emp_code = '${candCode}' and Mipunch_Reason = ${MP_Reason3} and man_appr= 'N' and month(dateoffice) >=  (select top 1 Leave_Mnth  from leave_bal where Emp_Code = '${candCode}' and Leave_Type = ${MP_Reason} order by Leave_Yr desc,Leave_Mnth desc)`;

    query = `select count(*) as count_,(select top 1 Cl_Bal  from leave_bal where Emp_Code = '${candCode}' and Leave_Type = ${MP_Reason} and 
	 Leave_Yr = year(getdate())  and Leave_Mnth = month(getdate())) as closing from attendancetable where 
	 emp_code = '${candCode}' and Mipunch_Reason = ${MP_Reason} and man_appr= 'N' and 
	 year(dateoffice) = year(getdate()) and  month(dateoffice) = month(getdate())
	 union all
        select count(*) as count_,(select top 1 Cl_Bal  from leave_bal where Emp_Code = '${candCode}' and Leave_Type = ${MP_Reason} and 
	 Leave_Yr = year(getdate())  and Leave_Mnth = month(getdate())) as closing from attendancetable where emp_code = '${candCode}' and Mipunch_Reason = ${MP_Reason3} and man_appr= 'N' 
	 and year(dateoffice) = year(getdate()) and  month(dateoffice) = month(getdate())`;
    const result = await sequelize.query(query);
    let closingMain = (result[0][0].closing ? result[0][0].closing : 0) - result[0][0].count_ - result[0][1].count_ / 2;
    console.log(closingMain)
    if (closingMain == 0) {
      response.Message = "No pending Leaves please available";
      errorflag = true;
    }

    if (LeaveValue > closingMain) {
      response.Message = `please check your Leaves application you have only ${closingMain} leave left For ${endMonth + 1} Month`;
      errorflag = true;
    }
    const result1 = await sequelize.query(
      `Select Man_Appr ,in1mannual,out1mannual , cast(dateoffice as date) as date_ from  Attendancetable where Emp_Code='${candCode}' AND DateOffice between '${MP_Date}' and '${MP_To_Date}'`
    );
    for (let i = 0; i < result1[0].length; i++) {
      if (result1[0][i].Man_Appr == null || result1[0][i].Man_Appr == "") {
      } else {
        response.Message =
          `Mispunch Request already raised on date '${result1[0][i].date_}'. can not raise leave request`;
        errorflag = true;
      }
    }

    if (errorflag) {
      return res.status(201).send({
        Status: "false",
        Message: response.Message,
        Query: "",
      });
    } else {
      const updateresult = await sequelize.query(
        `Update attendanceTable set 
												Status='A',
												Man_Appr='N',
												In1Mannual='N',
												Man_Recomend='N',
												man_rej='N', 
												Mipunch_Reason=:MP_Reason,
                        MI_Remark = null,
                        Spl_Remark=:Spl_Remark,
												Appr_1_Code=null,
												Appr_2_Code=null,
												Appr_3_Code=null,
												Appr_3_Stat=null,
												Appr_2_Stat=null,
												Appr_1_Stat=null,
												Appr_1_Rem =null,
												Appr_2_Rem =null,
                        Appr_3_Rem =null,
                        Mi_type=1,
                        in1 = CONCAT(cast(dateoffice as date),' ', REPLACE(cast(shiftstarttime as varchar),'.',':')),
                        Out1 = CONCAT(cast(dateoffice as date),' ', REPLACE(cast(shiftendtime as varchar),'.',':'))
                        output inserted.Mi_type
												where DateOffice between :MP_Date and :MP_To_Date and Emp_Code=:candCode `,
        {
          replacements: {
            MP_Reason: MP_Reason2,
            MP_Remark: null,
            Spl_Remark: Spl_Remark ? Spl_Remark : "",
            MP_Date,
            candCode,
            MP_To_Date
          },
        }
      );
      if (updateresult[0].length) {
        response.Message = "Leave request raised successfully!";
        return res.status(200).send({
          Status: true,
          Message: response.Message,
          Query: "",
          Result: {},
        });
      } else {
        response.Message = "Attendance roster not created contact HR person";
        return res.status(201).send({
          Status: false,
          Message: response.Message,
          Query: "",
          Result: {},
        });
      }

    }
  } catch (error) {
    console.error("Error:", error);
    response.Message = error.message;
    res.status(500).json(response);
  }
};
exports.getLeaveData = async function (req, res) {
  console.log(req.body)
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EMPCODE = req.body.EMPCODE ? req.body.EMPCODE : "";
    const Appr_Code = req.body.Appr_Code;
    const StartDate = req.body.StartDate;
    const EndDate = req.body.EndDate;
    const result =
      await sequelize.query(`SELECT top 1  EMPCODE, approver1_A	,approver1_B	,approver2_A	,approver2_B, approver3_A,	approver3_B,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver1_A collate database_default) as r1AName , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver1_B collate database_default) as r1BName ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver2_A collate database_default) as r2AName , 
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver2_B collate database_default) as r2BName  ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver3_A collate database_default) as r3AName  ,
    (select top 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where EMPCODE collate database_default = e.approver3_B collate database_default) as r3BName  
    FROM Approval_Matrix e WHERE EMPCODE = '${EMPCODE}' and module_code='attdence'`);
    let allreq;
    if (EMPCODE && EMPCODE !== "") {
      allreq = 1;
    } else {
      allreq = 2;
    }
    let b = "";
    const MpReason = `4,5,6,9,10,101,104`;

    if (result && allreq === 1) {
      let ApprovalLevel = 0;
      const approver1_A = result[0][0]?.approver1_A?.toUpperCase();
      const approver2_A = result[0][0]?.approver2_A?.toUpperCase();
      const approver3_A = result[0][0]?.approver3_A?.toUpperCase();
      const approver1_B = result[0][0]?.approver1_B?.toUpperCase();
      const approver2_B = result[0][0]?.approver2_B?.toUpperCase();
      const approver3_B = result[0][0]?.approver3_B?.toUpperCase();

      if (
        approver1_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver1_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 1;
      } else if (
        approver2_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver2_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        ApprovalLevel = 2;
      } else if (
        approver3_A?.toUpperCase() == Appr_Code?.toUpperCase() ||
        approver3_B?.toUpperCase() == Appr_Code?.toUpperCase()
      ) {
        console.log(approver3_A?.toUpperCase());
        console.log(Appr_Code?.toUpperCase());

        ApprovalLevel = 3;
      }

      let q = ``;
      if (StartDate && StartDate != "" && EndDate && EndDate != "") {
        q = `AND at.dateoffice between '${StartDate}' and '${EndDate}'`;
      }

      b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
        (Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
        (Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
       ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
       at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
       at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,
       at.LeaveValue,em.Prob_Period,at.MAN_APPR,1 as status_khud_ka,at.Man_Rej,
       IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
       (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
       (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
       iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
       iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
       iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
       iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by
       FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
       WHERE  at.mipunch_reason in (${MpReason}) and at.emp_code = '${EMPCODE}' ${q} ORDER BY at.DateOffice desc`;

      if (Appr_Code && Appr_Code != "") {
        b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
				(Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
				(Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
				 ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
				 at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
				 at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,at.Man_Rej,
				 at.LeaveValue,em.Prob_Period,at.MAN_APPR,Appr_${ApprovalLevel}_Stat as status_khud_ka,
				 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
				 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
				 iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
				 iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
				 iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
				 iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
				 IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat
				 FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
				 WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and at.mipunch_reason in (${MpReason}) and at.emp_code = '${EMPCODE}' ORDER BY at.DateOffice desc`;

        if (ApprovalLevel > 1) {
          b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
          (Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
          (Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
           ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
           at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
           at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,at.Man_Rej,
           at.LeaveValue,em.Prob_Period,at.MAN_APPR,Appr_${ApprovalLevel}_Stat as status_khud_ka,
           (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
           (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
           iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
           iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
           iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
           iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
           IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat
           FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
           WHERE at.MAN_APPR = 'N' and at.Man_rej ='N'  
          and at.mipunch_reason in (${MpReason}) and  at.emp_code = '${EMPCODE}' and at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
           at.utd not in (select utd from attendancetable where Appr_${ApprovalLevel - 1
            }_Stat is null and man_appr='N' and man_rej = 'N')
            ORDER BY at.DateOffice desc`;
        }
      }
    }

    if (allreq == 2 && Appr_Code && Appr_Code != "") {
      b = `SELECT at.Utd, at.Emp_Code AS Code_ ,(isnull(Title,'' ) + ' ' + isnull(EMPFIRSTNAME,'' )+ ' ' + isnull(EMPLASTNAME,'' )) AS EmpName,
			(Select  top 1 MISC_ABBR from MISC_MST where Misc_type=92 AND Misc_code=at.Mipunch_Reason) as Mipunch_Reason,spl_remark,
			(Select  top 1 Misc_Name  from MISC_MST where Misc_type=93 AND Misc_code=at.MI_Remark) as MI_Remark
			 ,isnull(em.EmployeeDesignation,'not specified') as EmployeeDesignation,
			 at.DateOffice AS Date_,at.ShiftStartTime AS StTime,at.ShiftEndTime AS EndTime,at.In2,at.Out2,at.Status,at.iN1mANNUAL,
			 at.iN2mANNUAL,at.out1mANNUAL,at.out2mANNUAL,em.CurrentJoinDate,em.Region,at.WO_Value,
			 at.LeaveValue,em.Prob_Period,at.MAN_APPR,at.Man_Rej,
			 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 1 and dateoffice = at.dateoffice order by utd desc) as fileIn,
			 (select top 1 DOC_PATH from EMP_DOCS where EMP_CODE collate database_default =empcode collate database_default  and misspunch_inout = 2 and dateoffice = at.dateoffice order by utd desc) as fileOut,
			 iif(Appr_3_Rem is not null,Appr_3_Rem,iif(Appr_2_Rem is not null,Appr_2_Rem,iif(Appr_1_Rem is not null,Appr_1_Rem,null))) head_remark,	
			 iif(Appr_3_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_3_code),
			 iif(Appr_2_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_2_code),
			 iif(Appr_1_stat is not null,(select top 1 empfirstname from employeemaster where empcode = Appr_1_code),null))) Head_remark_by,
    		 IIF(man_appr = 'Y' OR man_rej = 'Y', 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
			 iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver1_A, approver1_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver2_A, approver2_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver3_A, approver3_B) and module_code = 'attdence' and at.emp_code collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka
			 FROM  attendancetable AS at INNER JOIN EmployeeMaster AS em ON em.EmpCode collate database_default  = at.Emp_Code collate database_default  
			 WHERE at.MAN_APPR = 'N' and at.Man_rej ='N' and at.mipunch_reason in (${MpReason}) and 
			 ((at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver1_A, approver1_B) and module_code = 'attdence'))
			 or (at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver2_A, approver2_B) and module_code = 'attdence') and  at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
				 at.utd not in (select utd from attendancetable where Appr_1_Stat is null and man_appr='N' and man_rej = 'N')) or
			 (at.emp_code in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
			 IN (approver3_A	,approver3_B) and module_code = 'attdence')  and at.utd in (select utd from attendancetable where man_appr='N' and man_rej = 'N') and 
				 at.utd not in (select utd from attendancetable where Appr_2_Stat is null and man_appr='N' and man_rej = 'N')))
			 ORDER BY at.DateOffice desc`;
    }

    const a = await sequelize.query(b);
    let data = [];

    a[0].forEach((rowData) => {
      let row = {
        EmpCode: rowData.Code_ ? rowData.Code_.trim() : "",
        EmpName: rowData.EmpName ? rowData.EmpName.trim() : "",
        EmployeeDesignation: rowData.EmployeeDesignation
          ? rowData.EmployeeDesignation.trim()
          : "",
        StTime: rowData.StTime ? rowData.StTime.toString() : "",
        EndTime: rowData.EndTime ? rowData.EndTime.toString() : "",
        Date: new Date(rowData.Date_).toLocaleDateString("en-IN"),
        In1: new Date(rowData.In2).toISOString().substr(11, 5),
        Out1: new Date(rowData.Out2).toISOString().substr(11, 5),
        In1Mannual: rowData.In1Mannual ? rowData.In1Mannual : null,
        Out1Mannual: rowData.Out1Mannual ? rowData.Out1Mannual : null,
        MAN_APPR: rowData.MAN_APPR,
        Man_Rej: rowData.Man_Rej ? rowData.Man_Rej : null,
        AtnStatus: rowData.Status,
        // fileIn: rowData.fileIn
        //   ? `https://erp.autovyn.com/backend/fetch?filePath=${rowData.fileIn}`
        //   : null,
        // fileOut: rowData.fileOut
        //   ? `https://erp.autovyn.com/backend/fetch?filePath=${rowData.fileOut}`
        //   : null,
        MI_Remark: rowData.MI_Remark,
        Mipunch_Reason: rowData.Mipunch_Reason,
        Utd: rowData.Utd,
        head_remark: rowData.head_remark,
        head_remark_by: rowData.Head_remark_by,
        stat: rowData.stat,
        status_khud_ka: rowData.status_khud_ka,
        Spl_Remark: rowData.spl_remark,
        spl_remark: rowData.spl_remark,
      };
      data.push(row);
    });
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: data,
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
exports.ApproveLeave = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  let response = {
    Status: false,
    Message: "",
  };
  const leva_obj = {
    "4": "4",
    "5": "5",
    "6": "6",
    "9": "9",
    "104": "9",
    "10": '4'
  }
  try {
    console.log(req.body);

    const EMPCODE = req.body.EMPCODE;
    const Appr_Code = req.body.Appr_Code;
    const Utd = req.body.Utd;
    const ApproveOrRej = req.body.ApproveOrRej;
    const Remark = req.body.Remark;

    const a = await sequelize.query(
      `SELECT top 1 * from Approval_Matrix where empcode = '${EMPCODE}' and module_code='attdence'`
    );
    const b = await sequelize.query(
      `	select cast(dateoffice as date) as dateoffice  from attendancetable where utd in (${Utd})`
    );
    if (a[0]?.length > 0) {
      let ApprovalLevel = 0;
      const approver1_A = a[0][0].approver1_A?.toUpperCase();
      const approver2_A = a[0][0].approver2_A?.toUpperCase();
      const approver3_A = a[0][0].approver3_A?.toUpperCase();
      const approver1_B = a[0][0].approver1_B?.toUpperCase();
      const approver2_B = a[0][0].approver2_B?.toUpperCase();
      const approver3_B = a[0][0].approver3_B?.toUpperCase();

      if (approver1_A?.toUpperCase() == Appr_Code?.toUpperCase() || approver1_B?.toUpperCase() == Appr_Code?.toUpperCase()) {
        ApprovalLevel = 1;
      } else if (approver2_A?.toUpperCase() == Appr_Code?.toUpperCase() || approver2_B?.toUpperCase() == Appr_Code?.toUpperCase()) {
        ApprovalLevel = 2;
      } else if (approver3_A?.toUpperCase() == Appr_Code.toUpperCase() || approver3_B?.toUpperCase() == Appr_Code?.toUpperCase()) {
        ApprovalLevel = 3;
      }

      if (ApproveOrRej == 1) {
        var asd = ApprovalLevel == 1 ? 1 : ApprovalLevel - 1;
        let result1 = ``;
        if (ApprovalLevel == 1) {
          result1 = `UPDATE attendancetable 
            SET Appr_${ApprovalLevel}_Stat = 1,
            Appr_${ApprovalLevel}_Code = '${Appr_Code}', 
            Appr_${ApprovalLevel}_Rem = '${Remark}' 
            WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat IS NULL and man_appr !='Y'`;
        } else {
          result1 = `UPDATE attendancetable 
            SET Appr_${ApprovalLevel}_Stat = 1,
            Appr_${ApprovalLevel}_Code = '${Appr_Code.toUpperCase()}', 
            Appr_${ApprovalLevel}_Rem = '${Remark}' 
            WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat IS NULL and Appr_${asd}_Stat is not null`;
        }
        await sequelize.query(result1, { transaction: t });
        if (ApprovalLevel == 1) {
          response.Message = "Approval 1 Updated Successfully";
        } else if (ApprovalLevel == 2) {
          response.Message = "Approval 2 Updated Successfully";
        } else if (ApprovalLevel == 3) {
          response.Message = "Approval 3 Updated Successfully";
        }
        let Finalresult = ``;
        const dataofleave = await sequelize.query(`select Misc_Dtl3 as Misc_Dtl1,Misc_Code from misc_Mst where misc_code in (select top 1 mipunch_reason from attendancetable WHERE  Utd IN (${Utd})) and Misc_Type = 92`, { transaction: t });

        if (ApprovalLevel == 3) {
          const leveUpdate = await sequelize.query(`update Leave_BAL set 
            Avail_Lev = Avail_Lev  + ${dataofleave[0][0].Misc_Dtl1} , Cl_Bal = cl_bal - ${dataofleave[0][0].Misc_Dtl1} output inserted.Cl_Bal 
            where Emp_Code in ('${EMPCODE}') and (cl_bal- ${dataofleave[0][0].Misc_Dtl1}) >= 0 and
            Leave_Mnth = MONTH('${b[0][0].dateoffice?.slice(0, 10)}') 
            and Leave_Yr = YEAR('${b[0][0].dateoffice?.slice(0, 10)}')
            and  Leave_Type = ${leva_obj[dataofleave[0][0].Misc_Code]}
            `, { transaction: t });
          console.log(leveUpdate[0][0]);
          if (leveUpdate[0][0]) {
            const UpdateLeveBal = await sequelize.query(`
            DECLARE @currentMonth INT;
            SET @currentMonth = MONTH('${b[0][0].dateoffice?.slice(0, 10)}');
            EXEC UpdateOrInsertLeaveBalance @emp_code = :EMPCODE, @leave_type = 4, @leave_mnth = @currentMonth;
            EXEC UpdateOrInsertLeaveBalance @emp_code = :EMPCODE, @leave_type = 9, @leave_mnth = @currentMonth;
          ` , {
              replacements: {
                EMPCODE,
              }, transaction: t
            }); Finalresult = await sequelize.query(`UPDATE attendancetable 
              SET man_appr = 'Y'
              WHERE  Utd IN (${Utd}) and man_appr = 'N'`, { transaction: t });
            response.Message = "Final Approval Done";
            await t.commit();
          } else {
            response.Message = 'Leave can not be adjusted'
            await t.rollback();
          }
        } else if (
          ApprovalLevel == 2 &&
          !a[0][0].approver3_A &&
          !a[0][0].approver3_B
        ) {
          const leveUpdate = await sequelize.query(`update Leave_BAL set 
            Avail_Lev = Avail_Lev  + ${dataofleave[0][0].Misc_Dtl1} , Cl_Bal = cl_bal - ${dataofleave[0][0].Misc_Dtl1} output inserted.Cl_Bal 
            where Emp_Code in ('${EMPCODE}') and (cl_bal- ${dataofleave[0][0].Misc_Dtl1}) >= 0 and
            Leave_Mnth = MONTH('${b[0][0].dateoffice?.slice(0, 10)}') 
            and Leave_Yr = YEAR('${b[0][0].dateoffice?.slice(0, 10)}')
            and  Leave_Type = ${leva_obj[dataofleave[0][0].Misc_Code]}
            `, { transaction: t });
          if (leveUpdate[0][0]) {
            const UpdateLeveBal = await sequelize.query(`
              DECLARE @currentMonth INT;
              SET @currentMonth = MONTH('${b[0][0].dateoffice?.slice(0, 10)}');
              EXEC UpdateOrInsertLeaveBalance @emp_code = :EMPCODE, @leave_type = 4, @leave_mnth = @currentMonth;
              EXEC UpdateOrInsertLeaveBalance @emp_code = :EMPCODE, @leave_type = 9, @leave_mnth = @currentMonth;
              ` , {
              replacements: {
                EMPCODE,
              }, transaction: t
            }); Finalresult = await sequelize.query(`UPDATE attendancetable 
                                    SET man_appr = 'Y'  
                                    WHERE  Utd IN (${Utd}) and man_appr = 'N'`, { transaction: t });
            response.Message = "Final Approval Done";
            await t.commit();
          } else {
            response.Message = 'Leave can not be adjusted'

            await t.rollback();
          }
        } else if (ApprovalLevel == 1 && !a[0][0].approver3_A && !a[0][0].approver3_B && !a[0][0].approver2_A && !a[0][0].approver2_B) {
          const leveUpdate = await sequelize.query(`update Leave_BAL set 
            Avail_Lev = Avail_Lev  + ${dataofleave[0][0].Misc_Dtl1} , Cl_Bal = cl_bal - ${dataofleave[0][0].Misc_Dtl1} output inserted.Cl_Bal 
            where Emp_Code in ('${EMPCODE}') and (cl_bal- ${dataofleave[0][0].Misc_Dtl1}) >= 0 and
            Leave_Mnth = MONTH('${b[0][0].dateoffice?.slice(0, 10)}') 
            and Leave_Yr = YEAR('${b[0][0].dateoffice?.slice(0, 10)}')
            and  Leave_Type = ${leva_obj[dataofleave[0][0].Misc_Code]}
            `, { transaction: t });
          console.log(leveUpdate[0][0]);

          if (leveUpdate[0][0]) {
            const UpdateLeveBal = await sequelize.query(`
              DECLARE @currentMonth INT;
              SET @currentMonth = MONTH('${b[0][0].dateoffice?.slice(0, 10)}');
              EXEC UpdateOrInsertLeaveBalance @emp_code = :EMPCODE, @leave_type = 4, @leave_mnth = @currentMonth;
              EXEC UpdateOrInsertLeaveBalance @emp_code = :EMPCODE, @leave_type = 9, @leave_mnth = @currentMonth;
              ` , {
              replacements: {
                EMPCODE,
              }, transaction: t
            });
            Finalresult = await sequelize.query(`UPDATE attendancetable 
                                    SET man_appr = 'Y'  
                                    WHERE  Utd IN (${Utd}) and man_appr = 'N'`, { transaction: t });
            response.Message = "Final Approval Done";
            await t.commit();
          } else {
            response.Message = 'Leave can not be adjusted'
            await t.rollback();
          }
        } else {
          t.commit();
        }

      } else {
        var asd = ApprovalLevel == 1 ? 1 : ApprovalLevel - 1;
        let result2 = ``;
        if (ApprovalLevel == 1) {
          result2 = `UPDATE attendancetable 
          SET Appr_${ApprovalLevel}_Stat = 0,
          Appr_${ApprovalLevel}_Code = '${Appr_Code.toUpperCase()}', 
          Appr_${ApprovalLevel}_Rem = '${Remark}',
          man_appr = null, in1mannual = null, out1mannual = null,  Man_Rej='Y',        
          Reject_By = '${Appr_Code.toUpperCase()}'
          WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat is null and man_appr !='Y'`;
        } else {
          result2 = `UPDATE attendancetable 
              SET Appr_${ApprovalLevel}_Stat = 0,
              Appr_${ApprovalLevel}_Code = '${Appr_Code.toUpperCase()}', 
              Appr_${ApprovalLevel}_Rem = '${Remark}',
              man_appr = null, in1mannual = null, out1mannual = null,  Man_Rej='Y',
              Reject_By='${Appr_Code.toUpperCase()}'
              WHERE  Utd IN (${Utd}) and Appr_${ApprovalLevel}_Stat is null and Appr_${asd}_Stat is not null`;
        }
        await sequelize.query(result2);
        const Reject =
          await sequelize.query(`INSERT INTO Man_Reject SELECT att.EMP_CODE, att.dateoffice, 
            SUBSTRING(REPLACE(CONVERT(VARCHAR, att.In1, 108), ':', '.'),0,5) AS In1_Time, 
            SUBSTRING(REPLACE(CONVERT(VARCHAR, att.In1, 108), ':', '.'),0,5) AS In2_Time, 
            '${Appr_Code.toUpperCase()}' AS Some_Column FROM attendancetable AS att WHERE att.Utd IN (${Utd})`);
        response.Message = "Final Rejection completed";
      }
    }
    res.status(200).send({
      Status: true,
      Message: response.Message,
      Query: "",
      Result: {},
    });
  } catch (e) {
    console.error(e);
    await t.rollback();
    res.status(500).send({
      Status: false,
      Message: "Error occurred while Updating Status data",
      Query: "",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};



async function uploadImagesAnnonsment(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    console.log(files);

    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/Announcement/`;
      const ext = path.extname(file.originalname);
      // Generate randomUUID
      const randomUUID = uuidv4();

      // Append extension to randomUUID
      const fileName = randomUUID + ext;
      console.log(fileName);
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
        console.log(`Image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
      }
      const data = {
        SRNO: index,
        EMP_CODE: Created_by,
        Created_by: Created_by,
        DOC_NAME: file.originalname,
        misspunch_inout: index,
        columndoc_type: "Announcement",
        DOC_PATH: `${customPath}${fileName}`,
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

exports.addAnnouncement = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  let {
    title,
    message,
    created_by,
    send_by,
    status,
    priority,
    is_deleted,
    send_to_users,
  } = req.body;

  try {

    const EMP_DOCS_data = await uploadImagesAnnonsment(
      req.files,
      req.headers?.compcode?.split("-")[0],
      created_by
    );
    send_to_users=JSON.parse(send_to_users);
    // Insert the announcement first
    const result = await sequelize.query(
      `INSERT INTO announcements (title, message, created_by, send_by, send_to ,
      status, priority, attachment_path, is_deleted) output inserted.announcement_id
      VALUES (:title, :message, :created_by, :send_by, :send_to,
      :status, :priority, :attachment_path, :is_deleted)`,
      {
        replacements: {
          title: title ? title : null,
          message: message ? message : null,
          created_by: created_by ? created_by : null,
          send_by: send_by ? send_by : null,
          send_to: send_to_users ? send_to_users.length : 0,
          status: status ? status : 1,
          priority: priority ? priority : null,
          attachment_path: EMP_DOCS_data[0]?.DOC_PATH ? EMP_DOCS_data[0]?.DOC_PATH : null,
          is_deleted: is_deleted ? is_deleted : false,
        },
        transaction: t,
      }
    );
    console.log(result);
    const announcementId = result[0][0].announcement_id;
    console.log(send_to_users,"hhhhhh");

    // Insert the users into the announcement_users table
    if (send_to_users && send_to_users.length > 0) {
      const values = send_to_users
        .map((user) => `(${announcementId}, '${user}')`)
        .join(", ");

      await sequelize.query(
        `INSERT INTO announcement_users (announcement_id, employee_code) VALUES ${values}`,
        {
          transaction: t,
        }
      );
    }

    await t.commit();
    res.status(200).send({
      Status: "true",
      Message: EMP_DOCS_data[0]?.DOC_PATH,
      Result: null,
    });
  } catch (e) {
    console.error(e);
    await t.rollback();
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while inserting data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getAnnouncements = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const userId = req.body.userId;

  try {
    const results = await sequelize.query(
      `SELECT
        a.announcement_id as announcement_id,   
        a.title,
        a.message,
        a.created_by,
        a.send_by,
        a.status,
        a.priority,
        a.attachment_path,
        a.is_deleted,
        a.created_at,
        a.send_to as send_to_users_count  ,     
          (
        SELECT COUNT(*)
        FROM announcement_users
        WHERE announcement_id = a.announcement_id and status = 1
    ) AS total_opened_count,
		(select concat(announcement_users.employee_code,' ',EMPFIRSTNAME) as name,status,ReadDate from announcement_users join EMPLOYEEMASTER on empcode = employee_code  WHERE announcement_id = a.announcement_id order by status desc,ReadDate for json path, include_null_values) as details
      FROM
        announcements a
      where a.created_by = :userId
      ORDER BY
        a.created_at DESC`,

      {
        replacements: {
          userId: userId,
        },
      }
    );
    const resulttt = results[0].map((dataa) => ({
      ...dataa,
      details: JSON.parse(dataa.details || "[]"),
    }));

    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: resulttt || [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getUserAnnouncements = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const userId = req.body.userId;

  try {
    const results = await sequelize.query(
      `SELECT au.id ,
        au.status as status1 , 
        a.announcement_id as announcement_id, 
        a.title, 
        a.message, 
        (select concat(empfirstname, ' ', emplastname)as name from employeemaster where empcode = a.created_by )as created_by,
        a.send_by, 
        a.status, 
        a.priority, 
        a.attachment_path, 
        a.is_deleted, 
        a.created_at
      FROM 
        announcements a
      INNER JOIN 
        announcement_users au 
      ON 
        a.announcement_id = au.announcement_id
      WHERE 
        au.employee_code = :userId
      ORDER BY 
        a.created_at DESC`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: results,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getAnnouncementTemplates = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const userId = req.body.userId;

  try {
    const results = await sequelize.query(
      `SELECT 
      *
      FROM 
        notification_temp
      ORDER BY 
        created_at DESC`
    );

    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: results[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.updateAnnouncementStatus = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const userIds = req.body.announcementUserIds;
  console.log(userIds);

  // if (!Array.isArray(userIds) || userIds.length === 0) {
  //   return res.status(400).send({
  //     Status: "false",
  //     Message: "No user IDs provided",
  //     Result: null,
  //   });
  // }

  try {
    const abcd = await sequelize.query(
      `UPDATE announcement_users 
       SET status = 1 ,ReadDate=GETDATE() output inserted.*
       WHERE id IN (:userIds)  
  AND (status != 1 OR status IS NULL);`,
      {
        replacements: { userIds },
      }
    );
    console.log(abcd);
    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while updating data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getPendingAnnouncement = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empCode = req.body.empCode;

  try {
    const results = await sequelize.query(
      `select * 
      from announcement_users 
      where employee_code = '${empCode}'
      and status is NULL`
    );

    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: results[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.EmployeeImagesRar = async (req, res) => {
  try {
    // 1. Process some data (you can adjust this as per your need)

    const sequelize = await dbname(req.query.compcode);
    const data = await sequelize.query(`SELECT 
    CONCAT(emp_code, '_', UTD, '.', RIGHT(DOC_PATH, CHARINDEX('.', REVERSE(DOC_PATH)) - 1)) AS name,
    DOC_PATH AS path
      FROM 
          EMP_DOCS
      WHERE 
          misspunch_inout = 1 and columndoc_type = 'employee';
      `)

    // 2. Make a POST request to the external server to get the zip file
    const response = await axios({
      method: 'post',
      url: 'http://cloud.autovyn.com:3000/fetchMultiple',
      data: { files: data[0] },
      responseType: 'stream', // 'stream' for piping, but if that fails, use buffer
    });

    if (response.data && response.data.pipe) {
      // 3. Set headers for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=download.zip');

      // 4. Pipe the response directly to the user if stream works
      response.data.pipe(res);
    } else {
      // If pipe is not available, handle it as a buffer
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=download.zip');
      res.send(response.data);
    }
  } catch (error) {
    console.error('Error while processing the zip file:', error);
    res.status(500).send('Error processing the request');
  }
};
exports.GatePassDashboard = async (req, res) => {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const MonthAndLOcation = await sequelize.query(`
                   SELECT 
            ms.misc_name AS Location,
            COUNT(CASE 
                WHEN DATEPART(MONTH, dg.REQ_DATE) = DATEPART(MONTH, GETDATE()) 
                    AND DATEPART(YEAR, dg.REQ_DATE) = DATEPART(YEAR, GETDATE()) 
                THEN 1 
            END) AS CurrentMonthGatepass,

            COUNT(CASE 
                WHEN DATEPART(MONTH, dg.REQ_DATE) = DATEPART(MONTH, DATEADD(MONTH, -1, GETDATE())) 
                    AND DATEPART(YEAR, dg.REQ_DATE) = DATEPART(YEAR, DATEADD(MONTH, -1, GETDATE())) 
                THEN 1 
            END) AS PreviousMonthGatepass,

            COUNT(CASE 
                WHEN DATEPART(MONTH, dg.REQ_DATE) = DATEPART(MONTH, DATEADD(MONTH, -2, GETDATE())) 
                    AND DATEPART(YEAR, dg.REQ_DATE) = DATEPART(YEAR, DATEADD(MONTH, -2, GETDATE())) 
                THEN 1 
            END) AS MonthBeforePreviousMonthGatepass

        FROM 
            dig_gp dg
        LEFT JOIN 
            EMPLOYEEMASTER em ON dg.empcode = em.EMPCODE AND em.Export_Type < 3
        LEFT JOIN 
            Misc_Mst ms ON ms.Misc_Code = em.Location AND ms.Export_Type < 3 AND ms.Misc_Type = 85
        WHERE 
            dg.FINAL_STAT = 'Y'
            AND dg.REQ_DATE BETWEEN DATEADD(MONTH, -2, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))
                                AND DATEADD(DAY, -1, DATEADD(MONTH, 1, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1)))
        GROUP BY 
            ms.misc_name
        ORDER BY 
            PreviousMonthGatepass DESC;

                `)

    const personalAndOffical = await sequelize.query(`
                   SELECT 
                DATENAME(MONTH, DATEADD(MONTH, 0, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))) AS CurrentMonthName,
                COUNT(CASE 
                    WHEN GP_TYPE =1
                    THEN 1 
                END) AS official,
              COUNT(CASE 
                    WHEN GP_TYPE =0
                    THEN 1 
                END) AS Personal
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'
                AND dg.REQ_DATE BETWEEN DATEADD(MONTH, 0, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))
                AND DATEADD(DAY, -1, DATEADD(MONTH, 1, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1)))
              union all			
                  SELECT 
                DATENAME(MONTH, DATEADD(MONTH, -1, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))) AS CurrentMonthName,
                COUNT(CASE 
                    WHEN GP_TYPE =1
                    THEN 1 
                END) AS official,
              COUNT(CASE 
                    WHEN GP_TYPE =0
                    THEN 1 
                END) AS Personal
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'
                AND dg.REQ_DATE BETWEEN DATEADD(MONTH, -1, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))
                AND DATEADD(DAY, -1, DATEADD(MONTH, 0, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1)))				
                union all			
                  SELECT 
                DATENAME(MONTH, DATEADD(MONTH, -2, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))) AS CurrentMonthName,
                COUNT(CASE 
                    WHEN GP_TYPE =1
                    THEN 1 
                END) AS official,
              COUNT(CASE 
                    WHEN GP_TYPE =0
                    THEN 1 
                END) AS Personal
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'
                AND dg.REQ_DATE BETWEEN DATEADD(MONTH, -2, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))
                AND DATEADD(DAY, -1, DATEADD(MONTH, -1, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1)));	

                `)

    const daywiseChart = await sequelize.query(`SELECT 
                CAST(dg.REQ_DATE AS DATE) AS RequestDate, -- Extract the date part
                COUNT(CASE 
                    WHEN GP_TYPE = 1 THEN 1 
                END) AS OfficialCount,
                COUNT(CASE 
                    WHEN GP_TYPE = 0 THEN 1 
                END) AS PersonalCount
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'
                AND dg.REQ_DATE BETWEEN DATEADD(MONTH, 0, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1))
                AND DATEADD(DAY, -1, DATEADD(MONTH, 1, DATEFROMPARTS(DATEPART(YEAR, GETDATE()), DATEPART(MONTH, GETDATE()), 1)))
            GROUP BY 
                CAST(dg.REQ_DATE AS DATE) -- Group by the date
            ORDER BY 
                RequestDate; -- Order by date
            `);

    const TopBar = await sequelize.query(`select (SELECT 
                COUNT(*) 
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'  and RETURN_STAT = 1 -- Approved records 
                AND dg.ACT_OUT_TIME is not null and dg.ACT_IN_TIME is null and cast(req_date as date) = cast(getdate()as date) 
              ) AS EmployeesCurrentlyOut,(
            SELECT 
                COUNT(*) 
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'  -- Approved records
                AND dg.ACT_OUT_TIME is null and dg.ACT_IN_TIME is null and cast(req_date as date) = cast(getdate()as date)
              )AS ActionNotTaken	
            ,(
            SELECT 
                COUNT(*) 
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y' and dg.gp_type = 0  -- Approved records
                and cast(req_date as date) = cast(getdate()as date) 
            )AS NoReturn,(
            SELECT 
                COUNT(*)
            FROM 
                DIG_GP dg
            WHERE 
                dg.FINAL_STAT = 'Y'  -- Approved records
                and cast(req_date as date) = cast(getdate()as date) 
              )AS TotalApproved            `);

    return res.status(200).send({
      MonthAndLocation: MonthAndLOcation[0],
      personalAndOffical: personalAndOffical[0],
      daywiseChart: daywiseChart[0],
      TopBar: TopBar[0][0]
    })
  } catch (error) {
    console.error('Error while processing the zip file:', error);
    res.status(500).send('Error processing the request');
  }
};
exports.GatePassDashboardEmployee = async (req, res) => {
  try {
    const sequelize = await dbname(req.headers.compcode);
    let query = ``;
    if (req.body.type == 1) {
      query = `WITH LatestTrack AS (
    SELECT emp_code, 
           LATITUDE, 
           LONGITUDE,
           CAST(TRACK_DATETIME AS NVARCHAR(108)) DateTO,  
           ROW_NUMBER() OVER (PARTITION BY emp_code ORDER BY ID DESC) as RowNum
    FROM EMP_TRACK
    WHERE CAST(TRACK_DATETIME AS DATE) = CAST(GETDATE() AS DATE)
  )
  select EMPCODE,CAST(REQ_DATE AS NVARCHAR(108)) Date,track.DateTO,
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3) as EmployeeName,
              (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.EMPCODE and export_type < 3) as Designation,
              (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Location,
              iif(RETURN_STAT=1,'YES','NO') as [Return Type],REASON,
              iif(final_stat = 'Y', 'Approved',iif(final_stat = 'N','Rejected',null)) as Status, 
              FORMAT(CONVERT(datetime, ACT_OUT_TIME), 'h:mmtt') [Out Time],
              FORMAT(CONVERT(datetime, ACT_In_TIME), 'h:mmtt') [In Time],
              iif(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) is null,null,concat(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) ,'')) AS [Duration],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_B and export_type < 3) as [GUARD (OUT)],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_2_CODE_B and export_type < 3) as [GUARD (IN)],
        track.LATITUDE,
        track.LONGITUDE
              from DIG_GP fst
        LEFT JOIN LatestTrack track ON track.emp_code = fst.empcode AND track.RowNum = 1
        WHERE  fst.FINAL_STAT = 'Y'  and RETURN_STAT = 1 -- Approved records 
                  AND fst.ACT_OUT_TIME is not null and fst.ACT_IN_TIME is null and cast(req_date as date) = cast(getdate()as date) `
    }
    if (req.body.type == 2) {
      query = ` WITH LatestTrack AS (
      SELECT emp_code, 
            LATITUDE, 
            LONGITUDE,
            CAST(TRACK_DATETIME AS NVARCHAR(108)) DateTO,  
            ROW_NUMBER() OVER (PARTITION BY emp_code ORDER BY ID DESC) as RowNum
      FROM EMP_TRACK
      WHERE CAST(TRACK_DATETIME AS DATE) = CAST(GETDATE() AS DATE)
  )
  select EMPCODE,CAST(REQ_DATE AS NVARCHAR(108)) Date,track.DateTO,
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3) as EmployeeName,
              (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.EMPCODE and export_type < 3) as Designation,
              (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Location,
              iif(RETURN_STAT=1,'YES','NO') as [Return Type],REASON,
              iif(final_stat = 'Y', 'Approved',iif(final_stat = 'N','Rejected',null)) as Status, 
              FORMAT(CONVERT(datetime, ACT_OUT_TIME), 'h:mmtt') [Out Time],
              FORMAT(CONVERT(datetime, ACT_In_TIME), 'h:mmtt') [In Time],
              iif(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) is null,null,concat(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) ,'')) AS [Duration],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_B and export_type < 3) as [GUARD (OUT)],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_2_CODE_B and export_type < 3) as [GUARD (IN)],
        track.LATITUDE,
        track.LONGITUDE
              from DIG_GP fst
        LEFT JOIN LatestTrack track ON track.emp_code = fst.empcode AND track.RowNum = 1
        WHERE fst.FINAL_STAT = 'Y'  -- Approved records
                  AND fst.ACT_OUT_TIME is null and fst.ACT_IN_TIME is null and cast(req_date as date) = cast(getdate()as date) `
    }
    if (req.body.type == 3) {
      query = `WITH LatestTrack AS (
      SELECT emp_code, 
            LATITUDE, 
            LONGITUDE,
            CAST(TRACK_DATETIME AS NVARCHAR(108)) DateTO,  
            ROW_NUMBER() OVER (PARTITION BY emp_code ORDER BY ID DESC) as RowNum
      FROM EMP_TRACK
      WHERE CAST(TRACK_DATETIME AS DATE) = CAST(GETDATE() AS DATE)
  )
  select EMPCODE,CAST(REQ_DATE AS NVARCHAR(108)) Date,track.DateTO,
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3) as EmployeeName,
              (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.EMPCODE and export_type < 3) as Designation,
              (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Location,
              iif(RETURN_STAT=1,'YES','NO') as [Return Type],REASON,
              iif(final_stat = 'Y', 'Approved',iif(final_stat = 'N','Rejected',null)) as Status, 
              FORMAT(CONVERT(datetime, ACT_OUT_TIME), 'h:mmtt') [Out Time],
              FORMAT(CONVERT(datetime, ACT_In_TIME), 'h:mmtt') [In Time],
              iif(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) is null,null,concat(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) ,'')) AS [Duration],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_B and export_type < 3) as [GUARD (OUT)],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_2_CODE_B and export_type < 3) as [GUARD (IN)],
        track.LATITUDE,
        track.LONGITUDE
              from DIG_GP fst
        LEFT JOIN LatestTrack track ON track.emp_code = fst.empcode AND track.RowNum = 1
        WHERE  fst.FINAL_STAT = 'Y' and fst.gp_type = 0  -- Approved records
                  and cast(req_date as date) = cast(getdate()as date) `
    }
    if (req.body.type == 4) {
      query = `WITH LatestTrack AS (
      SELECT emp_code, 
            LATITUDE, 
            LONGITUDE,
            CAST(TRACK_DATETIME AS NVARCHAR(108)) DateTO,  
            ROW_NUMBER() OVER (PARTITION BY emp_code ORDER BY ID DESC) as RowNum
      FROM EMP_TRACK
      WHERE CAST(TRACK_DATETIME AS DATE) = CAST(GETDATE() AS DATE)
  )
  select EMPCODE,CAST(REQ_DATE AS NVARCHAR(108)) Date,track.DateTO,
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3) as EmployeeName,
              (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.EMPCODE and export_type < 3) as Designation,
              (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Location,
              iif(RETURN_STAT=1,'YES','NO') as [Return Type],REASON,
              iif(final_stat = 'Y', 'Approved',iif(final_stat = 'N','Rejected',null)) as Status, 
              FORMAT(CONVERT(datetime, ACT_OUT_TIME), 'h:mmtt') [Out Time],
              FORMAT(CONVERT(datetime, ACT_In_TIME), 'h:mmtt') [In Time],
              iif(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) is null,null,concat(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) ,'')) AS [Duration],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_B and export_type < 3) as [GUARD (OUT)],
              (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_2_CODE_B and export_type < 3) as [GUARD (IN)],
        track.LATITUDE,
        track.LONGITUDE
              from DIG_GP fst
        LEFT JOIN LatestTrack track ON track.emp_code = fst.empcode AND track.RowNum = 1
        WHERE
                  fst.FINAL_STAT = 'Y'  -- Approved records
                  and cast(req_date as date) = cast(getdate()as date) `
    }
    const TopBar = await sequelize.query(query);
    return res.status(200).send({
      Result: TopBar[0]
    })

  } catch (error) {
    console.error('Error while processing the zip file:', error);
    res.status(500).send('Error processing the request');
  }
};
exports.getPendingTasks = async function (req, res) {
  console.log(req)
  const sequelize = await dbname(req.headers.compcode);
  const empCode = req.body.empCode;  // Employee Code (for identifying the employee or approver)
  let response = {
    Status: false,
    Message: "",
    Data: null,
  };

  try {
    // Fetch tasks assigned to the employee or tasks the employee has to approve
    const tasks = await sequelize.query(
      `
      SELECT 
    pt.TaskID,
    pt.ModuleName,
    pt.RequestID,
    pt.RequestType,
    pt.Status AS TaskStatus,
    pt.Priority,
    tad.ApprovalLevel,
    tad.AssignedTo,
    tad.Status AS ApprovalStatus,
    tad.ActionTaken,
    tad.ApprovedDate,
    pt.CreatedBy,
    CASE 
        WHEN pt.CreatedBy = :empCode THEN 'create'
        WHEN tad.AssignedTo = :empCode THEN 'approve'
        ELSE '' 
    END AS Role
    FROM 
        PendingTasks pt
    LEFT JOIN 
        TaskApprovalDetails tad ON pt.TaskID = tad.TaskID
    WHERE 
        pt.CreatedBy = :empCode OR tad.AssignedTo = :empCode
    ORDER BY 
        pt.Priority DESC, pt.TaskID, tad.ApprovalLevel;
    `,
      {
        replacements: { empCode },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    console.log(tasks.length, "dgsdggdsg")

    if (tasks.length > 0) {
      response.Status = true;
      response.Message = "Pending tasks retrieved successfully.";
      response.Data = tasks;
    } else {
      response.Message = "No pending tasks found.";
    }

    res.status(200).send(response);
  } catch (e) {
    console.log(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching tasks",
      Data: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getBirthdayEmployee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empCode = req.body.empCode;  // Employee Code (for identifying the employee or approver)

  let response = {
    Status: false,
    Message: "",
    Data: null,
  };

  try {
    // Fetch employees whose birthday is today along with their wish responses
    const employees = await sequelize.query(
      `	SELECT 
        CONCAT(emp.EMPFIRSTNAME, ' ', emp.EMPLASTNAME) AS EmpName,
        emp.EMPCODE,
        emp.dob,
        emp.FCM_TockenId as token,
        DATEDIFF(YEAR, emp.DOB, GETDATE()) -
          CASE
            WHEN MONTH(emp.DOB) > MONTH(GETDATE()) OR (MONTH(emp.DOB) = MONTH(GETDATE()) AND DAY(emp.DOB) > DAY(GETDATE()))      
            THEN 1
            ELSE 0
          END AS AgeDifference,        
        wr.response,
        wr.response_date,
        wr.created_at,
        CONCAT(wish_sender.EmpFirstName, ' ', wish_sender.EmpLastName) AS wish_sender_name,
        wish_sender.EmpCode AS wish_sender_code
      FROM
        Employeemaster emp
      LEFT JOIN wish_responses wr ON wr.birthday_emp_code = emp.EMPCODE       
      LEFT JOIN Employeemaster wish_sender ON wish_sender.EmpCode = wr.wish_sender_code
      WHERE
        MONTH(emp.DOB) = MONTH(GETDATE())
        AND DAY(emp.DOB) = DAY(GETDATE());	`,
      {
        replacements: { empCode },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Group wish responses by birthday employee
    const birthdayData = employees.reduce((acc, employee) => {
      const { EmpName, EMPCODE, dob, token, AgeDifference, response, response_date, created_at, wish_sender_name, wish_sender_code } = employee;

      // Find the employee in the accumulator array
      let birthdayEmployee = acc.find(emp => emp.EmpCode === EMPCODE);

      // If employee doesn't exist in the accumulator, create a new entry
      if (!birthdayEmployee) {
        birthdayEmployee = {
          EmpName,
          EmpCode: EMPCODE,
          dob,
          token,
          AgeDifference,
          wishResponses: [],
        };
        acc.push(birthdayEmployee);
      }

      // Push the wish response into the birthday employee's wishResponses array
      if (response) {
        birthdayEmployee.wishResponses.push({
          wisherName: wish_sender_name,
          wisherCode: wish_sender_code,
          response,
          responseDate: response_date,
          createdAt: created_at,
        });
      }

      return acc;
    }, []);

    // Send the formatted response
    if (birthdayData.length > 0) {
      response.Status = true;
      response.Message = "Birthday tasks retrieved successfully.";
      response.Data = birthdayData;
    } else {
      response.Message = "No birthday tasks found.";
    }

    res.status(200).send(response);
  } catch (e) {
    console.log(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching birthday tasks",
      Data: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.insertWish = async (req, res) => {
  const sequelize = await dbname(req.headers.compcode);
  const { birthdayEmpCode, wishSenderCode, response } = req.body;

  let result = {
    Status: false,
    Message: "",
  };

  try {
    await sequelize.query(
      `INSERT INTO wish_responses (
          birthday_emp_name,
          birthday_emp_code,
          wish_sender_name,
          wish_sender_code,
          response,
          response_date
      ) 
      VALUES (
          (SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM Employeemaster WHERE EMPCODE = :birthdayEmpCode),
          :birthdayEmpCode,
          (SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM Employeemaster WHERE EMPCODE = :wishSenderCode),
          :wishSenderCode,
          :response,
          GETDATE()
      );`,
      {
        replacements: {
          birthdayEmpCode,
          wishSenderCode,
          response,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    result.Status = true;
    result.Message = "Birthday wish inserted successfully.";
  } catch (error) {
    console.error("Error inserting birthday wish:", error);
    result.Message = "Error inserting birthday wish.";
  } finally {
    if (sequelize) await sequelize.close();
  }

  res.status(200).send(result);
};
exports.raiseComplaint = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  console.log(req.body, "3546456");

  const {
    title,
    description,
    created_by,
    docPath, // Use camelCase consistently
    tagged_people,
  } = JSON.parse(req.body.body);

  try {
    // Insert the complaint into the Complaints table
    const result = await sequelize.query(
      `INSERT INTO Complaints (Title, Description, CreatedBy, DOC_PATH)
            OUTPUT INSERTED.ComplaintID
            VALUES (:title, :description, :created_by, :doc_path)`,
      {
        replacements: {
          title: title || null,
          description: description || null,
          created_by: created_by || null,
          doc_path: docPath || null,
        },
        transaction: t,
      }
    );
    if (req.files.length > 0) {
      const EMP_DOCS_data = await uploadImagesTravel(
        req.files,
        req.headers?.compcode?.split("-")[0],
        created_by
      );
      const values = EMP_DOCS_data.map(
        (doc, index) =>
          `('COMPLAINTS', '${result[0][0].ComplaintID}', ${index + 1}, '${doc.DOC_PATH
          }', '${doc.DOC_NAME
          }', '${created_by}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`
      ).join(",");

      const query = `
          INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
          VALUES ${values}
      `;
      await sequelize.query(query);
    } else {
      console.error(`No Images Found`);
    }

    const complaintId = result[0][0].ComplaintID;
    console.log(tagged_people);
    const taggedPeopleArray = JSON.parse(tagged_people || "[]");

    if (taggedPeopleArray.length > 0) {
      const values = taggedPeopleArray
        .map((employeeId) => `(${complaintId}, '${employeeId.trim()}')`)
        .join(", ");

      await sequelize.query(
        `INSERT INTO ComplaintResponse (ComplaintID, EmployeeID) VALUES ${values}`,
        {
          transaction: t,
        }
      );
    }

    const values = taggedPeopleArray
      .map((employeeId) => `'${employeeId.trim()}'`)
      .join(", ");

    const fcmtokens = await sequelize.query(
      `select FCM_TockenId as  token,'abcd' as pendingActivityName,'${title}' as title, '${description}' as body from employeemaster where empcode in ( ${values})`,
      {
        transaction: t,
      }
    );
    console.log(fcmtokens);
    SendNotification(fcmtokens[0]);

    await t.commit();
    res.status(200).send({
      Status: "true",
      Message: "Complaint raised successfully!",
      Result: {},
    });
  } catch (e) {
    console.error(e);
    await t.rollback();
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while raising complaint",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getTaggedComplaints = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body);
  const employeeId = req.body.employeeId; // Assume employee ID is sent in headers for authentication.

  try {
    // Query to get complaints where the employee is tagged
    const result = await sequelize.query(
      `SELECT (select top 1 concat(empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= CreatedBy and export_type < 3) as EmployeeName,c.ComplaintID, c.Title, c.Description, c.CreatedBy, c.DOC_PATH, c.DateCreated , c.Status , tp.ResponseText,
    (SELECT path from DOC_UPLOAD WHERE Doc_Type = 'COMPLAINTS' AND TRAN_ID = c.ComplaintID FOR JSON PATH , INCLUDE_NULL_VALUES) AS images
          FROM Complaints c
          INNER JOIN ComplaintResponse tp ON c.ComplaintID = tp.ComplaintID
          WHERE tp.EmployeeID = :employeeId
          ORDER BY c.DateCreated DESC`,
      {
        replacements: { employeeId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    if (result[0] && Array.isArray(result[0])) {
      result[0] = result[0].map((row) => {
        if (row.images) {
          try {
            row.images = JSON.parse(row.images);
            if (Array.isArray(row.images)) {
              row.images = row.images.map((item) =>
                Object.values(item).join(",")
              );
            } else {
              row.images = [];
            }
          } catch (e) {
            console.error("Failed to parse images", e);
            row.images = [];
          }
        }
        return row;
      });
    }
    console.log(result, 'result')
    if (result.length > 0) {
      res.status(200).send({
        Status: "true",
        Message: "Tagged complaints fetched successfully!",
        Result: result,
      });
    } else {
      res.status(200).send({
        Status: "true",
        Message: "No complaints found for this employee.",
        Result: [],
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching complaints",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getSelfComplaints = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body);
  const employeeId = req.body.employeeId; // Assume employee ID is sent in headers for authentication.

  try {
    const result = await sequelize.query(
      `SELECT (select top 1 concat(empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= CreatedBy and export_type < 3) as EmployeeName,*
          FROM Complaints where CreatedBy =:employeeId`,
      {
        replacements: { employeeId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log(result);

    if (result.length > 0) {
      res.status(200).send({
        Status: "true",
        Message: "Your complaints fetched successfully!",
        Result: result,
      });
    } else {
      res.status(200).send({
        Status: "true",
        Message: "No complaints found.",
        Result: [],
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching complaints",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.getComplaintResponseFromComplaint = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body);
  const ComplaintID = req.body.ComplaintID;

  try {
    const result = await sequelize.query(
      `SELECT *
          FROM ComplaintResponse where ComplaintID =:ComplaintID`,
      {
        replacements: { ComplaintID },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (result.length > 0) {
      res.status(200).send({
        Status: "true",
        Message: "Your complaints fetched successfully!",
        Result: result,
      });
    } else {
      res.status(200).send({
        Status: "true",
        Message: "No complaints found.",
        Result: [],
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while fetching complaints",
      Result: {},
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.submitRemark = async function (req, res) {
  // return
  console.log(req.body);
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  const { complaintID, responseText, employeeId, status } = req.body;

  try {
    await sequelize.query(
      `Update ComplaintResponse  set ResponseText =:responseText, Status =:status , DateResponded = GETDATE()
           where ComplaintID =:complaintID and EmployeeID = :employeeId`,
      {
        replacements: {
          complaintID: complaintID,
          employeeId: employeeId ? employeeId : null,
          responseText: responseText ? responseText : null,
          status: status ? status : "Pending",
        },
        transaction: t,
      }
    );

    const title = "Complaint is Reviewed";
    const description = "Your Complaint is Reviewed By " + employeeId;

    const empId = await sequelize.query(
      `select CreatedBy from Complaints where ComplaintID= ${complaintID}`
    );

    console.log(empId);

    const fcmtokens = await sequelize.query(
      `select FCM_TockenId as  token,'abcd' as pendingActivityName,'${title}' as title, '${description}' as body from employeemaster where empcode = '${empId[0][0].CreatedBy}'`
    );

    console.log(fcmtokens);
    SendNotification(fcmtokens[0]);

    await t.commit();
    console.log("Transaction committed successfully");

    res.status(200).send({
      Status: "true",
      Message: "Remark submitted successfully!",
    });
  } catch (e) {
    console.error("Error occurred:", e);
    await t.rollback();
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while submitting remark",
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log("Sequelize connection closed");
    }
  }
};
exports.submitStatus = async function (req, res) {
  // return
  console.log(req.body);
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const { complaintID, status } = req.body;

  try {
    const empId = await sequelize.query(
      `update Complaints set Status =:status output inserted.CreatedBy where ComplaintID =:complaintID`,
      {
        replacements: {
          complaintID: complaintID,
          status: status ? status : "OPEN",
        },
        transaction: t,
      }
    );

    const title = "Complaint is Resolved";
    const description = "Your Complaint is Resolved ";

    // const empId = await sequelize.query(
    //   `select CreatedBy from Complaints where ComplaintID= ${complaintID}`
    // )

    console.log(empId);

    const fcmtokens = await sequelize.query(
      `select FCM_TockenId as  token,'abcd' as pendingActivityName,'${title}' as title, '${description}' as body from employeemaster where empcode = '${empId[0][0].CreatedBy}'`
    );

    console.log(fcmtokens);
    SendNotification(fcmtokens[0]);

    await t.commit();
    console.log("Transaction committed successfully");

    res.status(200).send({
      Status: "true",
      Message: "Status submitted successfully!",
    });
  } catch (e) {
    console.error("Error occurred:", e);
    await t.rollback();
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while submitting status",
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log("Sequelize connection closed");
    }
  }
};