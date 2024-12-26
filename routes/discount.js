const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const { SendWhatsAppMessgae } = require("./user");
const path = require("path");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require('crypto');
const { _DiscountOffers, discountOffersSchema } = require("../models/DiscountOffers");

exports.getlabels = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const labels = await sequelize.query(`select * from dise_abbr`);
    res.status(200).json(labels[0]);
  } catch (e) {
    console.log(e);
  }
};
//data
exports.discountdashboarddata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const multi_loc = req.body.multi_loc;

    const data1 = await sequelize.query(`SELECT COUNT(*) as Total,
    (select count(*) from GDFDI_ORDBK WHERE trans_type='ordbk' 
            AND TRANS_ID NOT IN (
                SELECT TRANS_ID 
                FROM GDFDI_ORDBK 
                WHERE TRANS_TYPE='ordbc'
            )
            AND TRANS_DATE between '${dateFrom}' and '${dateto}' and TEAM_HEAD is not null
      and LOC_CD in (select NEWCAR_RCPT from GODOWN_MST where Godw_Code in  (${multi_loc})) and UTD not in (select utd from dise_aprvl  where Curr_Date between '${dateFrom}' and '${dateto}' and location in  (${multi_loc}))) as pending_atdse,
      (select count(*) from dise_aprvl where Appr_1_Stat is null   and Curr_Date between '${dateFrom}' and '${dateto}' and location in  (${multi_loc}))as pending_atapr1,
	  (select count(*) from dise_aprvl where Appr_2_Stat is null and Appr_1_Stat=1  and Curr_Date between '${dateFrom}' and '${dateto}' and location in  (${multi_loc}))as pending_atapr2
        FROM (
            SELECT utd 
            FROM GDFDI_ORDBK 
            WHERE trans_type='ordbk' 
            AND TRANS_ID NOT IN (
                SELECT TRANS_ID 
                FROM GDFDI_ORDBK 
                WHERE TRANS_TYPE='ordbc'
            )
            AND TRANS_DATE between '${dateFrom}' and '${dateto}' and TEAM_HEAD is not null
      and LOC_CD in (select NEWCAR_RCPT from GODOWN_MST where Godw_Code in  (${multi_loc}))) AS subquery;
    `);

    const data2 = await sequelize.query(`
    select count(*) as Total from dise_aprvl where export_type=9 
    and Curr_Date between '${dateFrom}' and '${dateto}' and location in (${multi_loc})`);

    const data3 = await sequelize.query(`SELECT 
    (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Misc_Code = modl_group) AS Name,
    SUM(Approved_amt) AS Total
FROM 
    dise_aprvl where export_type<3 and UTD in (select distinct utd from dise_aprvl where utd is not null )
    and Curr_Date between '${dateFrom}' and '${dateto}' and location in (${multi_loc}) 
GROUP BY 
    modl_group;`);

    const data4 = await sequelize.query(`
    SELECT 
        (select top 1 Modl_Name from Modl_mst where Modl_Grp = modl_group) AS Name,
        SUM(Approved_amt) AS Total
    FROM 
        dise_aprvl  where export_type<3 and UTD in (select distinct utd from dise_aprvl where utd is not null )
        and Curr_Date between '${dateFrom}' and '${dateto}' and location in (${multi_loc})
      GROUP BY 
       modl_group;`);

    const data5 = await sequelize.query(`
        SELECT count(*) as Total,
            (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Misc_Code = modl_group) AS Name
        FROM 
            dise_aprvl where export_type<3 and UTD in (select distinct utd from dise_aprvl where utd is not null )
            and Curr_Date between '${dateFrom}' and '${dateto}' and location in (${multi_loc})
          GROUP BY 
            modl_group;`);

    const data6 = await sequelize.query(`
     select sum(booking) as totalbooking,sum(discount_request)as generate_request,sum(pending_approver1)as pending_approver1 ,sum(pending_approver2) as pending_approver2,Branch_name from (
     SELECT 
         COUNT(*) as booking,
         (SELECT TOP 1 GODW_NAME FROM Godown_Mst WHERE NEWCAR_RCPT = GDFDI_ORDBK.LOC_CD) as Branch_name,
         CASE WHEN EXISTS (SELECT TOP 1 utd FROM dise_aprvl WHERE utd = GDFDI_ORDBK.utd) THEN 1 ELSE 0 END as discount_request,
         CASE WHEN EXISTS (SELECT TOP 1 utd FROM dise_aprvl WHERE utd = GDFDI_ORDBK.utd and Appr_1_Stat is null) THEN 1 ELSE 0 END as pending_approver1,
         CASE WHEN EXISTS (SELECT TOP 1 utd FROM dise_aprvl WHERE utd = GDFDI_ORDBK.utd and Appr_2_Stat is null and Appr_1_Stat=1) THEN 1 ELSE 0 END as pending_approver2
     FROM 
         GDFDI_ORDBK 
     WHERE 
         trans_type = 'ordbk'
         AND TRANS_ID NOT IN (
             SELECT TRANS_ID 
             FROM GDFDI_ORDBK 
             WHERE TRANS_TYPE = 'ordbc'
         )
         AND  TRANS_DATE between '${dateFrom}' and '${dateto}' and TEAM_HEAD is not null
         AND LOC_CD IN (select NEWCAR_RCPT from GODOWN_MST where Godw_Code in  (${multi_loc})
         )
     GROUP BY 
         LOC_CD, Utd) as ab group by Branch_name`);

    res.status(200).send({
      data1: data1[0],
      data2: data2[0],
      data3: data3[0],
      data4: data4[0],
      data5: data5[0],
      data6: data6[0],
    });
  } catch (err) {
    console.log(err);
  }
};
exports.discountdashboard = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    var data = await sequelize.query(
      `select godw_code , godw_name from godown_mst where  godw_code in (${req.body.multi_loc}) and export_type < 3`
    );
    res.render("discountdashboard", {
      branch: data[0],
    });
  } catch (err) {
    console.log(err);
  }
};
//complete

