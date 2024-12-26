const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const { SendWhatsAppMessgae } = require("./user");


//data
exports.discountdashboarddata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const multi_loc = req.body.multi_loc;

    const data1 = await sequelize.query(`SELECT COUNT(*) as Total,
    (select count(*) from gd_fdi_trans WHERE trans_type='ordbk' 
            AND TRANS_ID NOT IN (
                SELECT TRANS_ID 
                FROM gd_fdi_trans 
                WHERE TRANS_TYPE='ordbc'
            )
            AND TRANS_DATE between '${dateFrom}' and '${dateto}' and TEAM_HEAD is not null
      and LOC_CD in (select NEWCAR_RCPT from GODOWN_MST where Godw_Code in  (${multi_loc})) and UTD not in (select utd from dise_aprvl  where Curr_Date between '${dateFrom}' and '${dateto}' and location in  (${multi_loc}))) as pending_atdse,
      (select count(*) from dise_aprvl where Appr_1_Stat is null   and Curr_Date between '${dateFrom}' and '${dateto}' and location in  (${multi_loc}))as pending_atapr1,
	  (select count(*) from dise_aprvl where Appr_2_Stat is null and Appr_1_Stat=1  and Curr_Date between '${dateFrom}' and '${dateto}' and location in  (${multi_loc}))as pending_atapr2
        FROM (
            SELECT utd 
            FROM gd_fdi_trans ~
            WHERE trans_type='ordbk' 
            AND TRANS_ID NOT IN (
                SELECT TRANS_ID 
                FROM gd_fdi_trans 
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
             (SELECT TOP 1 GODW_NAME FROM Godown_Mst WHERE NEWCAR_RCPT = gd_fdi_trans.LOC_CD) as Branch_name,
             CASE WHEN EXISTS (SELECT TOP 1 utd FROM dise_aprvl WHERE utd = gd_fdi_trans.utd) THEN 1 ELSE 0 END as discount_request,
             CASE WHEN EXISTS (SELECT TOP 1 utd FROM dise_aprvl WHERE utd = gd_fdi_trans.utd and Appr_1_Stat is null) THEN 1 ELSE 0 END as pending_approver1,
             CASE WHEN EXISTS (SELECT TOP 1 utd FROM dise_aprvl WHERE utd = gd_fdi_trans.utd and Appr_2_Stat is null and Appr_1_Stat=1) THEN 1 ELSE 0 END as pending_approver2
         FROM 
             gd_fdi_trans 
         WHERE 
             trans_type = 'ordbk'
             AND TRANS_ID NOT IN (
                 SELECT TRANS_ID 
                 FROM gd_fdi_trans 
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
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `
 SELECT 
  is_gd,  
               (select top 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME 
       FROM EMPLOYEEMASTER 
       WHERE EMPCODE =Appr_1_Code)as Aprover1,
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
    appr_1_date,appr_2_date,isapp1
    FROM dise_aprvl  where Location in (${req.body.multi_loc}) and Curr_date between '${dateFrom}' and '${dateto}' and   export_type<3 and fin_appr=1
  `
    );

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
   count(*)as request_raised,
    sum(iif(appr_1_stat = 1 , 1 ,0)) as approvedby1,
     sum(iif(appr_1_stat = 0 , 1 ,0)) as rejectedby1,
     sum(iif(appr_1_stat is null , 1 ,0)) as pendingat1,
     sum(iif(Appr_2_Stat = 1 , 1 ,0)) as approvedby2,
     sum(iif(Appr_2_Stat = 0 , 1 ,0)) as rejectedby2,
     sum(iif(Appr_2_Stat is null and appr_1_stat=1 , 1 ,0)) as pendingat2,
     EmployeeName       ,Designation                                                          ,
Location        ,Region ,Division                                                             ,
Department      ,srm    ,dms_code
     from (
     select
     (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3) as EmployeeName,
     (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3) as Designation,
       (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top
1 location from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Location,
     (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1
sal_region from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Region,
     (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1
division from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Division,
     (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1
section from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Department,
     srm ,appr_1_stat,Appr_2_Stat,apr2_apr,dms_code from (select 
     (select top 1 emp_dms_code from user_tbl where EMPCODE  = srm  and emp_dms_code is not null and export_type<3 and Module_Code=10) as dms_code
      ,* from dise_aprvl where  Location in (${req.body.branch}) and Curr_date between '${dateFrom}' and '${dateto}' and   export_type<3
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
      select
    (select (select count(*) as total_count from GD_FDI_TRANS where TRANS_TYPE = 'ordbk' and LEFT(Team_head, CHARINDEX(' - ', Team_head) - 1) in(dms_code) and
    cast (SUBSTRING ( TRANS_DATE  , 0, 11 )as date) between '${dateFrom}' and '${dateto}')) as
total_count,
   count(*)as request_raised,
    sum(iif(appr_1_stat = 1 , 1 ,0)) as approvedby1,
     sum(iif(appr_1_stat = 0 , 1 ,0)) as rejectedby1,
     sum(iif(appr_1_stat is null , 1 ,0)) as pendingat1,
     sum(iif(Appr_2_Stat = 1 , 1 ,0)) as approvedby2,
     sum(iif(Appr_2_Stat = 0 , 1 ,0)) as rejectedby2,
     sum(iif(Appr_2_Stat is null and appr_1_stat=1 , 1 ,0)) as pendingat2,
     EmployeeName       ,Designation                                                          ,
Location        ,Region ,Division                                                             ,
Department      ,srm    ,dms_code
     from (
     select
     (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3) as EmployeeName,
     (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3) as Designation,
       (select top 1 misc_name  from misc_mst where misc_type = 85 and  misc_code =(select top
1 location from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Location,
     (select top 1 misc_name  from misc_mst where misc_type = 91 and  misc_code =(select top 1
sal_region from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Region,
     (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1
division from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Division,
     (select top 1 misc_name  from misc_mst where misc_type = 81 and  misc_code =(select top 1
section from EMPLOYEEMASTER where empcode= fst.srm and export_type < 3)) as Department,
     srm ,appr_1_stat,Appr_2_Stat,apr2_apr,dms_code from (select 
     (select top 1 emp_dms_code from user_tbl where EMPCODE  = srm  and emp_dms_code is not null and export_type<3 and Module_Code=10) as dms_code
      ,* from dise_aprvl where  Location in (${req.body.multi_loc}) and Curr_date between '${dateFrom}' and '${dateto}' and   export_type<3
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
      `WITH CurrentMonth AS (
  select
 count(*) as total_count,
SUM(iif(is_gd = 'yes',1,0)) AS request_raised,
    SUM(IIF(appr_1_stat = 1 and is_gd = 'yes', 1, 0)) AS approvedby1,
    SUM(IIF(appr_1_stat = 0 and is_gd = 'yes', 1, 0)) AS rejectedby1,
    SUM(IIF((appr_1_stat IS NULL) and is_gd = 'yes', 1, 0)) AS pendingat1,
    SUM(IIF(appr_2_stat = 1 and is_gd = 'yes', 1, 0)) AS approvedby2,
    SUM(IIF(appr_2_stat = 0 and is_gd = 'yes', 1, 0)) AS rejectedby2,
    SUM(IIF((appr_2_stat is null and appr_1_stat=1)and is_gd = 'yes', 1, 0)) AS pendingat2,
(select Godw_Name from godown_mst where godw_code =location and export_type<3) as location_name
from (select * from dise_aprvl where Curr_Date BETWEEN '${dateFrom}' and '${dateto}'
 and location in (${req.body.multi_loc})
 ) as dss   group by dss.location
),
PreviousMonth AS (
  select
 count(*) as total_count,
 SUM(iif(is_gd = 'yes',1,0)) AS request_raised,
    SUM(IIF(appr_1_stat = 1 and is_gd = 'yes', 1, 0)) AS approvedby1,
    SUM(IIF(appr_1_stat = 0 and is_gd = 'yes', 1, 0)) AS rejectedby1,
    SUM(IIF((appr_1_stat IS NULL) and is_gd = 'yes', 1, 0)) AS pendingat1,
    SUM(IIF(appr_2_stat = 1 and is_gd = 'yes', 1, 0)) AS approvedby2,
    SUM(IIF(appr_2_stat = 0 and is_gd = 'yes', 1, 0)) AS rejectedby2,
    SUM(IIF((appr_2_stat is null and  appr_1_stat=1)and is_gd = 'yes', 1, 0)) AS pendingat2,
(select Godw_Name from godown_mst where godw_code =location and export_type<3) as location_name
from (
 select * from dise_aprvl where Curr_Date BETWEEN '${previousMonthDateFrom}' and '${previousMonthDateTo}'
 and location in (${req.body.multi_loc})
 ) as dss  group by dss.location
)

-- Join the CTEs to get combined data
SELECT
COALESCE(CM.location_name, PM.location_name) AS location_name,
CM.total_count AS current_total_count,
CM.request_raised AS current_request_raised,
CM.approvedby1 AS current_approvedby1,
CM.rejectedby1 AS current_rejectedby1,
CM.pendingat1 AS current_pendingat1,
CM.approvedby2 AS current_approvedby2,
CM.rejectedby2 AS current_rejectedby2,
CM.pendingat2 AS current_pendingat2,
PM.total_count AS previous_total_count,
PM.request_raised AS previous_request_raised,
PM.approvedby1 AS previous_approvedby1,
PM.rejectedby1 AS previous_rejectedby1,
PM.pendingat1 AS previous_pendingat1,
PM.approvedby2 AS previous_approvedby2,
PM.rejectedby2 AS previous_rejectedby2,
PM.pendingat2 AS previous_pendingat2
FROM CurrentMonth CM
FULL OUTER JOIN PreviousMonth PM ON CM.location_name = PM.location_name
ORDER BY COALESCE(CM.location_name, PM.location_name)`
    );
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.findvarient = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Misc_Code = req.body.Misc_Code;
    const varient = await sequelize.query(
      `select Modl_Name as label,Item_Code as value,Modl_Code from Modl_mst where Modl_Grp in (${Misc_Code})`
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
    const phoneno = req.body.MOBILE2 ? `'${req.body.MOBILE2}'` : `''`;
    const panno = req.body.PAN_NO ? `'${req.body.PAN_NO}'` : `''`;
    const Branch_Name = req.body.Godown_Code;
    const customerid = req.body.Cust_Name
    const modelgroup = req.body.Modl_Grp;
    const modelvariant = req.body.Modl_Var;
    const color = req.body.Color ? `'${req.body.Color}'` : `''`
    const date = req.body.Curr_Date;
    const Delv_Date = req.body.Delv_Date ? `'${req.body.Delv_Date}'` : null;
    const loantype = req.body.Loan ? `'${req.body.Loan}'` : null;
    const mgaamt = req.body.MGA_Amt ? `'${req.body.MGA_Amt}'` : null;
    const insurance = req.body.Insurance ? `'${req.body.Insurance}'` : null;
    const rto = req.body.RTO_Chrg ? `'${req.body.RTO_Chrg}'` : null;
    const ew = req.body.EW ? `'${req.body.EW}'` : null;
    const ccp = req.body.CCP ? `'${req.body.CCP}'` : null;
    const loycard = req.body.Loyalty_Card ? `'${req.body.Loyalty_Card}'` : null;
    const oldcar = req.body.Car_Exch ? `'${req.body.Car_Exch}'` : null;
    const fasttag = req.body.FastTeg ? `'${req.body.FastTeg}'` : null;
    const consumer = req.body.Consumer ? `'${req.body.Consumer}'` : null;
    const corporate = req.body.Corporate ? `'${req.body.Corporate}'` : null;
    const exchange = req.body.Exch ? `'${req.body.Exch}'` : null;
    const remark = req.body.remark_dse ? req.body.remark_dse.replace(/'/g, "''") : null;;
    const amount = req.body.Dise_Amt ? `${req.body.Dise_Amt}` : null;
    const Fuel = req.body.GE1 ? `'${req.body.GE1}'` : null;
    const waiting = req.body.waiting ? `'${req.body.waiting}'` : null;
    const Var_Cd = req.body.Variant_CD ? `'${req.body.Variant_CD}'` : null;
    const Trans_ID = req.body.Trans_ID ? `'${req.body.Trans_ID}'` : null;
    const Oldvalue = req.body.Oldvalue ? req.body.Oldvalue : null
    const isapp1 = req.body.isapp1 ? `'${req.body.isapp1}'` : null
    const document = req.body.document ? `'${req.body.document}'` : null
    const Stock_booking = req.body.Stock_booking ? `'${req.body.Stock_booking}'` : null


    const Loan_Amount = req.body.Loan_Amount ? req.body.Loan_Amount : null;
    const Bank_Name = req.body.Bank_Name ? `'${req.body.Bank_Name}'` : null;
    const Preferred_Insurance = req.body.Preferred_Insurance ? `'${req.body.Preferred_Insurance}'` : null;
    const Insurance_Company = req.body.Insurance_Company ? `'${req.body.Insurance_Company}'` : null;



    // const repremark = req.body.repremark ? `'${req.body.repremark}'` : null;
    // const reapp_emp = req.body.reapp_emp ? `'${req.body.reapp_emp}'` : null;
    const sequelize = await dbname(req.headers.compcode);

    const isalready = await sequelize.query(`select * from dise_aprvl where booking_id=${Trans_ID} and location='${Branch_Name}' and export_type<3`)
    if (isalready[0]?.length > 0) {
      await sequelize.query(`update  dise_aprvl set export_type=9 where booking_id=${Trans_ID} and location='${Branch_Name}' and export_type<3`)
      // return res.status(400).send("Entry Already Exist On This Booking Id");
    }

    const emp1 = await sequelize.query(
      `SELECT EMPCODE,mobileno, concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME,Reporting_1,Reporting_2
     FROM EMPLOYEEMASTER Where EMPCode =(select top 1 empcode from user_tbl where user_name = '${req.body.username}' and module_code = 10 and export_type <3 );`
    );
    const gd_loc = await sequelize.query(`select REPLACE(newcar_rcpt,'-S','')as newcar_rcpt from godown_mst where godw_code=${Branch_Name} and export_type<3`)
    await sequelize.query(
      `Insert into dise_aprvl (Mob,	Pan_No,	Cust_Name,	
      Modl_Var,	Veh_Clr,	Delv_Date,	Loan,	MGA_Amt,	Insurance,	RTO_Chrg,	
      EW,CCP,Fuel_type,Var_Cd,	Loyalty_Card,	Car_Exch,	FastTeg,	SRM,	RM,	Consumer,	Corporate,
      	Exch,	Aprvl_Offer,	Dise_Amt,			Curr_Date,	location,		
       	dual_apr,	modl_group,		wa_link,		export_type,	remark_dse,is_gd,status,waiting,booking_id,Oldvalue,isapp1,Gd_loc,document,Stock_booking,
        Loan_Amount,Bank_Name,Preferred_Insurance,Insurance_Company) 
    values(${phoneno},${panno}  ,'${customerid}' ,'${modelvariant}' ,${color} ,${Delv_Date} ,${loantype} , ${mgaamt} ,
    ${insurance} ,${rto} ,${ew} ,${ccp},${Fuel},${Var_Cd},${loycard} ,${oldcar} ,${fasttag} ,'${emp1[0][0].EMPCODE}' ,'0' ,${consumer},
    ${corporate} ,${exchange} ,'0' ,${amount}  ,GETDATE() ,'${Branch_Name}' , 
     '0' ,'${modelgroup}' ,'0' ,'1' ,'${remark}' ,'Yes' ,'0',${waiting},${Trans_ID},${Oldvalue},${isapp1},'${gd_loc[0][0].newcar_rcpt}',${document},${Stock_booking},
     ${Loan_Amount},${Bank_Name},${Preferred_Insurance},${Insurance_Company})`
    );
    res.status(200).send("Data saved successfully");


    // const Emp_name = await sequelize.query(`SELECT EMPCODE,  concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  AS EMPNAME,mobileno FROM EMPLOYEEMASTER where empcode ='${emp1[0][0].Reporting_1}'`)
    const mobileno = await sequelize.query(
      `select mobileno from employeemaster where empcode=(select top 1 approver1_A from Approval_Matrix where empcode='${emp1[0][0].EMPCODE}')`
    );
    const Model = await sequelize.query(
      `select Misc_Name from Misc_mst where Misc_type=14 and misc_code='${modelgroup}'`
    );
    const branch = await sequelize.query(
      `select Godw_Name from GODOWN_MST where Godw_Code in (${Branch_Name})  and export_type<3`);
    const comapny = await sequelize.query(`select comp_name from comp_mst `);
    // const tran_id = await sequelize.query(
    //   `select tran_id from dise_aprvl where Mob='${phoneno}' AND Pan_No='${panno}' `, { transaction: t }
    // );

    await sequelize.close();
    await SendWhatsAppMessgae(req.headers.compcode, mobileno[0][0]?.mobileno, "1_msg_discount_test", [
      {
        type: "text",
        text: emp1[0][0]?.EMPNAME,
      },
      {
        type: "text",
        text: emp1[0][0]?.mobileno,
      },
      {
        type: "text",
        text: amount,
      },
      {
        type: "text",
        text: customerid,
      },
      {
        type: "text",
        text: Model[0][0]?.Misc_Name,
      },
      {
        type: "text",
        text: branch[0][0]?.Godw_Name,
      },
      {
        type: "text",
        text: `https://erp.autovyn.com/autovyn/account/discount/approvergrid`,
      },
      {
        type: "text",
        text: comapny[0][0]?.comp_name,
      },
    ]);
    //     const message = `
    // Dear Sir/Maam,

    // This is to bring to your attention that Mr. ${
    //       emp1[0][0].EMPNAME
    //     } (DSE)(Mobile- ${
    //       emp1[0][0].mobileno
    //     }) Requested For Discount of Rs. ${amount} on behalf of New Car Customer ${customerid} and Car Model  ${
    //       Model[0][0].Misc_Name
    //     } From Branch ${branch[0][0].Godw_Name}.
    // Please review at the  http://cloud.autovyn.com:3000/discountapproval1?a=${btoa(
    //       tran_id[0][0].tran_id
    //     )}&b=${btoa(req.body.dlr_id)}

    // Regards
    // ${comapny[0][0].comp_name}

    // Thank you!
    // {AUTOVYN-ERP}
    //     `;

    //     sendmsg(mobileno[0][0]?.mobileno, message);
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
    let result;
    result =
      await sequelize.query(`
        SELECT      
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE godown_mst.Godw_Code=dise_aprvl.location and godown_mst.export_type<3)As godw_name,  
		(SELECT TOP 1 modl_name FROM Modl_Mst WHERE Modl_Var = Item_Code) AS Modl_Name,
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE  Misc_Code=dise_aprvl.Veh_Clr  AND misc_type = 10) AS Color 
		,fin_appr as final,reapp_remark as isReapproval,Appr_1_Stat as status1,Appr_2_Stat as status2, Appr_3_Stat as status3,is_gd as isgd,  * FROM dise_aprvl WHERE 
		Curr_Date BETWEEN '${dateFrom}' AND '${dateto}' and location in (${loc_code}) and srm ='${req.body.EMPCODE}'
        `);

    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};
