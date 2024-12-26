const { dbname } = require("../utils/dbconfig");
const ExcelJS = require("exceljs");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { DataTypes } = require("sequelize");

exports.findMasters = async function (req, res) {
  console.log(req.body, "body");
  const sequelize = await dbname(req.headers.compcode);
  const multiloc = req.body.multiloc;
  try {
    const MiscMst = _MiscMst(sequelize, DataTypes);
    const Region = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
        ["misc_code", "EMP_Code"],
        ["misc_name", "Emp_Name"],
      ],
      where: { misc_type: 91 },
    });

    const SECTION = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
        ["misc_code", "EMP_Code"],
        ["misc_name", "Emp_Name"],
      ],
      where: { misc_type: 81 },
    });

    const DIVISION = await MiscMst.findAll({
      attributes: [
        ["misc_code", "value"],
        ["misc_name", "label"],
        ["misc_code", "EMP_Code"],
        ["misc_name", "Emp_Name"],
      ],
      where: { misc_type: 68 },
    });
    const Location =
      await sequelize.query(`select Misc_code AS value,misc_name as label, misc_code as EMP_Code, misc_name as Emp_Name  from misc_mst where misc_type=85 and ${multiloc == "" ? '' : `misc_hod in (${multiloc}) and`}
     export_type<3`);
    // const EMPLOYEEDESIGNATION =
    //   await sequelize.query(`select distinct EMPLOYEEDESIGNATION AS value,EMPLOYEEDESIGNATION as label from employeemaster`);

    let data = {
      Region,
      SECTION,
      DIVISION,
      Location,
      // EMPLOYEEDESIGNATION,
      Location1: Location[0],
    };

    await sequelize.close();
    res.status(200).send({
      Status: "true", data: data
    });
  } catch (err) {
    await sequelize.close();

    console.log(err);
  }
};

