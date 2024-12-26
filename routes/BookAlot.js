const express = require("express");
const app = express();
const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal, Op, where } = require("sequelize");
const { _ChasAlot, chasAlotSchema } = require("../models/ChasAlot");


exports.ChassisView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const Items = await sequelize.query(`select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS ModelName,
    DATEDIFF(day, PInv_Date, GETDATE()) AS AgeingInDays,
    (SELECT TOP 1 Godw_Name FRom Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code) AS BranchName
    ,* from CHAS_MST WHERE 
    CHAS_ID NOT IN (SELECT CHAS_ID FROM Chas_Alot WHERE Export_Type = 1) AND 
    CHAS_ID in(
SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code}) group by CHAS_ID
	having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0 )`);
        console.log(Items[0].length)

        res.send({ success: true, Chassis: Items[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.ChassisReport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const Items = await sequelize.query(`select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS ModelName,
    DATEDIFF(day, PInv_Date, GETDATE()) AS AgeingInDays,
    (SELECT TOP 1 Godw_Name FRom Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code) AS BranchName
    ,* from CHAS_MST WHERE 
    CHAS_ID NOT IN (SELECT CHAS_ID FROM Chas_Alot WHERE Export_Type = 1) AND 
    CHAS_ID in(
SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code}) group by CHAS_ID
	having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0 )`);
        const Items1 = await sequelize.query(`select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS ModelName,
    DATEDIFF(day, PInv_Date, GETDATE()) AS AgeingInDays,
    (SELECT TOP 1 Godw_Name FRom Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code) AS BranchName
    ,* from CHAS_MST WHERE 
    CHAS_ID in(
SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code}) group by CHAS_ID
	having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0 )`);
        const Items2 = await sequelize.query(`select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS ModelName,
    DATEDIFF(day, PInv_Date, GETDATE()) AS AgeingInDays,
    (SELECT TOP 1 Godw_Name FRom Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code) AS BranchName
    ,* from CHAS_MST WHERE 
    CHAS_ID IN (SELECT CHAS_ID FROM Chas_Alot WHERE Export_Type = 1) AND 
    CHAS_ID in(
SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code}) group by CHAS_ID
	having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0 )`);
        console.log(Items[0].length)

        res.send({ success: true, UnAlloted: Items[0], Alloted: Items2[0], All: Items1[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.ChassisMaster = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;

        const Items1 = await sequelize.query(`select 
    CAST(Chas_Id AS VARCHAR) AS value, Chas_No AS label from CHAS_MST WHERE 
    CHAS_ID in(
    SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code}) group by CHAS_ID
	having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0 )`);
        res.send({ success: true, All: Items1[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.AllotedChassisView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const CHAS_NO = req.body.CHAS_NO;
        const Items = await sequelize.query(`select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = cm.Modl_Code) AS ModelName,
    (SELECT TOP 1 UTD FROM Chas_Alot where Chas_Alot.CHAS_ID = cm.Chas_Id) AS UTD,
    DATEDIFF(day, cm.PInv_Date, GETDATE()) AS AgeingInDays,
    (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = cm.Loc_Code) AS BranchName
    ,cm.* from CHAS_MST cm JOIN Chas_Alot ca ON cm.Chas_Id = ca.CHAS_ID
     WHERE cm.Chas_No = '${CHAS_NO}' AND ca.Export_Type = 1`);
        console.log(Items[0])
        res.send({ success: true, Chassis: Items[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.DeAllotedChassisView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_CODE = req.body.LOC_CODE;
        const DMS_CODE = req.body.DMS_CODE;
        const Items = await sequelize.query(`select 
GD_FDI_ID AS UTD,
Booking_ID AS Trans_ID,
DeAlot_Res AS Remark,
DeAlot_Date AS AllotedDate,
Export_Type as ExTy,
(SELECT TOP 1 Chas_No FROM CHAS_MST where CHAS_MST.Chas_Id = Chas_Alot.CHAS_ID) AS AllotedChassis,
(SELECT TOP 1 CUST_NAME FROM GD_FDI_TRANS where GD_FDI_TRANS.UTD = GD_FDI_ID) AS Cust_Name,
(SELECT TOP 1 TRANS_DATE FROM GD_FDI_TRANS where GD_FDI_TRANS.UTD = GD_FDI_ID) AS Trans_Date,
(SELECT TOP 1 modl_name FROM Modl_Mst WHERE Modl_Code = (SELECT TOP 1 VARIANT_CD FROM GD_FDI_TRANS where GD_FDI_TRANS.UTD = GD_FDI_ID)) AS Modl_Name,
(SELECT TOP 1 Misc_name FROM misc_mst WHERE misc_type = 10 AND misc_abbr = (SELECT TOP 1 ECOLOR_CD FROM GD_FDI_TRANS where GD_FDI_TRANS.UTD = GD_FDI_ID)) AS Color,
(SELECT TOP 1 Godw_Name FROM godown_mst WHERE export_type<=3 AND  newcar_rcpt = (SELECT TOP 1 LOC_CD FROM GD_FDI_TRANS where GD_FDI_TRANS.UTD = GD_FDI_ID)) AS Godw_Name
from Chas_Alot WHERE LOC_CODE in (${LOC_CODE}) AND Export_Type = 5 AND (DMS_CODE = '${DMS_CODE}' OR DE_ALOT_DMS_CODE = '${DMS_CODE}') AND GD_FDI_ID NOT IN (SELECT GD_FDI_ID FROM Chas_Alot WHERE Export_Type = 1)
`);
        console.log(Items[0])
        res.send({ success: true, Chassis: Items[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.ChassisWiseActions = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const CHAS_ID = req.body.CHAS_ID;
        if (CHAS_ID == '') {
            return
        }
        const Items = await sequelize.query(`SELECT 
    Created_At AS Action_Date, 
    (SELECT TOP 1 User_Name FROM User_Tbl WHERE emp_dms_code = DMS_CODE AND Export_Type = 1) AS Action_By, 
    Alottment_Rem AS Remarks, 
    'Allocation' AS Action_Type, GD_FDI_ID, Booking_ID
FROM 
    Chas_Alot 
WHERE 
    CHAS_ID = '${CHAS_ID}'
UNION ALL
SELECT 
    DeAlot_Date AS Action_Date, 
    (SELECT TOP 1 User_Name FROM User_Tbl WHERE emp_dms_code = DE_ALOT_DMS_CODE AND Export_Type = 1) AS Action_By, 
    DeAlot_Res AS Remarks, 
    'Deallocation' AS Action_Type, GD_FDI_ID, Booking_ID
FROM 
    Chas_Alot 
WHERE 
    CHAS_ID = '${CHAS_ID}'
    AND DeAlot_Date IS NOT NULL
ORDER BY 
    Action_Date;
`);
        console.log(Items[0])
        res.send({ success: true, Chassis: Items[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};


exports.AllotChassis = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body.formData;
        console.log(BodyData)
        if (!BodyData.CHAS_ID) {
            return res.status(500).send({
                success: false,
                message: "No Chassis Selected"
            });
        }
        const CheckApproval = await sequelize.query(
            `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = '${BodyData.EMP_CODE}' AND module_code = 'bookingAllotment'`);
        console.log(CheckApproval, 'CheckApproval')
        if (CheckApproval[0].length > 0) {
            const { error, value: AlotrData } = chasAlotSchema.validate(BodyData, {
                abortEarly: false,
                stripUnknown: true,
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map((err) => err.message).join(", ");
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                const t = await sequelize.transaction();
                const ChasAlot = _ChasAlot(sequelize, DataTypes);
                try {
                    const Om = await ChasAlot.create(
                        { ...AlotrData, Export_Type: 2 },
                        { transaction: t }
                    );
                    await t.commit();
                    res.status(200).send({ success: true, Message: "Chassis Allotment Request Raised Successfully", UTD: Om.UTD });
                } catch (error) {
                    console.log(error)
                    res.status(500).send({
                        success: false,
                        message: "An error occurred while creating Master",
                        error,
                    });
                    await t.rollback();
                }
            }
        }
        else {
            const { error, value: AlotrData } = chasAlotSchema.validate(BodyData, {
                abortEarly: false,
                stripUnknown: true,
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map((err) => err.message).join(", ");
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                const t = await sequelize.transaction();
                const ChasAlot = _ChasAlot(sequelize, DataTypes);
                try {
                    const Om = await ChasAlot.create(
                        { ...AlotrData, Export_Type: 1, Fin_Appr_Stat: 1 },
                        { transaction: t }
                    );
                    await t.commit();
                    res.status(200).send({ success: true, Message: "Chassis Alloted Successfully", UTD: Om.UTD });
                } catch (error) {
                    console.log(error)
                    res.status(500).send({
                        success: false,
                        message: "An error occurred while creating Master",
                        error,
                    });
                    await t.rollback();
                }
            }
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while creating Master",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.DeAllotChassis = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const DeAlot_Res = req.body.DeAlot_Res;
        const UTD = req.body.UTD;
        const DMS_CODE = req.body.DMS_CODE;
        console.log(req.body)

        const t = await sequelize.transaction();
        const ChasAlot = _ChasAlot(sequelize, DataTypes);
        try {
            await ChasAlot.update(
                { DeAlot_Res: DeAlot_Res, Export_Type: 5, DeAlot_Date: sequelize.fn('GETDATE'), DE_ALOT_DMS_CODE: DMS_CODE },
                {
                    where: { UTD },
                    transaction: t
                }
            );
            await t.commit();
            res.status(200).send({ success: true, Message: "Chassis De-Alloted" });
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "An error occurred while creating Master",
                error,
            });
            await t.rollback();
        }

    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while creating Master",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.viewgdapproaldata = async function (req, res) {
    try {
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const loc_code = req.body.loc_code;
        const sequelize = await dbname(req.headers.compcode);

        const emp_dms_code = await sequelize.query(
            `select emp_dms_code from  user_tbl where User_Name='${req.body.username}' and export_type<3 and module_code=10 `
        );
        console.log(emp_dms_code[0][0].emp_dms_code, 'emp_dms_code[0][0].emp_dms_code')
        let result;
        if (emp_dms_code[0][0].emp_dms_code == 'EDP') {
            result = await sequelize.query(`WITH godown_cte AS (
    SELECT REPLACE(newcar_rcpt, '-S', '') AS loc_cd, godw_code, Godw_Name,
           ROW_NUMBER() OVER (PARTITION BY REPLACE(newcar_rcpt, '-S', '') ORDER BY export_type) AS rn
    FROM godown_mst
    WHERE export_type <= 3
),
model_cte AS (
    SELECT Modl_Code, Modl_Name, Item_Code, Modl_Grp,
           ROW_NUMBER() OVER (PARTITION BY Modl_Code ORDER BY Modl_Code) AS rn
    FROM Modl_Mst
),
dise_aprvl_cte AS (
    SELECT UTD, is_gd, Appr_1_Stat, Appr_2_Stat, reapp_emp, Appr_1_Rem, Appr_2_Rem, fin_appr,
           ROW_NUMBER() OVER (PARTITION BY UTD ORDER BY tran_id) AS rn
    FROM dise_aprvl
    WHERE export_type < 3
),
chas_cte AS (
    SELECT GD_FDI_ID, (SELECT TOP 1 Chas_no from Chas_mst where Chas_mst.Chas_Id = Chas_Alot.CHAS_ID) AS ChasNo, Created_AT AS AllotedDate, Alottment_Rem, Export_Type,
           ROW_NUMBER() OVER (PARTITION BY GD_FDI_ID ORDER BY GD_FDI_ID) AS rn
    FROM Chas_Alot
    WHERE Export_Type = 1
)
SELECT 
    GD.UTD, GD.Trans_ID, GD.Trans_Date, GD.Trans_Ref_Date, GD.Variant_CD, GD.ECOLOR_CD, 
    GD.Cust_Name, GD.Team_Head, GD.Loc_Cd, c.Export_Type AS ExTy,
    g.godw_code AS Godown_Code, g.Godw_Name,
    m.Modl_Name, m.Item_Code, m.Modl_Grp,
    c.ChasNo AS AllotedChassis, c.AllotedDate, c.Alottment_Rem AS Remark,
    da.is_gd, da.Appr_1_Stat AS status1, da.Appr_2_Stat AS status2, 
    da.reapp_emp, da.Appr_1_Rem, da.Appr_2_Rem, da.fin_appr AS final,
    mm.Misc_name AS Color
FROM GD_FDI_TRANS GD
LEFT JOIN godown_cte g ON GD.Loc_Cd = g.loc_cd AND g.rn = 1
LEFT JOIN model_cte m ON GD.Variant_CD = m.Modl_Code AND m.rn = 1
LEFT JOIN chas_cte c ON GD.UTD = c.GD_FDI_ID AND c.rn = 1
LEFT JOIN dise_aprvl_cte da ON GD.UTD = da.UTD AND da.rn = 1
LEFT JOIN misc_mst mm ON GD.ECOLOR_CD = mm.misc_abbr AND mm.misc_type = 10
WHERE GD.TRANS_TYPE = 'ORDBK'  
  AND CAST(GD.TRANS_DATE AS date) BETWEEN '${dateFrom}' AND '${dateto}'
  AND GD.Trans_ID NOT IN (
      SELECT gda.trans_id 
      FROM GD_FDI_TRANS gda 
      WHERE gda.Trans_ID = GD.Trans_ID 
        AND gda.LOC_CD = GD.Loc_Cd 
        AND gda.TRANS_TYPE = 'ordbc'
  )
  AND GD.Loc_Cd IN (
      SELECT REPLACE(newcar_rcpt, '-S', '') 
      FROM godown_mst 
      WHERE godw_code IN (${loc_code})
  )
  AND g.Godw_Code IN (${loc_code});`)
        } else {
            result =
                await sequelize.query(` select * from ( SELECT      UTD,     Trans_ID,     Trans_Date,     Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
        (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<=3) AS Godown_Code,   
          (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<=3) AS Godw_Name,
               (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                   (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                     (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp, 
                    (SELECT Chas_No  from Chas_Mst where Chas_Id = (SELECT TOP 1 CHAS_ID FROM Chas_Alot WHERE GD_FDI_ID = GD_FDI_TRANS.UTD AND Export_Type = 1)) AS AllotedChassis,  
                     (SELECT TOP 1 Created_AT FROM Chas_Alot WHERE GD_FDI_ID = GD_FDI_TRANS.UTD AND Export_Type = 1) AS AllotedDate, 
                     (SELECT TOP 1 Export_Type FROM Chas_Alot WHERE GD_FDI_ID = GD_FDI_TRANS.UTD AND Export_Type = 1) AS ExTy, 
                     (SELECT TOP 1 Alottment_Rem FROM Chas_Alot WHERE GD_FDI_ID = GD_FDI_TRANS.UTD AND Export_Type = 1) AS Remark, 
                     (SELECT TOP 1 tran_id FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id desc) AS tran_id,  
                     (SELECT TOP 1 is_gd FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id desc) AS isgd,
                     (SELECT TOP 1 Appr_1_Stat FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id desc) AS status1,    
                     (SELECT TOP 1 Appr_2_Stat FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id desc) AS status2,  
                     (SELECT TOP 1 Appr_3_Stat FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id desc) AS status3,  
                    (SELECT TOP 1 Appr_1_Rem FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS Appr_1_Rem, 
                       (SELECT TOP 1 Appr_2_Rem FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS Appr_2_Rem, 
                     (SELECT TOP 1 reapp_remark FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id desc) AS isReapproval,
                       (SELECT TOP 1 fin_appr FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS final, 
          (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color FROM GD_FDI_TRANS WHERE 
          TRANS_TYPE = 'ORDBK'  AND cast(TRANS_DATE as date) BETWEEN '${dateFrom}' AND '${dateto}' 
          and TRANS_ID not in (select trans_id from GD_FDI_TRANS gda where gda.TRANS_ID=GD_FDI_TRANS.TRANS_ID 
          and gda.LOC_CD=GD_FDI_TRANS.LOC_CD and gda.TRANS_TYPE='ordbc')   
          And LEFT(Team_head, CHARINDEX(' - ', Team_head) - 1) in( ${emp_dms_code[0][0].emp_dms_code}) ) as ab 
          where Godown_Code in (${loc_code}) order by Trans_Date desc`);
        }
        console.log(result[0].length, 'ggggggg')
        res.status(200).send(result[0]);
    } catch (e) {
        console.log(e);
    }
};
exports.ApprovalDataView = async function (req, res) {
    try {
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const loc_code = req.body.loc_code;
        const Appr_Code = req.body.Appr_Code;
        const sequelize = await dbname(req.headers.compcode);
        let query
        query = `
     select * from (
         select
         iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
                IN (approver1_A, approver1_B) and module_code = 'bookingAllotment' and EMP_CODE collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
                IN (approver2_A, approver2_B) and module_code = 'bookingAllotment' and EMP_CODE collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
                IN (approver3_A, approver3_B) and module_code = 'bookingAllotment' and EMP_CODE collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                   (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
               where empcode =
                   (select iif(Appr_1_Code is not null,Appr_1_Code,
                   (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                    from Approval_Matrix where module_code = 'bookingAllotment' and   EMP_CODE collate database_default = empcode collate database_default)))
                   and   Export_Type < 3) as apr1_name,
                   (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
               where empcode =
                   (select iif(Appr_2_Code is not null,Appr_2_Code,
                   (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                    from Approval_Matrix where  module_code = 'bookingAllotment' and   EMP_CODE collate database_default = empcode collate database_default)))
                   and   Export_Type < 3) as apr2_name,
                   (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
               where empcode = 
                   (select iif(Appr_3_Code is not null,Appr_3_Code,
                   (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                    from Approval_Matrix where module_code = 'bookingAllotment' and   EMP_CODE collate database_default = empcode collate database_default)))
                   and   Export_Type < 3) as apr3_name,
                   iif(Fin_Appr_Stat is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
                  IN (approver1_A, approver1_B) and module_code = 'bookingAllotment' and EMP_CODE collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
                  IN (approver2_A, approver2_B) and module_code = 'bookingAllotment' and EMP_CODE collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
                  IN (approver3_A, approver3_B) and module_code = 'bookingAllotment' and EMP_CODE collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
               (SELECT TOP 1 Chas_No FROM CHAS_MST WHERE CHAS_MST.Chas_Id = Chas_Alot.CHAS_ID) AS ChasNo,
                (select Modl_Name from Modl_Mst where Modl_Code = (select TOP 1 VARIANT_CD from GD_FDI_TRANS where GD_FDI_TRANS.UTD  = GD_FDI_ID)) AS ModelName,
                (select Misc_Name from Misc_Mst where Misc_type = 10 AND Misc_Abbr = (select TOP 1 ECOLOR_CD from GD_FDI_TRANS where GD_FDI_TRANS.UTD  = GD_FDI_ID)) AS Color,
                   * from Chas_Alot where Created_At between '${dateFrom}' and '${dateto}' and LOC_CODE in (${loc_code}) and export_type<3
                   and EMP_CODE in  (select empcode from approval_matrix where 
                     '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
                   ) as dasd 
                 
                     `;



        if (req.body.status == 2) {
            query += `where  (status_khud_ka is null and status_appr is null) order by Created_At`
        } else {
            query += `where  status_khud_ka =${req.body.status}  order by Created_At`

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
exports.ApprovalSystem = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const mainData = req.body.tran_id;
        console.log(mainData)
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

        await processMainData(mainData, sequelize, Appr_Code, Remark);

        return res.status(200).send({ success: true, Message: "Approved Successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).send({ status: false, Message: "Internal Server Error" });
    }
};
exports.RejectSystem = async function (req, res) {
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

        await processMainData1(mainData, sequelize, Appr_Code, Remark);

        return res.status(200).send({ success: true, Message: "Request Rejected Successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).send({ status: false, Message: "Internal Server Error" });
    }
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const processMainData = async (mainData, sequelize, Appr_Code, Remark) => {
    // const t = await sequelize.transaction();
    const backgroundTasks = [];

    try {
        // Pre-fetch necessary static data
        const comp_name_result = await sequelize.query(`SELECT TOP 1 comp_name FROM comp_mst`);
        const comp_name = comp_name_result[0][0]?.comp_name;

        for (const item of mainData) {
            const c = item?.rowData;
            const empcode = c?.EMP_CODE;
            const tran_id = c?.UTD;

            const a = await sequelize.query(
                `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'bookingAllotment'`,
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

                if ((ApprovalLevel === 1 && !approvers.approver2_A && !approvers.approver2_B) ||
                    (ApprovalLevel === 2 && !approvers.approver3_A && !approvers.approver3_B)) {
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
                    query = `
                      UPDATE Chas_Alot
                      SET Appr_1_Code = :Appr_Code,
                          Appr_1_Stat = 1,
                          Appr_1_Rem = :Remark,
                          Appr_1_Date=GETDATE(),
                          Fin_Appr_Stat = :Final_apprvl
                      WHERE UTD = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr_Stat IS NULL
                    `;
                    if (Final_apprvl == 1) {
                        query2 = `
                          UPDATE Chas_Alot
                          SET Export_type = 1
                          WHERE UTD = :tran_id 
                        `;
                    }
                } else if (ApprovalLevel === 2) {
                    query = `
                      UPDATE Chas_Alot
                      SET Appr_2_Code = :Appr_Code,
                          Appr_2_Stat = 1,
                          appr_2_date=GETDATE(),
                          Appr_2_Rem = :Remark,
                          Fin_Appr_Stat = :Final_apprvl
                      WHERE UTD = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr_Stat IS NULL
                    `;
                    if (Final_apprvl == 1) {
                        query2 = `
                        UPDATE Chas_Alot
                        SET Export_type = 1
                        WHERE UTD = :tran_id 
                        `;
                    }
                } else if (ApprovalLevel === 3) {
                    query = `
                      UPDATE Chas_Alot
                      SET Appr_3_Code = :Appr_Code,
                          Appr_3_Stat = 1,
                          Appr_3_Rem = :Remark,
                          Fin_Appr_Stat = 1
                      WHERE UTD = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr_Stat IS NULL
                    `;
                    if (Final_apprvl == 1) {
                        query2 = `
                        UPDATE Chas_Alot
                        SET Export_type = 1
                        WHERE UTD = :tran_id 
                        `;
                    }
                }
                // Execute the update queries
                const [affectedRows] = await sequelize.query(
                    `SELECT * FROM Chas_Alot WHERE UTD = :tran_id`,
                    {
                        replacements: { tran_id }
                        // , transaction: t
                    }
                );

                if (affectedRows.length > 0) {
                    if (query2 !== null) {
                        await sequelize.query(query2, {
                            replacements: { tran_id }
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
                // if (ApprovalLevel === 1) {
                //     const result = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
                //     backgroundTasks.push(() => SendWhatsAppMessgae(result[0][0]?.mobile_no, 'approver_1_approve_message', [
                //         { "type": "text", "text": item?.rowData.SRM_Name },
                //         { "type": "text", "text": item?.rowData?.Cust_Name },
                //         { "type": "text", "text": item?.rowData?.Mob },
                //         { "type": "text", "text": item?.rowData?.modl_name },
                //         { "type": "text", "text": item?.rowData?.apr1_name },
                //         { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
                //         { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
                //         { "type": "text", "text": Remark ? Remark : '(Not Given)' },
                //         { "type": "text", "text": item?.rowData?.apr1_name },
                //         { "type": "text", "text": comp_name }
                //     ]));

                //     if (!Final_apprvl) {
                //         const approver2 = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
                //         const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
                //         if (approver2[0]?.length && approver2[0][0].mobile_no) {
                //             backgroundTasks.push(() => SendWhatsAppMessgae(approver2[0][0].mobile_no, 'disc_appr_msg_l2_new', [
                //                 { "type": "text", "text": outlet_name[0][0].br_extranet },
                //                 { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
                //                 { "type": "text", "text": item?.rowData?.Cust_Name },
                //                 { "type": "text", "text": item?.rowData?.Dise_Amt },
                //                 { "type": "text", "text": item?.rowData?.RM_Name },
                //                 { "type": "text", "text": item?.rowData?.book_date },
                //                 { "type": "text", "text": comp_name }
                //             ]));
                //         }
                //     }
                // } else if (ApprovalLevel === 2) {
                //     const mobile_emp = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
                //     if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
                //         backgroundTasks.push(() => SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_reject_message', [
                //             { "type": "text", "text": item?.rowData?.SRM_Name },
                //             { "type": "text", "text": item?.rowData?.Cust_Name },
                //             { "type": "text", "text": item?.rowData?.Mob },
                //             { "type": "text", "text": item?.rowData?.modl_name },
                //             { "type": "text", "text": item?.rowData?.apr2_name },
                //             { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
                //             { "type": "text", "text": item?.rowData?.Dise_Amt },
                //             { "type": "text", "text": Remark ? Remark : '(Not Given)' },
                //             { "type": "text", "text": item?.rowData?.apr2_name },
                //             { "type": "text", "text": comp_name }
                //         ]));
                //     }
                // }

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
                // for (const task of backgroundTasks) {
                //     await task();
                //     await delay(2000);
                //     // Execute each function in backgroundTasks
                // }
            } catch (err) {
                console.error('Error executing background tasks:', err);
            }
        }, 1000);

    }
};
async function processMainData1(mainData, sequelize, Appr_Code, Remark) {
    // const t = await sequelize.transaction();
    try {
        for (const item of mainData) {
            const c = item?.rowData;
            const empcode = c?.EMP_CODE;
            const tran_id = c?.UTD;

            const a = await sequelize.query(
                `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'bookingAllotment'`,
                {
                    replacements: { empcode }

                    // , transaction: t 
                }
            );

            const mobile_emp = await sequelize.query(`select top 1 mobile_no from employeemaster where empcode='${item?.rowData.SRM}'`)
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
                      UPDATE Chas_Alot
                      SET Appr_1_Code = :Appr_Code,
                          Appr_1_Stat = 0,
                          Appr_1_Rem = :Remark,
                          Fin_Appr_Stat = 0,
                          Appr_1_Date=GETDATE()
                      WHERE UTD = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr_Stat IS NULL;
                    `;
                    // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
                    //     await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData.empname
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.Cust_Name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.Mob
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.modl_name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.apr1_name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.Appr_1_Rem ? item?.rowData?.Appr_1_Rem : '(Not Given)'
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.apr1_name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": comp_name[0][0].comp_name
                    //         }
                    //     ])
                    // }
                } else if (ApprovalLevel === 2) {
                    query = `
            UPDATE Chas_Alot
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr_Stat = 0,
                Appr_1_Date=GETDATE()
            WHERE UTD = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr_Stat IS NULL;
          `;
                    // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
                    //     await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData.empname
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.Cust_Name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.Mob
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.modl_name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.apr2_name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": item?.rowData?.apr2_name
                    //         },
                    //         {
                    //             "type": "text",
                    //             "text": comp_name[0][0].comp_name
                    //         }
                    //     ])
                    // }

                } else if (ApprovalLevel === 3) {
                    query = `
            UPDATE Chas_Alot
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr_Stat = 0,
                Appr_1_Date=GETDATE()
            WHERE UTD = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr_Stat IS NULL;
          `;
                }
                const [affectedRows] = await sequelize.query(
                    `SELECT * FROM Chas_Alot WHERE UTD = :tran_id;`,
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
};



exports.viewgdapproaldataone = async function (req, res) {
    try {
        const loc_code = req.body.loc_code;
        const Booking_id = req.body.Booking_id;
        const search = req.body.search;
        const sequelize = await dbname(req.headers.compcode);
        let result = await sequelize.query(`WITH godown_cte AS (
    SELECT REPLACE(newcar_rcpt, '-S', '') AS loc_cd, godw_code, Godw_Name,
           ROW_NUMBER() OVER (PARTITION BY REPLACE(newcar_rcpt, '-S', '') ORDER BY export_type) AS rn
    FROM godown_mst
    WHERE export_type <= 3
),
model_cte AS (
    SELECT Modl_Code, Modl_Name, Item_Code, Modl_Grp,
           ROW_NUMBER() OVER (PARTITION BY Modl_Code ORDER BY Modl_Code) AS rn
    FROM Modl_Mst
),
dise_aprvl_cte AS (
    SELECT UTD, is_gd, Appr_1_Stat, Appr_2_Stat, reapp_emp, Appr_1_Rem, Appr_2_Rem, fin_appr,
           ROW_NUMBER() OVER (PARTITION BY UTD ORDER BY tran_id) AS rn
    FROM dise_aprvl
    WHERE export_type < 3
),
chas_cte AS (
    SELECT GD_FDI_ID, (SELECT TOP 1 Chas_no from Chas_mst where Chas_mst.Chas_Id = Chas_Alot.CHAS_ID) AS ChasNo, Created_AT AS AllotedDate, Alottment_Rem, Export_Type,
           ROW_NUMBER() OVER (PARTITION BY GD_FDI_ID ORDER BY GD_FDI_ID) AS rn
    FROM Chas_Alot
    WHERE Export_Type = 1
)
SELECT 
    GD.UTD, GD.Trans_ID, GD.Trans_Date, GD.Trans_Ref_Date, GD.Variant_CD, GD.ECOLOR_CD, 
    GD.Cust_Name, GD.Team_Head, GD.Loc_Cd, c.Export_Type AS ExTy,
    g.godw_code AS Godown_Code, g.Godw_Name,
    m.Modl_Name, m.Item_Code, m.Modl_Grp,
    c.ChasNo AS AllotedChassis, c.AllotedDate, c.Alottment_Rem AS Remark,
    da.is_gd, da.Appr_1_Stat AS status1, da.Appr_2_Stat AS status2, 
    da.reapp_emp, da.Appr_1_Rem, da.Appr_2_Rem, da.fin_appr AS final,
    mm.Misc_name AS Color
FROM GD_FDI_TRANS GD
LEFT JOIN godown_cte g ON GD.Loc_Cd = g.loc_cd AND g.rn = 1
LEFT JOIN model_cte m ON GD.Variant_CD = m.Modl_Code AND m.rn = 1
LEFT JOIN chas_cte c ON GD.UTD = c.GD_FDI_ID AND c.rn = 1
LEFT JOIN dise_aprvl_cte da ON GD.UTD = da.UTD AND da.rn = 1
LEFT JOIN misc_mst mm ON GD.ECOLOR_CD = mm.misc_abbr AND mm.misc_type = 10
WHERE GD.TRANS_TYPE = 'ORDBK'  
  AND GD.Trans_ID NOT IN (
      SELECT gda.trans_id 
      FROM GD_FDI_TRANS gda 
      WHERE gda.Trans_ID = GD.Trans_ID 
        AND gda.LOC_CD = GD.Loc_Cd 
        AND gda.TRANS_TYPE = 'ordbc'
  )
  AND GD.Loc_Cd IN (
      SELECT REPLACE(newcar_rcpt, '-S', '') 
      FROM godown_mst 
      WHERE godw_code IN (${loc_code})
  )
        AND g.Godw_Code IN (${loc_code}) and GD.trans_id='${Booking_id}'`)
        const isAlredy = await sequelize.query(`select (select top 1 chas_no from chas_mst where chas_mst.chas_id=chas_alot.chas_id)as Chas_No
        from chas_alot where booking_id ='${Booking_id}' and export_type=1 and loc_code='${loc_code}' and chas_id not in (select chas_id from chas_mst where chas_no ='${search}')`)
        res.status(200).send({ result: isAlredy[0].length > 0 ? isAlredy[0] : result[0], isAlredy: isAlredy[0].length > 0 ? true : false });
    } catch (e) {
        console.log(e);
    }
};


exports.ChassisViewSingle = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const Chas_Id = req.body.Chas_Id;
        const Items = await sequelize.query(`select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS ModelName,
       (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
    DATEDIFF(day, PInv_Date, GETDATE()) AS AgeingInDays,
    (select top 1 booking_id from chas_alot where chas_alot.chas_id=CHAS_MST.chas_id and chas_alot.export_type=1)as Booking_id,
    (select top 1 UTD from chas_alot where chas_alot.chas_id=CHAS_MST.chas_id and chas_alot.export_type=1)as UTD,
    (SELECT TOP 1 Godw_Name FRom Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code) AS BranchName
    ,* from CHAS_MST WHERE 
      Chas_No='${Chas_Id}'  AND 
    CHAS_ID in(
SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code}) group by CHAS_ID
	having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0 )

	union all

	select 
    (SELECT TOP 1 Modl_Name FROM Modl_Mst where Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS ModelName,
       (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
    DATEDIFF(day, PInv_Date, GETDATE()) AS AgeingInDays,
    (select top 1 booking_id from chas_alot where chas_alot.chas_id=CHAS_MST.chas_id and chas_alot.export_type=1)as Booking_id,
    (select top 1 UTD from chas_alot where chas_alot.chas_id=CHAS_MST.chas_id and chas_alot.export_type=1)as UTD,
    (SELECT TOP 1 Godw_Name FRom Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code) AS BranchName
    ,* from CHAS_MST WHERE 
      Chas_No='${Chas_Id}'  AND 
   CHAS_ID in(
	 SELECT DISTINCT CHAS_ID
             FROM CHAS_TRANSIT
             WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code})
             and CHAS_ID not in (SELECT DISTINCT CHAS_ID
             FROM CHAS_TRAN
             WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code in (${Loc_Code})
             GROUP BY CHAS_ID
             HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0)
             GROUP BY CHAS_ID
             HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0  )`);
        res.send({ success: true, Chassis: Items[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.ChasisViewStock = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const Chas_Id = req.body.Chas_Id;
        const result = await sequelize.query(`select * from chas_alot where CHAS_ID='${Chas_Id}' and export_type=1`)
        res.send(result[0][0]);
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};