//complete
exports.disc7 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select Godw_Name as label,Godw_Code as value from GODOWN_MST where export_type<3 and godw_code in (${req.body.multi_loc})`
    );
    const model_group = await sequelize.query(
      `select Misc_Name as label,Misc_Code as value from Misc_mst where Misc_type=14`
    );
    const color = await sequelize.query(
      `select Misc_Name as label,Misc_Code  as value from Misc_mst where Misc_type=10`
    );
    const Loantype = await sequelize.query(
      `select Misc_Name as label,Misc_Code as value from Misc_mst where Misc_type=18`
    );

    const Financer = await sequelize.query(
      `select Misc_Name as label,Misc_Name  as value from Misc_mst where Misc_type=8`
    );
    const Insurance = await sequelize.query(
      `select MAX( CUST_NAME) as value,MAX( CUST_NAME) as label from Gd_fdi_trans where trans_type='wi' and GE10='INS' group by LEFT( cust_name,5)
order by value`
    );
    res.status(200).send({
      branch: branch[0],
      model_group: model_group[0],
      color: color[0],
      Loantype: Loantype[0],
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
      await sequelize.query(` select UTD,Trans_ID,Trans_Date,Trans_Ref_Date,GD_FDI_TRANS.Variant_CD,Cust_Name,GD_FDI_TRANS.GE1, (select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2, (select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO, (select top 1 godw_code from godown_mst where GD_FDI_TRANS.loc_cd=REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) as Godown_Code, (select top 1 item_code from Modl_Mst where VARIANT_CD=Modl_Code) as Modl_Var,  (select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code) as Modl_Grp, (select top 1 Misc_code from misc_mst where ECOLOR_CD=misc_abbr and misc_type=10 ) as Color From GD_FDI_TRANS
WHERE UTD = '${UTD}';
`);
    res.status(200).send({ booking: result[0][0], dise: null });
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
    let query = `
    
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
          (select top 1 trans_date from gd_fdi_trans where gd_fdi_trans.utd = dise_aprvl.utd)as book_date,
              (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
              (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode = SRM )as empname,
                (select top 1 EMPCODE  FROM employeemaster where empcode collate database_default in ( SRM collate database_default ))as emp_code,
              (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,
              (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
              * from dise_aprvl where Curr_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) and export_type<3
              and srm in  (select empcode from approval_matrix where 
                '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
              ) as dasd where (status_khud_ka is not null and status_appr is not null)
              or (status_khud_ka is null and status_appr is null)
                `;

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
    (select top 1 trans_date from gd_fdi_trans where gd_fdi_trans.utd = dise_aprvl.utd)as book_date,
        (select top 1 godw_name from GODOWN_MST where Godw_Code=location)as godw_name,  
        (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=modl_group)as Modl_Group_Name,
        (select top  1 Misc_Name from Misc_Mst where Misc_type=10 and export_type < 3 and  misc_code=Veh_Clr and Misc_Name<>'')as Veh_Clr_Name,
        (select top 1 Misc_Name from Misc_Mst where Misc_type=18 and  misc_code=Loan)as Loan_Name,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as empname,
        (select top 1 EMPCODE  FROM employeemaster where empcode in (select top 1 empcode from user_tbl where user_name collate database_default = SRM collate database_default and export_type < 3 and module_code = 10))as emp_code,
        (select top 1 Modl_Name from  Modl_Mst where item_code=Modl_Var)as modl_name,   
        (select top 1 EXECUTIVE FROM GD_FDI_TRANS where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as RM_Name,
        (select top 1 TEAM_HEAD FROM GD_FDI_TRANS where utd=dise_aprvl.UTD and TRANS_TYPE='ordbk')as SRM_Name,
        (select top 1 Misc_Name  from  Misc_Mst where Misc_Code=Veh_Clr and Misc_Type=10 )as color,
        * from dise_aprvl  where utd='${UTD}' and export_type=9 order by tran_id desc`;
    const branch = await sequelize.query(query);

    res.status(200).send(branch[0][0]);
  } catch (e) {
    console.log(e);
  }
};

async function processMainData(compcodePassed, mainData, sequelize, Appr_Code, Remark) {
  const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;


      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'discount'`,
        { replacements: { empcode }, transaction: t }
      );
      const comp_name = await sequelize.query(`select top 1 comp_name from comp_mst`)
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
          query2 = `UPDATE dise_aprvl
              SET Approved_amt = Dise_Amt
              WHERE Approved_amt IS NULL and Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL`
          query = `
            UPDATE dise_aprvl
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                appr_1_date=GETDATE(),
                Appr_1_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
          const result = await sequelize.query(`select top 1 mobileno from employeemaster where empcode='${item?.rowData.SRM}'`)

          await SendWhatsAppMessgae(compcodePassed, result[0][0]?.mobileno, 'approver_1_approve_message', [
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
              "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : '(Not Given)'
            },
            {
              "type": "text",
              "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)'
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
              "text": comp_name[0][0]?.comp_name
            }
          ]);
          if (!Final_apprvl) {
            const approver2 = await sequelize.query(`select top 1 mobileno from employeemaster where empcode=(select top 1 approver2_A from approval_matrix where empcode='${item?.rowData.SRM}' and module_code='discount')`)
            const mobile_emp = await sequelize.query(`select top 1 mobileno from employeemaster where empcode='${item?.rowData.SRM}'`)
            // if (mobile_emp[0]?.length && mobile_emp[0][0].mobileno) {
            //   await SendWhatsAppMessgae(mobile_emp[0][0].mobileno, 'approver_reject_message', [
            //     {
            //       "type": "text",
            //       "text": item?.rowData.empname
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.Cust_Name
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.Mob
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.modl_name
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.apr2_name
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : '(Not Given)'

            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)'
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
            //     },
            //     {
            //       "type": "text",
            //       "text": item?.rowData?.apr2_name
            //     },
            //     {
            //       "type": "text",
            //       "text": comp_name[0][0]?.comp_name
            //     }
            //   ]);
            // }
            if (approver2[0]?.length && approver2[0][0].mobileno) {
              await SendWhatsAppMessgae(compcodePassed, approver2[0][0].mobileno, 'to_2_approver_msg', [
                {
                  "type": "text",
                  "text": item?.rowData.empname
                },
                {
                  "type": "text",
                  "text": mobile_emp[0][0].mobileno
                },
                {
                  "type": "text",
                  "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)'
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
                  "text": `https://erp.autovyn.com/autovyn/account/discount/approvergrid`
                },
                {
                  "type": "text",
                  "text": item?.rowData?.apr1_name
                },
                {
                  "type": "text",
                  "text": item?.rowData?.godw_name
                },
                {
                  "type": "text",
                  "text": comp_name[0][0]?.comp_name
                },
                {
                  "type": "text",
                  "text": item?.rowData?.Curr_Date
                },
              ]);
            }
          }

        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE dise_aprvl
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          const mobile_emp = await sequelize.query(`select top 1 mobileno from employeemaster where empcode='${item?.rowData.SRM}'`)
          const approver1 = await sequelize.query(`select top 1 mobileno from employeemaster where empcode=(select top 1 approver1_A from approval_matrix where empcode='${item?.rowData.SRM}')`)
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
            await SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_reject_message', [
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
                "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : '(Not Given)'

              },
              {
                "type": "text",
                "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)'
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
                "text": comp_name[0][0]?.comp_name
              }
            ]);
            await SendWhatsAppMessgae(compcodePassed, approver1[0][0].mobileno, 'approver_reject_message', [
              {
                "type": "text",
                "text": item?.rowData.apr1_name
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
                "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : '(Not Given)'

              },
              {
                "type": "text",
                "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)'
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
                "text": comp_name[0][0]?.comp_name
              }
            ]);
          }

        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE dise_aprvl
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }

        const [affectedRows] = await sequelize.query(
          `SELECT * FROM dise_aprvl WHERE Tran_id = :tran_id;`,
          { replacements: { tran_id }, transaction: t }
        );

        if (affectedRows.length > 0) {
          if (query2) {
            await sequelize.query(query2, { replacements: { ...data, tran_id }, transaction: t });
          }
          await sequelize.query(query, { replacements: { ...data, tran_id }, transaction: t });
        }

        console.log({
          success: true,
          Message: affectedRows.length === 0 ? "Cannot Approve" : `Approved on level ${ApprovalLevel}`
        });
      }
    }

    await t.commit();
  } catch (e) {
    console.error(e);
    await t.rollback();
    throw e;
  }
}

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
  const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'discount'`,
        { replacements: { empcode }, transaction: t }
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
          const approver1 = await sequelize.query(`select top 1 mobileno from employeemaster where empcode=(select top 1 approver1_A from approval_matrix where empcode='${item?.rowData.SRM}')`)

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
            await SendWhatsAppMessgae(compcodePassed, approver1[0][0].mobileno, 'approver_1_2_reject_messaage', [
              {
                "type": "text",
                "text": item?.rowData.apr1_name
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
          { replacements: { tran_id }, transaction: t }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, { replacements: { ...data, tran_id }, transaction: t });
        }

        console.log({
          success: true,
          Message: affectedRows.length === 0 ? "Cannot Reject" : `Rejected on level ${ApprovalLevel}`
        });
      }
    }

    await t.commit();
  } catch (e) {
    console.error(e);
    await t.rollback();
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
    const t = await sequelize.transaction();
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
      RM,
      Corporate,
      Exch,
      Aprvl_Offer,
      Dise_Amt,
      Aprvl_By,
      Status,
      Remark,
      Curr_Date,
      location,
      Approved_amt,
      aprvl_by2,
      dual_apr,
      modl_group,
      tran_id,
      wa_link,
      apr2_apr,
      export_type,
      remark_dse,
      booking_id,
      UTD,
      isapp1,
      is_gd,
      CCP,
      EW,
      Fuel_Type,
      Var_Cd,
      waiting,
      reapp_remark,
      reapp_emp,
      Appr_1_Code,
      Appr_1_Stat,
      Appr_1_Rem,
      Appr_2_Code,
      Appr_2_Stat,
      Appr_2_Rem,
      Appr_3_Code,
      Appr_3_Stat,
      Appr_3_Rem,
      Fin_Appr,
      Created_At,
      Consumer,
    } = req.body;
    const Delv_Date = req.body.Delv_Date ? `'${req.body.Delv_Date}'` : null;
    let result;
    if (tran_id) {
      await sequelize.query(
        `update dise_aprvl set export_type=9 where tran_id=${tran_id} and export_type<3`,
        { transaction: t }
      );
      result = await sequelize.query(
        `select * from  dise_aprvl  where tran_id=${tran_id} and export_type<3`,
        { transaction: t }
      );
    }
    await sequelize.query(
      `Insert into dise_aprvl (Mob,	Pan_No,	Cust_Name,	
    Modl_Var,	Veh_Clr,	Delv_Date,	Loan,	MGA_Amt,	Insurance,	RTO_Chrg,	
    EW,CCP,Fuel_type,Var_Cd,	Loyalty_Card,	Car_Exch,	FastTeg,	SRM,	RM,	Consumer,	Corporate,
      Exch,	Aprvl_Offer,	Dise_Amt,			Curr_Date,	location,		
       dual_apr,	modl_group,		wa_link,		export_type,	remark_dse,UTD,booking_id,is_gd,status,waiting,reapp_remark,reapp_emp) 
  values('${Mob}','${Pan_No}'  ,'${Cust_Name}' ,'${Modl_Var}' ,'${Veh_Clr}' ,${Delv_Date} ,'${Loan}' , '${MGA_Amt}' ,
  '${Insurance}' ,'${RTO_Chrg}' ,'${EW}' ,'${CCP}','${Fuel_Type}','${Var_Cd}','${Loyalty_Card}' ,'${Car_Exch}' ,'${FastTeg}' ,'${SRM}' ,${"0"} ,'${Consumer}' ,
   ${Corporate} ,'${Exch}' ,'${0}' ,'${Dise_Amt}'  ,'${Curr_Date}' ,'${location}' , 
   '${0}' ,'${modl_group}' ,'${"0"}' ,'${1}' ,'${remark_dse}' ,${UTD},'${booking_id}','Yes' ,'0',${waiting},'${reapp_remark}','${reapp_emp}')`,
      { transaction: t }
    );
    await t.commit();

    return res
      .status(200)
      .send({ success: true, Message: "done Successfully" });
  } catch (e) {
    console.log(e);
    await t.rollback();

    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