exports.attendanceReport = async function (req, res) {
  // const sequelize = await dbname(req.headers.compcode);
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const region = data.region;
    const location = data.location;
    const department = data.department;
    const emptype = data.emptype;
    const empcode = data.empcode;
    const reporttype = data.reporttype;
    var query;

    query = `select empcode from employeemaster where export_type<3 and lastwor_date is null `;

    if (region) query += ` and sal_region in (${region}) `;
    const user_location = data.user_location;
    if (parseInt(user_location)) {
      if (location) query += `and location in (${location}) `;
    } else {
      if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
    }

    if (department) query += `and section in (${department}) `;
    if (emptype) query += `and emptype in (${emptype}) `;
    if (empcode) {
      query += `and empcode in (''${empcode}'') `;
    }
    console.log(query, "this is query ")

    const main_queryCopy = `DECLARE @StartDate DATE = '${dateFrom}'; 
      DECLARE @EndDate DATE = '${dateto}';
      
      DECLARE @TempTable TABLE (
          DateValue DATE
      );
      
      DECLARE @Columns NVARCHAR(MAX);
      DECLARE @Columns1 NVARCHAR(MAX);
      DECLARE @Columns2 NVARCHAR(MAX);
      DECLARE @Columns3 NVARCHAR(MAX);
      DECLARE @PivotQuery NVARCHAR(MAX);
      DECLARE @PivotColumns NVARCHAR(MAX);
      DECLARE @StatusColumns NVARCHAR(MAX);
      DECLARE @StatusColumns2 NVARCHAR(MAX);
      
      
      WITH DateRange AS (
          SELECT @StartDate AS DateValue
          UNION ALL
          SELECT DATEADD(DAY, 1, DateValue)
          FROM DateRange
          WHERE DateValue < @EndDate
      )
      
      INSERT INTO @TempTable (DateValue)
      SELECT DateValue
      FROM DateRange;
      
      SELECT @PivotColumns = STRING_AGG(QUOTENAME(DateValue), ',')
      FROM @TempTable;
      
      SELECT @Columns = COALESCE(@Columns + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM')) FROM @TempTable;
      SELECT @Columns1 = COALESCE(@Columns1 + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_in1') FROM @TempTable;
      SELECT @Columns2 = COALESCE(@Columns2 + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_out1') FROM @TempTable;
      SELECT @Columns3 = COALESCE(@Columns3 + ', ', '') + QUOTENAME(FORMAT(DateValue, 'dd-MMM')) + ', ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_in1') + ', ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_out1') FROM @TempTable;
      SET @StatusColumns = (
          SELECT STRING_AGG('SUM(IIF(status=''' + status + ''', 1, 0)) AS ' + QUOTENAME(status), ', ')
          FROM (
              SELECT DISTINCT status
              FROM attendancetable 
              WHERE dateoffice BETWEEN @StartDate AND @EndDate
          ) AS StatusList
      );
      
      SET @StatusColumns2 = (
          SELECT STRING_AGG( QUOTENAME(status), ', ')
          FROM (
              SELECT DISTINCT status
              FROM attendancetable 
              WHERE dateoffice BETWEEN @StartDate AND @EndDate
          ) AS StatusList
      );
      
      
      
      SET @PivotQuery = '
              select fst.emp_code AS Empcode,
              (select top 1 concat(title,'' '',empfirstname,'' '',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as EmployeeName,
              (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as Designation,
              (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Location,
              (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Region,
              (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Department,
              (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Section,
              '+@Columns3+ ' ,'+@StatusColumns2+',gghf.present as [Paid Days],gghf.penalty as [Total Penalty Days],'+cast((select top 1 count(*) from @TempTable) as varchar(3))+' as MonthCount from (SELECT EMP_CODE, ' + @Columns  + '
      FROM (
          SELECT EMP_CODE, dateoffice, status
          FROM attendancetable where dateoffice between @StartDate and @EndDate and  EMP_CODE in (${query})
      ) AS p1
      PIVOT (
          MAX(status) FOR dateoffice IN (' + @PivotColumns + ')
      ) AS p)as fst
        INNER JOIN (
              SELECT EMP_CODE, ' + @Columns1 + '
          FROM (
              SELECT EMP_CODE, dateoffice, convert (varchar(8),in1,108) as in1
              FROM attendancetable where dateoffice between @StartDate and @EndDate and  EMP_CODE in (${query})
          ) AS src
          PIVOT (
              MAX(in1) FOR dateoffice IN (' + @PivotColumns + ')
          ) AS p2
      ) AS p2 ON fst.EMP_CODE = p2.EMP_CODE
      INNER JOIN (
              SELECT EMP_CODE, ' + @Columns2 + '
          FROM (
              SELECT EMP_CODE, dateoffice, convert (varchar(8),out1,108) as out1
              FROM attendancetable where dateoffice between @StartDate and @EndDate and  EMP_CODE in (${query})
          ) AS src
          PIVOT (
              MAX(out1) FOR dateoffice IN (' + @PivotColumns + ')
          ) AS p3
      ) AS asd ON fst.EMP_CODE = asd.EMP_CODE
      inner Join (
      SELECT emp_code, ' + @StatusColumns + ' ,sum(value) as Present,sum(penalty_days) as penalty
          FROM attendancetable
          join ( select value, status as st2,penalty_days from Employee_AtnStatus) as abcdss on abcdss.st2 = attendancetable.status
          --join employeemaster on empcode = emp_code
          where dateoffice between @StartDate and @EndDate  GROUP BY emp_code
      ) as gghf on fst.emp_code = gghf.emp_code '
      ; 
      
      EXEC sp_executesql @PivotQuery, N'@StartDate DATE, @EndDate DATE', @StartDate, @EndDate
            `;
    const main_query2Copy = `DECLARE @StartDate DATE = '${dateFrom}'; -- Set your start date
      DECLARE @EndDate DATE = '${dateto}';    -- Set your end date
      
      DECLARE @TempTable TABLE (
          DateValue DATE
      );
      
      DECLARE @Columns NVARCHAR(MAX);
      DECLARE @Columns3 NVARCHAR(MAX);
      DECLARE @PivotQuery NVARCHAR(MAX);
      DECLARE @PivotColumns NVARCHAR(MAX);
      DECLARE @StatusColumns NVARCHAR(MAX);
      DECLARE @StatusColumns2 NVARCHAR(MAX);
      WITH DateRange AS (
          SELECT @StartDate AS DateValue
          UNION ALL
          SELECT DATEADD(DAY, 1, DateValue)
          FROM DateRange
          WHERE DateValue < @EndDate
      )
      
      INSERT INTO @TempTable (DateValue)
      SELECT DateValue
      FROM DateRange;
      
      SELECT @PivotColumns = STRING_AGG(QUOTENAME(DateValue), ',')
      FROM @TempTable;
      
      SELECT @Columns = COALESCE(@Columns + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM')) FROM @TempTable;
      SELECT @Columns3	= COALESCE(@Columns3 + ', ', '') +  QUOTENAME(FORMAT(DateValue, 'dd-MMM')) FROM @TempTable;
      SET @StatusColumns = (
      SELECT STRING_AGG('SUM(IIF(status=''' + status + ''', 1, 0)) AS ' + QUOTENAME(status), ', ')
      FROM (
          SELECT DISTINCT status
          FROM attendancetable 
          WHERE dateoffice BETWEEN @StartDate AND @EndDate 
      ) AS StatusList
      );
      
      SET @StatusColumns2 = (
      SELECT STRING_AGG( QUOTENAME(status), ', ')
      FROM (
          SELECT DISTINCT status
          FROM attendancetable 
          WHERE dateoffice BETWEEN @StartDate AND @EndDate 
      ) AS StatusList
      );
      
      
      SET @PivotQuery = '
              select fst.emp_code,
          (select top 1 concat(title,'' '',empfirstname,'' '',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as EmployeeName,
          (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as Designation,
          (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Location,
          (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Region,
          (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Department, 
          (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Section,
          '+@Columns3+','+@StatusColumns2+',gghf.present as [Paid Days],gghf.penalty as [Total Penalty Days] ,'+cast((select top 1 count(*) from 
    @TempTable) as varchar(3))+' as MonthCount from (SELECT EMP_CODE, ' + @Columns + '
        FROM (
          SELECT EMP_CODE, dateoffice, status
          FROM attendancetable where dateoffice between @StartDate and @EndDate and EMP_CODE in (${query})
        ) AS p1
        PIVOT (
          MAX(status) FOR dateoffice IN (' + @PivotColumns + ')
        ) AS p 
        union all 
              SELECT EMP_CODE, ' + @Columns + '
          FROM (
              SELECT EMP_CODE, dateoffice, convert (varchar(8),in1,108) as in1
              FROM attendancetable where dateoffice between @StartDate and @EndDate and EMP_CODE in (${query})
          ) AS src
          PIVOT (
              MAX(in1) FOR dateoffice IN (' + @PivotColumns + ')
          ) AS p2
      union all 
              SELECT EMP_CODE, ' + @Columns + '
          FROM (
              SELECT EMP_CODE, dateoffice, convert (varchar(8),out1,108) as out1
              FROM attendancetable where dateoffice between @StartDate and @EndDate and EMP_CODE in (${query})
          ) AS src
          PIVOT (
              MAX(out1) FOR dateoffice IN (' + @PivotColumns + ')
          ) AS p3 )as fst inner Join (
      SELECT emp_code, ' + @StatusColumns + ' ,sum(value) as Present,sum(penalty_days) as penalty
      FROM attendancetable
      join ( select value, status as st2,penalty_days from Employee_AtnStatus) as abcdss on abcdss.st2 = attendancetable.status
      --join employeemaster on empcode = emp_code
      where dateoffice between @StartDate and @EndDate
      GROUP BY emp_code
      ) as gghf on fst.emp_code = gghf.emp_code order by emp_code'
      ; 
      
        EXEC sp_executesql @PivotQuery, N'@StartDate DATE, @EndDate DATE', @StartDate, @EndDate;
            `;

    let txnDetails;
    let reportName;

    if (reporttype == 2) {
      txnDetails = await sequelize.query(main_query2Copy);
      reportName = "Attendattendance Summary Report (Multi Line)";
    } else if (reporttype == 1) {
      txnDetails = await sequelize.query(main_queryCopy);
      reportName = "Attendattendance Summary Report (Single Line)";
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

    // Add headers for the data starting from the 3rd row
    const headers = Object?.keys(txnDetails[0][0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    // worksheet.columns.forEach(column => {
    //     let maxWidth = 0;
    //     column.eachCell({ includeEmpty: true }, cell => {
    //         const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
    //         maxWidth = Math.max(maxWidth, columnWidth);
    //     });
    //     column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    // });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Attendance_Report.xlsx"'
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
    console.log(e)
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
      'attachment; filename="AttdenceReport.xlsx"'
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
exports.OtDaysReport = async function (req, res) {
  // const sequelize = await dbname(req.headers.compcode);
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const region = data.region;
    const location = data.location;
    const department = data.department;
    const emptype = data.emptype;
    const empcode = data.empcode;
    const reporttype = data.reporttype;
    var query;

    query = `select empcode from employeemaster where export_type<3 and lastwor_date is null `;

    if (region) query += ` and sal_region in (${region}) `;
    const user_location = data.user_location;
    if (parseInt(user_location)) {
      if (location) query += `and location in (${location}) `;
    } else {
      if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
    }
    if (department) query += `and section in (${department}) `;
    if (emptype) query += `and emptype in (${emptype}) `;
    if (empcode) {
      query += `and empcode in (''${empcode}'') `;
    }

    const main_queryCopy = `DECLARE @StartDate DATE = '${dateFrom}'; 
  DECLARE @EndDate DATE = '${dateto}';
  
    DECLARE @TempTable TABLE (
      DateValue DATE
  );

  DECLARE @Columns NVARCHAR(MAX);
  DECLARE @Columns1 NVARCHAR(MAX);
  DECLARE @Columns2 NVARCHAR(MAX);
  DECLARE @Columns3 NVARCHAR(MAX);
  DECLARE @Columns4 NVARCHAR(MAX);
  DECLARE @Columns6 NVARCHAR(MAX);
  DECLARE @Columns5 NVARCHAR(MAX);
  DECLARE @PivotQuery NVARCHAR(MAX);
  DECLARE @PivotColumns NVARCHAR(MAX);
  


  WITH DateRange AS (
      SELECT @StartDate AS DateValue
      UNION ALL
      SELECT DATEADD(DAY, 1, DateValue)
      FROM DateRange
      WHERE DateValue < @EndDate
  )
  
  INSERT INTO @TempTable (DateValue)
  SELECT DateValue
  FROM DateRange;

  SELECT @PivotColumns = STRING_AGG(QUOTENAME(DateValue), ',')
  FROM @TempTable;
  SELECT @Columns = COALESCE(@Columns + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_OT') FROM @TempTable;
  SELECT @Columns4 = COALESCE(@Columns4 + '+ ', '') + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_OT')  FROM @TempTable;
  SELECT @Columns6 = COALESCE(@Columns6 + '+ ', '') + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_OT_Days')  FROM @TempTable;
  SELECT @Columns1 = COALESCE(@Columns1 + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_in1') FROM @TempTable;
  SELECT @Columns2 = COALESCE(@Columns2 + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_out1') FROM @TempTable;
  SELECT @Columns3 = COALESCE(@Columns3 + ', ', '') +  QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_in1') + ', ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_out1') + ', ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM')+ '_OT')+ ', ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM')+ '_OT_Days')  FROM @TempTable;      
  SELECT @Columns5 = COALESCE(@Columns5 + ', ', '') + QUOTENAME(FORMAT(DateValue, 'yyyy-MM-dd')) + ' as ' + QUOTENAME(FORMAT(DateValue, 'dd-MMM') + '_OT_Days') FROM @TempTable;
  

  SET @PivotQuery = 'select * from (
          select fst.emp_code AS Empcode,
          (select top 1 concat(title,'' '',empfirstname,'' '',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as EmployeeName,
          (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as Designation,
          (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Location,
          (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Region,
          (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Department,
          (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Section,
          '+@Columns3+' ,'+@Columns6+' as [Paid OT Days],'+cast((select top 1 count(*) from @TempTable) as varchar(3))+' as MonthCount from (SELECT EMP_CODE, ' + @Columns  + ' 
  FROM (
      SELECT EMP_CODE, dateoffice,           CONCAT (CAST(
        IIF(((FLOOR(hoursworked) * 60) + ((hoursworked - FLOOR(hoursworked)) * 100))> 
            (IIF(((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) < 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100)),
            ((((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) + 1440) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))),
            (((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))))),
            ((FLOOR(hoursworked) * 60) + ((hoursworked - FLOOR(hoursworked)) * 100) - 
            IIF(((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) < 
			((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100)),
            ((((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) + 1440) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))),
            (((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))))),
            0
        ) AS DECIMAL(19,0)
    ),'' Min'') AS OT
      FROM attendancetable where dateoffice between @StartDate and @EndDate and  EMP_CODE in (${query})
  ) AS p1
  PIVOT (
      MAX(OT) FOR dateoffice IN (' + @PivotColumns + ')
  ) AS p)as fst

     INNER JOIN (
          SELECT EMP_CODE, ' + @Columns1 + '
      FROM (
          SELECT EMP_CODE, dateoffice, convert (varchar(8),in1,108) as in1
          FROM attendancetable where dateoffice between @StartDate and @EndDate and  EMP_CODE in (${query})
      ) AS src
      PIVOT (
          MAX(in1) FOR dateoffice IN (' + @PivotColumns + ')
      ) AS p2
  ) AS p2 ON fst.EMP_CODE = p2.EMP_CODE
       INNER JOIN (
          SELECT EMP_CODE, ' + @Columns5 + '
      FROM (
          SELECT 
    EMP_CODE, 
    dateoffice,
    otp.Pvalue AS OTP
FROM 
    attendancetable
LEFT JOIN 
    overtime_policy otp ON 
    CAST(
        IIF(((FLOOR(hoursworked) * 60) + ((hoursworked - FLOOR(hoursworked)) * 100))> 
            (IIF(((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) < 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100)),
            ((((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) + 1440) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))),
            (((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))))),
            ((FLOOR(hoursworked) * 60) + ((hoursworked - FLOOR(hoursworked)) * 100) - 
            IIF(((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) < 
			((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100)),
            ((((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) + 1440) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))),
            (((FLOOR(shiftendtime) * 60) + ((shiftendtime - FLOOR(shiftendtime)) * 100)) - 
            ((FLOOR(shiftstarttime) * 60) + ((shiftstarttime - FLOOR(shiftstarttime)) * 100))))),
            0
        ) AS DECIMAL(19,2)
    ) BETWEEN otp.MinMinutes AND otp.MaxMinutes
		 where dateoffice between  @StartDate and @EndDate and  EMP_CODE in (${query})
    ) AS src
      PIVOT (
          MAX(OTP) FOR dateoffice IN (' + @PivotColumns + ')
      ) AS p2
  ) AS p4 ON fst.EMP_CODE = p4.EMP_CODE
  INNER JOIN (
          SELECT EMP_CODE, ' + @Columns2 + '
      FROM (
          SELECT EMP_CODE, dateoffice, convert (varchar(8),out1,108) as out1
          FROM attendancetable where dateoffice between @StartDate and @EndDate and  EMP_CODE in (${query})
      ) AS src
      PIVOT (
          MAX(out1) FOR dateoffice IN (' + @PivotColumns + ')
      ) AS p3
  ) AS asd ON fst.EMP_CODE = asd.EMP_CODE ) as laksdlaskjld order by [Paid OT Days] desc'
  ;

  EXEC sp_executesql @PivotQuery, N'@StartDate DATE, @EndDate DATE', @StartDate, @EndDate
        `;


    let txnDetails;
    let reportName;


    txnDetails = await sequelize.query(main_queryCopy);
    reportName = "Over Time Calculation Report";


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
    });
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    // worksheet.columns.forEach(column => {
    //     let maxWidth = 0;
    //     column.eachCell({ includeEmpty: true }, cell => {
    //         const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
    //         maxWidth = Math.max(maxWidth, columnWidth);
    //     });
    //     column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    // });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Over_Time_Sheet.xlsx"'
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
      'attachment; filename="Over_Time_Sheet_NoDataAvailable.xlsx"'
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
exports.digitalgatepass = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const region = data.region;
    const location = data.location;
    const department = data.department;
    const empcode = data.empcode;
    let query = `select empcode from employeemaster where export_type<3 and lastwor_date is null `;
    if (region) query += ` and sal_region in (${region}) `;
    const user_location = data.user_location;
    if (parseInt(user_location)) {
      if (location) query += `and location in (${location}) `;
    } else {
      if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
    }
    if (department) query += `and section in (${department}) `;
    if (empcode) {
      query += `and empcode in ('${empcode}') `;
    }
    let reportName = "Gate Pass Report";

    const txnDetails = await sequelize.query(
      `select EMPCODE,  
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3) as EmployeeName,
            (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.EMPCODE and export_type < 3) as Designation,
            (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Location,
            (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Region,
            (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Department,
            (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Section,
            CAST(REQ_DATE AS NVARCHAR(108)) Date,
            iif(GP_TYPE=1,'OFFICIAL','PERSONAL')as [Gate Pass Type],
            iif(	RETURN_STAT=1,'YES','NO') as [Return Type],REASON,
            iif(final_stat = 'Y', 'Approved',iif(final_stat = 'N','Rejected',null)) as Status,
            FORMAT(CONVERT(datetime, ACT_OUT_TIME), 'h:mmtt') [Out Time],
            FORMAT(CONVERT(datetime, ACT_In_TIME), 'h:mmtt') [In Time],
            iif(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) is null,null,concat(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) ,' Min')) AS [Duration],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_3_CODE_B and export_type < 3) as [Applied BY],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_A and export_type < 3) as [Approved by],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_B and export_type < 3) as [GUARD (OUT)],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_2_CODE_B and export_type < 3) as [GUARD (IN)]
            from DIG_GP fst WHERE CAST(req_date AS DATE) BETWEEN '${dateFrom}' AND '${dateto}' and empcode in (${query});`
    );
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
      'attachment; filename="GatePass_Report.xlsx"'
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
      'attachment; filename="Gatepassreport.xlsx"'
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


exports.MobileAttdenceReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  const data = req.query;
  const dateto = data.dateto;
  const dateFrom = data.dateFrom;
  const region = data.region;
  const location = data.location;
  const department = data.department;
  const empcode = data.empcode;
  console.log(req.query, "body");
  var query;

  query = `select empcode from employeemaster where export_type<3 and lastwor_date is null `;

  if (region) query += ` and sal_region in (${region}) `;
  const user_location = data.user_location;
  if (parseInt(user_location)) {
    if (location) query += `and location in (${location}) `;
  } else {
    if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
  }
  if (department) query += `and section in (${department}) `;
  if (empcode) {
    query += `and empcode in ('${empcode}') `;
  }
  try {
    let reportName = "Mobile Attdence Report";

    const txnDetails = await sequelize.query(
      `select emp_code, 
        (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) as EmployeeName,
         CONVERT(NVARCHAR(10), dateoffice, 101) AS Date,
                    (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) as Designation,
                    (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Location,
                    (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Region,
                    (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Department,
                    (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Section,
                    FORMAT(CONVERT(datetime, App_in1), 'h:mmtt') [In Time],
                    FORMAT(CONVERT(datetime, App_out1), 'h:mmtt') [Out Time],
                     iif(MAN_APPR = 'Y', 'Approved',iif(MAN_APPR = 'N',iif(Man_rej='Y','Rejected',null),null)) as Status,
                    In_Add as [In Address],Out_Add as [Out_Add] from attendancetable  where mi_type=1 and (app_in1 is not null or App_out1 is not null)
                    and Emp_Code in (${query}) and dateoffice between '${dateFrom}' and '${dateto}'  `
    );
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
      'attachment; filename="MobileAttdenceReport.xlsx"'
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
      'attachment; filename="MobileAttdenceReport.xlsx"'
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


function getLaterMonthYear(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const laterDate = d1 > d2 ? d1 : d2;
  const month = laterDate.getMonth() + 1; // getMonth() returns 0-11, so we add 1
  const year = laterDate.getFullYear();
  return { month, year };
}


exports.SalaryReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  const data = req.query;
  const dateto = data.dateto;
  const dateFrom = data.dateFrom;
  const region = data.region;
  const location = data.location;
  const department = data.department;
  const empcode = data.empcode;
  console.log(req.query, "body");
  const result = getLaterMonthYear(dateFrom, dateto);
  var query;

  query = `select empcode from employeemaster where export_type<3 `;

  if (region) query += ` and sal_region in (${region}) `;
  const user_location = data.user_location;
  if (parseInt(user_location)) {
    if (location) query += `and location in (${location}) `;
  } else {
    if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
  }
  if (department) query += `and section in (${department}) `;
  if (empcode) {
    query += `and empcode in ('${empcode}') `;
  }
  try {
    let reportName = "Salary Report";

    //     const txnDetails1 = await sequelize.query(
    //       `WITH SalaryDetails AS (
    //     SELECT 
    //         Emp_Code,
    //                 (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) as EmployeeName,
    //         (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) as Designation,
    //         (select top 1 EmpType from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) as EmpType,
    //         (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Location,   
    //         (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Region,   
    //         (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Department, 
    //                 (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= emp_code and export_type < 3)) as Section,
    //         Present_days,
    //         Monthdays,
    // 	FORMAT(Lock_Date, 'MMM d yyyy') AS Lock_Date,
    //         Gross AS SalaryMonthlyRate,
    //         Basic  AS BasicDa,
    //         Basic_Earn AS BasicDaCalc,
    //         HRA,
    //         HRA_Earn AS hraCalc,
    //         Washing AS wa,
    //         Washing_Earn AS WaCalc,
    //         CONVEN,
    //                 MISC_EARN,
    //                 lwf_employee,
    //                 Sal_Unpaid,
    //         CONVEN_Earn,
    // 		Advance,
    //         Total_Earn AS SalAmt,
    //         Arrear AS ExtraDaysVar,
    //         pf_employee,
    // 		Total_Days,
    //         PROF_TAX,
    //                 tds as tds,
    //                 oth_Ded  ,
    //                 final_payment,
    //         (SELECT BANKNAME FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code) AS bankName,
    //         (SELECT BANKACCOUNTNO FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code) AS BankAcntNo,
    //         (SELECT ifsc_code FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code) AS IfscCode,
    //         (SELECT GENDER FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code) AS Gender,
    //         (SELECT isnull(INCENTIVE_AMT,0) FROM Emp_Ded WHERE Emp_id = Emp_Code AND Ded_Type = 15) AS VariablePay,
    // 		esic_employee as esic
    //     FROM SALARYFILE
    //     WHERE SalMnth = '${result.month}' and salyear = '${result.year}' AND Emp_Code IN (${query})
    // ),

    // AttendanceDetails AS (
    //     SELECT 
    //         Emp_Code, 
    //         SUM(value) AS paidDays 
    //     FROM attendancetable
    //     JOIN (
    //         SELECT value, status AS st2 
    //         FROM Employee_AtnStatus
    //     ) AS abcdss ON abcdss.st2 = attendancetable.status
    //     WHERE Emp_Code IN (${query}) 
    //     AND attendancetable.dateoffice BETWEEN '${dateFrom}' AND '${dateto}'
    //     GROUP BY Emp_Code
    // )

    // SELECT 
    //       s.Emp_Code as [Employee Code],
    //     s.EmployeeName as [Employee Name],
    //     s.Gender,
    //     s.location as Branch,
    //         iif(s.EmpType =1,'REGULAR','CASUAL') as Category,
    //         s.Department,
    //     s.Designation,
    //     s.Section,
    //     s.Lock_Date as [Salary Lock Date],
    //     s.SalaryMonthlyRate as [Salary Monthly Rate],
    //     s.Monthdays,
    //     a.paidDays as [Days Paid],
    //     s.BasicDa as [Basic DA],
    //     s.BasicDaCalc as [Basic DA Calc],
    //     s.HRA,
    //     s.hraCalc as [HRA Calc],
    //     s.wa,
    //     s.WaCalc,
    //     s.CONVEN,
    //     s.CONVEN_Earn,
    //     COALESCE(s.VariablePay, 0)  AS [Variable Pay],
    //         s.ExtraDaysVar AS [Extra Days Pay],    
    //         COALESCE(s.Sal_Unpaid, 0) AS [Spl Allowance],
    //     (s.SalAmt + COALESCE(s.VariablePay, 0)) AS [total Wages],   
    //     s.pf_employee as [PROV. FUND],
    //     s.PROF_TAX as [P.Tax],
    //         s.lwf_employee AS [LWF],
    //         s.ESIC,
    //         s.tds,
    //         (s.oth_ded + s.Advance)as [Other ded.],
    //         (s.esic + s.PROF_TAX + s.pf_employee + s.Advance + s.lwf_employee) AS [Total Deductions],
    //         s.final_payment as [Net Salary],       
    //     s.bankName as [Bank Name],
    //     s.BankAcntNo as [Account No],
    //     s.IfscCode as [IFSC Code]
    // FROM SalaryDetails s
    // LEFT JOIN AttendanceDetails a ON s.Emp_Code = a.Emp_Code;`
    //     );
    const txnDetails = await sequelize.query(
      `WITH EmployeeInfo AS (
        SELECT 
            e.EMPCODE,
            CONCAT(e.title, ' ', e.empfirstname, ' ', e.EMPLASTNAME) AS EmployeeName,
            e.EMPLOYEEDESIGNATION AS Designation,
            e.EmpType,
            loc.misc_name AS Location,
            reg.misc_name AS Region,
            dept.misc_name AS Department,
            sect.misc_name AS Section,
            e.BANKNAME,
            e.BANKACCOUNTNO,
            e.ifsc_code,
            e.GENDER,
            e.dob,
        e.PAYMENTMODE,
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
                s.Emp_Code,
                e.EmployeeName,
                e.Designation,
                e.EmpType,
                e.Location,
                e.Region,
                e.Department,
                e.Section,
                E.DOB,
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
                s.PROF_TAX,
                s.tds,
                s.oth_Ded,
                s.final_payment,
                e.BANKNAME AS bankName,
                e.BANKACCOUNTNO AS BankAcntNo,
                e.ifsc_code AS IfscCode,
                e.GENDER AS Gender,
            e.PAYMENTMODE,
            e.CURRENTJOINDATE,
            e.LASTWOR_DATE,
                COALESCE(d.INCENTIVE_AMT, 0) AS VariablePay,
                s.esic_employee AS esic
            FROM SALARYFILE s
            LEFT JOIN EmployeeInfo e ON e.EMPCODE = s.Emp_Code
            LEFT JOIN Emp_Ded d ON d.Emp_id = s.Emp_Code AND d.Ded_Type = 15 and d.Mnth=s.SalMnth
            WHERE s.SalMnth = '${result.month}' and s.salyear = '${result.year}' AND s.Emp_Code IN (${query})
        ),

        AttendanceDetails AS (
            SELECT 
                Emp_Code, 
                SUM(value) AS paidDays 
            FROM attendancetable a
            JOIN Employee_AtnStatus e ON e.status = a.status
            WHERE Emp_Code IN (${query}) 
            AND a.dateoffice BETWEEN '${dateFrom}' AND '${dateto}'
            GROUP BY Emp_Code
        )

        SELECT 
            s.Emp_Code AS [Employee Code],
            s.EmployeeName AS [Employee Name],
            s.Gender,
            s.Location AS Branch,
            IIF(s.EmpType = 1, 'REGULAR', 'CASUAL') AS Category,
            s.Department,
            s.Designation,
            s.Section,
            s.SalaryMonthlyRate AS [Salary Monthly Rate],
            S.dob,
          s.CURRENTJOINDATE as [Joining Date],
          s.LASTWOR_DATE as [Last Working Date],
            s.Monthdays,
            a.paidDays AS [Days Paid],
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
            (s.oth_ded + s.Advance) AS [Other ded.],
            (s.esic + s.PROF_TAX + s.pf_employee + s.Advance + s.lwf_employee + s.tds) AS [Total Deductions],
            s.final_payment AS [Net Salary],  
          s.PAYMENTMODE as [Payment Mode],
            s.bankName AS [Bank Name],
            s.BankAcntNo AS [Account No],
            s.IfscCode AS [IFSC Code]
        FROM SalaryDetails s 
        LEFT JOIN AttendanceDetails a ON s.Emp_Code = a.Emp_Code
        where Final_Payment > 0 or (LASTWOR_DATE is null and Final_Payment <= 0) `
    );
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
      'attachment; filename="SalaryReport.xlsx"'
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
      'attachment; filename="SalaryReport_NodataAvailable.xlsx"'
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

exports.AssetEmpReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  const data = req.query;
  const dateto = data.dateto;
  const dateFrom = data.dateFrom;

  console.log(req.query, "body");
  const result = getLaterMonthYear(dateFrom, dateto);

  try {
    let reportName = "Employee Wise Asset Report";

    const txnDetails = await sequelize.query(
      `select Emp_Code,(SELECT EMPFIRSTNAME FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code) AS EMPLOYEE_NAME,
Aset_Code, Aset_Name,Asset_Type, Issue_Date,Revoke_Date, Lost_Date, Revoke_Rem from Asset_Issue`
    );
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
      'attachment; filename="EmployeeWiseAsset.xlsx"'
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
      'attachment; filename="EmployeeWiseAsset_NodataAvailable.xlsx"'
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


exports.digitalgatepassdash = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const data = req.body;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const region = data.region;
    const location = data.location;
    const department = data.department;
    const empcode = data.empcode;
    const empcodeList = data.empcodeList;

    let query = `select empcode from employeemaster where export_type<3 and lastwor_date is null `;
    if (region) query += ` and sal_region in (${region}) `;
    if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
    if (department) query += `and section in (${department}) `;
    // if (empcode?.length > 0) {
    //   const quotedEmpcodes = empcode.map((code) => `''${code}''`).join(",");
    query += `and empcode in (${empcode}) `;
    // }
    let reportName = "Gate Pass Report";

    const txnDetails = await sequelize.query(
      `select * from (select EMPCODE,  
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3) as EmployeeName,
            (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.EMPCODE and export_type < 3) as Designation,
            (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Location,
            (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Region,
            (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Department,
            (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.empcode and export_type < 3)) as Section,
            CAST(REQ_DATE AS NVARCHAR(108)) Date, CAST(REQ_DATE AS date) as month,
            iif(GP_TYPE=1,'OFFICIAL','PERSONAL')as [Gate Pass Type],
            iif(	RETURN_STAT=1,'YES','NO') as [Return Type],REASON,
            iif(final_stat = 'Y', 'Approved',iif(final_stat = 'N','Rejected',null)) as Status,
            FORMAT(CONVERT(datetime, ACT_OUT_TIME), 'h:mmtt') [Out Time],
            FORMAT(CONVERT(datetime, ACT_In_TIME), 'h:mmtt') [In Time],
            iif(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) is null,null,concat(DATEDIFF(minute, CONVERT(datetime, ACT_OUT_TIME), CONVERT(datetime, ACT_In_TIME)) ,'')) AS [Duration],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_3_CODE_B and export_type < 3) as [Applied BY],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_A and export_type < 3) as [Approved by],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_1_CODE_B and export_type < 3) as [GUARD (OUT)],
            (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.APPR_2_CODE_B and export_type < 3) as [GUARD (IN)]
            from DIG_GP fst WHERE CAST(req_date AS DATE) BETWEEN '${dateFrom}' AND '${dateto}' and empcode in (${query})
             )  as ab where Duration > 0`
    );

    res.send({ success: true, data: txnDetails[0] });

  } catch (e) {
    console.log(e);

  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.PunchingReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const region = data.region;
    const location = data.location;
    const department = data.department;
    const empcode = data.empcode;
    let query = `select empcode from employeemaster where export_type<3 and lastwor_date is null `;
    if (region) query += ` and sal_region in (${region}) `;
    const user_location = data.user_location;
    if (parseInt(user_location)) {
      if (location) query += `and location in (${location}) `;
    } else {
      if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
    }
    if (department) query += `and section in (${department}) `;
    if (empcode) {
      query += `and empcode in (''${empcode}'') `;
    }
    let reportName = "Daily Punching Report";

    const txnDetails = await sequelize.query(
      ` DECLARE @sql NVARCHAR(MAX);
        DECLARE @columns NVARCHAR(MAX);
        DECLARE @columns1 NVARCHAR(MAX);
        DECLARE @maxPunches INT;

        -- Step 1: Determine the maximum number of punches in a day
        SELECT @maxPunches = MAX(punchCount)
        FROM (
            SELECT cardno, CAST(officepunch AS DATE) AS PunchDate, COUNT(DISTINCT officepunch) AS punchCount
            FROM machinerawpunch
            WHERE CAST(officepunch AS DATE) = '${dateto}'
            GROUP BY cardno, CAST(officepunch AS DATE)
        ) AS PunchCounts;

        -- Step 2: Generate dynamic column names with aliases
        SELECT @columns = STRING_AGG(QUOTENAME(number) + ' AS ' + QUOTENAME(CONCAT('Punch ', number)), ',')
        FROM (
            SELECT TOP (@maxPunches) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS number
            FROM master.dbo.spt_values
        ) AS Numbers;

        SELECT @columns1 = STRING_AGG(QUOTENAME(number), ',')
        FROM (
            SELECT TOP (@maxPunches) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS number
            FROM master.dbo.spt_values
        ) AS Numbers;

        -- Step 3: Build dynamic pivot query
        SET @sql = '
        SELECT 
            cardno AS EmployeeID,
          EmployeeName,
            PunchDate, 
          TotalPunchCount,
            ' + @columns + '
        FROM (
            SELECT 
                cardno,
                CAST(officepunch AS DATE) AS PunchDate,
            concat(title,'' '',empfirstname,'' '',EMPLASTNAME) as EmployeeName,
                FORMAT(officepunch, ''HH:mm:ss'') AS PunchTime,
                ROW_NUMBER() OVER (PARTITION BY cardno, CAST(officepunch AS DATE) ORDER BY officepunch) AS rn,
            COUNT(*) OVER (PARTITION BY cardno, CAST(officepunch AS DATE)) AS TotalPunchCount
            FROM (
                SELECT DISTINCT cardno, officepunch
                FROM machinerawpunch
                WHERE CAST(officepunch AS DATE) = ''${dateto}''
            ) AS DistinctPunches
          left join EMPLOYEEMASTER
          on EMPCODE = cardno and EMPLOYEEMASTER.Export_Type < 3 where cardno in (${query})
        ) AS RankedPunches
        PIVOT (
            MAX(PunchTime)
            FOR rn IN (' + @columns1 + ')
        ) AS PivotedPunches
        ORDER BY EmployeeName desc
        ';

        -- Print and execute the dynamic SQL
        PRINT @sql;
        EXEC sp_executesql @sql;`
    );
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
      'attachment; filename="Punching_Report.xlsx"'
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
      'attachment; filename="Punching_Report.xlsx"'
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




exports.parfoma_report = async function (req, res) {

  const sequelize = await dbname(req.query.compcode);
  try {
    const reportName = "Report_of_Comparision";

    // Query to fetch transaction details
    const txnDetails = await sequelize.query(
      `WITH LatestRecords AS (
        SELECT 
          *, 
          ROW_NUMBER() OVER (PARTITION BY vin ORDER BY INV_DT DESC) AS RowNum
        FROM 
          NewCar_Sale_Register
      )
      SELECT 
        BI.VIN_INV AS AUTOVYN_VIN,
        BI.Invoice_Date AS AUTOVYN_INVOICE_DATE,
        BI.Ledger_Name AS AUTOVYN_Ledger_Name,
        BI.Customer_Id AS AUTOVYN_Customer_Id,
        BI.PAN_NO AS AUTOVYN_PAN_NO, 
        BI.Modl_Code AS AUTOVYN_Modl_Code,
        BI.Cons_Disc + BI.Spl_Scheme_Disc AS AUTOVYN_Consumer_Discount,
        BI.Corp_Disc AS AUTOVYN_CORPORATE_DISCOUNT,
        BI.Exch_Disc AS AUTOVYN_EXCHANGE_DISCOUNT,
        BI.Net_Amt AS AUTOVYN_INVOICE_AMOUNT,
        GFT.Inv_No AS DMS_INV_NO,
        GFT.Vin AS DMS_VIN,
        GFT.Inv_dt AS DMS_Invoice_Date,
        GFT.Customer_Name AS DMS_Customer_Name,
        GFT.Customer_id AS DMS_Customer_Id,
        GFT.PAN_No AS DMS_PAN_NO,
        GFT.Variant_cd AS DMS_Modl_Code,
        GFT.DISCOUNT AS DMS_Consumer_Discount,
        GFT.Discount_for_Corp_Institutional_Customer AS DMS_CORPORATE_DISCOUNT,
        GFT.EXCHANGE_LOYALTY_BONUS_DISCOUNT AS DMS_EXCHANGE_DISCOUNT,
        GFT.Inv_Amt AS DMS_INVOICE_AMOUNT
      FROM 
        BHATIA_INVOICE BI
      LEFT JOIN 
        (SELECT 
          * 
         FROM 
          LatestRecords
         WHERE 
          RowNum = 1
        ) AS GFT
      ON 
        GFT.vin = BI.VIN_INV
      WHERE 
        BI.tran_id = 0;`
    );

    // Query to fetch company name
    const Company_Name = await sequelize.query(
      `SELECT TOP 1 comp_name FROM Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Set company name and report title
    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name || "Company Name"}`;
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getCell("A1").font = { bold: true, size: 16 };

    worksheet.mergeCells("A2:E2");
    worksheet.getCell("A2").value = `${reportName}`;
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };

    // Define headers
    const headers = [
      "From",
      "VIN",
      "INVOICE_DATE",
      "Ledger_Name",
      "Customer_Id",
      "PAN_NO",
      "Modl_Code",
      "Consumer_Discount",
      "CORPORATE_DISCOUNT",
      "EXCHANGE_DISCOUNT",
      "INVOICE_AMOUNT",
      "INV_NO",
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // Dark green background
      };
    });
    function cleanName(name) {
      return name?.replace(/^(Mr\.?|Ms\.?|M\/s|Dr\.?)\s*/i, '').trim();
    }
    // Add data rows
    txnDetails[0]?.forEach((record) => {
      const autovynValues = [
        "Autovyn",
        record.AUTOVYN_VIN,
        record.AUTOVYN_INVOICE_DATE,
        record.AUTOVYN_Ledger_Name,
        record.AUTOVYN_Customer_Id,
        record.AUTOVYN_PAN_NO,
        record.AUTOVYN_Modl_Code,
        record.AUTOVYN_Consumer_Discount,
        record.AUTOVYN_CORPORATE_DISCOUNT,
        record.AUTOVYN_EXCHANGE_DISCOUNT,
        record.AUTOVYN_INVOICE_AMOUNT,
      ];

      const dmsValues = [
        "DMS",
        record.DMS_VIN,
        record.DMS_Invoice_Date,
        record.DMS_Customer_Name,
        record.DMS_Customer_Id,
        record.DMS_PAN_NO,
        record.DMS_Modl_Code,
        record.DMS_Consumer_Discount,
        record.DMS_CORPORATE_DISCOUNT,
        record.DMS_EXCHANGE_DISCOUNT,
        record.DMS_INVOICE_AMOUNT,
        record.DMS_INV_NO,
      ];
      const Comparison = [
        "Comparison",
        record.AUTOVYN_VIN == record.DMS_VIN ? 'true' : 'false',
        record.AUTOVYN_INVOICE_DATE == record.DMS_Invoice_Date ? 'true' : 'false',
        cleanName(record.AUTOVYN_Ledger_Name?.toLowerCase()) == cleanName(record.DMS_Customer_Name?.toLowerCase()) ? 'true' : 'false',
        record.AUTOVYN_Customer_Id == record.DMS_Customer_Id ? 'true' : 'false',
        record.AUTOVYN_PAN_NO == record.DMS_PAN_NO ? 'true' : 'false',
        record.AUTOVYN_Modl_Code == record.DMS_Modl_Code ? 'true' : 'false',
        record.AUTOVYN_Consumer_Discount == record.DMS_Consumer_Discount ? 'true' : 'false',
        record.DMS_CORPORATE_DISCOUNT == record.DMS_CORPORATE_DISCOUNT ? 'true' : 'false',
        record.DMS_EXCHANGE_DISCOUNT == record.DMS_EXCHANGE_DISCOUNT ? 'true' : 'false',
        record.AUTOVYN_INVOICE_AMOUNT == record.DMS_INVOICE_AMOUNT ? 'true' : 'false',
      ]

      worksheet.addRow(autovynValues); // Add AUTOVYN row
      worksheet.addRow(dmsValues); // Add DMS row
      worksheet.addRow(Comparison); // Add Comparison row
      worksheet.addRow([]); // Add a blank row for spacing
    });

    // Send the file as a response
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      .setHeader(
        "Content-Disposition",
        'attachment; filename="Report_of_Comparision.xlsx"'
      );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error occurred:", error);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(500)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      .setHeader(
        "Content-Disposition",
        'attachment; filename="Error_Report.xlsx"'
      );

    await workbook.xlsx.write(res);
    res.end();
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};