exports.viewDiscountReport = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const loc_code = req.body.multi_loc;

  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(`
     select * from ( SELECT GDFDI_ORDBK.UTD, Trans_ID, Trans_Date, Trans_Ref_Date, GDFDI_ORDBK.Variant_CD, GDFDI_ORDBK.ECOLOR_CD, GDFDI_ORDBK.Cust_Name, Team_Head, Loc_Cd,    
              (SELECT TOP 1 godw_code FROM godown_mst WHERE GDFDI_ORDBK.loc_cd COLLATE DATABASE_DEFAULT=REPLACE(godown_mst.newcar_rcpt ,'-S','')COLLATE DATABASE_DEFAULT and  godown_mst.export_type<=3) AS Godown_Code,    
              (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GDFDI_ORDBK.loc_cd COLLATE DATABASE_DEFAULT= REPLACE(godown_mst.newcar_rcpt ,'-S','')COLLATE DATABASE_DEFAULT and godown_mst.export_type<=3) AS godw_name,    
              (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD COLLATE DATABASE_DEFAULT= Modl_Code COLLATE DATABASE_DEFAULT) AS Modl_Name,
              (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD COLLATE DATABASE_DEFAULT= Modl_Code COLLATE DATABASE_DEFAULT) AS item_code,
              (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD COLLATE DATABASE_DEFAULT= Modl_Code COLLATE DATABASE_DEFAULT) AS Modl_Grp,
is_gd  AS isgd,
 Appr_1_Stat  AS status1,
Appr_2_Stat  AS status2,
 Appr_1_Rem  AS Appr_1_Remark,
(select top 1 concat(empfirstname,' ',emplastname) from EMPLOYEEMASTER WHERE EMPLOYEEMASTER.empcode=Appr_1_Code)as Approver_1,
(select top 1 concat(empfirstname,' ',emplastname) from EMPLOYEEMASTER WHERE EMPLOYEEMASTER.empcode= Appr_2_Code)as Approver_2,
Appr_2_Rem  AS Appr_2_Remark,
reapp_emp  AS reapp_emp,
fin_appr  AS final,
 Approved_amt as Approved_amt,
Remark as Remark,
Curr_Date as Curr_Date,
     TRANS_DATE as booking_Date,Team_Head as Srmname,EXecutive as RMNAME,
	 (select top 1 godw_name from Godown_Mst where Replace(NEWCAR_RCPT,'-S','')COLLATE DATABASE_DEFAULT=GDFDI_ORDBK.LOC_CD COLLATE DATABASE_DEFAULT)as Branch_Name,
     GDFDI_ORDBK.CUST_NAME as CustomerName,
dise_aprvl.Mob as MobileNumber,
dise_aprvl.Pan_No as PanNumber,
       (select top 1 Modl_Name from  Modl_Mst where VARIANT_CD =MODEL_CD )as ModelName,
dise_aprvl.Delv_Date as DeliveryDate,
    
dise_aprvl. Consumer as ConsumerOffer,

dise_aprvl.Corporate as CorporateOffer,
  
dise_aprvl.Exch as ExchangeOffer,
   
dise_aprvl.Cartel as Cartel,

dise_aprvl.Buffer as Buffer,
   
dise_aprvl.MGA as MGA,

dise_aprvl.mssfoffer as mssfoffer,


dise_aprvl.Exchange_Support as Exchange_Support,


 CASE
             WHEN CCP = '0' THEN 'No'
               WHEN CCP = '1' THEN 'Yes'
           ELSE 'unknown'
         END AS CCP,


CASE
             WHEN EW = '0' THEN 'No'
               WHEN EW = '1' THEN 'Yes'
           ELSE 'unknown'
         END AS EW ,
     dise_aprvl.Fuel_type as Fuel_type,
 CASE
               WHEN waiting = '0' THEN 'No'
               WHEN waiting = '1' THEN 'Yes'
           ELSE 'unknown' END AS Car_Waiting ,

     dise_aprvl.Dise_Amt as AdditionalDiscount,

     (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code =dise_aprvl.Loan)as Loan_Name,

CASE
             WHEN Insurance = '0' THEN 'No'
               WHEN Insurance = '1' THEN 'Yes'  ELSE 'unknown' END AS Insurance ,

     CASE
            WHEN  RTO_Chrg = '0' THEN 'Permanent'
               WHEN RTO_Chrg = '1' THEN 'Temporary'
           ELSE 'unknown'
         END AS RTOCharges,
         CASE
              WHEN Loyalty_Card = '0' THEN 'No'
               WHEN Loyalty_Card = '1' THEN 'Yes'
           ELSE 'unknown'
         END AS Loyalty_Card ,
          CASE
               WHEN Car_Exch = '0' THEN 'No'
               WHEN Car_Exch = '1' THEN 'Yes'
           ELSE 'unknown'
         END AS CarExchange,
      CASE
    WHEN dise_aprvl.FastTeg = '0' THEN 'No'
    WHEN dise_aprvl.FastTeg = '1' THEN 'Yes'
    ELSE 'unknown'
    END AS FastTeg,
       dise_aprvl.registration as registration,
        dise_aprvl.vas as vas,
         dise_aprvl.MGA_AMt as MGA_AMt,
         dise_aprvl.Customer_Type as Customer_Type,
         dise_aprvl.appr_1_date as appr_1_date,
         dise_aprvl.appr_2_date as appr_2_date,
        dise_aprvl.Approval_Type as Approval_Type,
        dise_aprvl.Vehicle_Ageing as Vehicle_Ageing,
   (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,CUST_ID FROM GDFDI_ORDBK
   Left join dise_aprvl on dise_aprvl.UTD=GDFDI_ORDBK.UTD  and dise_aprvl.export_type<3
   WHERE TRANS_TYPE = 'ORDBK'
   AND cast (TRANS_DATE as date) BETWEEN '${dateFrom}' AND '${dateto}' and TRANS_ID not in (select trans_id from GDFDI_ORDBK gda where gda.TRANS_ID=GDFDI_ORDBK.TRANS_ID and gda.LOC_CD=GDFDI_ORDBK.LOC_CD and gda.TRANS_TYPE='ordbc') 
   And loc_cd in (select Replace(newcar_rcpt,'-S','')COLLATE DATABASE_DEFAULT from godown_mst where godw_code in (${loc_code})) ) as 
ab where Godown_Code in (${loc_code})`)

    res.status(200).send(discountdata[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.viewDiscountReportUserWisedata = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;

  try {
    const sequelize = await dbname(req.headers.compcode);
    const discountdata = await sequelize.query(`select 
    (select (select count(*) as total_count from GDFDI_ORDBK where TRANS_TYPE = 'ordbk' and LEFT(Team_head, CHARINDEX(' - ', Team_head) - 1) in(dms_code) and 
    cast (SUBSTRING ( TRANS_DATE  , 0, 11 )as date) between '${dateFrom}' and '${dateto}')) as total_count,
   count(*)as request_raised,
    sum(iif(status = 1 , 1 ,0)) as approvedby1,
     sum(iif(status = 2 , 1 ,0)) as rejectedby1,
     sum(iif(status = 0 or status is null , 1 ,0)) as pendingat1,
     sum(iif(apr2_apr = 1 , 1 ,0)) as approvedby2,
     sum(iif(apr2_apr = 2 , 1 ,0)) as rejectedby2,
     sum(iif(apr2_apr = 0 or status is null , 1 ,0)) as pendingat2,
     EmployeeName	,Designation	,Location	,Region	,Division	,Department	,srm	,dms_code
     from (
     select 
     (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as EmployeeName,
     (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as Designation,
       (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Location,
     (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Region,
     (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Division,
     (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Department,
     srm,status,apr2_apr,dms_code from (select (select top 1 EMPCODE from user_tbl where user_name  = srm  and empcode is not null) as emp_code,
     (select top 1 emp_dms_code from user_tbl where user_name  = srm  and emp_dms_code is not null) as dms_code
      ,* from dise_aprvl where  Location in (${req.body.branch}) and Curr_date between '${dateFrom}' and '${dateto}' and   export_type<3 and fin_appr=1
      ) as fst) as da group by SRM,EmployeeName,Designation,Location,Region
      ,Division,Department,dms_code`)
    res.status(200).send(discountdata[0]);
    await sequelize.close();
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.discountreportUserwise = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const branch = req.body.branch;
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `
     select(select (select count(*) as total_count from GDFDI_ORDBK where TRANS_TYPE = 'ordbk' and
LEFT(Team_head, CHARINDEX(' - ', Team_head) - 1)COLLATE DATABASE_DEFAULT in(dms_code) and 
    cast (SUBSTRING ( TRANS_DATE  , 0, 11 )as date) between '2024-11-01' AND '2024-11-30')) as total_count,
   count(*)as request_raised,
    sum(iif(status = 1 , 1 ,0)) as approvedby1,
     sum(iif(status = 2 , 1 ,0)) as rejectedby1,
     sum(iif(status = 0 or status is null , 1 ,0)) as pendingat1,
     sum(iif(apr2_apr = 1 , 1 ,0)) as approvedby2,
     sum(iif(apr2_apr = 2 , 1 ,0)) as rejectedby2,
     sum(iif(apr2_apr = 0 or status is null , 1 ,0)) as pendingat2,
     EmployeeName	,Designation	,Location	,Region	,Division	,Department	,srm	,dms_code
     from (
     select 
     (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as EmployeeName,
     (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3) as Designation,
       (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top 1 location from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Location,
     (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1 sal_region from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Region,
     (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Division,
     (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1 section from EMPLOYEEMASTER where empcode= fst.emp_code and export_type < 3)) as Department,
     srm,status,apr2_apr,dms_code from (select (select top 1 EMPCODE from user_tbl where user_name COLLATE DATABASE_DEFAULT = srm COLLATE DATABASE_DEFAULT and empcode is not null) as emp_code,
     (select top 1 emp_dms_code from user_tbl where user_name  COLLATE DATABASE_DEFAULT= srm COLLATE DATABASE_DEFAULT  and emp_dms_code is not null) as dms_code
      ,* from dise_aprvl where  Location in (${req.body.multi_loc}) and Curr_date between '${dateFrom}' and '${dateto}' and   export_type<3 and fin_appr=1
      ) as fst) as da group by SRM,EmployeeName,Designation,Location,Region
      ,Division,Department,dms_code
   `
    );

    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.discountreportBranchwise = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const branch = req.body.branch;
  function getPreviousMonthDate(dateString) {
    const date = new Date(dateString);
    const previousMonth = date.getMonth() - 1;

    if (previousMonth < 0) {
      // Handle wrap-around for January to previous December
      date.setFullYear(date.getFullYear() - 1);
      date.setMonth(11); // December is month 11 (0-indexed)
    } else {
      date.setMonth(previousMonth);
    }
    return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  }

  const previousMonthDateTo = getPreviousMonthDate(dateto);
  const previousMonthDateFrom = getPreviousMonthDate(dateFrom);
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `
     SELECT 
    COUNT(*) AS total_count,
    SUM(IIF(is_gd = 'yes', 1, 0)) AS request_raised,
    SUM(IIF(appr_1_stat = 1 AND is_gd = 'yes', 1, 0)) AS approvedby1,
    SUM(IIF(appr_1_stat = 0 AND is_gd = 'yes', 1, 0)) AS rejectedby1,
    SUM(IIF((appr_1_stat IS NULL) AND is_gd = 'yes', 1, 0)) AS pendingat1,
    SUM(IIF(appr_2_stat = 1 AND is_gd = 'yes', 1, 0)) AS approvedby2,
    SUM(IIF(appr_2_stat = 0 AND is_gd = 'yes', 1, 0)) AS rejectedby2,
    SUM(IIF((appr_2_stat IS NULL AND appr_1_stat = 1) AND is_gd = 'yes', 1, 0)) AS pendingat2,
    (SELECT Godw_Name FROM godown_mst WHERE REPLACE(newcar_rcpt, '-s', '') COLLATE DATABASE_DEFAULT = LOC_CD COLLATE DATABASE_DEFAULT AND export_type < 3) AS location_name,
    LOC_CD
FROM (
    SELECT
        g.LOC_CD,
        g.trans_id,
        dl.*
    FROM GDFDI_ORDBK g
    LEFT JOIN (
        SELECT utd, appr_1_stat, appr_2_stat, is_gd
        FROM dise_aprvl
        WHERE export_type < 3
    ) AS dl ON dl.utd = g.UTD
    WHERE g.loc_cd COLLATE DATABASE_DEFAULT IN (
        SELECT REPLACE(newcar_rcpt, '-s', '') COLLATE DATABASE_DEFAULT 
        FROM godown_mst 
        WHERE godw_code IN (${req.body.multi_loc})
    ) 
    AND CAST(g.TRANS_DATE AS DATE) BETWEEN '${dateFrom}' AND '${dateto}'
    AND g.TRANS_TYPE = 'ordbk'
    AND g.TRANS_ID NOT IN (
        SELECT trans_id 
        FROM GDFDI_ORDBK gda
        WHERE gda.TRANS_ID = g.TRANS_ID 
        AND gda.LOC_CD = g.LOC_CD 
        AND gda.TRANS_TYPE = 'ordbc'
    )
) AS dad
GROUP BY LOC_CD 
ORDER BY total_count;

   `
    );
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.DiscountReport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const branch = await sequelize.query(
    `select Godw_Name,Godw_Code from GODOWN_MST where Godw_Code in (${req.body.multi_loc}) and export_type<3`
  );

  res.render("DiscountReport", { branch: branch[0] });
};
exports.disc3 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select Godw_Name,Godw_Code from GODOWN_MST where Godw_Code in (${req.body.multi_loc}) and export_type<3`
    );
    const model_group = await sequelize.query(
      `select Misc_Name,Misc_Code from Misc_mst where Misc_type=14`
    );
    const color = await sequelize.query(
      `select Misc_Name,Misc_Code from Misc_mst where Misc_type=10 and export_type<3 and misc_name!='' and misc_name is not null`
    );
    const Loantype = await sequelize.query(
      `select Misc_Name,Misc_Code from Misc_mst where Misc_type=18`
    );
    const emp =
      await sequelize.query(`SELECT EMPCODE,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME,Reporting_1,Reporting_2
    FROM EMPLOYEEMASTER`);
    const emp1 =
      await sequelize.query(`SELECT EMPCODE,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME,Reporting_1,Reporting_2
