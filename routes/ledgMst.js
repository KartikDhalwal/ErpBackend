const { Sequelize, DataTypes, literal, QueryTypes, Op } = require('sequelize');
const { dbname } = require('../utils/dbconfig');
const Joi = require('joi');
const { _LedgMst, LedgMstSchema } = require("../models/LedgMst");

const FormData = require("form-data");
const axios = require("axios");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const e = require('express');

exports.findMasters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const result4 = await sequelize.query('select CAST(Misc_Code AS VARCHAR) as value, Misc_Name AS label from Misc_Mst where Misc_Type = 3');
        const recordSet5 = await sequelize.query(`select CAST(Godw_Name AS VARCHAR) as label,CAST(Godw_Code AS VARCHAR) as value from GODOWN_MST where Godw_Code in (${multi_loc}) and export_type<3`);
        const recordSet6 = await sequelize.query('select CAST(Group_Code AS VARCHAR) as value,group_name AS label from Grup_Mst ');
        const recordSet7 = await sequelize.query('select CAST(Ledg_Name AS VARCHAR) as label,CAST(Ledg_Code AS VARCHAR) as value from Ledg_Mst where Group_Code=2559');
        const recordSet8 = await sequelize.query('select CAST(Misc_Code AS VARCHAR) as value,Misc_Name AS label from Misc_Mst where Misc_Type=1');
        const recordSet9 = await sequelize.query('select CAST(SECTION_ID AS VARCHAR) as value,SECTION_NAME AS label from TDS_SECTION');
        const recordSet10 = await sequelize.query('select CAST(Misc_Code AS VARCHAR) as value,Misc_Name AS label from Misc_Mst where Misc_Type=2');
        const recordSet11 = await sequelize.query('select CAST(GST_CODE AS VARCHAR) as value ,HEAD AS label  from  GSTRATE;');
        // const recordSet12 = await sequelize.query('select HSN_CODE AS value,Description AS label from HSNRATE ');
        const AllBranches = await sequelize.query('select Godw_Name from Godown_Mst');
        const MaxLedgCode = await sequelize.query('SELECT isnull(max(Ledg_Code)+1,1) AS LedgCode from Ledg_Mst');

        res.send({
            success: true, states: result4[0], branch: recordSet5[0], ledggroup: recordSet6[0], tdsledg: recordSet7[0],
            tehcode: recordSet8[0], tdssection: recordSet9[0], dist: recordSet10[0], gstcode: recordSet11[0],
            AllBranches: AllBranches[0], Ledg_Code: MaxLedgCode[0][0].LedgCode
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};
exports.findMaxLedgCode = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const MaxLedgCode = await sequelize.query('SELECT isnull(max(Ledg_Code)+1,1) AS LedgCode from Ledg_Mst');
        res.send({
            success: true, Ledg_Code: MaxLedgCode[0][0].LedgCode
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};
exports.AccStatmentLedg = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const Ledg_Code = req.body.Ledg_Code;
        const Data = await sequelize.query(`WITH MonthlyBalances AS (
            SELECT 
                MONTH(Acnt_Date) AS MonthNumber,
                COALESCE(SUM(CASE WHEN amt_drcr = 1 THEN Post_Amt ELSE 0 END), 0) AS TotalDebit,
                COALESCE(SUM(CASE WHEN amt_drcr = 2 THEN Post_Amt ELSE 0 END), 0) AS TotalCredit
            FROM 
                ACNT_POST
            WHERE 
                Ledg_Ac = ${Ledg_Code}
                AND Export_type < 5
                AND Loc_Code in (${multi_loc})
            GROUP BY 
                MONTH(Acnt_Date)
        ),
        AllMonths AS (
            SELECT 1 AS MonthNumber, 'January' AS MonthName
            UNION SELECT 2, 'February' UNION SELECT 3, 'March' UNION SELECT 4, 'April' UNION SELECT 5, 'May' UNION SELECT 6, 'June' 
            UNION SELECT 7, 'July' UNION SELECT 8, 'August' UNION SELECT 9, 'September' UNION SELECT 10, 'October' UNION SELECT 11, 'November' UNION SELECT 12, 'December'
        )
        SELECT 
            AllMonths.MonthName,
            COALESCE(MB.OpeningBalance, 0) AS OpeningBalance,
            COALESCE(MB.TotalDebit, 0) AS TotalDebit,
            COALESCE(MB.TotalCredit, 0) AS TotalCredit,
            COALESCE(MB.OpeningBalance, 0) + COALESCE(MB.TotalDebit, 0) - COALESCE(MB.TotalCredit, 0) AS ClosingBalance
        FROM 
            AllMonths
        LEFT JOIN (
            SELECT 
                MonthNumber,
                TotalDebit,
                TotalCredit,
                LAG(COALESCE(TotalDebit, 0) - COALESCE(TotalCredit, 0), 1, 0) OVER (ORDER BY MonthNumber) AS OpeningBalance
            FROM 
                MonthlyBalances
        ) MB ON AllMonths.MonthNumber = MB.MonthNumber
        ORDER BY 
            AllMonths.MonthNumber;`);
        res.send({
            success: true, Data: Data[0]
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};
exports.FinLedger = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.multi_loc ? req.body.multi_loc : 0;
        const Ledg_Code = req.body.Ledg_Code;
        // const LedgMst = _LedgMst(sequelize, DataTypes);
        // console.log(Ledg_Code)
        // Con
        const LedgMst_ = await sequelize.query(`SELECT * FROM Ledg_Mst where Ledg_Code = ${Ledg_Code}`);
        const RCN_ = await sequelize.query(
            `
              SELECT Ledg_Code,Item_Code,Rate,Party_Rate,Qty_From,Qty_Upto, 
                     CAST(Valid_From AS DATE) AS Valid_From, 
                     CAST(Valid_Upto AS DATE) AS Valid_Upto
              FROM Ledg_RCN 
              WHERE Ledg_Code = ${Ledg_Code};`
        );

        LedgMst_[0][0].EmpExperience = RCN_[0];
        res.send({
            success: true, Data: LedgMst_[0][0]
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};
exports.LedgerView = async function (req, res) {
    console.log(req.body)
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const searchText = req.body.searchText;
        const Data = await sequelize.query(`SELECT TOP 20
        LM.Ledg_Name,
        LM.Ledg_Abbr,
        LM.Ledg_Code,
        LM.Loc_Code,
        LM.Group_Code,
        LM.state_code,
        LM.gst,
        GM.Group_Name,
        GD.Godw_Code,
        CASE
            WHEN LM.Loc_Code = 0 THEN 'Generic'
            ELSE GD.Godw_Name
        END AS Godw_Name
    FROM
        Ledg_Mst LM
    LEFT JOIN
        Grup_Mst GM ON LM.Group_Code = GM.Group_Code
    LEFT JOIN
        (SELECT * FROM GODOWN_MST WHERE EXPORT_TYPE < 3) GD ON LM.Loc_Code = GD.Godw_Code
    WHERE
        (LM.Loc_Code IN (0) OR LM.Loc_Code IN (${Loc_Code}))
        AND LM.Export_Type  <> 33                                                                                                                                                                      
        AND (LM.Ledg_Name LIKE '%${searchText}%' OR LM.Ledg_Abbr LIKE '%${searchText}%' OR LM.Ledg_Code LIKE '%${searchText}%' OR GM.Group_Name LIKE '%${searchText}%');`);
        res.send({
            success: true, Data: Data[0]
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};
exports.LedgerSave = async function (req, res) {
    const LedgData = req.body;
    const sequelize = await dbname(req.headers.compcode);
    console.log(LedgData, 'hjgjgyvkgkgv')
    const bodyLedgNameUpper = LedgData.Ledg_Name.toUpperCase().trim();
    const result =
        await sequelize.query(`SELECT UPPER(REPLACE(LTRIM(RTRIM(Ledg_Name)), ' ', '')) AS Ledg_Name 
      FROM Ledg_Mst 
      WHERE Loc_code = '1' 
      AND Export_Type < 3 
      AND (LTRIM(RTRIM(Ledg_Name))) = '${bodyLedgNameUpper}'`);

    if (result[0].length > 0) {
        res.status(400).send("Ledger Account Already Exist")
        return;
    }
    function convertBooleansToIntegers(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'boolean') {
                obj[key] = obj[key] ? '1' : '0';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                convertBooleansToIntegers(obj[key]);
            }
        }
    }
    convertBooleansToIntegers(LedgData);
    // const { error, value: LedgerData } = LedgMstSchema.validate(BodyData, {
    //     abortEarly: false,
    //     stripUnknown: true
    // });
    // // console.log(error,'error')
    // if (error) {
    //     const errorMessage = error.details.map(err => err.message).join(', ');
    //     console.log(errorMessage)
    //     return res.status(400).send({ success: false, message: errorMessage });
    // }
    // console.log(error, 'error')
    const t = await sequelize.transaction();
    // const LedgMst = _LedgMst(sequelize, DataTypes);
    try {
        const MaxLedgCode = await sequelize.query(`SELECT isnull(max(Ledg_Code)+1,1) AS LedgCode from Ledg_Mst`, { transaction: t });
        let Ledg_Code = MaxLedgCode[0][0]?.LedgCode;
        if (LedgData.All_Br === 1) {
            LedgData.Loc_code = 0;
            LedgData.Post_Branch = 0;
        }
        const Groupcheck = await sequelize.query(`SELECT Group_Name FROM Grup_Mst WHERE Group_Code = '${LedgData.Group_Code}'`);
        if (Groupcheck[0][0].Group_Name.toUpperCase().includes('SUNDRY DEBTORS')) {
            LedgData.Ledg_Class = 29;
        } else if (Groupcheck[0][0].Group_Name.toUpperCase().includes('SUNDRY CREDITORS')) {
            LedgData.Ledg_Class = 21;
        } else if (Groupcheck[0][0].Group_Name.toUpperCase().includes('CASH')) {
            LedgData.Ledg_Class = 24;
        } else if (Groupcheck[0][0].Group_Name.toUpperCase().includes('BANK')) {
            LedgData.Ledg_Class = 23;
        } else {
            LedgData.Ledg_Class = null;
        }
        // await LedgMst.create({ ...LedgerData, Ledg_Code, Created_By }, { transaction: t });

        await sequelize.query(`INSERT INTO Ledg_Mst (
    IEC_No, Ledg_Code,Ledg_Class, Ledg_Name, Ledg_Add6, Exc_Comm, Group_Code, Loc_code, Post_Branch, Ledg_Abbr, State_Code, Ledg_Pan, Form60, GSTTYPE, GST_No, PARTYTYPE, Country, MSME, IsEComerce, ECC_No, Ledg_Tin, Ledg_Name3, Ledg_Ph1, Ledg_Email, Ledg_Ph2, Ledg_Ph3, Ledg_PIN, Dist_Code, Teh_Code, Ledg_Add1, Ledg_Add2, GST_Type, COMP_ACT_GRP, Chap_Head, GST, Exc_Div, HSBC_Flag, IsBilltoBill, All_Br, Cntrl_Acnt, Insu_Cntrl, Item_Post, IsLockManual, ManualLock_From, PostHold_From, IsInvFund, OD_Ageing, NormalInt, OverDueInt, IsIB, IsPost, IsDr, IsCr, IB_Locked, BackDays, IB_NewRef, IB_AgnstRef, Bank_Type, BankApiEnabled, Self_Bank_Trf, CORP_CC, Bank_Name1, Br1_Add1, Ac_No1, Ifsc_Code1, TDS_Ledg, TDS_Perc, Party_Status, TDS_SECTION, Srv_Tax, TCS_Flag, Ledg_Limit, INTR_RATE, INTR_DAYS, Op_Bal, Cl_Bal, Emp_Code, Export_Type, Ledg_Name2, Email2, ENTR_PC
) VALUES (
    ${LedgData.IEC_No ? `'${LedgData.IEC_No}'` : null}, 
    ${Ledg_Code}, 
    ${LedgData.Ledg_Class ? LedgData.Ledg_Class : null}, 
    ${LedgData.Ledg_Name ? `'${LedgData.Ledg_Name}'` : null}, 
    ${LedgData.Ledg_Add6 ? `'${LedgData.Ledg_Add6}'` : null}, 
    ${LedgData.Exc_Comm ? `'${LedgData.Exc_Comm}'` : null}, 
    ${LedgData.Group_Code ? LedgData.Group_Code : null}, 
    ${LedgData.Loc_code ? LedgData.Loc_code : null}, 
    ${LedgData.Post_Branch ? `'${LedgData.Post_Branch}'` : null}, 
    ${LedgData.Ledg_Abbr ? `'${LedgData.Ledg_Abbr}'` : null}, 
    ${LedgData.State_Code ? `'${LedgData.State_Code}'` : null}, 
    ${LedgData.Ledg_Pan ? `'${LedgData.Ledg_Pan}'` : null}, 
    ${LedgData.Form60 !== undefined ? LedgData.Form60 : null}, 
    ${LedgData.GSTTYPE ? `'${LedgData.GSTTYPE}'` : null}, 
    ${LedgData.GST_No ? `'${LedgData.GST_No}'` : null}, 
    ${LedgData.PARTYTYPE ? `'${LedgData.PARTYTYPE}'` : null}, 
    ${LedgData.Country ? `'${LedgData.Country}'` : null}, 
    ${LedgData.MSME ? `'${LedgData.MSME}'` : null}, 
    ${LedgData.IsEComerce !== undefined ? LedgData.IsEComerce : null}, 
    ${LedgData.ECC_No ? `'${LedgData.ECC_No}'` : null}, 
    ${LedgData.Ledg_Tin ? `'${LedgData.Ledg_Tin}'` : null}, 
    ${LedgData.Ledg_Name3 ? `'${LedgData.Ledg_Name3}'` : null}, 
    ${LedgData.Ledg_Ph1 ? `'${LedgData.Ledg_Ph1}'` : null}, 
    ${LedgData.Ledg_Email ? `'${LedgData.Ledg_Email}'` : null}, 
    ${LedgData.Ledg_Ph2 ? `'${LedgData.Ledg_Ph2}'` : null}, 
    ${LedgData.Ledg_Ph3 ? `'${LedgData.Ledg_Ph3}'` : null}, 
    ${LedgData.Ledg_PIN ? `'${LedgData.Ledg_PIN}'` : null}, 
    ${LedgData.Dist_Code ? `'${LedgData.Dist_Code}'` : null}, 
    ${LedgData.Teh_Code ? `'${LedgData.Teh_Code}'` : null}, 
    ${LedgData.Ledg_Add1 ? `'${LedgData.Ledg_Add1}'` : null}, 
    ${LedgData.Ledg_Add2 ? `'${LedgData.Ledg_Add2}'` : null}, 
    ${LedgData.GST_Type ? LedgData.GST_Type : null}, 
    ${LedgData.COMP_ACT_GRP ? LedgData.COMP_ACT_GRP : null}, 
    ${LedgData.Chap_Head ? `'${LedgData.Chap_Head}'` : null}, 
    ${LedgData.GST ? `'${LedgData.GST}'` : null}, 
    ${LedgData.Exc_Div ? `'${LedgData.Exc_Div}'` : null}, 
    ${LedgData.HSBC_Flag ? LedgData.HSBC_Flag : null}, 
    ${LedgData.IsBilltoBill !== undefined ? LedgData.IsBilltoBill : null}, 
    ${LedgData.All_Br ? LedgData.All_Br : null}, 
    ${LedgData.Cntrl_Acnt ? LedgData.Cntrl_Acnt : null}, 
    ${LedgData.Insu_Cntrl ? LedgData.Insu_Cntrl : null}, 
    ${LedgData.Item_Post ? `'${LedgData.Item_Post}'` : null}, 
    ${LedgData.IsLockManual !== undefined ? LedgData.IsLockManual : null}, 
    ${LedgData.ManualLock_From ? `'${LedgData.ManualLock_From}'` : null}, 
    ${LedgData.PostHold_From ? `'${LedgData.PostHold_From}'` : null}, 
    ${LedgData.IsInvFund !== undefined ? LedgData.IsInvFund : null}, 
    ${LedgData.OD_Ageing ? LedgData.OD_Ageing : null}, 
    ${LedgData.NormalInt ? LedgData.NormalInt : null}, 
    ${LedgData.OverDueInt ? LedgData.OverDueInt : null}, 
    ${LedgData.IsIB !== undefined ? LedgData.IsIB : null}, 
    ${LedgData.IsPost !== undefined ? LedgData.IsPost : null}, 
    ${LedgData.IsDr !== undefined ? LedgData.IsDr : null}, 
    ${LedgData.IsCr !== undefined ? LedgData.IsCr : null}, 
    ${LedgData.IB_Locked ? `'${LedgData.IB_Locked}'` : null}, 
    ${LedgData.BackDays ? LedgData.BackDays : null}, 
    ${LedgData.IB_NewRef ? LedgData.IB_NewRef : null}, 
    ${LedgData.IB_AgnstRef ? LedgData.IB_AgnstRef : null}, 
    ${LedgData.Bank_Type ? LedgData.Bank_Type : null}, 
    ${LedgData.BankApiEnabled !== undefined ? LedgData.BankApiEnabled : null}, 
    ${LedgData.Self_Bank_Trf !== undefined ? LedgData.Self_Bank_Trf : null}, 
    ${LedgData.CORP_CC ? LedgData.CORP_CC : null}, 
    ${LedgData.Bank_Name1 ? `'${LedgData.Bank_Name1}'` : null}, 
    ${LedgData.Br1_Add1 ? `'${LedgData.Br1_Add1}'` : null}, 
    ${LedgData.Ac_No1 ? `'${LedgData.Ac_No1}'` : null}, 
    ${LedgData.Ifsc_Code1 ? `'${LedgData.Ifsc_Code1}'` : null}, 
    ${LedgData.TDS_Ledg ? LedgData.TDS_Ledg : null}, 
    ${LedgData.TDS_Perc ? LedgData.TDS_Perc : null}, 
    ${LedgData.Party_Status ? LedgData.Party_Status : null}, 
    ${LedgData.TDS_SECTION ? LedgData.TDS_SECTION : null}, 
    ${LedgData.Srv_Tax ? `'${LedgData.Srv_Tax}'` : null}, 
    ${LedgData.TCS_Flag !== undefined ? LedgData.TCS_Flag : null}, 
    ${LedgData.Ledg_Limit ? `'${LedgData.Ledg_Limit}'` : null}, 
    ${LedgData.INTR_RATE ? `'${LedgData.INTR_RATE}'` : null}, 
    ${LedgData.INTR_DAYS ? `'${LedgData.INTR_DAYS}'` : null}, 
    ${LedgData.Op_Bal ? LedgData.Op_Bal : null}, 
    ${LedgData.Cl_Bal ? LedgData.Cl_Bal : null}, 
    ${LedgData.Emp_Code ? `'${LedgData.Emp_Code}'` : null}, 
    ${LedgData.Export_Type ? LedgData.Export_Type : null}, 
    ${LedgData.Ledg_Name2 ? `'${LedgData.Ledg_Name2}'` : null}, 
    ${LedgData.Email2 ? `'${LedgData.Email2}'` : null},
    'CLOUD-${LedgData.Created_By}');`, { transaction: t });



        if (LedgData.EmpExperience) {
            for (const data of LedgData.EmpExperience) {
                await sequelize.query(`
                    INSERT INTO ledg_RCN (ledg_code, Item_Code, Rate, Party_Rate, Valid_From, Valid_Upto, Qty_From, Qty_Upto) 
                    VALUES ('${Ledg_Code}','${data.Item_Code}', ${data.Rate}, ${data.Party_Rate}, '${data.Valid_From}', '${data.Valid_Upto}', ${data.Qty_From}, ${data.Qty_Upto});
                `, { transaction: t });
            }
        }


        await t.commit();
        res.status(200).send({ success: true, message: 'Ledger Saved', icon: 'success' });
    } catch (error) {
        await t.rollback();
        console.log(error)
        res.status(500).send({ success: false, message: 'An error occurred while Saving Data', error, icon: 'warning' });
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.FindGroupPath = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Group_Code = req.body.Group_Code;
        const Data = await sequelize.query(`WITH RecursiveHierarchy AS (
            SELECT Group_Code, Group_Name, Sub_Group, CAST(Group_Name AS NVARCHAR(MAX)) AS Group_Path
            FROM Grup_Mst
            WHERE Group_Code = '${Group_Code}'
            UNION ALL
            SELECT gm.Group_Code, gm.Group_Name, gm.Sub_Group, CAST(gm.Group_Name + '  |  ' + rh.Group_Path   AS NVARCHAR(MAX))
            FROM Grup_Mst gm
            INNER JOIN RecursiveHierarchy rh ON gm.Group_Code = rh.Sub_Group
          )
          SELECT DISTINCT Group_Code, Group_Path
          FROM RecursiveHierarchy;`);
        res.send({
            success: true, Data: Data[0][0]
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};
exports.AccountExport = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "Account Summary Report";
        const Loc_Code = req.query.Loc_Code;
        const Ledg_Code = req.query.Ledg_Code;
        console.log(Ledg_Code)
        console.log(Loc_Code)

        const txnDetails = await sequelize.query(
            `SELECT 
                FORMAT(Acnt_Date, 'dd-MMM-yyyy') AS Voucher_Date,
                Bill_Ref AS Voucher_Number, 
                (SELECT TOP 1 Book_Name FROM Book_mst WHERE Book_Code = Acnt_post.Book_Code) AS Particulars,
                Chq_No AS Cheque_No,
                (SELECT TOP 1 Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = Ledg_Ac) AS LedgerAC,
                CASE 
                    WHEN Amt_drcr = '1' THEN Post_Amt
                    WHEN Amt_drcr = '2' THEN 0
                    ELSE NULL
                END AS Debit,
                CASE 
                    WHEN Amt_drcr = '2' THEN Post_Amt
                    WHEN Amt_drcr = '1' THEN 0
                    ELSE NULL
                END AS Credit
                FROM 
                    ACNT_POST
                WHERE 
                    Ledg_Ac = ${Ledg_Code}
                    AND Acnt_Date >= CASE 
                                        WHEN MONTH(GETDATE()) >= 4 
                                        THEN DATEFROMPARTS(YEAR(GETDATE()), 4, 1)
                                        ELSE DATEFROMPARTS(YEAR(GETDATE()) - 1, 4, 1)
                                     END
                    AND Acnt_Date < CASE 
                                        WHEN MONTH(GETDATE()) >= 4 
                                        THEN DATEFROMPARTS(YEAR(GETDATE()) + 1, 4, 1)
                                        ELSE DATEFROMPARTS(YEAR(GETDATE()), 4, 1)
                                    END;`);

        const Company_Name = await sequelize.query(
            `select top 1 comp_name from Comp_Mst`
        );
        const BranchDetails = await sequelize.query(
            `select top 1 * from Godown_Mst WHERE Godw_Code = ${Loc_Code}`
        );
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");
        worksheet.mergeCells("A1:G1");
        worksheet.getCell("A1").value = `${BranchDetails[0][0].TRADE_NAME}`; // Replace with your company name
        worksheet.getCell("A1").alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
        worksheet.mergeCells("A2:G2");
        worksheet.getCell("A2").value = `${BranchDetails[0][0].Godw_Add1}`; // Replace with your company name
        worksheet.getCell("A2").alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        worksheet.mergeCells("A3:G3");
        worksheet.getCell("A3").value = `${BranchDetails[0][0].Godw_Add2}`; // Replace with your company name
        worksheet.getCell("A3").alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        worksheet.mergeCells("A4:G4");
        worksheet.getCell("A4").value = `${BranchDetails[0][0].Godw_Add3}`;
        worksheet.getCell("A4").alignment = {
            vertical: "middle",
            horizontal: "center",
        };

        const headers = Object.keys(txnDetails[0][0]);
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" },
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
            'attachment; filename="Account_Statement.xlsx"'
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
            'attachment; filename="Account Statement.xlsx"'
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
exports.UpdateLedger = async function (req, res) {
    const LedgData = req.body;
    console.log(LedgData, 'BodyData')
    function convertBooleansToIntegers(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'boolean') {
                obj[key] = obj[key] ? '1' : '0';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                convertBooleansToIntegers(obj[key]);
            }
        }
    }
    convertBooleansToIntegers(LedgData);
    // const { error, value: LedgerData } = LedgMstSchema.validate(BodyData, {
    //     abortEarly: false,
    //     stripUnknown: true
    // });
    // console.log(error, 'error')
    // if (error) {
    //     const errorMessage = error.details.map(err => err.message).join(', ');
    //     return res.status(400).send({ success: false, message: errorMessage });
    // } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    // const LedgMst = _LedgMst(sequelize, DataTypes);
    try {
        if (LedgData.All_Br === 1) {
            LedgData.Loc_code = 0;
            LedgData.Post_Branch = 0;
        }
        const Groupcheck = await sequelize.query(`SELECT Group_Name FROM Grup_Mst WHERE Group_Code = '${LedgData.Group_Code}'`);
        if (Groupcheck[0][0].Group_Name.toUpperCase().includes('SUNDRY DEBTORS')) {
            LedgData.Ledg_Class = 29;
        } else if (Groupcheck[0][0].Group_Name.toUpperCase().includes('SUNDRY CREDITORS')) {
            LedgData.Ledg_Class = 21;
        } else if (Groupcheck[0][0].Group_Name.toUpperCase().includes('CASH')) {
            LedgData.Ledg_Class = 24;
        } else if (Groupcheck[0][0].Group_Name.toUpperCase().includes('BANK')) {
            LedgData.Ledg_Class = 23;
        } else {
            LedgData.Ledg_Class = null;
        }
        await sequelize.query(`INSERT INTO Ledg_Mst_Hst select * from Ledg_Mst where Ledg_Code = ${LedgData.Ledg_Code}`, { transaction: t })
        await sequelize.query(`UPDATE Ledg_Mst
SET
    IEC_No = ${LedgData.IEC_No ? `'${LedgData.IEC_No}'` : null},
    Ledg_Class = ${LedgData.Ledg_Class ? LedgData.Ledg_Class : null},
    Ledg_Name = ${LedgData.Ledg_Name ? `'${LedgData.Ledg_Name}'` : null},
    Ledg_Add6 = ${LedgData.Ledg_Add6 ? `'${LedgData.Ledg_Add6}'` : null},
    Exc_Comm = ${LedgData.Exc_Comm ? `'${LedgData.Exc_Comm}'` : null},
    Group_Code = ${LedgData.Group_Code ? LedgData.Group_Code : null},
    Loc_code = ${LedgData.Loc_code ? LedgData.Loc_code : null},
    Post_Branch = ${LedgData.Post_Branch ? `'${LedgData.Post_Branch}'` : null},
    Ledg_Abbr = ${LedgData.Ledg_Abbr ? `'${LedgData.Ledg_Abbr}'` : null},
    State_Code = ${LedgData.State_Code ? `'${LedgData.State_Code}'` : null},
    Ledg_Pan = ${LedgData.Ledg_Pan ? `'${LedgData.Ledg_Pan}'` : null},
    Form60 = ${LedgData.Form60 !== undefined ? LedgData.Form60 : null},
    GSTTYPE = ${LedgData.GSTTYPE ? `'${LedgData.GSTTYPE}'` : null},
    GST_No = ${LedgData.GST_No ? `'${LedgData.GST_No}'` : null},
    PARTYTYPE = ${LedgData.PARTYTYPE ? `'${LedgData.PARTYTYPE}'` : null},
    Country = ${LedgData.Country ? `'${LedgData.Country}'` : null},
    MSME = ${LedgData.MSME ? `'${LedgData.MSME}'` : null},
    IsEComerce = ${LedgData.IsEComerce !== undefined ? LedgData.IsEComerce : null},
    ECC_No = ${LedgData.ECC_No ? `'${LedgData.ECC_No}'` : null},
    Ledg_Tin = ${LedgData.Ledg_Tin ? `'${LedgData.Ledg_Tin}'` : null},
    Ledg_Name3 = ${LedgData.Ledg_Name3 ? `'${LedgData.Ledg_Name3}'` : null},
    Ledg_Ph1 = ${LedgData.Ledg_Ph1 ? `'${LedgData.Ledg_Ph1}'` : null},
    Ledg_Email = ${LedgData.Ledg_Email ? `'${LedgData.Ledg_Email}'` : null},
    Ledg_Ph2 = ${LedgData.Ledg_Ph2 ? `'${LedgData.Ledg_Ph2}'` : null},
    Ledg_Ph3 = ${LedgData.Ledg_Ph3 ? `'${LedgData.Ledg_Ph3}'` : null},
    Ledg_PIN = ${LedgData.Ledg_PIN ? `'${LedgData.Ledg_PIN}'` : null},
    Dist_Code = ${LedgData.Dist_Code ? `'${LedgData.Dist_Code}'` : null},
    Teh_Code = ${LedgData.Teh_Code ? `'${LedgData.Teh_Code}'` : null},
    Ledg_Add1 = ${LedgData.Ledg_Add1 ? `'${LedgData.Ledg_Add1}'` : null},
    Ledg_Add2 = ${LedgData.Ledg_Add2 ? `'${LedgData.Ledg_Add2}'` : null},
    GST_Type = ${LedgData.GST_Type ? LedgData.GST_Type : null},
    COMP_ACT_GRP = ${LedgData.COMP_ACT_GRP ? LedgData.COMP_ACT_GRP : null},
    Chap_Head = ${LedgData.Chap_Head ? `'${LedgData.Chap_Head}'` : null},
    GST = ${LedgData.GST ? `'${LedgData.GST}'` : null},
    Exc_Div = ${LedgData.Exc_Div ? `'${LedgData.Exc_Div}'` : null},
    HSBC_Flag = ${LedgData.HSBC_Flag ? LedgData.HSBC_Flag : null},
    IsBilltoBill = ${LedgData.IsBilltoBill !== undefined ? LedgData.IsBilltoBill : null},
    All_Br = ${LedgData.All_Br ? LedgData.All_Br : null},
    Cntrl_Acnt = ${LedgData.Cntrl_Acnt ? LedgData.Cntrl_Acnt : null},
    Insu_Cntrl = ${LedgData.Insu_Cntrl ? LedgData.Insu_Cntrl : null},
    Item_Post = ${LedgData.Item_Post ? `'${LedgData.Item_Post}'` : null},
    IsLockManual = ${LedgData.IsLockManual !== undefined ? LedgData.IsLockManual : null},
    ManualLock_From = ${LedgData.ManualLock_From ? `'${LedgData.ManualLock_From}'` : null},
    PostHold_From = ${LedgData.PostHold_From ? `'${LedgData.PostHold_From}'` : null},
    IsInvFund = ${LedgData.IsInvFund !== undefined ? LedgData.IsInvFund : null},
    OD_Ageing = ${LedgData.OD_Ageing ? LedgData.OD_Ageing : null},
    NormalInt = ${LedgData.NormalInt ? LedgData.NormalInt : null},
    OverDueInt = ${LedgData.OverDueInt ? LedgData.OverDueInt : null},
    IsIB = ${LedgData.IsIB !== undefined ? LedgData.IsIB : null},
    IsPost = ${LedgData.IsPost !== undefined ? LedgData.IsPost : null},
    IsDr = ${LedgData.IsDr !== undefined ? LedgData.IsDr : null},
    IsCr = ${LedgData.IsCr !== undefined ? LedgData.IsCr : null},
    IB_Locked = ${LedgData.IB_Locked ? `'${LedgData.IB_Locked}'` : null},
    BackDays = ${LedgData.BackDays ? LedgData.BackDays : null},
    IB_NewRef = ${LedgData.IB_NewRef ? LedgData.IB_NewRef : null},
    IB_AgnstRef = ${LedgData.IB_AgnstRef ? LedgData.IB_AgnstRef : null},
    Bank_Type = ${LedgData.Bank_Type ? LedgData.Bank_Type : null},
    BankApiEnabled = ${LedgData.BankApiEnabled !== undefined ? LedgData.BankApiEnabled : null},
    Self_Bank_Trf = ${LedgData.Self_Bank_Trf !== undefined ? LedgData.Self_Bank_Trf : null},
    CORP_CC = ${LedgData.CORP_CC ? LedgData.CORP_CC : null},
    Bank_Name1 = ${LedgData.Bank_Name1 ? `'${LedgData.Bank_Name1}'` : null},
    Br1_Add1 = ${LedgData.Br1_Add1 ? `'${LedgData.Br1_Add1}'` : null},
    Ac_No1 = ${LedgData.Ac_No1 ? `'${LedgData.Ac_No1}'` : null},
    Ifsc_Code1 = ${LedgData.Ifsc_Code1 ? `'${LedgData.Ifsc_Code1}'` : null},
    TDS_Ledg = ${LedgData.TDS_Ledg ? LedgData.TDS_Ledg : null},
    TDS_Perc = ${LedgData.TDS_Perc ? LedgData.TDS_Perc : null},
    Party_Status = ${LedgData.Party_Status ? LedgData.Party_Status : null},
    TDS_SECTION = ${LedgData.TDS_SECTION ? LedgData.TDS_SECTION : null},
    Srv_Tax = ${LedgData.Srv_Tax ? `'${LedgData.Srv_Tax}'` : null},
    TCS_Flag = ${LedgData.TCS_Flag !== undefined ? LedgData.TCS_Flag : null},
    Ledg_Limit = ${LedgData.Ledg_Limit ? `'${LedgData.Ledg_Limit}'` : null},
    INTR_RATE = ${LedgData.INTR_RATE ? `'${LedgData.INTR_RATE}'` : null},
    INTR_DAYS = ${LedgData.INTR_DAYS ? `'${LedgData.INTR_DAYS}'` : null},
    Op_Bal = ${LedgData.Op_Bal ? LedgData.Op_Bal : null},
    Cl_Bal = ${LedgData.Cl_Bal ? LedgData.Cl_Bal : null},
    Emp_Code = ${LedgData.Emp_Code ? `'${LedgData.Emp_Code}'` : null},
    Export_Type = ${LedgData.Export_Type ? LedgData.Export_Type : null},
    Ledg_Name2 = ${LedgData.Ledg_Name2 ? `'${LedgData.Ledg_Name2}'` : null},
    Email2 = ${LedgData.Email2 ? `'${LedgData.Email2}'` : null}
WHERE
    Ledg_Code = ${LedgData.Ledg_Code};`, { transaction: t });
        // await LedgMst.update({ ...LedgerData, Created_by: LedgerData.Created_by }, {
        //     where: { GUID: BodyData.GUID }
        // }, { transaction: t });
        if (LedgData.EmpExperience) {
            await sequelize.query(
                `Delete from ledg_RCN where ledg_Code = '${LedgData.Ledg_Code}'`
            );

            for (const data of LedgData.EmpExperience) {
                await sequelize.query(`
                            INSERT INTO ledg_RCN (ledg_Code, Item_Code, Rate, Party_Rate, Valid_From, Valid_Upto, Qty_From, Qty_Upto) 
                            VALUES ('${LedgData.Ledg_Code}','${data.Item_Code}', ${data.Rate}, ${data.Party_Rate}, '${data.Valid_From}', '${data.Valid_Upto}', ${data.Qty_From}, ${data.Qty_Upto});
                        `);
            }
        }


        await t.commit();
        res.send(`Data Updated Successfully`)
    } catch (error) {
        console.log(error)
        res.send({ success: false, message: 'An error occurred while Updating Data', error });
        await t.rollback();
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
    // }
};