FROM EMPLOYEEMASTER Where EMPCode  = (select top 1 empcode from user_tbl where user_name='${req.body.username}' and export_type<3 and module_code=10);`);

    res.status(200).send({
      branch: branch[0],
      model_group: model_group[0],
      color: color[0],
      Loantype: Loantype[0],
      emp: emp[0],
      emp1: emp1[0],
    });
  } catch (e) {
    console.log(e);
  }
};

async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/discount/`;
        const ext = path.extname(file.originalname);
        // Generate randomUUID
        const randomUUID = uuidv4();
        // Append extension to randomUUID
        const fileName = randomUUID + ext;
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
          const data = {
            SRNO: index,
            User_Name: Created_by,
            DOC_NAME: file.originalname,
            fieldname: file.fieldname,
            path: `${customPath}${fileName}`,
          };
          // console.log(data, 'data');
          dataArray.push(data);
          console.log(`Image uploaded successfully`);
        } catch (error) {
          console.log(error);
          console.error(`Error uploading image ${index}:, error.message`);
        }
        // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
      })
    );
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}
exports.findvarient = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Misc_Code = req.body.Misc_Code;
    const varient = await sequelize.query(
      `select Modl_Name as label,Item_Code as value,Modl_Code from Modl_mst where Modl_Grp='${Misc_Code}'`
    );
    res.status(200).json(varient[0]);
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.savediscountapproval = async function (req, res) {

  try {
    const UTD = req.body.UTD ? `'${req.body.UTD}'` : null;
    const export_Type = req.body.UTD ? 1 : 2;
    const bookingid = req.body.Trans_ID ? `'${req.body.Trans_ID}'` : null;
    const phoneno = req.body.MOBILE2;
    const panno = req.body.PAN_NO;
    const Branch_Name = req.body.Godown_Code;
    const customerid = req.body.Cust_Name;
    const modelgroup = req.body.Modl_Grp;
    const modelvariant = req.body.Modl_Var;
    const color = req.body.Color ? `'${req.body.Color}'` : null;
    const date = req.body.Curr_Date;
    const Delv_Date = req.body.Delv_Date ? `'${req.body.Delv_Date}'` : null;
    const loantype = req.body.Loan;
    const mgaamt = req.body.MGA_Amt;
    const insurance = req.body.Insurance;
    const rto = req.body.RTO_Chrg;
    const ew = req.body.EW;
    const ccp = req.body.CCP;
    const loycard = req.body.Loyalty_Card;
    const oldcar = req.body.Car_Exch;
    const fasttag = req.body.FastTeg;
    const consumer = req.body.Consumer;
    const corporate = req.body.Corporate;
    const exchange = req.body.Exch ? req.body.Exch : 0;
    const remark = req.body.remark_dse;
    const remark_dse_other = req.body.remark_dse_other;
    const amount = req.body.Dise_Amt;
    const Fuel = req.body.GE1;
    const waiting = req.body.waiting;
    const Var_Cd = req.body.Variant_CD;
    const Vehicle_Ageing = req.body.Vehicle_Ageing
    const Approval_Type = req.body.Approval_Type
    const Customer_Type = req.body.Customer_Type

    const Cartel = req.body.Cartel
    const Buffer = req.body.Buffer
    const MGA = req.body.MGA
    const Exchange_Support = req.body.Exchange_Support
    const discount = req.body.discount ? `'${req.body.discount}'` : null;

    const registration = req.body.registration ? `'${req.body.registration}'` : null;
    const Vas = req.body.Vas ? `'${req.body.Vas}'` : null;
    const document = req.body.document ? `'${req.body.document}'` : null;
    const Stock_booking = req.body.Stock_booking ? `'${req.body.Stock_booking}'` : null;
    const mssfoffer = req.body.mssfoffer ? req.body.mssfoffer : null;


    const Loan_Amount = req.body.Loan_Amount ? req.body.Loan_Amount : null;
    const Bank_Name = req.body.Bank_Name ? `'${req.body.Bank_Name}'` : null;
    const Preferred_Insurance = req.body.Preferred_Insurance ? `'${req.body.Preferred_Insurance}'` : null;
    const Insurance_Company = req.body.Insurance_Company ? `'${req.body.Insurance_Company}'` : null;
    const Oldvalue = req.body.Oldvalue ? req.body.Oldvalue : null;




    // const repremark = req.body.repremark ? `'${req.body.repremark}'` : null;
    // const reapp_emp = req.body.reapp_emp ? `'${req.body.reapp_emp}'` : null;
    let concatenatedRemark;
    if (remark_dse_other) {
      concatenatedRemark = `${remark} - ${remark_dse_other}`;
    } else {
      concatenatedRemark = `${remark}`;
    }

    const sequelize = await dbname(req.headers.compcode);
    const isalready = await sequelize.query(`select * from dise_aprvl where utd=${UTD} and export_type=1`)
    if (isalready[0].length > 0) {
      return res.status(401).send("Discount Already Raised On This Entry")
    }


    // const t = await sequelize.transaction();
    const Gd_loc = await sequelize.query(`select Loc_cd from GDFDI_ORDBK where utd=${UTD}`)


    const emp1 = await sequelize.query(
      `SELECT EMPCODE,mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME,Reporting_1,Reporting_2
     FROM EMPLOYEEMASTER Where EMPCode =(select top 1 empcode from user_tbl where user_name = '${req.body.username}' and module_code = 10 and export_type <3 );`,
      // { transaction: t }
    );

    await sequelize.query(
      `Insert into dise_aprvl 
      (Mob,	Pan_No,	Cust_Name,Modl_Var,	Veh_Clr,
      Delv_Date,	Loan,	MGA_Amt,	Insurance,	RTO_Chrg,	
      EW,CCP,Fuel_type,Var_Cd,	Loyalty_Card,
      Car_Exch,	FastTeg,	SRM,	RM,	Consumer,
      Corporate,Exch,	Aprvl_Offer,	Dise_Amt,			Curr_Date,	location,		
      dual_apr,	modl_group,		wa_link,		export_type,	remark_dse,
      UTD,booking_id,is_gd,status,waiting,
      Gd_loc,Vehicle_Ageing,Approval_Type,Customer_Type,
      Cartel,Buffer,MGA,Exchange_Support,discount,
      registration,Vas,document,Stock_booking,mssfoffer,
      Loan_Amount,Bank_Name,Preferred_Insurance,Insurance_Company,Oldvalue) 
    values
    ('${phoneno}','${panno}'  ,'${customerid}' ,'${modelvariant}' ,${color} ,
    ${Delv_Date} ,'${loantype}' , '${mgaamt}' ,'${insurance}' ,'${rto}' ,
    '${ew}' ,'${ccp}','${Fuel}','${Var_Cd}','${loycard}' ,
    '${oldcar}' ,'${fasttag}' ,'${emp1[0][0].EMPCODE}' ,'${0}' ,'${consumer}' ,
    '${corporate}' ,'${exchange}' ,'${0}' ,'${amount}'  ,GETDATE() ,'${Branch_Name}' , 
     '${0}' ,'${modelgroup}' ,'${"0"}' ,'${export_Type}' ,'${concatenatedRemark}' ,
     ${UTD},${bookingid},'Yes' ,'0',${waiting},
     '${Gd_loc[0][0].Loc_cd}','${Vehicle_Ageing}','${Approval_Type}','${Customer_Type}',
     ${Cartel},${Buffer},${MGA},${Exchange_Support},${discount},
     ${registration},${Vas},${document},${Stock_booking},${mssfoffer},
     ${Loan_Amount},${Bank_Name},${Preferred_Insurance},${Insurance_Company},${Oldvalue})`,
      // { transaction: t }
    );
    // const Emp_name = await sequelize.query(`SELECT EMPCODE,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME,mobileno FROM EMPLOYEEMASTER where empcode ='${emp1[0][0].Reporting_1}'`)
    const mobileno = await sequelize.query(
      `select mobileno from employeemaster where empcode=(select top 1 approver1_A from Approval_Matrix where empcode='${emp1[0][0].EMPCODE}')`,
      // { transaction: t }
    );
    const Model = await sequelize.query(
      `select Misc_Name from Misc_mst where Misc_type=14 and misc_code='${modelgroup}'`,
      // { transaction: t }
    );
    const branch = await sequelize.query(
      `select br_extranet from GODOWN_MST where Godw_Code in (${Branch_Name})  and export_type<3`,
      // { transaction: t }
    );
    const comapny = await sequelize.query(`select comp_name from comp_mst `, {
      // transaction: t,
    });
    const model_var = await sequelize.query(`select top 1 Modl_Name from  Modl_Mst where item_code='${modelvariant}'`, {
      // transaction: t,
    })
    const add = await sequelize.query(`select executive,cast(trans_date as date)as booking_date from GDFDI_ORDBK where utd=${UTD} and trans_type='ordbk'`, {
      // transaction: t,
    })

    const colorformes = await sequelize.query(`select Misc_Name from Misc_mst where Misc_type=10 and export_type<3 and misc_code=${color}`, {
      // transaction: t,
    })
    // await t.commit();
    await sequelize.close();


    await SendWhatsAppMessgae(req.headers.compcode, mobileno[0][0]?.mobileno, "disc_appr_msg_l1_new", [
      {
        type: "text",
        text: branch[0][0]?.br_extranet,
      },
      {
        type: "text",
        text: `${Model[0][0].Misc_Name} , ${model_var[0][0].Modl_Name} , ${colorformes[0][0].Misc_Name} `,
      },
      {
        type: "text",
        text: customerid,
      },
      {
        type: "text",
        text: amount,
      },
      {
        type: "text",
        text: add[0][0].executive,
      },
      {
        type: "text",
        text: add[0][0].booking_date,
      },
      {
        type: "text",
        text: comapny[0][0]?.comp_name,
      },
    ]);
    res.status(200).send("Data saved successfully");
  } catch (e) {
    console.log(e);
  }
};
exports.findphonenumber = async function (req, res) {
  const user_mobile = req.body.phoneNumber;
  const sequelize = await dbname(req.headers.compcode);

  const result = await sequelize.query(
    `select * from dise_aprvl where mob = '${user_mobile}'`
  );
  // console.log(result[0]);
  if (result[0].length < 1) {
    res.status(200).send("phone number dosesnt exits");
  } else {
    res.status(400).send(" phone number exits");
  }
};
exports.finddataofapproval1 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const Tran_id = req.body.Tran_id;

    const result = await sequelize.query(`
    SELECT da.*,
    (select top 1 reapp_remark from dise_aprvl where da.utd=utd and tran_id not in (${Tran_id}) order by tran_id desc)as reapproval_remark,
     gm.godw_name, mm.Misc_Name AS Modl_Group_Name,mc.Veh_Clr_Name, ml.Loan_Name, em.empname, rep1.EMPNAME AS Reporting1_Name, rep2.EMPNAME AS Reporting2_Name, mm_modl.Modl_Name AS modl_name
FROM dise_aprvl da
JOIN godown_mst gm ON da.Location = gm.godw_code
LEFT JOIN (
    SELECT Misc_Name, misc_code
    FROM Misc_mst
    WHERE Misc_type = 14
) mm ON da.modl_group = mm.misc_code
LEFT JOIN (
    SELECT Misc_Name AS Veh_Clr_Name, misc_code AS Veh_Clr_Code
    FROM Misc_mst
    WHERE Misc_type = 10
) mc ON da.Veh_Clr = mc.Veh_Clr_Code
LEFT JOIN (
    SELECT Misc_Name AS Loan_Name, misc_code AS Loan_Code
    FROM Misc_mst
    WHERE Misc_type = 18
) ml ON da.Loan = ml.Loan_Code
LEFT JOIN (
  SELECT EMPCODE,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
    FROM employeemaster
) em ON em.empcode = (select top 1 empcode from user_tbl where user_name = da.SRM and export_Type < 3 and module_code = 10)
LEFT JOIN (
  SELECT EMPCODE AS emocode,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
    FROM employeemaster
)rep1 ON da.Aprvl_By = rep1.emocode
LEFT JOIN (
  SELECT EMPCODE AS emocode,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
    FROM employeemaster
) rep2 ON da.aprvl_by2 = rep2.emocode
LEFT JOIN Modl_mst mm_modl ON da.Modl_Var = mm_modl.item_code
WHERE da.tran_id = '${Tran_id}' and gm.export_type<3;    
    `);

    res.status(200).json(result[0][0]);
  } catch (e) {
    console.log(e);
  }
};
exports.updatediscountapproval1 = async function (req, res) {
  try {
    const Tran_id = req.body.Tran_id;
    const status = req.body.status;

    const amount2 = req.body.amount2;
    const remark2 = req.body.remark2;
    const dir_id = req.body.dir_id;

    // Now you can access formData and process it as needed

    const repremark = req.body.repremark ? `'${req.body.repremark}'` : null;
    const sequelize = await dbname(req.headers.compcode);

    if (status == 9) {
      const Tran_id = req.body.Tran_id;
      const mgaamt = req.body.mgaamt;
      const insurance = req.body.insurance;
      const rto = req.body.rto;
      const ew = req.body.ew;
      const ccp = req.body.CCP;
      const loycard = req.body.loycard;
      const oldcar = req.body.oldcar;
      const fasttag = req.body.fasttag;
      const consumer = req.body.consumer;
      const corporate = req.body.corporate;
      const exchange = req.body.exchange ? req.body.exchange : 0;
      const amount = req.body.amount;

      const result = await sequelize.query(`update  dise_aprvl set  	
       	MGA_Amt='${mgaamt}',	Insurance='${insurance}',	RTO_Chrg='${rto}',	
        EW='${ew}',CCP='${ccp}',Loyalty_Card='${loycard}',	Car_Exch='${oldcar}',	FastTeg='${fasttag}',	Consumer='${consumer}',	Corporate='${corporate}',
          Exch='${exchange}',Dise_Amt=${amount} where tran_id='${Tran_id}'`);
    }

    const export_type = "export_type";
    const remarkforreapp = "reapp_remark";
    const aprvl_by = "aprvl_by";
    const reapp_emp = "reapp_emp";

    const dual_aprvl = await sequelize.query(
      `select DISC_DUAL_APRVL,DUAL_APRVL_MSG from comp_KeyData`
    );

    if (dual_aprvl[0][0].DISC_DUAL_APRVL) {
      const result2 = await sequelize.query(
        ` select SRM,aprvl_by2,location,status from dise_aprvl where tran_id='${Tran_id}'`
      );
      const approver1 = await sequelize.query(
        `select top 1 empcode from User_Tbl where user_name='${req.body.username}' and module_code=10 and export_type<3`
      );
      await sequelize.query(
        `update dise_aprvl set Remark='${remark2}',aprvl_by=(select top 1 empcode from User_Tbl where user_name='${req.body.username
        }' and module_code=10 and export_type<3),Approved_amt='${amount2}',Status='${status}',export_type=${status == 9 ? 9 : export_type
        },isapp1='1',apr2_apr = 0 ,reapp_remark=${repremark ? repremark : remarkforreapp
        }, reapp_emp=${status == 9 ? approver1[0].empcode : reapp_emp
        }  where tran_id='${Tran_id}' `
      );

      res.status(200).json("successfull");
      const result3 = await sequelize.query(
        `select status,aprvl_by2 from dise_aprvl where tran_id='${Tran_id}'`
      );

      const findall = await sequelize.query(
        `select SRM,Cust_Name,Mob,Modl_group,aprvl_by,aprvl_by2,Dise_Amt,Approved_amt,Remark,Curr_Date from  dise_aprvl where tran_id='${Tran_id}'`
      );
      const empname =
        await sequelize.query(`SELECT mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode=(select empcode from user_tbl where user_name = '${findall[0][0].SRM}' and module_code = 10 and export_type = 1 )`);
      const approver =
        await sequelize.query(`SELECT  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode='${findall[0][0].aprvl_by}'`);
      const approva2 =
        await sequelize.query(`SELECT mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode='${findall[0][0].aprvl_by2}'`);

      const Model = await sequelize.query(
        `select Misc_Name from Misc_mst where Misc_type=14 AND Misc_Code=${findall[0][0].Modl_group}`
      );
      const comapny = await sequelize.query(`select comp_name from comp_mst `);

      //       const message1 = `
      // Dear ${empname[0][0].EMPNAME},

      // Your Discount Approval Request For New Car Customer ${findall[0][0].Cust_Name} Mobile No ${findall[0][0].Mob} For Car Model ${Model[0][0].Misc_Name} Has Been Approved By The Approver  ${approver[0][0].EMPNAME} And Has Been Forwarded to Level 2  Approval . Approved Amt is ${findall[0][0].Approved_amt} Against The Requested Amount ${findall[0][0].Dise_Amt} With Remark ${findall[0][0].Remark}

      //       Regards
      //       ${approver[0][0].EMPNAME}
      //       ${comapny[0][0].comp_name}

      //       Thank you!
      //       {AUTOVYN-ERP}
      //           `;
      //       sendmsg(empname[0][0].mobileno, message1);

      if (dual_aprvl[0][0].DUAL_APRVL_MSG) {
        //         const message = `
        // Dear Sir/Mam,
        // This is to bring to your attention that Mr. ${
        //           empname[0][0].EMPNAME
        //         } (DSE)(Mobile- ${
        //           empname[0][0].mobileno
        //         }) Requested For Discount Of Rs ${
        //           findall[0][0].Dise_Amt
        //         } On Behalf Of New  Car Customer ${
        //           findall[0][0].Cust_Name
        //         } Mobile No ${findall[0][0].Mob} For Car Model ${
        //           Model[0][0].Misc_Name
        //         }. Please The Customer Request Provided At The
        //   http://cloud.autovyn.com:3000/disc5?a=${btoa(
        //     findall[0][0].Curr_Date
        //   )}&c=${btoa(result2[0][0].location)}&b=${btoa(dir_id)}&d=${btoa(
        //           findall[0][0].aprvl_by2
        //         )}
        // Regards
        // ${empname[0][0].EMPNAME}
        // ${comapny[0][0].comp_name}
        // Thank you!
        // {AUTOVYN-ERP}
        //           `;
        // Adding a delay of 2 seconds before sending OTP to approva2[0][0].mobileno
        // setTimeout(function () {
        //   sendmsg(approva2[0][0].mobileno, message);
        // }, 5000);
      }
    } else {
      const result2 = await sequelize.query(
        ` select SRM,aprvl_by2,location,status from dise_aprvl where tran_id='${Tran_id}'`
      );

      await sequelize.query(
        `update dise_aprvl set Remark='${remark2}',Approved_amt=${amount2},Status='${status}',isapp1='1',apr2_apr ='${status}'  where tran_id='${Tran_id}' `
      );

      res.status(200).json("successfull");
      const result3 = await sequelize.query(
        ` select status,aprvl_by2 from dise_aprvl where tran_id='${Tran_id}'`
      );

      const findall = await sequelize.query(
        `select SRM,Cust_Name,Mob,Modl_group,aprvl_by,aprvl_by2,Dise_Amt,Approved_amt,Remark,Curr_Date from  dise_aprvl where tran_id='${Tran_id}'`
      );
      const empname =
        await sequelize.query(`SELECT mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode=(select empcode from user_tbl where user_name = '${findall[0][0].SRM}' and module_code = 10 and export_type = 1 )`);
      const approver =
        await sequelize.query(`SELECT  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode='${findall[0][0].aprvl_by}'`);
      const approva2 =
        await sequelize.query(`SELECT mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode='${findall[0][0].aprvl_by2}'`);

      const Model = await sequelize.query(
        `select Misc_Name from Misc_mst where Misc_type=14 AND Misc_Code=${findall[0][0].Modl_group}`
      );
      const comapny = await sequelize.query(`select comp_name from comp_mst `);

      //       const message1 = `
      // Dear ${empname[0][0].EMPNAME},

      // Your Discount Approval Request For New Car Customer ${findall[0][0].Cust_Name} Mobile No ${findall[0][0].Mob} For Car Model ${Model[0][0].Misc_Name} Has Been Approved By The Approver  ${approver[0][0].EMPNAME}  Approved Amt is ${findall[0][0].Approved_amt} Against The Requested Amount ${findall[0][0].Dise_Amt} With Remark ${findall[0][0].Remark}

      //       Regards
      //       ${approver[0][0].EMPNAME}
      //       ${comapny[0][0].comp_name}

      //       Thank you!
      //       {AUTOVYN-ERP}
      //           `;

      //       sendmsg(empname[0][0].mobileno, message1);
    }
  } catch (e) {
    console.log(e);
  }
};
exports.disc5 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select godw_name as name , godw_code as value  from godown_mst where godw_code in (${req.body.multi_loc}) and export_type<3 order by godw_code`
    );
    res.status(200).send({
      branch: branch[0],
      location: req.body.multi_loc,
    });
  } catch (e) {
    res.status(500).send({ Message: "Internal server error" });
    console.log(e);
  }
};
exports.disc8 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select godw_name as name , godw_code as value  from godown_mst where godw_code in (${req.body.multi_loc}) and export_type<3 order by godw_code`
    );
    res.status(200).send({
      branch: branch[0],
      location: req.body.multi_loc,
    });
  } catch (e) {
    console.log(e);
  }
};
exports.viewdiscountapproaldataforapr1 = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.multi_loc;
    const sequelize = await dbname(req.headers.compcode);

    var query = `SELECT
              (SELECT TOP 1 trans_date FROM GDFDI_ORDBK WHERE GDFDI_ORDBK.utd = da.utd) AS book_date,
              (SELECT TOP 1 godw_name FROM GODOWN_MST WHERE Godw_Code=da.location) AS godw_name,
              (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_type=14 AND export_type < 3 AND misc_code=da.modl_group) AS Modl_Group_Name,
              (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_type=10 AND export_type < 3 AND misc_code=da.Veh_Clr AND Misc_Name<>'') AS Veh_Clr_Name,
              (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_type=18 AND misc_code=da.Loan) AS Loan_Name,
              (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM employeemaster WHERE empcode IN (da.SRM)) AS empname,
              (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM employeemaster WHERE EMPCODE= da.Aprvl_By) AS Reporting1_Name,
              (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM employeemaster WHERE EMPCODE=da.aprvl_by2) AS Reporting2_Name,
              (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE item_code=da.Modl_Var) AS modl_name,
            am.approver1_A,
              am.approver1_B,
            am.module_code,
              *
          FROM 
          dise_aprvl da
          JOIN 
              Approval_Matrix am ON da.srm =am.empcode`;
    if (
      req.body.status == "1" ||
      req.body.status == "2" ||
      req.body.status == "9"
    )
      query += ` WHERE da.location in  (${loc_code ? loc_code : req.body.multi_loc
        }) and  da.Curr_Date between '${dateFrom}' AND '${dateto}' and da.status = '${req.body.status
        }' 
      and am.module_code='discount' 
       AND (am.approver1_A =(select top 1 empcode from User_Tbl where user_name='${req.body.username
        }' and export_type<3 and module_code=10) 
       or  am.approver1_B =(select top 1 empcode from User_Tbl where user_name='${req.body.username
        }' and export_type<3 and module_code=10))`;
    else
      query += ` WHERE da.location in  (${loc_code ? loc_code : req.body.multi_loc
        })
       and da.Curr_Date between '${dateFrom}' AND '${dateto}' and (da.status = 0 or da.status is null ) 
       and am.module_code='discount' 
       AND (am.approver1_A =(select top 1 empcode from User_Tbl where user_name='${req.body.username
        }' and module_code=10 and export_type<3) 
       or  am.approver1_B =(select top 1 empcode from User_Tbl where user_name='${req.body.username
        }' and module_code=10 and export_type<3));`;

    console.log(query);
    const branch = await sequelize.query(query);

    const criteria = await sequelize.query(`select * from Dise_Criteria`);
    res.status(200).send({
      data: branch[0],
      criteria: criteria[0],
    });
  } catch (e) {
    console.log(e);
  }
};

exports.reapperovalby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const remark = req.body.remark;

    const tran_id = req.body.data;

    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update dise_aprvl set apr2_apr=9,aprvl_by2=(select top 1 empcode from user_tbl where user_name='${req.body.username}' and module_code=10 and export_type<3),export_type=9,reapp_remark='${remark}',status=9,reapp_emp=aprvl_by2 where tran_id=${tran_id[i]}`
      );
      const findall = await sequelize.query(
        `select SRM,Cust_Name,Mob,Modl_group,aprvl_by2,Dise_Amt,Approved_amt,Remark from  dise_aprvl where tran_id=${tran_id[i]}`
      );

      const empname =
        await sequelize.query(`SELECT mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode=(select top 1 empcode from user_tbl where user_name = '${findall[0][0].SRM}' and module_code = 10 and export_type = 1)`);

      const approver =
        await sequelize.query(`SELECT  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME
      FROM employeemaster where empcode='${findall[0][0].aprvl_by2}'`);

      if (!approver[0].length) {
        return res
          .status(200)
          .json(
            "successfully rejected But msg not sent to TL process stop due to reporting hierarchy is not available"
          );
      }

      const Model = await sequelize.query(
        `select Misc_Name from Misc_mst where Misc_type=14 AND Misc_Code=${findall[0][0].Modl_group}`
      );
      const comapny = await sequelize.query(`select comp_name from comp_mst `);

      //       const message = `
      // Dear ${empname[0][0].EMPNAME},

      // Your Discount Approval Request For New Car Customer ${findall[0][0].Cust_Name} Mobile No. ${findall[0][0].Mob} For Car Model ${Model[0][0].Misc_Name} Has Been Send For Reapproval By Approver ${approver[0][0].EMPNAME}. With Remark ${findall[0][0].Remark}.

      // Regards

      // ${approver[0][0].EMPNAME}
      // ${comapny[0][0].comp_name}

      // Thank you!
      // {AUTOVYN-ERP}
      //           `;
      //       console.log(message);

      //       sendmsg(empname[0][0].mobileno, message);
    }
    res.status(200).json("successfully");
  } catch (e) {
    console.log(e);
  }
};
exports.updatediscountamountonly = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.tran_id;
    const amt = req.body.amt;
    await sequelize.query(
      `update dise_aprvl set Approved_amt='${amt}' where tran_id='${tran_id}' `
    );

    res.status(200).send("done");
  } catch (e) {
    console.log(e);
  }
};
//complete
exports.viewgdapproaldata = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const sequelize = await dbname(req.headers.compcode);

    const emp_dms_code = await sequelize.query(
      `select emp_dms_code from  user_tbl where User_Name='${req.body.username}' and export_type<3 and module_code=10 `
    );

    let result;
    if (emp_dms_code[0][0].emp_dms_code == 'EDP') {
      result = await sequelize.query(`select * from ( SELECT GDFDI_ORDBK.UTD, Trans_ID, Trans_Date, Trans_Ref_Date, GDFDI_ORDBK.Variant_CD, GDFDI_ORDBK.ECOLOR_CD, GDFDI_ORDBK.Cust_Name, Team_Head, Loc_Cd,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE GDFDI_ORDBK.loc_cd collate database_default = REPLACE(godown_mst.newcar_rcpt ,'-S','') collate database_default and  godown_mst.export_type<=3) AS Godown_Code,   
      (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GDFDI_ORDBK.loc_cd collate database_default = godown_mst.newcar_rcpt collate database_default and godown_mst.export_type<=3) AS godw_name,
      (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD collate database_default = Modl_Code collate database_default) AS Modl_Name, 
      (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD collate database_default = Modl_Code collate database_default) AS item_code,   
      (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD collate database_default = Modl_Code collate database_default) AS Modl_Grp,   
      CASE WHEN MONTH(trans_date) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND YEAR(trans_date) = YEAR(DATEADD(MONTH, -1, GETDATE())) 
			and TRANS_ID not in (select TRANS_REF_NUM from GDFDI_ORDBK gda where TRANS_TYPE='vs' and gda.LOC_CD=GDFDI_ORDBK.LOC_CD) THEN 'Old' ELSE null END AS Transaction_Status,
      dise_aprvl.is_gd  AS isgd,
      dise_aprvl.Appr_1_Stat  AS status1, 
      dise_aprvl.Appr_2_Stat  AS status2, 
      dise_aprvl.reapp_emp AS reapp_emp, 
      dise_aprvl.Approved_amt AS Approved_amt, 
      dise_aprvl.Dise_Amt AS Dise_Amt, 
      dise_aprvl.Appr_1_Rem AS Appr_1_Rem, 
      dise_aprvl.Appr_2_Rem AS Appr_2_Rem, 
      dise_aprvl.fin_appr  AS final, 
      (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD collate database_default = misc_abbr collate database_default AND misc_type = 10) AS Color
	  FROM GDFDI_ORDBK 
	  Left join dise_aprvl on dise_aprvl.UTD=GDFDI_ORDBK.UTD  and dise_aprvl.export_type<3
	  WHERE TRANS_TYPE = 'ORDBK'    
      AND cast(TRANS_DATE as date) BETWEEN '${dateFrom}' AND '${dateto}'  and TRANS_ID not in 
	  (select trans_id from GDFDI_ORDBK gda where gda.TRANS_ID=GDFDI_ORDBK.TRANS_ID and gda.LOC_CD collate database_default =GDFDI_ORDBK.LOC_CD collate database_default and gda.TRANS_TYPE='ordbc')
	   And loc_cd collate database_default in (select Replace(newcar_rcpt,'-S','') collate database_default from godown_mst where godw_code in (${loc_code})) ) as ab where Godown_Code in (${loc_code})`)
    } else {
      result =
        await sequelize.query(`select * from ( SELECT      GDFDI_ORDBK.UTD,     Trans_ID,     Trans_Date,     Trans_Ref_Date,     GDFDI_ORDBK.Variant_CD,     GDFDI_ORDBK.ECOLOR_CD,     GDFDI_ORDBK.Cust_Name,     Team_Head,     Loc_Cd,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE GDFDI_ORDBK.loc_cd collate database_default =REPLACE(godown_mst.newcar_rcpt ,'-S','') collate database_default and  godown_mst.export_type<=3) AS Godown_Code,   
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GDFDI_ORDBK.loc_cd collate database_default = godown_mst.newcar_rcpt collate database_default and godown_mst.export_type<=3) AS godw_name,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD collate database_default = Modl_Code collate database_default) AS Modl_Name, 
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD collate database_default = Modl_Code collate database_default) AS item_code,   
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD collate database_default = Modl_Code collate database_default) AS Modl_Grp,
                   CASE WHEN MONTH(trans_date) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND YEAR(trans_date) = YEAR(DATEADD(MONTH, -1, GETDATE())) 
			and TRANS_ID not in (select TRANS_REF_NUM from GDFDI_ORDBK gda where TRANS_TYPE='vs' and gda.LOC_CD=GDFDI_ORDBK.LOC_CD) THEN 'Old' ELSE null END AS Transaction_Status, 
                   dise_aprvl.tran_id AS tran_id,  
                     dise_aprvl.Approved_amt  AS Approved_amt, 
                     dise_aprvl.Dise_Amt AS Dise_Amt, 
                   dise_aprvl.is_gd  AS isgd,
                   dise_aprvl.Appr_1_Stat  AS status1,    
                   dise_aprvl.Appr_2_Stat  AS status2,  
                   dise_aprvl.Appr_3_Stat  AS status3,  
                   dise_aprvl.Appr_1_Rem  AS Appr_1_Rem, 
                    dise_aprvl.Appr_2_Rem AS Appr_2_Rem, 
                   dise_aprvl.reapp_remark  AS isReapproval,
                     dise_aprvl.fin_appr  AS final, 
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD collate database_default = misc_abbr collate database_default AND misc_type = 10) AS Color 
		FROM GDFDI_ORDBK 
		Left join dise_aprvl on dise_aprvl.UTD=GDFDI_ORDBK.UTD  and dise_aprvl.export_type<3
		WHERE TRANS_TYPE = 'ORDBK'  AND cast(TRANS_DATE as date) BETWEEN '${dateFrom}' AND '${dateto}' and TRANS_ID not in (select trans_id from GDFDI_ORDBK gda 
		where gda.TRANS_ID=GDFDI_ORDBK.TRANS_ID and gda.LOC_CD collate database_default = GDFDI_ORDBK.LOC_CD collate database_default and gda.TRANS_TYPE='ordbc')   And LEFT(Team_head, CHARINDEX(' - ', Team_head) - 1) in( ${emp_dms_code[0][0].emp_dms_code}) ) as ab where Godown_Code in (${loc_code}) order by Trans_Date desc`);
    }
    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.viewdiscountaccount = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.multi_loc;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
select * from (
    select
          (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
              (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
              (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
              (select top 1 EMPCODE  FROM employeemaster where empcode collate database_default in ( SRM collate database_default ))as emp_code,
              (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,
              (SELECT TOP 1 
                LTRIM(SUBSTRING(EXECUTIVE, CHARINDEX(' - ', EXECUTIVE) + 3, LEN(EXECUTIVE)))
              FROM GDFDI_ORDBK 
              WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS RM_Name,
 (SELECT TOP 1 
               CUST_ID
              FROM GDFDI_ORDBK 
              WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS [customer Id],
              (SELECT TOP 1 
                LTRIM(SUBSTRING(TEAM_HEAD, CHARINDEX(' - ', TEAM_HEAD) + 3, LEN(TEAM_HEAD)))
              FROM GDFDI_ORDBK 
              WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS SRM_Name,
              (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
              * from dise_aprvl where Curr_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) and export_type<3
              ) as dasd where fin_appr=1 order by Curr_Date
                `;
    const result = await sequelize.query(query)
    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.checked = async function (req, res) {
  console.log(req.body, "skdfkmld")
  try {
    const tran_id = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`update dise_aprvl set checked='Yes',checked_by='${Appr_Code}',accountsremark='${req.body.Remark}' where tran_id in (${tran_id})`)
    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.uploadeddocument = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const SRNo = req.body.SRNo;
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        res.status(200).send(EMP_DOCS_data[0].path);
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};
//complete
exports.disc7 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select Godw_Name as label,Godw_Code as value from GODOWN_MST where export_type<3`
    );
    const model_group = await sequelize.query(
      `select Misc_Name as label,Misc_Code as value from Misc_mst where Misc_type=14`
    );
    const color = await sequelize.query(
      `select Misc_Name as label,Misc_Code  as value from Misc_mst where Misc_type=10`
    );
    const Financer = await sequelize.query(
      `select Misc_Name as label,Misc_Name  as value from Misc_mst where Misc_type=8`
    );
    const Insurance = await sequelize.query(
      `select MAX( CUST_NAME) as value,MAX( CUST_NAME) as label from Gd_fdi_trans where trans_type='wi' and GE10='INS' group by LEFT( cust_name,5)
order by value`
    );
    const Loantype = await sequelize.query(
      `select Misc_Name as label,Misc_Code as value from Misc_mst where Misc_type=18`
    );
    const emp = await sequelize.query(
      `SELECT EMPCODE as value,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS label   FROM EMPLOYEEMASTER`
    );
    const emp1 =
      await sequelize.query(`SELECT EMPCODE as value,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS label,Reporting_1,Reporting_2
    FROM EMPLOYEEMASTER Where EMPCode  = (select top 1 empcode from user_tbl where user_name='${req.body.username}' and export_type<3 and module_code=10);`);

    res.status(200).send({
      branch: branch[0],
      model_group: model_group[0],
      color: color[0],
      Loantype: Loantype[0],
      emp: emp[0],
      emp1: emp1[0],
      Financer: Financer[0],
      Insurance: Insurance[0]
    });
  } catch (e) {
    console.log(e);
  }
};
//complete
exports.findgdfdidata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    const result =
      await sequelize.query(`SELECT 
    GDFDI_ORDBK.UTD,
    GDFDI_ORDBK.Trans_ID,
    GDFDI_ORDBK.Trans_Date,
    GDFDI_ORDBK.Trans_Ref_Date,
    GDFDI_ORDBK.Variant_CD,
    GDFDI_ORDBK.Cust_Name,
    GDFDI_ORDBK.GE1,
    gd_fdi_trans_customer.mobile2 AS MOBILE2,
    gd_fdi_trans_customer.PAN_NO,
    godown_mst.godw_code AS Godown_Code,
    Modl_Mst.item_code AS Modl_Var,
    Modl_Mst.Modl_Grp,
    misc_mst.Misc_code AS Color
FROM 
    GDFDI_ORDBK
LEFT JOIN 
    gd_fdi_trans_customer 
    ON gd_fdi_trans_customer.UTD = GDFDI_ORDBK.UTD
LEFT JOIN 
    godown_mst 
    ON GDFDI_ORDBK.loc_cd COLLATE database_default = 
       REPLACE(godown_mst.newcar_rcpt, '-S', '') COLLATE database_default
       AND godown_mst.export_type <= 3
LEFT JOIN 
    Modl_Mst 
    ON GDFDI_ORDBK.Variant_CD COLLATE database_default = Modl_Mst.Modl_Code COLLATE database_default
LEFT JOIN 
    misc_mst 
    ON GDFDI_ORDBK.ECOLOR_CD COLLATE database_default = misc_mst.misc_abbr COLLATE database_default
       AND misc_mst.misc_type = 10
WHERE 
    GDFDI_ORDBK.UTD = '${UTD}';

`);
    res.status(200).send({ booking: result[0][0], dise: null });
  } catch (e) {
    console.log(e);
  }
};
//complete
exports.gdapprover = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select Godw_Name,Godw_Code from GODOWN_MST where Godw_Code in (${req.body.multi_loc}) and export_type<3`
    );
    res.status(200).send({ branch: branch[0] });
  } catch (e) {
    console.log(e);
  }
};
//// accroding to  Approval matrix
exports.viewdiscountapproaldata = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query
    if (req.headers.compcode === 'vapl-24') {
      query = `
      MERGE ORDBC AS target
   USING (SELECT
              Trans_Id,LOC_CD from GDFDI_ORDBK where Trans_Type='ORDBC'
 
          ) AS source
   ON (target.Trans_Id = source.Trans_Id
       AND target.LOC_CD = source.LOC_CD
       )
   WHEN NOT MATCHED THEN
       INSERT (Trans_Id,LOC_CD)
       VALUES (source.Trans_Id, source.LOC_CD);
 select * from (
     select
     iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode = 
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
              IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
           (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
               (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
               (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
               (select top 1 EMPCODE  FROM employeemaster where empcode collate database_default in ( SRM collate database_default ))as emp_code,
               (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,
                 (SELECT 1 FROM ORDBC S WHERE S.TRANS_ID = dise_aprvl.booking_id AND S.LOC_CD = (
                  SELECT TOP 1 REPLACE(newcar_rcpt, '-S', '')  FROM Godown_Mst  WHERE Godw_Code = dise_aprvl.location )) AS is_cancelled,
               (SELECT TOP 1 
                 LTRIM(SUBSTRING(EXECUTIVE, CHARINDEX(' - ', EXECUTIVE) + 3, LEN(EXECUTIVE)))
               FROM GDFDI_ORDBK 
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS RM_Name,
               (SELECT TOP 1 
                 LTRIM(SUBSTRING(TEAM_HEAD, CHARINDEX(' - ', TEAM_HEAD) + 3, LEN(TEAM_HEAD)))
               FROM GDFDI_ORDBK 
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS SRM_Name,
               (SELECT TOP 1
                TAXABLE_VALUE
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS Booking_amount,
               (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
               * from dise_aprvl where Curr_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) and export_type<3
               and srm in  (select empcode from approval_matrix where 
                 '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
               ) as dasd 
             
                 `;

    } else {
      query = `
 select * from (
     select
     iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode = 
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
              IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
           (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
               (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
               (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
               (select top 1 EMPCODE  FROM employeemaster where empcode collate database_default in ( SRM collate database_default ))as emp_code,
               (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,
               (SELECT TOP 1 
                 LTRIM(SUBSTRING(EXECUTIVE, CHARINDEX(' - ', EXECUTIVE) + 3, LEN(EXECUTIVE)))
               FROM GDFDI_ORDBK 
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS RM_Name,
               (SELECT TOP 1 
                 LTRIM(SUBSTRING(TEAM_HEAD, CHARINDEX(' - ', TEAM_HEAD) + 3, LEN(TEAM_HEAD)))
               FROM GDFDI_ORDBK 
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS SRM_Name,
               (SELECT TOP 1
                TAXABLE_VALUE
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS Booking_amount,
               (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
               * from dise_aprvl where Curr_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) and export_type<3
               and srm in  (select empcode from approval_matrix where 
                 '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
               ) as dasd 
             
                 `;
    }


    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null) order by Curr_Date`
    } else {
      query += `where  status_khud_ka =${req.body.status}  order by Curr_Date`

    }

    const branch = await sequelize.query(query);
    const criteria = await sequelize.query(`select * from Dise_Criteria`);
    res.status(200).send({
      branch: branch[0],
      criteria: criteria[0],
    });
  } catch (e) {
    console.log(e);
  }
};
exports.viewold = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const sequelize = await dbname(req.headers.compcode);
    let query = ` select
    (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
        (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,  
        (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
        (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
        (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
        (select top 1 EMPCODE  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as emp_code,
        (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,   
        (select top 1 EXECUTIVE FROM GDFDI_ORDBK where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as RM_Name,
        (select top 1 TEAM_HEAD FROM GDFDI_ORDBK where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as SRM_Name,
        (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
        * from dise_aprvl  where utd='${UTD}' and export_type=9 order by tran_id desc`;
    const branch = await sequelize.query(query);

    res.status(200).send(branch[0][0]);
  } catch (e) {
    console.log(e);
  }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const processMainData = async (compcodePassed, mainData, sequelize, Appr_Code, Remark) => {
  // const t = await sequelize.transaction();
  const backgroundTasks = [];

  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(`SELECT TOP 1 comp_name FROM comp_mst`);
    const comp_name = comp_name_result[0][0]?.comp_name;

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;

      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'discount'`,
        {
          replacements: { empcode }
          // , transaction: t
        }
      );

      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;
        let Final_apprvl = null;

        if ([approvers.approver1_A?.toLowerCase(), approvers.approver1_B?.toLowerCase()].includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 1;
        } else if ([approvers.approver2_A?.toLowerCase(), approvers.approver2_B?.toLowerCase()].includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 2;
        } else if ([approvers.approver3_A?.toLowerCase(), approvers.approver3_B?.toLowerCase()].includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          throw new Error("You are not the right person to approve this");
        }

        if ((ApprovalLevel === 1 && !approvers.approver2_A && !approvers.approver2_B && !approvers.approver2_C) ||
          (ApprovalLevel === 2 && !approvers.approver3_A && !approvers.approver3_B && !approvers.approver3_C)) {
          Final_apprvl = 1;
        }

        const data = {
          Appr_Code,
          Remark,
          Final_apprvl
        };

        let query = "";
        let query2 = null;

        if (ApprovalLevel === 1) {
          query2 = `
            UPDATE dise_aprvl
            SET Approved_amt = Dise_Amt
            WHERE Approved_amt IS NULL AND Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
          query = `
            UPDATE dise_aprvl
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                appr_1_date=GETDATE(),
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE dise_aprvl
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE dise_aprvl
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }

        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM dise_aprvl WHERE Tran_id = :tran_id`,
          {
            replacements: { tran_id }
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          if (query2) {
            await sequelize.query(query2, {
              replacements: { ...data, tran_id }
              // , transaction: t 
            }
            );
          }
          await sequelize.query(query, {
            replacements: { ...data, tran_id }
            // , transaction: t 
          });
        }

        // Prepare message sending tasks for background execution
        if (ApprovalLevel === 1) {
          const result = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
          backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, result[0][0]?.mobileno, 'approver_1_approve_message', [
            { "type": "text", "text": item?.rowData.SRM_Name },
            { "type": "text", "text": item?.rowData?.Cust_Name },
            { "type": "text", "text": item?.rowData?.Mob },
            { "type": "text", "text": item?.rowData?.modl_name },
            { "type": "text", "text": item?.rowData?.apr1_name },
            { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
            { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
            { "type": "text", "text": Remark ? Remark : '(Not Given)' },
            { "type": "text", "text": item?.rowData?.apr1_name },
            { "type": "text", "text": comp_name }
          ]));

          if (!Final_apprvl) {
            const approver2 = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
            const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
            if (approver2[0]?.length && approver2[0][0].mobileno) {
              backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, approver2[0][0].mobileno, 'disc_appr_msg_l2_new1', [
                { "type": "text", "text": outlet_name[0][0].br_extranet },
                { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
                { "type": "text", "text": item?.rowData?.Cust_Name },
                { "type": "text", "text": item?.rowData?.Dise_Amt },
                { "type": "text", "text": item?.rowData?.Approved_amt },
                { "type": "text", "text": item?.rowData?.RM_Name },
                { "type": "text", "text": item?.rowData?.book_date },
                { "type": "text", "text": comp_name }
              ]));
            }
          }
        } else if (ApprovalLevel === 2) {
          const mobile_emp = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
            backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_reject_message', [
              { "type": "text", "text": item?.rowData?.SRM_Name },
              { "type": "text", "text": item?.rowData?.Cust_Name },
              { "type": "text", "text": item?.rowData?.Mob },
              { "type": "text", "text": item?.rowData?.modl_name },
              { "type": "text", "text": item?.rowData?.apr2_name },
              { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
              { "type": "text", "text": item?.rowData?.Dise_Amt },
              { "type": "text", "text": Remark ? Remark : '(Not Given)' },
              { "type": "text", "text": item?.rowData?.apr2_name },
              { "type": "text", "text": comp_name }
            ]));
          }
        }

        console.log({
          success: true,
          Message: affectedRows.length === 0 ? "Cannot Approve" : `Approved on level ${ApprovalLevel}`
        });
      }
    }
    // await t.commit();
    // Respond to the caller immediately
    return {
      success: true,
      message: 'Main data processing initiated'
    };
  } catch (e) {
    console.error(e);
    //p
    throw e;
  }
  finally {
    setTimeout(async () => {
      try {
        for (const task of backgroundTasks) {
          await task();
          await delay(2000);
          // Execute each function in backgroundTasks
        }
      } catch (err) {
        console.error('Error executing background tasks:', err);
      }
    }, 1000);

  }
};

exports.approveby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory"
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to approve"
      });
    }

    await processMainData(req.headers.compcode, mainData, sequelize, Appr_Code, Remark);

    return res.status(200).send({ success: true, Message: "Approved Successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};

exports.rejectby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;

    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to reject",
      });
    }

    await processMainData1(req.headers.compcode, mainData, sequelize, Appr_Code, Remark);

    return res.status(200).send({ success: true, Message: "Request Rejected Successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};
async function processMainData1(compcodePassed, mainData, sequelize, Appr_Code, Remark) {
  // const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'discount'`,
        {
          replacements: { empcode }

          // , transaction: t 
        }
      );

      const mobile_emp = await sequelize.query(`select top 1 mobileno from employeemaster where empcode='${item?.rowData.SRM}'`)
      const comp_name = await sequelize.query(`select top 1 comp_name from comp_mst`)


      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;

        if ([approvers.approver1_A?.toLowerCase(), approvers.approver1_B?.toLowerCase()].map(approver => approver?.toLowerCase()).includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 1;
        } else if ([approvers.approver2_A, approvers.approver2_B].map(approver => approver?.toLowerCase()).includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 2;
        } else if ([approvers.approver3_A, approvers.approver3_B].map(approver => approver?.toLowerCase()).includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE dise_aprvl
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
            await SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_1_2_reject_messaage', [
              {
                "type": "text",
                "text": item?.rowData.empname
              },
              {
                "type": "text",
                "text": item?.rowData?.Cust_Name
              },
              {
                "type": "text",
                "text": item?.rowData?.Mob
              },
              {
                "type": "text",
                "text": item?.rowData?.modl_name
              },
              {
                "type": "text",
                "text": item?.rowData?.apr1_name
              },
              {
                "type": "text",
                "text": item?.rowData?.Appr_1_Rem ? item?.rowData?.Appr_1_Rem : '(Not Given)'
              },
              {
                "type": "text",
                "text": item?.rowData?.apr1_name
              },
              {
                "type": "text",
                "text": comp_name[0][0].comp_name
              }
            ])
          }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE dise_aprvl
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
            await SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_1_2_reject_messaage', [
              {
                "type": "text",
                "text": item?.rowData.empname
              },
              {
                "type": "text",
                "text": item?.rowData?.Cust_Name
              },
              {
                "type": "text",
                "text": item?.rowData?.Mob
              },
              {
                "type": "text",
                "text": item?.rowData?.modl_name
              },
              {
                "type": "text",
                "text": item?.rowData?.apr2_name
              },
              {
                "type": "text",
                "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
              },
              {
                "type": "text",
                "text": item?.rowData?.apr2_name
              },
              {
                "type": "text",
                "text": comp_name[0][0].comp_name
              }
            ])
          }

        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE dise_aprvl
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM dise_aprvl WHERE Tran_id = :tran_id;`,
          {
            replacements: { tran_id }
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id }

          });
        }

        console.log({
          success: true,
          Message: affectedRows.length === 0 ? "Cannot Reject" : `Rejected on level ${ApprovalLevel}`
        });
      }
    }

    // await t.commit();
  } catch (e) {
    console.error(e);
    // await t.rollback();
    throw e;
  }
}
exports.findone = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body, "sksks");
    const tran_id = req.body.tran_id;
    const branch = req.body.branch;
    const result = await sequelize.query(
      `select * from dise_aprvl where utd=${tran_id} and location='${branch}' and export_type<3`
    );

    res.status(200).send(result[0][0]);
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
exports.reapproval = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    // const t = await sequelize.transaction();
    const {
      Mob,
      Pan_No,
      Cust_Name,
      Modl_Var,
      Veh_Clr,
      Loan,
      MGA_Amt,
      Insurance,
      RTO_Chrg,
      Loyalty_Card,
      Car_Exch,
      FastTeg,
      SRM,
      Corporate,
      Exch,
      Dise_Amt,
      Curr_Date,
      location,
      modl_group,
      tran_id,
      remark_dse,
      booking_id,
      UTD,
      CCP,
      EW,
      Fuel_Type,
      Var_Cd,
      waiting,
      reapp_remark,
      reapp_emp,
      Consumer,
      Vehicle_Ageing,
      Approval_Type,
      Customer_Type,
      registration,
      Vas,
      Cartel,
      Buffer,
      discount,
      MGA,
      Exchange_Support,
      Stock_booking,
      mssfoffer
    } = req.body;
    const Delv_Date = req.body.Delv_Date ? `'${req.body.Delv_Date}'` : null;
    const document = req.body.document ? `'${req.body.document}'` : null;


    const Loan_Amount = req.body.Loan_Amount ? req.body.Loan_Amount : null;
    const Bank_Name = req.body.Bank_Name ? `'${req.body.Bank_Name}'` : null;
    const Preferred_Insurance = req.body.Preferred_Insurance ? `'${req.body.Preferred_Insurance}'` : null;
    const Insurance_Company = req.body.Insurance_Company ? `'${req.body.Insurance_Company}'` : null;
    const Oldvalue = req.body.Oldvalue ? req.body.Oldvalue : null;


    let result;
    if (tran_id) {
      await sequelize.query(
        `update dise_aprvl set export_type=9 where tran_id=${tran_id} and export_type<3`
        // { transaction: t }
      );
      result = await sequelize.query(
        `select * from  dise_aprvl  where tran_id=${tran_id} and export_type<3`
        // { transaction: t }
      );
    }
    const Gd_loc = await sequelize.query(`select Loc_cd from GDFDI_ORDBK where utd=${UTD}`)
    await sequelize.query(
      `Insert into dise_aprvl 
      (Mob,	Pan_No,	Cust_Name,Modl_Var,	Veh_Clr,
      Delv_Date,	Loan,	MGA_Amt,	Insurance,	RTO_Chrg,	
      EW,CCP,Fuel_type,Var_Cd,	Loyalty_Card,	Car_Exch,	
      FastTeg,	SRM,	RM,	Consumer,	Corporate,Exch,
      Aprvl_Offer,	Dise_Amt,			Curr_Date,	location,dual_apr,
      modl_group,		wa_link,		export_type,	remark_dse,UTD,
      booking_id,is_gd,status,waiting,reapp_remark,
      reapp_emp,Gd_loc,Vehicle_Ageing,Approval_Type,Customer_Type,
      registration,Vas,Cartel,Buffer,discount,MGA
      ,Exchange_Support,Stock_booking,mssfoffer,document,
      Loan_Amount,Bank_Name,Preferred_Insurance,Insurance_Company,Oldvalue
      ) 
  values
  ('${Mob}','${Pan_No}'  ,'${Cust_Name}' ,'${Modl_Var}' ,'${Veh_Clr}'
   ,${Delv_Date} ,'${Loan}' , '${MGA_Amt}' ,'${Insurance}' ,'${RTO_Chrg}' 
   ,'${EW}' ,'${CCP}','${Fuel_Type}','${Var_Cd}','${Loyalty_Card}' ,
   '${Car_Exch}' ,'${FastTeg}' ,'${reapp_emp}' ,${"0"} ,'${Consumer}' ,
   ${Corporate} ,'${Exch}' ,'${0}' ,'${Dise_Amt}'  ,'${Curr_Date}' ,
   '${location}' ,  '${0}' ,'${modl_group}' ,'${"0"}' ,'${1}' ,
   '${remark_dse}' ,${UTD},'${booking_id}','Yes' ,'0',${waiting},
   '${reapp_remark}','${reapp_emp}','${Gd_loc[0][0].Loc_cd}','${Vehicle_Ageing}','${Approval_Type}',
   '${Customer_Type}','${registration}','${Vas}',${Cartel ? Cartel : null},
    ${Buffer ? Buffer : null},${discount ? discount : null},${MGA ? MGA : null},${Exchange_Support ? Exchange_Support : null},
    '${Stock_booking}',${mssfoffer ? mssfoffer : null},${document},
    ${Loan_Amount},${Bank_Name},${Preferred_Insurance},${Insurance_Company},${Oldvalue})`
      // { transaction: t }
    );
    // await t.commit();

    return res
      .status(200)
      .send({ success: true, Message: "done Successfully" });
  } catch (e) {
    console.log(e);
    // await t.rollback();
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
exports.recentviewdiscountapproaldata = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query
    if (req.headers.compcode === 'vapl-24') {
      query = `
        select * from (select
     iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
            IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
            IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
            IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
              IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
              IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
              IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
			   	(select top 1  delv_date  from icm_mst where ICM_MST.DMS_Inv=(select top 1 TRANS_ID from GDFDI_ORDBK where trans_type='vs' and TRANS_REF_NUM=booking_id and LOC_CD=Gd_loc and dise_aprvl.export_type<3)and export_type<3)as bill_no,
		   (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
               (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
               (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
               (select top 1 EMPCODE  FROM employeemaster where empcode collate database_default in ( SRM collate database_default ))as emp_code,
               (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,
                 (SELECT 1 FROM ORDBC S WHERE S.TRANS_ID = dise_aprvl.booking_id AND S.LOC_CD = (
                  SELECT TOP 1 REPLACE(newcar_rcpt, '-S', '')  FROM Godown_Mst  WHERE Godw_Code = dise_aprvl.location )) AS is_cancelled,
               (SELECT TOP 1
                 LTRIM(SUBSTRING(EXECUTIVE, CHARINDEX(' - ', EXECUTIVE) + 3, LEN(EXECUTIVE)))
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS RM_Name,
               (SELECT TOP 1
                 LTRIM(SUBSTRING(TEAM_HEAD, CHARINDEX(' - ', TEAM_HEAD) + 3, LEN(TEAM_HEAD)))
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS SRM_Name,
               (SELECT TOP 1
                TAXABLE_VALUE
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS Booking_amount,
               (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
               * from dise_aprvl where Curr_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) and export_type<3
               and appr_2_code ='${Appr_Code}' and appr_2_stat ='${req.body.status}'
			   ) as dasd where bill_no is null   `;

    } else {
      query = `
 select * from (select
     iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
            IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
            IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
            IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'discount' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
              IN (approver1_A, approver1_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
              IN (approver2_A, approver2_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
              IN (approver3_A, approver3_B) and module_code = 'discount' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
(select TOP 1 delv_date 
 FROM icm_mst 
 WHERE ICM_MST.DMS_Inv COLLATE DATABASE_DEFAULT = 
       (SELECT TOP 1 TRANS_ID 
        FROM GDFDI_ORDBK 
        WHERE trans_type = 'vs' 
          AND TRANS_REF_NUM COLLATE DATABASE_DEFAULT= booking_id COLLATE DATABASE_DEFAULT
          AND LOC_CD COLLATE DATABASE_DEFAULT = Gd_loc  COLLATE DATABASE_DEFAULT
          AND dise_aprvl.export_type < 3) COLLATE DATABASE_DEFAULT 
   AND export_type < 3) AS bill_no,		   (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
               (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
               (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
               (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
               (select top 1 EMPCODE  FROM employeemaster where empcode collate database_default in ( SRM collate database_default ))as emp_code,
               (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,
               (SELECT TOP 1
                 LTRIM(SUBSTRING(EXECUTIVE, CHARINDEX(' - ', EXECUTIVE) + 3, LEN(EXECUTIVE)))
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS RM_Name,
               (SELECT TOP 1
                 LTRIM(SUBSTRING(TEAM_HEAD, CHARINDEX(' - ', TEAM_HEAD) + 3, LEN(TEAM_HEAD)))
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS SRM_Name,
               (SELECT TOP 1
                TAXABLE_VALUE
               FROM GDFDI_ORDBK
               WHERE utd = dise_aprvl.UTD AND TRANS_TYPE = 'ordbk') AS Booking_amount,
               (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
               * from dise_aprvl where Curr_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) and export_type<3
               and appr_2_code ='${Appr_Code}' and appr_2_stat ='${req.body.status}'
			   ) as dasd where bill_no is null`;
    }
    const branch = await sequelize.query(query);
    const criteria = await sequelize.query(`select * from Dise_Criteria`);
    res.status(200).send({
      branch: branch[0],
      criteria: criteria[0],
    });
  } catch (e) {
    console.log(e);
  }
};


exports.recentapproveby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory"
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to approve"
      });
    }

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;
      await sequelize.query(`UPDATE dise_aprvl
            SET Appr_2_Code = '${Appr_Code}',
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = '${Remark}',
                Fin_Appr = 1
            WHERE Tran_id = '${tran_id}' `)
    }
    return res.status(200).send({ success: true, Message: "Approved Successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};


exports.recentrejectby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory"
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to approve"
      });
    }

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;
      await sequelize.query(`UPDATE dise_aprvl
            SET Appr_2_Code = '${Appr_Code}',
                Appr_2_Stat = 0,
                appr_2_date=GETDATE(),
                Appr_2_Rem = '${Remark}',
                Fin_Appr = 0
            WHERE Tran_id = '${tran_id}' `)
    }
    return res.status(200).send({ success: true, Message: "Rejected Successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};


exports.discountoffer = async function (req, res) {
  const State = req.body.State;
  const Valid_From = req.body.Valid_From;
  const Valid_Upto = req.body.Valid_Upto
  const Modl_Grp = req.body.Modl_Grp
  const Channel = req.body.Channel
  const Year = req.body.Year
  const Branch = req.body.Branch
  try {
    const sequelize = await dbname(req.headers.compcode);
    const [result] = await sequelize.query(`
       WITH Modles AS (
   SELECT 
    Modl_Name AS label, 
    MIN(Item_Code) AS value -- Select the smallest Item_Code for each Modl_Name
FROM Modl_mst
WHERE Modl_Grp <> 0 
GROUP BY Modl_Name
	)
      SELECT 
    Modl_Grp AS Model_Group,
    (SELECT TOP 1 misc_Name 
    FROM Misc_Mst 
    WHERE Misc_Code = Modl_Grp AND Misc_Type = 14) AS Model_Group_Name,
    Modl_Code AS Model_Code,
    Modl_Name AS Model_Name,
    Do.Consumer,
    Do.Exch,
    Do.Mssf,
    Do.Corporate1,
    Do.Corporate2,
    Do.Valid_From,
    Do.Valid_Upto,
    Do.MI_Date,
    Do.State,
    Do.Region,
    Do.UTD,
    Do.MI_Date_Upto,
    Do.MarutiEmp,
    Do.MeriMaruti,
    Do.scrappage,
    Do.Rips
FROM 
    Modl_Mst
LEFT JOIN 
    Discount_Offers Do 
ON 
   Do.Model_Group = Modl_Mst.Modl_Grp 
    AND Do.Model_Code = Modl_Mst.Modl_Code
    AND Do.Valid_From >= '${Valid_From}'  
    AND Do.Valid_Upto <= '${Valid_Upto}'
    AND Do.State in ('${State}')
    And  (Do.Channel LIKE '%${Channel}%' OR Do.Channel IN (${Channel}))
    And  (Do.Year LIKE '%${Year}%' OR Do.Year IN (${Year}))
    And  (Do.Branch LIKE '%${Branch}%' OR Do.Branch IN (${Branch}))
WHERE 
    Modl_Grp <> 0  -- This condition filters the rows from Modl_Mst
    and Modl_Mst.Modl_Grp in (select Misc_Code from Misc_Mst where misc_type=14 and Misc_Num2 in (${Channel}))
    and Modl_Mst.Item_Code  in (select value from Modles) and Modl_Mst.isactive=1

ORDER BY 
    Model_Group
`)

    const Modl_Grp_Array = Modl_Grp && Array.isArray(Modl_Grp) ? Modl_Grp[0].split(',') : [];
    const filteredResult = (Modl_Grp && Modl_Grp_Array.length < 10)
      ? result.filter(row => Modl_Grp_Array.includes(row.Model_Group.toString()))
      : result;

    const transformedData = filteredResult.reduce((acc, row) => {
      // Find or create the group for this Model_Group
      let group = acc.find(g => g.Model_Group === row.Model_Group);

      if (!group) {
        group = {
          Model_Group: row.Model_Group,
          Model_Group_Name: row.Model_Group_Name,
          models: []
        };
        acc.push(group);
      }
      // Add model details to the group
      group.models.push({
        Model_Code: row.Model_Code,
        Model_Name: row.Model_Name,
        Consumer: row.Consumer,
        Exch: row.Exch,
        Mssf: row.Mssf,
        Corporate1: row.Corporate1,
        Corporate2: row.Corporate2,
        Valid_From: row.Valid_From,
        Valid_Upto: row.Valid_Upto,
        MI_Date: row.MI_Date,
        State: row.State,
        Region: row.Region,
        UTD: row.UTD,
        MI_Date_Upto: row.MI_Date_Upto,
        MarutiEmp: row.MarutiEmp,
        MeriMaruti: row.MeriMaruti,
        scrappage: row.scrappage,
        Rips: row.Rips
      });

      return acc;
    }, []);
    return res.status(200).send({ transformedData: transformedData, result: result });

  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};
async function validateBulkData(Modl_Array) {
  try {
    // Validate each item in the Modl_Array
    const validatedData = await Promise.all(
      Modl_Array.map((item) => discountOffersSchema.validateAsync(item))
    );

    return validatedData; // Return the validated data (optional)
  } catch (err) {
    throw new Error(`Validation error: ${err.message}`); // If any item fails validation, throw an error
  }
}
exports.savediscountoffer = async function (req, res) {
  const modl_data = req.body.group;
  const Valid_From = req.body.other.Valid_From;
  const Valid_Upto = req.body.other.Valid_Upto;
  const Created_by = req.body.other.Created_by;
  const MI_Date = req.body.other.MI_Date;
  const MI_Date_Upto = req.body.other.MI_Date_Upto;


  const State = Array.isArray(req.body.State) ? req.body.State.join(',') : req.body.State.toString();
  const Channel = Array.isArray(req.body.Channel) ? req.body.Channel.join(',') : req.body.Channel.toString();
  const Year = Array.isArray(req.body.Year) ? req.body.Year.join(',') : req.body.Year.toString();
  const Branch = Array.isArray(req.body.Branch) ? req.body.Branch.join(',') : req.body.Branch.toString();

  let Modl_Array = []
  try {
    const sequelize = await dbname(req.headers.compcode);

    for (const ModelName of modl_data.models) {
      const data = {
        Model_Group: modl_data.Model_Group,
        Model_Group_Name: modl_data.Model_Group_Name,
        Model_Code: ModelName.Model_Code,
        Model_Name: ModelName.Model_Name,
        Rips: ModelName.Rips,
        MI_Date: ModelName.MI_Date ? ModelName.MI_Date : MI_Date,
        MI_Date_Upto: ModelName.MI_Date_Upto ? ModelName.MI_Date_Upto : MI_Date_Upto,
        Consumer: ModelName.Consumer,
        Exch: ModelName.Exch,
        Mssf: ModelName.Mssf,
        Corporate1: ModelName.Corporate1,
        Corporate2: ModelName.Corporate2,
        Valid_From: ModelName.Valid_From ? ModelName.Valid_From : Valid_From,
        Valid_Upto: ModelName.Valid_Upto ? ModelName.Valid_Upto : Valid_Upto,
        State: State,
        Region: ModelName.Region,
        Created_By: Created_by,
        MarutiEmp: ModelName.MarutiEmp,
        MeriMaruti: ModelName.MeriMaruti,
        scrappage: ModelName.scrappage,
        Channel: Channel,
        Branch: Branch,
        Year: Year,
      }
      Modl_Array.push(data)
    }
    const validatedData = await validateBulkData(Modl_Array);
    const Disocunt_Offer = _DiscountOffers(sequelize, DataTypes);
    const t = await sequelize.transaction();
    const Disocunt_Offer1 = await Disocunt_Offer.bulkCreate(validatedData, {
      transaction: t,
    });
    await t.commit();
    return res.status(200).send("done");
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, err: e, Message: "Internal Server Error" });
  }
};

exports.updatediscountoffer = async function (req, res) {
  const modl_data = req.body.group;
  // const State = req.body.other.State;
  const Valid_From = req.body.other.Valid_From;
  const Valid_Upto = req.body.other.Valid_Upto;
  const Created_by = req.body.other.Created_by;
  const MI_Date = req.body.other.MI_Date;
  const MI_Date_Upto = req.body.other.MI_Date_Upto;
  // const Channel = req.body.other.Channel;

  const State = Array.isArray(req.body.State) ? req.body.State.join(',') : req.body.State.toString();
  const Channel = Array.isArray(req.body.Channel) ? req.body.Channel.join(',') : req.body.Channel.toString();
  const Year = Array.isArray(req.body.Year) ? req.body.Year.join(',') : req.body.Year.toString();
  const Branch = Array.isArray(req.body.Branch) ? req.body.Branch.join(',') : req.body.Branch.toString();

  let Modl_Array = [];
  try {
    const sequelize = await dbname(req.headers.compcode);
    for (const ModelName of modl_data.models) {
      const data = {
        Model_Group: modl_data.Model_Group,
        Model_Group_Name: modl_data.Model_Group_Name,
        Model_Code: ModelName.Model_Code,
        Model_Name: ModelName.Model_Name,
        MI_Date: ModelName.MI_Date ? ModelName.MI_Date : MI_Date,
        MI_Date_Upto: ModelName.MI_Date_Upto ? ModelName.MI_Date_Upto : MI_Date_Upto,
        Consumer: ModelName.Consumer,
        Exch: ModelName.Exch,
        Mssf: ModelName.Mssf,
        Rips: ModelName.Rips,
        Corporate1: ModelName.Corporate1,
        Corporate2: ModelName.Corporate2,
        Valid_From: ModelName.Valid_From ? ModelName.Valid_From : Valid_From,
        Valid_Upto: ModelName.Valid_Upto ? ModelName.Valid_Upto : Valid_Upto,
        State: State,
        Region: ModelName.Region,
        Created_By: Created_by,
        UTD: ModelName.UTD, // Assuming UTD is passed in the request
        MarutiEmp: ModelName.MarutiEmp,
        MeriMaruti: ModelName.MeriMaruti,
        scrappage: ModelName.scrappage,
        Channel: Channel,
        Branch: Branch,
        Year: Year,
      };
      Modl_Array.push(data);
    }
    const validatedData = await validateBulkData(Modl_Array);
    const Discount_Offer = _DiscountOffers(sequelize, DataTypes);
    const t = await sequelize.transaction();

    for (const record of validatedData) {
      // Check if record with the same UTD exists
      const existingRecord = await Discount_Offer.findOne({
        where: { UTD: record.UTD }
      });

      if (existingRecord) {
        // Update the existing record
        await existingRecord.update(record, { transaction: t });
      } else {
        // Insert a new record if UTD doesn't exist
        await Discount_Offer.create(record, { transaction: t });
      }
    }

    await t.commit();
    return res.status(200).send("done");
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, err: e, Message: "Internal Server Error" });
  }
};



exports.viewbooking = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const sequelize = await dbname(req.headers.compcode);
    let branch;
    let query = ` select
    (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
        (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,  
        (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
        (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
        (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
        (select top 1 EMPCODE  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as emp_code,
        (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,   
        (select top 1 EXECUTIVE FROM GDFDI_ORDBK where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as RM_Name,
        (select top 1 TEAM_HEAD FROM GDFDI_ORDBK where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as SRM_Name,
        (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
        * from dise_aprvl  where utd='${UTD}' and export_type=1 order by tran_id desc`;
    branch = await sequelize.query(query);
    if (branch[0].length == 0) {
      query = ` select
    (select top 1 trans_date from GDFDI_ORDBK where GDFDI_ORDBK.utd = dise_aprvl.utd)as book_date,
        (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,  
        (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
        (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
        (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
        (select top 1 EMPCODE  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as emp_code,
        (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,   
        (select top 1 EXECUTIVE FROM GDFDI_ORDBK where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as RM_Name,
        (select top 1 TEAM_HEAD FROM GDFDI_ORDBK where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as SRM_Name,
        (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
        * from dise_aprvl  where tran_id='${UTD}' and export_type=1 order by tran_id desc`;
      branch = await sequelize.query(query);

    }

    res.status(200).send(branch[0][0]);
  } catch (e) {
    console.log(e);
  }
};

exports.viewDiscountReportrana = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `
 SELECT 
  is_gd,  
               (select top 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME 
       FROM EMPLOYEEMASTER 
       WHERE EMPCODE =Appr_1_Code)as Aprover1,
       (select top 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME 
       FROM EMPLOYEEMASTER 
       WHERE EMPCODE =SRM)as SRM,
      CASE
          WHEN Appr_1_Stat is null THEN 'Pending'
          WHEN Appr_1_Stat = '1' THEN 'Approve'
          WHEN Appr_1_Stat = '0' THEN 'Reject' 
      ELSE status
    END AS Approver1status,
     (select top 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME 
       FROM EMPLOYEEMASTER 
       WHERE EMPCODE =Appr_2_Code)as Aprover2,
      CASE
          WHEN Appr_2_Stat is null THEN 'Pending'
          WHEN Appr_2_Stat = '1' THEN 'Approve'
          WHEN Appr_2_Stat = '0' THEN 'Reject' 
      ELSE 'Pending'
    END AS Approver2status,
    Approved_amt,
    Remark,Curr_date as CurrentDate,    
    (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as Branch_Name,
  Cust_Name as CustomerName,Mob as MobileNumber,Pan_No as PanNumber , 
  (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as ModelName,
  (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as VehicleColor,
  Delv_Date as DeliveryDate,
  Consumer as ConsumerOffer,Corporate as CorporateOffer,
  Exch as ExchangeOffer,
  CASE
        WHEN CCP = '0' THEN 'No'
          WHEN CCP = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS CCP,
  
  CASE
          WHEN EW = '0' THEN 'No'
          WHEN EW = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS EW,Fuel_type,
  CASE
          WHEN waiting = '0' THEN 'No'
          WHEN waiting = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS Car_Waiting,
    MGA_Amt,
  Dise_Amt as AdditionalDiscount,
  (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
  
  CASE
        WHEN Insurance = '0' THEN 'No'
          WHEN Insurance = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS Insurance,
  CASE
        WHEN RTO_Chrg = '0' THEN 'No'
          WHEN RTO_Chrg = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS RTOCharges,
    CASE
        WHEN Loyalty_Card = '0' THEN 'No'
          WHEN Loyalty_Card = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS Loyalty_Card
    
    ,
    CASE
        WHEN Car_Exch = '0' THEN 'No'
          WHEN Car_Exch = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS CarExchange
    ,
    CASE
        WHEN FastTeg = '0' THEN 'No'
          WHEN FastTeg = '1' THEN 'Yes' 
      ELSE 'unknown'
    END AS FastTeg ,
    appr_1_date,appr_2_date,isapp1,
    Loan_Amount,Bank_Name,Preferred_Insurance,Insurance_Company,oldvalue
    FROM dise_aprvl  where Location in (${req.body.multi_loc}) and Curr_date between '${dateFrom}' and '${dateto}' and   export_type<3 
  `
    );

    res.status(200).send(discountdata[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.findModelgroup = async function (req, res) {
  const Channel = req.body.Channel;
  const Region = req.body.Region;

  try {
    const sequelize = await dbname(req.headers.compcode);
    const Models = await sequelize.query(
      `WITH MiscData AS (
          SELECT 
              Misc_Name AS label,
              CAST(Misc_Code AS VARCHAR(MAX)) AS value
          FROM Misc_Mst
          WHERE Misc_Type = 14 and Misc_Name !=''
          and Misc_Num2 in (${Channel})
      )

      -- Get the 'ALL' row for Misc
      SELECT 
          'ALL' AS label, 
          STRING_AGG(CAST(Misc_Code AS VARCHAR(MAX)), ',') AS value,
          0 AS sort_order  -- 'ALL' row first
      FROM Misc_Mst
      WHERE Misc_Type = 14 and Misc_Name !=''

      UNION ALL

      -- Get Misc_Mst data
      SELECT 
          label, 
          value,
          1 AS sort_order  -- Other rows after 'ALL'
      FROM MiscData
      ORDER BY sort_order;`
    );
    const Branches =
      await sequelize.query(`SELECT Godw_Code AS value, Godw_Name AS label FROM 
    GODOWN_MST WHERE br_region in (${Region}) and export_type<3`);
    res.status(200).send({ Models: Models[0], Branches: Branches[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


exports.Available_Models = async function (req, res) {
  const Modl_Grp = req.body.Modl_Grp
  const Channel = req.body.Channel;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`
       WITH Modles AS (
   SELECT 
    Modl_Name AS label, 
    MIN(Item_Code) AS value -- Select the smallest Item_Code for each Modl_Name
FROM Modl_mst
WHERE Modl_Grp <> 0 
GROUP BY Modl_Name
	)
	  select item_code,Modl_Name,isActive from Modl_Mst where Item_Code in (select value from Modles)
	  and Modl_Grp in (select Misc_Code from Misc_Mst where misc_type=14 and Misc_Num2 in (${Channel}))
    and Modl_grp in (${Modl_Grp})
      `)

    return res.status(200).send(result[0]);

  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};
exports.activemodels = async function (req, res) {
  const models = req.body.models;
  const sequelize = await dbname(req.headers.compcode);
  try {
    for (item of models) {
      await sequelize.query(`update modl_mst set isActive=${item.isActive} where item_code='${item.item_code}'`)
    }
    return res.status(200).send('done');

  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};