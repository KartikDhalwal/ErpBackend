const { Sequelize, DataTypes, literal, QueryTypes, Op, fn, col } = require('sequelize');
const { dbname } = require('../utils/dbconfig');
const Joi = require('joi');
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const fs = require('fs');
const path = require('path');
const { _MarutiPayoutScheme } = require("../models/MarutiPayoutScheme");
const { _TeamMst, teamMstSchema } = require("../models/TeamMst");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { _IncPolicy } = require('../models/IncPolicy');


exports.findMasters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body);
        const Location = await sequelize.query(`select cast (Godw_code as varchar) AS value, godw_name AS label from godown_Mst where  export_type < 3`)
        const GroupHead = await sequelize.query(`select Misc_Name AS value, Misc_Abbr AS label from Misc_Mst where Misc_Type = 619 and export_type < 3 `)
        const TeamLeader = await sequelize.query(`select Misc_Name AS value, Misc_Abbr AS label from Misc_Mst where Misc_Type = 620 and export_type < 3 and cc_group = ${req.body.MONTH} and cc_ledg = ${req.body.YEAR}`)
        const Dse = await sequelize.query(`select EMPCODE AS value, CONCAT(EMPCODE , ' - ',EMPFIRSTNAME , ' ' , EMPLASTNAME) AS label, EMPLOYEEDESIGNATION from EMPLOYEEMASTER where EMPLOYEEDESIGNATION like '%DSE%' OR EMPLOYEEDESIGNATION like '%RDSE%' OR EMPLOYEEDESIGNATION like '%SR. RELATIONSHIP MANAGER%' OR EMPLOYEEDESIGNATION like '%RELATIONSHIP MANAGER%'`)
        let data = {
            GroupHead,
            TeamLeader,
            Dse,
            Location
        };
        await sequelize.close();
        res.send({ success: true, data: data });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};
exports.Models = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Model = await sequelize.query(`select Misc_Code AS Code, Misc_Name AS Name from Misc_Mst where Misc_Type = 15 and export_type < 3 `)
        let data = {
            Model: Model[0]
        };
        await sequelize.close();
        res.send({ success: true, data: data });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};
exports.IncPolicy = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body);
        const Inc_policy = await sequelize.query(`select * from inc_policy where mnth = ${req.body.mnth} and yr = ${req.body.yr}`)
        await sequelize.close();
        res.send({ success: true, data: Inc_policy[0][0] });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};
exports.SavePolicy = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        // console.log(req.body);
        const IncPolicy = _IncPolicy(sequelize, DataTypes);
        const result = await IncPolicy.upsert(req.body);
        // const Inc_policy = await sequelize.query(`select * from inc_policy where mnth = ${req.body.mnth} and yr = ${req.body.yr}`)
        console.log(result)
        await sequelize.close();
        res.send({
            success: true,
            // data: Inc_policy[0][0]
        });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};
exports.Import = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        // console.log(req.body);

        const result = await sequelize.query(`
              DECLARE @Year INT = ${req.body.yr}; -- Replace with your desired year
        DECLARE @Month INT = ${req.body.mnth};  -- Replace with the desired month (for example, 5 for May)

        -- Calculate previous month and year
        DECLARE @PrevYear INT;
        DECLARE @PrevMonth INT;

        SET @PrevMonth = CASE
                            WHEN @Month = 1 THEN 12
                            ELSE @Month - 1
                        END;

        SET @PrevYear = CASE
                            WHEN @Month = 1 THEN @Year - 1  
                            ELSE @Year
                        END;
                        
                        insert into INC_POLICY (INC_TYPE,	Yr,	Mnth,	Segment,	sale_dse,	sale_dse_nos,	sale_dse_1,	sale_dse_2,	sale_dse_3,	sale_dse_4,	sale_dse_5,	sale_dse_6,	sale_dse_7,	sale_dse_8,	sale_dse_9,	sale_dse_10,	sale_dse_11,
                            	sale_tl,	sale_tl_nos,	sale_tl_1,	sale_tl_2,	sale_tl_3,	sale_tl_4,	sale_tl_5,	sale_tl_6,	sale_tl_7,	sale_tl_8,	sale_tl_9,	sale_tl_10,	sale_tl_11,	rto_dse,	rto_dse_nos,	rto_dse_1,	rto_dse_2,	rto_dse_3,
                                rto_dse_4,	rto_dse_5,	rto_dse_6,	rto_dse_7,	rto_dse_8,	rto_dse_9,	rto_dse_10,	rto_dse_11,	rto_tl,	rto_tl_nos,	rto_tl_1,	rto_tl_2,	rto_tl_3,	rto_tl_4,	rto_tl_5,	rto_tl_6,	rto_tl_7,	rto_tl_8,	rto_tl_9,	
                                rto_tl_10,	rto_tl_11,	MI_dse,	MI_dse_nos,	MI_dse_1,	MI_dse_2,	MI_dse_3,	MI_dse_4,	MI_dse_5,	MI_dse_6,	MI_dse_7,	MI_dse_8,	MI_dse_9,	MI_dse_10,	MI_dse_11,	MI_tl,	MI_tl_nos,	MI_tl_1,	MI_tl_2,	MI_tl_3,
                                MI_tl_4,	MI_tl_5,	MI_tl_6,	MI_tl_7,	MI_tl_8,	MI_tl_9,	MI_tl_10,	MI_tl_11,	MCP_dse,	MCP_dse_nos,	MCP_dse_1,	MCP_dse_2,	MCP_dse_3,	MCP_dse_4,	MCP_dse_5,	MCP_dse_6,	MCP_dse_7,	MCP_dse_8,	MCP_dse_9,
                                MCP_dse_10,	MCP_dse_11,	MCP_tl,	MCP_tl_nos,	MCP_tl_1,	MCP_tl_2,	MCP_tl_3,	MCP_tl_4,	MCP_tl_5,	MCP_tl_6,	MCP_tl_7,	MCP_tl_8,	MCP_tl_9,
                                MCP_tl_10,	MCP_tl_11,	MSR_dse,	MSR_dse_nos,	MSR_dse_1,	MSR_dse_2,	MSR_dse_3,	MSR_dse_4,	MSR_dse_5,
                                MSR_dse_6,	MSR_dse_7,	MSR_dse_8,	MSR_dse_9,	MSR_dse_10,	MSR_dse_11,	MSR_tl,	MSR_tl_nos,	MSR_tl_1,	MSR_tl_2,	MSR_tl_3,
                                MSR_tl_4,	MSR_tl_5,	MSR_tl_6,	MSR_tl_7,	MSR_tl_8,	MSR_tl_9,	MSR_tl_10,	MSR_tl_11,	ENTR_DATE,	ENTR_TIME,	Usr_Code,	MOD_DATE,	MOD_TIME,	Mod_USER,	Loc_Code,	Export_Type,
                                sale_dse_Penetration,	RTO_dse_Penetration,	MI_dse_Penetration,	MCP_dse_Penetration,	MSR_dse_Penetration,	sale_tl_Penetration,	RTO_tl_Penetration,	MI_tl_Penetration,
                                MCP_tl_Penetration,	MSR_tl_Penetration,	ew_dse,	ew_dse_nos,	ew_dse_1,	ew_dse_2,	ew_dse_3,	ew_dse_4,	ew_dse_5,	ew_dse_6,	ew_dse_7,	ew_dse_8,	ew_dse_9,	ew_dse_10,	ew_dse_11,	ew_tl,	ew_tl_nos,
                            	ew_tl_1,	ew_tl_2,	ew_tl_3,	ew_tl_4,	ew_tl_5,	ew_tl_6,	ew_tl_7,	ew_tl_8,	ew_tl_9,	ew_tl_10,	ew_tl_11,	exch_dse,	exch_dse_nos,	exch_dse_1,	exch_dse_2,	exch_dse_3,	exch_dse_4,
                                exch_dse_5,	exch_dse_6,	exch_dse_7,	exch_dse_8,	exch_dse_9,	exch_dse_10,	exch_dse_11,	exch_tl,	exch_tl_nos,	exch_tl_1,	exch_tl_2,
                               	exch_tl_3,	exch_tl_4,	exch_tl_5,	exch_tl_6,	exch_tl_7,	exch_tl_8,	exch_tl_9,	exch_tl_10,	exch_tl_11,	MGA_dse,
                            	MGA_dse_nos,	MGA_dse_1,	MGA_dse_2,	MGA_dse_3,	MGA_dse_4,	MGA_dse_5,	MGA_dse_6,	MGA_dse_7,	MGA_dse_8,	MGA_dse_9,	MGA_dse_10,	MGA_dse_11,	MGA_tl,	MGA_tl_nos,	MGA_tl_1,
                                MGA_tl_2,	MGA_tl_3,	MGA_tl_4,	MGA_tl_5,	MGA_tl_6,	MGA_tl_7,	MGA_tl_8,	MGA_tl_9,	MGA_tl_10,	MGA_tl_11,	EW_dse_Penetration,	EXCH_dse_Penetration,	MGA_dse_Penetration,	EW_tl_Penetration,	
                                EXCH_tl_Penetration,	MGA_tl_Penetration,	FOCUS_MODEL,	TV_Pen_dse_1,	TV_Pen_dse_2,	TV_Pen_dse_3,	TV_Pen_dse_4,	TV_Pen_dse_5,	TV_MV_dse_1,	TV_MV_dse_2,	TV_MV_dse_3,	TV_MV_dse_4,	
                                TV_MV_dse_5,	TV_IncAmt_dse_1,	TV_IncAmt_dse_2,	TV_IncAmt_dse_3,	TV_IncAmt_dse_4,	TV_IncAmt_dse_5,	NTV_Pen_dse_1,	NTV_Pen_dse_2,	NTV_Pen_dse_3,	NTV_Pen_dse_4,
                                NTV_Pen_dse_5,	NTV_MV_dse_1,	NTV_MV_dse_2,	NTV_MV_dse_3,	NTV_MV_dse_4,	NTV_MV_dse_5,	NTV_IncAmt_dse_1,	NTV_IncAmt_dse_2,	NTV_IncAmt_dse_3,	NTV_IncAmt_dse_4,	NTV_IncAmt_dse_5,	TV_Pen_TL_1,
                                TV_Pen_TL_2,	TV_Pen_TL_3, TV_Pen_TL_4,	TV_Pen_TL_5,	TV_MV_TL_1,	TV_MV_TL_2,	TV_MV_TL_3,	TV_MV_TL_4,	TV_MV_TL_5,	TV_IncAmt_TL_1,	TV_IncAmt_TL_2,	TV_IncAmt_TL_3,	TV_IncAmt_TL_4,	TV_IncAmt_TL_5,	
                                NTV_Pen_TL_1,	NTV_Pen_TL_2,	NTV_Pen_TL_3,	NTV_Pen_TL_4,	NTV_Pen_TL_5,	NTV_MV_TL_1,	NTV_MV_TL_2,	NTV_MV_TL_3,	NTV_MV_TL_4,	NTV_MV_TL_5,	NTV_IncAmt_TL_1,	NTV_IncAmt_TL_2,	
                                NTV_IncAmt_TL_3,	NTV_IncAmt_TL_4,	NTV_IncAmt_TL_5,	GP_DSE_1,	GP_DSE_2,	GP_DSE_3,	GP_DSE_4,	GP_DSE_5,	LP_DSE_1,	LP_DSE_2,	LP_DSE_3,	LP_DSE_4,	LP_DSE_5,	
                                PENULTY_DSE_1,	PENULTY_DSE_2,	PENULTY_DSE_3,	PENULTY_DSE_4,	PENULTY_DSE_5,	GP_TL_1,	GP_TL_2,	GP_TL_3,	GP_TL_4,	GP_TL_5,	LP_TL_1,	LP_TL_2,	LP_TL_3,	LP_TL_4,	LP_TL_5,
                                PENULTY_TL_1,	PENULTY_TL_2,	PENULTY_TL_3,	PENULTY_TL_4,	PENULTY_TL_5,	Cmpl_dse,	Cmpl_dse_nos,	Cmpl_dse_1,	Cmpl_dse_2,	Cmpl_dse_3,	Cmpl_dse_4,	Cmpl_dse_5,	Cmpl_dse_6,	Cmpl_dse_7,	
                                Cmpl_dse_8,	Cmpl_dse_9,	Cmpl_dse_10,	Cmpl_dse_11,	Cmpl_tl,	Cmpl_tl_nos,	Cmpl_tl_1,	Cmpl_tl_2,	Cmpl_tl_3,	Cmpl_tl_4,	Cmpl_tl_5,	Cmpl_tl_6,	Cmpl_tl_7,	Cmpl_tl_8,	Cmpl_tl_9,	Cmpl_tl_10,	Cmpl_tl_11,	Cmpl_dse_Penetration,	Cmpl_tl_Penetration,	NF_sale_dse_1,	NF_sale_dse_2,	NF_sale_dse_3,	NF_sale_dse_4,	NF_sale_dse_5,	NF_sale_dse_6,	NF_sale_dse_7,	NF_sale_dse_8,	NF_sale_dse_9,	NF_sale_dse_10,	NF_sale_dse_11,	NF_sale_tl_1,	NF_sale_tl_2,	
                                NF_sale_tl_3,	NF_sale_tl_4,	NF_sale_tl_5,	NF_sale_tl_6,	NF_sale_tl_7,	NF_sale_tl_8,	NF_sale_tl_9,	NF_sale_tl_10,	NF_sale_tl_11)
                            select INC_TYPE,	@Year,	@Month,	Segment,	sale_dse,	sale_dse_nos,	sale_dse_1,	sale_dse_2,	sale_dse_3,	sale_dse_4,	sale_dse_5,	sale_dse_6,	sale_dse_7,	sale_dse_8,	sale_dse_9,	sale_dse_10,	sale_dse_11,
                            	sale_tl,	sale_tl_nos,	sale_tl_1,	sale_tl_2,	sale_tl_3,	sale_tl_4,	sale_tl_5,	sale_tl_6,	sale_tl_7,	sale_tl_8,	sale_tl_9,	sale_tl_10,	sale_tl_11,	rto_dse,	rto_dse_nos,	rto_dse_1,	rto_dse_2,	rto_dse_3,
                                rto_dse_4,	rto_dse_5,	rto_dse_6,	rto_dse_7,	rto_dse_8,	rto_dse_9,	rto_dse_10,	rto_dse_11,	rto_tl,	rto_tl_nos,	rto_tl_1,	rto_tl_2,	rto_tl_3,	rto_tl_4,	rto_tl_5,	rto_tl_6,	rto_tl_7,	rto_tl_8,	rto_tl_9,	
                                rto_tl_10,	rto_tl_11,	MI_dse,	MI_dse_nos,	MI_dse_1,	MI_dse_2,	MI_dse_3,	MI_dse_4,	MI_dse_5,	MI_dse_6,	MI_dse_7,	MI_dse_8,	MI_dse_9,	MI_dse_10,	MI_dse_11,	MI_tl,	MI_tl_nos,	MI_tl_1,	MI_tl_2,	MI_tl_3,
                                MI_tl_4,	MI_tl_5,	MI_tl_6,	MI_tl_7,	MI_tl_8,	MI_tl_9,	MI_tl_10,	MI_tl_11,	MCP_dse,	MCP_dse_nos,	MCP_dse_1,	MCP_dse_2,	MCP_dse_3,	MCP_dse_4,	MCP_dse_5,	MCP_dse_6,	MCP_dse_7,	MCP_dse_8,	MCP_dse_9,
                                MCP_dse_10,	MCP_dse_11,	MCP_tl,	MCP_tl_nos,	MCP_tl_1,	MCP_tl_2,	MCP_tl_3,	MCP_tl_4,	MCP_tl_5,	MCP_tl_6,	MCP_tl_7,	MCP_tl_8,	MCP_tl_9,
                                MCP_tl_10,	MCP_tl_11,	MSR_dse,	MSR_dse_nos,	MSR_dse_1,	MSR_dse_2,	MSR_dse_3,	MSR_dse_4,	MSR_dse_5,
                                MSR_dse_6,	MSR_dse_7,	MSR_dse_8,	MSR_dse_9,	MSR_dse_10,	MSR_dse_11,	MSR_tl,	MSR_tl_nos,	MSR_tl_1,	MSR_tl_2,	MSR_tl_3,
                                MSR_tl_4,	MSR_tl_5,	MSR_tl_6,	MSR_tl_7,	MSR_tl_8,	MSR_tl_9,	MSR_tl_10,	MSR_tl_11,	ENTR_DATE,	ENTR_TIME,	Usr_Code,	MOD_DATE,	MOD_TIME,	Mod_USER,	Loc_Code,	Export_Type,
                                sale_dse_Penetration,	RTO_dse_Penetration,	MI_dse_Penetration,	MCP_dse_Penetration,	MSR_dse_Penetration,	sale_tl_Penetration,	RTO_tl_Penetration,	MI_tl_Penetration,
                                MCP_tl_Penetration,	MSR_tl_Penetration,	ew_dse,	ew_dse_nos,	ew_dse_1,	ew_dse_2,	ew_dse_3,	ew_dse_4,	ew_dse_5,	ew_dse_6,	ew_dse_7,	ew_dse_8,	ew_dse_9,	ew_dse_10,	ew_dse_11,	ew_tl,	ew_tl_nos,
                            	ew_tl_1,	ew_tl_2,	ew_tl_3,	ew_tl_4,	ew_tl_5,	ew_tl_6,	ew_tl_7,	ew_tl_8,	ew_tl_9,	ew_tl_10,	ew_tl_11,	exch_dse,	exch_dse_nos,	exch_dse_1,	exch_dse_2,	exch_dse_3,	exch_dse_4,
                                exch_dse_5,	exch_dse_6,	exch_dse_7,	exch_dse_8,	exch_dse_9,	exch_dse_10,	exch_dse_11,	exch_tl,	exch_tl_nos,	exch_tl_1,	exch_tl_2,
                               	exch_tl_3,	exch_tl_4,	exch_tl_5,	exch_tl_6,	exch_tl_7,	exch_tl_8,	exch_tl_9,	exch_tl_10,	exch_tl_11,	MGA_dse,
                            	MGA_dse_nos,	MGA_dse_1,	MGA_dse_2,	MGA_dse_3,	MGA_dse_4,	MGA_dse_5,	MGA_dse_6,	MGA_dse_7,	MGA_dse_8,	MGA_dse_9,	MGA_dse_10,	MGA_dse_11,	MGA_tl,	MGA_tl_nos,	MGA_tl_1,
                                MGA_tl_2,	MGA_tl_3,	MGA_tl_4,	MGA_tl_5,	MGA_tl_6,	MGA_tl_7,	MGA_tl_8,	MGA_tl_9,	MGA_tl_10,	MGA_tl_11,	EW_dse_Penetration,	EXCH_dse_Penetration,	MGA_dse_Penetration,	EW_tl_Penetration,	
                                EXCH_tl_Penetration,	MGA_tl_Penetration,	FOCUS_MODEL,	TV_Pen_dse_1,	TV_Pen_dse_2,	TV_Pen_dse_3,	TV_Pen_dse_4,	TV_Pen_dse_5,	TV_MV_dse_1,	TV_MV_dse_2,	TV_MV_dse_3,	TV_MV_dse_4,	
                                TV_MV_dse_5,	TV_IncAmt_dse_1,	TV_IncAmt_dse_2,	TV_IncAmt_dse_3,	TV_IncAmt_dse_4,	TV_IncAmt_dse_5,	NTV_Pen_dse_1,	NTV_Pen_dse_2,	NTV_Pen_dse_3,	NTV_Pen_dse_4,
                                NTV_Pen_dse_5,	NTV_MV_dse_1,	NTV_MV_dse_2,	NTV_MV_dse_3,	NTV_MV_dse_4,	NTV_MV_dse_5,	NTV_IncAmt_dse_1,	NTV_IncAmt_dse_2,	NTV_IncAmt_dse_3,	NTV_IncAmt_dse_4,	NTV_IncAmt_dse_5,	TV_Pen_TL_1,
                                TV_Pen_TL_2,	TV_Pen_TL_3, TV_Pen_TL_4,	TV_Pen_TL_5,	TV_MV_TL_1,	TV_MV_TL_2,	TV_MV_TL_3,	TV_MV_TL_4,	TV_MV_TL_5,	TV_IncAmt_TL_1,	TV_IncAmt_TL_2,	TV_IncAmt_TL_3,	TV_IncAmt_TL_4,	TV_IncAmt_TL_5,	
                                NTV_Pen_TL_1,	NTV_Pen_TL_2,	NTV_Pen_TL_3,	NTV_Pen_TL_4,	NTV_Pen_TL_5,	NTV_MV_TL_1,	NTV_MV_TL_2,	NTV_MV_TL_3,	NTV_MV_TL_4,	NTV_MV_TL_5,	NTV_IncAmt_TL_1,	NTV_IncAmt_TL_2,	
                                NTV_IncAmt_TL_3,	NTV_IncAmt_TL_4,	NTV_IncAmt_TL_5,	GP_DSE_1,	GP_DSE_2,	GP_DSE_3,	GP_DSE_4,	GP_DSE_5,	LP_DSE_1,	LP_DSE_2,	LP_DSE_3,	LP_DSE_4,	LP_DSE_5,	
                                PENULTY_DSE_1,	PENULTY_DSE_2,	PENULTY_DSE_3,	PENULTY_DSE_4,	PENULTY_DSE_5,	GP_TL_1,	GP_TL_2,	GP_TL_3,	GP_TL_4,	GP_TL_5,	LP_TL_1,	LP_TL_2,	LP_TL_3,	LP_TL_4,	LP_TL_5,
                                PENULTY_TL_1,	PENULTY_TL_2,	PENULTY_TL_3,	PENULTY_TL_4,	PENULTY_TL_5,	Cmpl_dse,	Cmpl_dse_nos,	Cmpl_dse_1,	Cmpl_dse_2,	Cmpl_dse_3,	Cmpl_dse_4,	Cmpl_dse_5,	Cmpl_dse_6,	Cmpl_dse_7,	
                                Cmpl_dse_8,	Cmpl_dse_9,	Cmpl_dse_10,	Cmpl_dse_11,	Cmpl_tl,	Cmpl_tl_nos,	Cmpl_tl_1,	Cmpl_tl_2,	Cmpl_tl_3,	Cmpl_tl_4,	Cmpl_tl_5,	Cmpl_tl_6,	Cmpl_tl_7,	Cmpl_tl_8,	Cmpl_tl_9,	Cmpl_tl_10,	Cmpl_tl_11,	Cmpl_dse_Penetration,	Cmpl_tl_Penetration,	NF_sale_dse_1,	NF_sale_dse_2,	NF_sale_dse_3,	NF_sale_dse_4,	NF_sale_dse_5,	NF_sale_dse_6,	NF_sale_dse_7,	NF_sale_dse_8,	NF_sale_dse_9,	NF_sale_dse_10,	NF_sale_dse_11,	NF_sale_tl_1,	NF_sale_tl_2,	
                                NF_sale_tl_3,	NF_sale_tl_4,	NF_sale_tl_5,	NF_sale_tl_6,	NF_sale_tl_7,	NF_sale_tl_8,	NF_sale_tl_9,	NF_sale_tl_10,	NF_sale_tl_11 from Inc_policy where 
                                             Mnth = @PrevMonth   -- Previous year's CC_Group
                                            AND Yr = @PrevYear and
                                NOT EXISTS (          -- Validation to prevent duplicate rows
                                    SELECT 1
                                    FROM Inc_policy AS Target
                                    WHERE
                                        Target.mnth = @Month
                                        AND Target.yr = @Year
                            )

                        `);
        // const Inc_policy = await sequelize.query(`select * from inc_policy where mnth = ${req.body.mnth} and yr = ${req.body.yr}`)
        console.log(result)
        await sequelize.close();
        res.send({
            success: true,
            // data: Inc_policy[0][0]
        });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};

exports.FindMasterDetail = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const MiscMstData = await MiscMst.findAll({
            where: { Misc_Type: req.body.Misc_Type, Export_Type: 1, CC_Group: req.body.CC_Group, CC_Ledg: req.body.CC_Ledg },
        });

        await sequelize.close();
        res.status(200).send({ success: true, data: MiscMstData });
    } catch (err) {
        await sequelize.close();
        console.log(err);
    }
};
exports.ImportFromPrevMonthDSE = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {

        const data = await sequelize.query(`
            DECLARE @Year INT = ${req.body.CC_Ledg}; -- Replace with your desired year
        DECLARE @Month INT = ${req.body.CC_Group};  -- Replace with the desired month (for example, 5 for May)

        -- Calculate previous month and year
        DECLARE @PrevYear INT;
        DECLARE @PrevMonth INT;

        SET @PrevMonth = CASE
                            WHEN @Month = 1 THEN 12
                            ELSE @Month - 1
                        END;

        SET @PrevYear = CASE
                            WHEN @Month = 1 THEN @Year - 1  
                            ELSE @Year
                        END;

        -- Insert the new rows while updating CC_Ledg and CC_Group with validation to prevent duplicates        
        INSERT INTO Misc_Mst
            (Misc_Type, Misc_Code, Misc_Name, Misc_Abbr, Misc_Dtl1, Join_Date, Birth_Date, Exp_Date, Export_Type, ServerId, Loc_code, CC_Group, CC_Ledg)
        SELECT
            Misc_Type,
            Misc_Code,
            Misc_Name,
            Misc_Abbr,
            Misc_Dtl1,
            Join_Date,
            Birth_Date,
            Exp_Date,
            Export_Type,
            ServerId,
            Loc_code,
            @Month AS CC_Group,  -- New year value
            @Year AS CC_Ledg   -- New month value
        FROM Misc_Mst AS Source
        WHERE
            Misc_Type = ${req.body.Misc_Type}
            AND Export_Type = 1
            AND CC_Group = @PrevMonth   -- Previous year's CC_Group
            AND CC_Ledg = @PrevYear  -- Previous month's CC_Ledg
            AND NOT EXISTS (          -- Validation to prevent duplicate rows
                SELECT 1
                FROM Misc_Mst AS Target
                WHERE
                Target.Misc_Type = Source.Misc_Type and 
                    Target.Misc_Code = Source.Misc_Code     
                    AND Target.CC_Group = @Month
                    AND Target.CC_Ledg = @Year
    ); `);

        await sequelize.close();
        res.status(200).send({ success: true, data: {} });
    } catch (err) {
        await sequelize.close();
        console.log(err);
    }
};

exports.findEmployeeName = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body)
    try {
        let Name
        Name = await sequelize.query(`select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Misc_Abbr from EMPLOYEEMASTER where EMPCODE = '${req.body.Misc_Name}'`)
        await sequelize.close();
        res.send({ success: true, data: Name });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};

exports.TeamView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const [rows] = await sequelize.query(`SELECT Misc_Name, Misc_Abbr, Misc_Dtl1, Misc_Type FROM Misc_Mst WHERE Loc_Code in (${Loc_Code}) and Export_Type < 3 and ((  Misc_Type IN (620, 621,619,618) and CC_Group=7	and CC_Ledg=2024) or Misc_Type = 619) `);

        let hierarchy = {};
        let itemMap = {};
        const AVATAR_URL = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        const COLORS = ["#cdb4db", "#ffafcc", "#f8ad9d", "#c9cba3", "#00afb9", "#84a59d", "#0081a7", "#e6e6e6"];
        let colorIndex = 0;

        const getColor = () => {
            const color = COLORS[colorIndex % COLORS.length];
            colorIndex++;
            return color;
        };

        const getDesignation = (type) => {
            switch (type) {
                case 619: return "Group Head";
                case 620: return "Team Leader";
                case 621: return "DSE";
                default: return "Designation";
            }
        };

        rows.forEach(row => {
            let itemName = `${row.Misc_Name}-${row.Misc_Abbr}`;
            let item = {
                id: itemName,
                data: {
                    imageURL: AVATAR_URL,
                    name: itemName,
                    designation: getDesignation(row.Misc_Type),
                },
                options: {
                    nodeBGColor: getColor(),
                    nodeBGColorHover: getColor(),
                },
                children: []
            };
            itemMap[itemName] = item;
            if (row.Misc_Type === 619) {
                hierarchy[itemName] = item;
            }
        });
        console.log(itemMap);

        rows.forEach(row => {
            // if (row.Misc_Type === 621 || row.Misc_Type === 620) {
            let parentKey = `${row.Misc_Dtl1}-${rows.find(r => r.Misc_Name == row.Misc_Dtl1)?.Misc_Abbr}`;
            let parentItem = itemMap[parentKey];
            if (parentItem) {
                parentItem.children.push(itemMap[`${row.Misc_Name}-${row.Misc_Abbr}`]);
            } else {
                console.log("Parent not found:", parentKey);
            }
            // }
        });
        const transformHierarchy = (node, visited = new Set()) => {
            if (visited.has(node)) {
                console.warn(`Circular reference detected for node with id: ${node.id}`);
                return null; // Return null if a circular reference is found
            }

            visited.add(node);

            return {
                id: node.id,
                data: node.data,
                options: node.options,
                children: node.children
                    ? node.children
                        .map((child) => transformHierarchy(child, visited))
                        .filter(Boolean) // Remove any null children
                    : [],
            };
        };

        // const data = createHierarchyArray(rows)
        const transformedData = Object.keys(hierarchy).map(rootKey => transformHierarchy(hierarchy[rootKey]));
        res.status(200).send({
            success: true,
            data: transformedData
        });

    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "An error occurred while creating Team.",
            error,
        });
    } finally {
        await sequelize.close();
    }
};
exports.DSEImportExcel = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body.created_by)
    const t = await sequelize.transaction();
    try {
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const excelFile = req.files["excel"][0]; // Accessing the uploaded file
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (!data?.length) {
            sequelize.close();
            return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" })
        }
        const itemCode = data.map(obj => `'${obj.DSE_EMPCODE}'`);
        const employeeMasterQuery = itemCode.length
            ? `SELECT DISTINCT(EMPCODE) AS ic FROM EMPLOYEEMASTER WHERE EXPORT_TYPE <> 33 AND EMPCODE IN (${itemCode})`
            : `SELECT DISTINCT(EMPCODE) AS ic FROM EMPLOYEEMASTER WHERE EXPORT_TYPE <> 33 AND EMPCODE IS NULL`;
        const check2 = await sequelize.query(employeeMasterQuery, { type: sequelize.QueryTypes.SELECT });
        const item_code = await sequelize.query(`select distinct(Misc_Name) AS ic from Misc_mst where Misc_Type in (620,621) AND Misc_Name in (${itemCode.length ? itemCode : `''`})`);
        console.log(check2, 'data')
        const EmpMstCheck = await sequelize.query(`select isPayroll from KeyData`);
        let EMPLOYEEMASTERFLAG = 0;
        console.log(EmpMstCheck[0][0].isPayroll, 'EmpMstCheck[0].isPayroll')
        if (EmpMstCheck[0][0].isPayroll == 'Y') {
            EMPLOYEEMASTERFLAG = 1;
        }
        const ErroredData = [];
        const CorrectData = [];
        data.map(obj => {
            let oldObj = { ...obj };
            const rejectionReasons = [];
            const duplicateItemCode = data.filter(item => item.DSE_EMPCODE?.toString() === obj.DSE_EMPCODE?.toString());
            if (duplicateItemCode?.length >= 2 && obj.DSE_EMPCODE) {
                rejectionReasons.push(`Duplicate DSE EMPCODE  (${obj.DSE_EMPCODE}) found ${duplicateItemCode.length} times in this Excel`, ' | ');
            }
            const duplicateItemName = data.filter(item => item.DSE_NAME?.toString() === obj.DSE_NAME?.toString());
            if (duplicateItemCode?.length >= 2 && obj.DSE_NAME) {
                rejectionReasons.push(`Duplicate DSE Name  (${obj.DSE_NAME}) found ${duplicateItemName.length} times on Diferent EMPCODE in this Excel`, ' | ');
            }
            if (item_code[0].some(item => item.ic?.toString() == obj.DSE_EMPCODE?.toString())) {
                rejectionReasons.push(`DSE Code  ${obj.DSE_EMPCODE} Already Exist In DSE Master`, ' | ');
            }
            if (EMPLOYEEMASTERFLAG === 1) {
                if (!check2.some(item => item.ic?.toString() === obj.DSE_EMPCODE?.toString())) {
                    rejectionReasons.push(`DSE Code ${obj.DSE_EMPCODE} Not Exist In Employee Master`, ' | ');
                }
            }
            if (rejectionReasons.length > 0) {
                ErroredData.push({
                    ...oldObj,
                    rejectionReasons: rejectionReasons?.slice(0, -1)
                });
            } else {
                CorrectData.push(obj);
            }
        });
        console.log(CorrectData, 'CorrectData');
        console.log(ErroredData, "ErroredData");
        const maxMiscCode = await MiscMst.max("Misc_Code", {
            where: { Misc_Type: 621 },
            transaction: t,
        });
        let newMiscCode = maxMiscCode + 1;
        const MiscMst_ = await MiscMst.bulkCreate(
            CorrectData.map((item, index) => ({
                Misc_Type: 621,
                Misc_Code: newMiscCode + index,
                Misc_Name: item.DSE_EMPCODE,
                Misc_Abbr: item.DSE_NAME,
                Misc_Dtl1: item.DSE_TL,
                Join_Date: adjustToIST(item.DOJ),
                Export_Type: 1,
                ServerId: 1,
                CC_Group: req.body.Month,
                CC_Ledg: req.body.Year,
                Loc_Code: req.body.Loc_Code
            })),
            { transaction: t }
        )
        console.log(MiscMst_.length);
        t.commit();
        await sequelize.close();
        res.status(200).send({ ErroredData: ErroredData, CorrectData: CorrectData, Message: `${MiscMst_.length} Records Inserted` })
    } catch (error) {
        t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};
exports.TVNTVImportExcel = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body.created_by)
    const t = await sequelize.transaction();
    try {
        // const MiscMst = _MiscMst(sequelize, DataTypes);
        const excelFile = req.files["excel"][0]; // Accessing the uploaded file
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (!data?.length) {
            sequelize.close();
            return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" })
        }
        console.log(data);
        const ErroredData = [];
        const CorrectData = [];
        const ntvValues = [];
        const tvValues = [];

        const vinList = data.map(data => `'${data.VIN}'`).join(', ');
        const selectexistingICMVINs = await sequelize.query(`SELECT VIN,Chas_No FROM ICM_MST WHERE VIN IN (${vinList})`);
        const selectexistingVINs = await sequelize.query(`SELECT VIN FROM Exch_veh WHERE VIN IN (${vinList})`);
        let insertValues = [];
        let updateStatements = [];
        console.log(selectexistingICMVINs[0]);
        const existingVINs = selectexistingVINs[0].map(row => row.VIN);
        const columnMapper = {
            'newchasno': 'CHASSIS_NO',
            'OldModel_1': 'MODEL',
            'OldRegno_1': 'OLD_REG_NO',
            'OldAmount_1': 'RF COST',
            'Party_Name_1': 'NAME',
            'VIN': 'VIN',
            'Exch_Type_1': 'TV_NTV',
            'ENG_NO': 'ENG_NO',
            'isEBR': 'EBR',
        };
        function getNewChasNo(vin) {
            const found = selectexistingICMVINs[0].find(item => item.VIN == vin);
            return found ? found.Chas_No : null;
        }
        data.forEach(data => {
            const vin = data['VIN'];
            let values = [];

            if (!existingVINs.includes(vin)) {
                for (const column in columnMapper) {
                    // Handle NewChasNo dynamically
                    if (column === 'Exch_Type_1') {
                        // Handle TV_NTV transformation
                        const exchTypeValue = data['TV_NTV'] === 'TV' ? 0 : data['TV_NTV'] === 'NTV' ? 1 : 2;
                        values.push(`${exchTypeValue}`);
                    } else if (column === 'OldRegno_1') {
                        // Handle TV_NTV transformation
                        const exchTypeValue = data['OLD_REG_NO']?.replace(/-/g, '')
                        values.push(`'${exchTypeValue}'`);
                    } else if (column === 'isEBR') {
                        // Handle TV_NTV transformation
                        const exchTypeValue = data['EBR'] == 'EBR' ? 1 : 2;
                        values.push(`${exchTypeValue}`);
                    } else if (data[columnMapper[column]] !== undefined) {
                        values.push(`'${data[columnMapper[column]]}'`);
                    } else if (data[columnMapper[column]] == undefined) {
                        values.push(`null`);
                    }
                }
                insertValues.push(`(${values.join(', ')})`);
                ErroredData.push(data);
            } else {
                updateStatements.push(`UPDATE EXCH_veh SET Exch_Type_1 = '${data['TV_NTV'] == 'TV' ? 0 : data['TV_NTV'] == 'NTV' ? 1 : 2}',isebr = '${data['EBR'] == 'EBR' ? 1 : 2}' WHERE VIN = '${vin}'`);
                CorrectData.push(data);
            }
        });
        const insertQuery = `
            INSERT INTO EXCH_veh (${Object.keys(columnMapper).join(', ')})
            VALUES ${insertValues.join(', ')};
        `;

        const updateQuery = updateStatements.join('; ');
        // console.log(updateQuery)
        // console.log(updateQuery)
        if (insertValues.length)
            await sequelize.query(insertQuery);
        await sequelize.query(updateQuery);
        // const conditions = data.map(row =>
        //     `(NewChasNo = '${row.CHASSIS_NO}' AND OldRegno_1 = '${row.OLD_REG_NO?.replace(/-/g, '')}')`
        // ).join(' OR ');
        // const conditions1 = data.map(row =>
        //     `NewChasNo = '${row.CHASSIS_NO}' `
        // ).join(' OR ');

        // // Full SQL query
        // const query = `
        //     SELECT *
        //     FROM exch_veh
        //     WHERE ${conditions};
        // `;

        // // Execute the query
        // const existingRecords = await sequelize.query(query);

        // const updates = [];
        // const inserts = [];

        // // Process each row in the Excel data
        // for (let row of data) {
        //     let { CHASSIS_NO, OLD_REG_NO, ENG_NO, MODEL, NAME, ADDRESS, ICM_CUST_ID, VIN, TV_NTV, EBR } = row;
        //     OLD_REG_NO = OLD_REG_NO.replace(/-/g, '');

        //     // Map Excel columns to database columns
        //     const dbData = {
        //         ChassisNumber: CHASSIS_NO,
        //         OldRegNo: OLD_REG_NO,
        //         EngineNumber: ENG_NO ? ENG_NO : null,
        //         Model: MODEL ? MODEL : null,
        //         CustomerName: NAME ? NAME : null,
        //         // Address: ADDRESS || null,
        //         // IcmCustId: ICM_CUST_ID ? ICM_CUST_ID : null,
        //         Vin: VIN || null,
        //         TvNtv: TV_NTV == 'TV' ? 1 : TV_NTV == 'NTV' ? 1 : 2 || null,
        //         Ebr: EBR == 'EBR' ? 1 : 2 || null,
        //     };

        //     // Check if the record exists in the fetched data
        //     const existingRecord = existingRecords[0].find(record =>
        //         record.NewChasNo == CHASSIS_NO && record.OldRegno_1 == OLD_REG_NO
        //     );
        //     // console.log(existingRecord)
        //     if (existingRecord) {
        //         // Prepare data for update if any fields are null or empty in the database
        //         const updateFields = {};
        //         for (const [key, value] of Object.entries(dbData)) {
        //             if (!existingRecord[key] && value) {
        //                 updateFields[key] = value;
        //             }
        //         }
        //         if (Object.keys(updateFields).length > 0) {
        //             updates.push({
        //                 ...updateFields,
        //                 ChassisNumber: CHASSIS_NO,
        //                 OldRegNo: OLD_REG_NO
        //             });
        //         }
        //     } else {
        //         // If the record doesn't exist, prepare it for insertion
        //         inserts.push(dbData);
        //     }
        // }

        // // Perform bulk updates
        // if (updates.length > 0) {
        //     const updateQuery = updates.map(record => `
        //         UPDATE exch_veh
        //         SET 
        //             ENG_No = COALESCE(NULLIF('${record.EngineNumber}', ''), ENG_No),
        //             OldModel_1 = COALESCE(NULLIF('${record.Model}', ''), OldModel_1),
        //             Party_Name_1 = COALESCE(NULLIF('${record.CustomerName}', ''), Party_Name_1),
        //             Vin = COALESCE(NULLIF('${record.Vin}', ''), Vin),
        //             Exch_Type_1 = '${record.TvNtv}',
        //             IsEBR = COALESCE(NULLIF('${record.Ebr}', ''), IsEBR)
        //         WHERE NewChasNo = '${record.ChassisNumber}' AND OldRegno_1 = '${record.OldRegNo}';
        //     `).join('');

        //     // console.log(updateQuery);
        //     // await sequelize.query(updateQuery);
        // }

        // // Perform bulk insert
        // if (inserts.length > 0) {
        //     const insertQuery = `
        //         INSERT INTO exch_veh (NewChasNo, OldRegno_1, ENG_No, OldModel_1, Party_Name_1, Vin, Exch_Type_1, IsEBR)
        //         VALUES ${inserts.map(record => `(
        //             '${record.ChassisNumber}', 
        //             '${record.OldRegNo}', 
        //             '${record.EngineNumber}', 
        //             '${record.Model}', 
        //             '${record.CustomerName}', 
        //             '${record.Vin}', 
        //             '${record.TvNtv}', 
        //             '${record.Ebr}'
        //         )`).join(',')};`;
        //     // console.log(insertQuery)
        //     // await sequelize.query(insertQuery);
        // }

        // console.log(updates.length);
        // console.log(inserts.length);
        t.commit();
        await sequelize.close();
        res.status(200).send({ ErroredData: ErroredData, CorrectData: CorrectData, Message: `${ErroredData.length} Records Inserted & ${CorrectData.length} Records updated` })

    } catch (error) {
        // t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};
exports.TVNTVImportFormat = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "DSE Excel Import";
        const Headeres = ['CHASSIS_NO', 'ENG_NO', 'MODEL', 'OLD_REG_NO', 'RF COST', 'NAME', 'ADDRESS', 'ICM_CUST_ID', 'VIN', 'TV_NTV', 'EBR',];
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");
        // worksheet.mergeCells("A1:E1");
        // worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
        // worksheet.getCell("A1").alignment = {
        //     vertical: "middle",
        //     horizontal: "center",
        // };
        // worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
        // worksheet.mergeCells("A2:E2");
        // worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
        // worksheet.getCell("A2").alignment = {
        //     vertical: "middle",
        //     horizontal: "center",
        // };
        // worksheet.mergeCells("A3:L3");
        // let reportName1 = "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
        // worksheet.getCell("A3").value = `${reportName1}`;

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

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
            console.error("Error creating workbook:", error);
            res.status(500).send("Internal Server Error");
        });
    } catch (e) {
        console.log(e)
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("Sheet1");

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
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
exports.DseImportFormat = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "DSE Excel Import";
        const Headeres = ['DSE_EMPCODE', 'DSE_NAME', 'DSE_TL', 'DOJ'];
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");
        // worksheet.mergeCells("A1:E1");
        // worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
        // worksheet.getCell("A1").alignment = {
        //     vertical: "middle",
        //     horizontal: "center",
        // };
        // worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
        // worksheet.mergeCells("A2:E2");
        // worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
        // worksheet.getCell("A2").alignment = {
        //     vertical: "middle",
        //     horizontal: "center",
        // };
        // worksheet.mergeCells("A3:L3");
        // let reportName1 = "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
        // worksheet.getCell("A3").value = `${reportName1}`;

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

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
            console.error("Error creating workbook:", error);
            res.status(500).send("Internal Server Error");
        });
    } catch (e) {
        console.log(e)
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("Sheet1");

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
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
exports.TLImportExcel = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body.created_by)
    const t = await sequelize.transaction();
    try {
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const excelFile = req.files["excel"][0];
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (!data?.length) {
            sequelize.close();
            return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" })
        }
        const itemCode = data.map(obj => `'${obj.TL_EMPCODE}'`);
        const employeeMasterQuery = itemCode.length
            ? `SELECT DISTINCT(EMPCODE) AS ic FROM EMPLOYEEMASTER WHERE EXPORT_TYPE <> 33 AND EMPCODE IN (${itemCode})`
            : `SELECT DISTINCT(EMPCODE) AS ic FROM EMPLOYEEMASTER WHERE EXPORT_TYPE <> 33 AND EMPCODE IS NULL`;
        const check2 = await sequelize.query(employeeMasterQuery, { type: sequelize.QueryTypes.SELECT });
        const item_code = await sequelize.query(`select distinct(Misc_Name) AS ic from Misc_mst where Misc_Type in (619,620) AND Misc_Name in (${itemCode.length ? itemCode : `''`})`);
        console.log(data, 'data')
        const EmpMstCheck = await sequelize.query(`select isPayroll from KeyData`);
        let EMPLOYEEMASTERFLAG = 0;
        console.log(EmpMstCheck[0][0].isPayroll, 'EmpMstCheck[0].isPayroll')
        if (EmpMstCheck[0][0].isPayroll == 'Y') {
            EMPLOYEEMASTERFLAG = 1;
        }
        const ErroredData = [];
        const CorrectData = [];
        data.map(obj => {
            let oldObj = { ...obj };
            const rejectionReasons = [];
            const duplicateItemCode = data.filter(item => item.TL_EMPCODE?.toString() === obj.TL_EMPCODE?.toString());
            if (duplicateItemCode?.length >= 2 && obj.TL_EMPCODE) {
                rejectionReasons.push(`Duplicate TL EMPCODE  (${obj.TL_EMPCODE}) found ${duplicateItemCode.length} times in this Excel`, ' | ');
            }
            const duplicateItemName = data.filter(item => item.TL_NAME?.toString() === obj.TL_NAME?.toString());
            if (duplicateItemCode?.length >= 2 && obj.TL_NAME) {
                rejectionReasons.push(`Duplicate TL Name  (${obj.TL_NAME}) found ${duplicateItemName.length} times on Diferent EMPCODE in this Excel`, ' | ');
            }
            if (item_code[0].some(item => item.ic?.toString() == obj.TL_EMPCODE?.toString())) {
                rejectionReasons.push(`TL Code  ${obj.TL_EMPCODE} Already Exist In DSE Master`, ' | ');
            }
            if (EMPLOYEEMASTERFLAG === 1) {
                if (!check2.some(item => item.ic?.toString() === obj.DSE_EMPCODE?.toString())) {
                    rejectionReasons.push(`DSE Code ${obj.DSE_EMPCODE} Not Exist In Employee Master`, ' | ');
                }
            }
            if (rejectionReasons.length > 0) {
                ErroredData.push({
                    ...oldObj,
                    rejectionReasons: rejectionReasons?.slice(0, -1)
                });
            } else {
                CorrectData.push(obj);
            }
        });
        console.log(CorrectData, 'CorrectData');
        console.log(ErroredData, "ErroredData");
        const maxMiscCode = await MiscMst.max("Misc_Code", {
            where: { Misc_Type: 620 },
            transaction: t,
        });
        let newMiscCode = maxMiscCode + 1;
        const MiscMst_ = await MiscMst.bulkCreate(
            CorrectData.map((item, index) => ({
                Misc_Type: 620,
                Misc_Code: newMiscCode + index,
                Misc_Name: item.TL_EMPCODE,
                Misc_Abbr: item.TL_NAME,
                Misc_Dtl1: item.GH_EMPCODE,
                Join_Date: adjustToIST(item.DOJ),
                Export_Type: 1,
                ServerId: 1,
                Loc_Code: req.body.Loc_Code
            })),
            { transaction: t }
        )
        console.log(MiscMst_.length);
        t.commit();
        await sequelize.close();
        res.status(200).send({ ErroredData: ErroredData, CorrectData: CorrectData, Message: `${MiscMst_.length} Records Inserted` })
    } catch (error) {
        t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};
exports.TLImportFormat = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "Team Leader Excel Import";
        const Headeres = ['TL_EMPCODE', 'TL_NAME', 'GH_EMPCODE', 'DOJ'];
        // const Company_Name = await sequelize.query(
        //     `select top 1 comp_name from Comp_Mst`
        // );
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");
        // worksheet.mergeCells("A1:E1");
        // worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
        // worksheet.getCell("A1").alignment = {
        //     vertical: "middle",
        //     horizontal: "center",
        // };
        // worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
        // worksheet.mergeCells("A2:E2");
        // worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
        // worksheet.getCell("A2").alignment = {
        //     vertical: "middle",
        //     horizontal: "center",
        // };
        // worksheet.mergeCells("A3:L3");
        // let reportName1 = "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
        // worksheet.getCell("A3").value = `${reportName1}`;
        const headerRow = worksheet.addRow(Headeres);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" },
            };
        });
        worksheet.addRow();
        worksheet.addRow();
        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
            console.error("Error creating workbook:", error);
            res.status(500).send("Internal Server Error");
        });
    } catch (e) {
        console.log(e)
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("Sheet1");

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
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
function adjustToIST(dateStr) {
    const date = new Date(dateStr);
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 31);
    const ISTDateStr = date.toISOString();
    return ISTDateStr.slice(0, 10);
};
async function IcmReport(data) {
    // console.log(req.query)
    const sequelize = await dbname(data.compcode);
    // const data = req.query;
    // console.log(data)
    let frmTag = data.frmTag;
    let DateFrom = data.DateFrom;
    let DateUpto = data.DateUpto;
    let RptOn = data.RptOn;
    let PPC = data.PPC;
    let IOS = !!data.IOS;
    let LocString = data.LocString;
    let FIN_OS = !!data.FIN_OS;
    let DEL_OS = !!data.DEL_OS;
    let yr = data.yr;
    let mnth = data.mnth;
    console.log(frmTag, DateFrom, DateUpto, RptOn, IOS, LocString, FIN_OS);
    try {
        const CompName = await sequelize.query(`SELECT Comp_Name from Comp_Mst`);
        const CompanyName = CompName[0][0].Comp_Name;

        if (frmTag !== 'ICM' && frmTag !== 'DELV_REG') {
            // DateFrom = '2021/04/01'
            await sequelize.query(`UPDATE  NEWCAR_Sale_Register set ICM_ID=99999 
              WHERE INV_NO=(SELECT CANCEL_NO FROM DMS_ROW_DATA WHERE CANCEL_NO=INV_NO AND TRAN_TYPE=10 AND Export_Type<3);
              UPDATE ICM_MST SET EXPORT_TYPE=33 WHERE Delv_Date IS NULL AND DMS_INV in 
              (SELECT CANCEL_NO FROM DMS_ROW_DATA WHERE CANCEL_NO=ICM_MST.DMS_INV AND TRAN_TYPE=10 AND Export_Type<3)`);
            await sequelize.query(`Update ICM_MST set Inv_Number=
              (select top 1 IsNull(Sale_inv_prefix,'')+Convert(Varchar,Invoice_No) from 
              Bhatia_Invoice where ICM_MST.Tran_id=ICM_Id) where IsNull(Inv_Number,'')='' and 
              EXISTS (select 1 from  Bhatia_Invoice where ICM_MST.Tran_id=ICM_Id)`);
        }
        if (CompanyName == 'MAGIC22') {
            await sequelize.query(`update acnt_post set Rect_type=6 where  Rect_type=4`);
        }
        // await sequelize.query(`UPDATE insu_auto_debit  SET 
        //   customer_id=( SELECT max(ledger_id)  FROM DMS_ROW_DATA WHERE DMS_ROW_DATA.vin = insu_auto_debit.vin  
        //   and Tran_Type=1  and DMS_ROW_DATA.EXPORT_TYPE in (1,2) and isnull(CANCEL_No,'')=''   )  
        //   WHERE Year(TRAN_DATE)=2021 and EXISTS (SELECT 1 FROM DMS_ROW_DATA WHERE 
        //   DMS_ROW_DATA.vin = insu_auto_debit.vin and  DMS_ROW_DATA.Ledger_Id <> insu_auto_debit.Customer_id  
        //   and Tran_Type=1  and DMS_ROW_DATA.EXPORT_TYPE in (1,2)  and isnull(CANCEL_No,'')='' )`);
        // console.log(IOS)
        if (IOS) {
            RptOn = 3;
        }
        var DateSTr = ``;
        // console.log(RptOn,'RptOn')

        if (RptOn == 5) DateSTr += `File_Date`;
        else if (RptOn == 3) DateSTr += `Delv_Date`;
        else if (RptOn == 2) DateSTr += `INV_DATE`;
        else DateSTr += `File_Date`;
        // console.log(RptOn,'RptOn')

        if (RptOn == 4) {
            // RptOn = 2
        }
        let QueryLoc = LocString;

        if (DateFrom !== '') {
            DateSTr = `and ${DateSTr} BETWEEN '${DateFrom}' AND '${DateUpto}' AND ICM_MST.Loc_Code in (${QueryLoc})`;
        }

        let reportName = "ICM Register";
        // console.log(RptOn,'RptOn')

        let Ssql =
            `select Distinct ICM_MST.Tran_Id as SNo, ICM_MST.Tran_Id as Tran_Id,
              (Select top 1 Com_Name from Godown_Mst where Godw_Code=IsNull(Org_Loc,0)) AS Billing_Branch,
              (Select top 1 Com_Name from Godown_Mst where Godw_Code=Loc_Code) AS Delivery_Branch_Location,
              Ledg_Name as Customer_Name,Cust_Id as Customer_Id,Del_CustId as Delivery_Customer_Id,
              Pan_No as Customer_PAN,GST_No as Customer_GST_No,(select top 1 Misc_Name  from Misc_Mst 
              where Misc_Type=3 and Misc_code=Stat_Code) as State_Of_Supply,
              (select top 1 Misc_Name  from Misc_Mst where Misc_Type=2 and Misc_code=Dist_Code) as District,
              (select top 1 Misc_Name  from Misc_Mst where Misc_Type=1 and Misc_code=Teh_Code) as Tehsil,
              Village,Aadhar_No,Ph1 as Customer_Mobile,iif(IsNull(Inv_Number,'')='',DMS_Inv,
              IsNull(Inv_Number,'')) as Invoice_No,INV_DATE as Invoice_Date, INV_Date as ICM_Date,INV_DATE as RIPS_DATE,
              Delv_Date as Date_Of_Veh_Delivery,Verify_Date,GP_Prefix as Gatepass_No,
              iif(IsNull(drpRTO,0)=2,'Yes','No') as Commercial_or_Not,RTO_RefNo as CH_No,Regn_No as Registration_No,
              RTO_DAte as Regn_Date,Chas_No as Chassis_No,MI_Date as Insurance_Date,
              (select top 1 Misc_Name  from Misc_Mst where Misc_Type=14 and Misc_code=Modl_Grp) as Model,Modl_Grp,
              ICM_MST.Modl_Code as Model_Id,(select top 1 Modl_Name from Modl_Mst where  
              Convert(Integer,Modl_Mst.Item_Code)=Convert(Integer,ICM_MST.Modl_Code)) as Model_Variant,
              (select top 1 Misc_Name  from Misc_Mst where Misc_Type=10 and Misc_code=Veh_Clr)  as Colour,
              0.0 as BASIC_PRICE,MRP_Price as ExShowroom_Price,0.0 as Tax_Perc, Cons_Disc1 as Consumer_Offer,
              Buffer_Disc as Buffer,MSSF,Corp_Disc as Corporate_Offer,Exch_Disc as Exchange_Offer,
              (select top 1 iif(Exch_type_1 = 0,'TV','NTV') from exch_veh where exch_veh.VIN = ICM_MST.VIN ) as TV_NTV,
              (select top 1 iif(ISEBR = 1,'EBR','PHYSICAL') from exch_veh where exch_veh.VIN = ICM_MST.VIN ) as IS_EBR,
              (select top 1 OldRegno_1 from exch_veh where exch_veh.VIN = ICM_MST.VIN ) as OldRegno_1,
              RIPS1_Disc as RIPS_Support1,RIPS2_Disc as RIPS_Support2,RIPS3_Disc as   RIPS_Support3
              ,MDS_Offer,Emp_Disc as Employee_Scheme_by_MSIL,MSIL_Disc as MSIL_Discount_with_Approval_by_GM_SM,
              0.0 as ISL_DISCOUNT_DEALER_SHARE,0.0 as EXCHANGE_DISCOUNT_DEALER_SHARE,Adnl_Disc as Post_Sale_Discount,
               Totl_Disc as Total_Discount, OnRoad_Price as Total_Invoice_Value,MGA_Pric as MGA,NonMGA_Chrgs as Teflon,
               NonMGA_Oth as Non_MGA,IsNull(RTO_Pric,0) as Road_Tax, IsNull(RTO_Pric2,0) as TR,Choice_No,
               iif(isnull(drpEW,0)=2,'Royal Platinum(5th Yr)',iif(isnull(drpEW,0)=1,'Gold (3rd Yr)',iif(isnull(drpEW,0)=3,
               'Rana EW Royal Platinum',iif(isnull(drpEW,0)=4,'None','Platinum (4th Yr)')))) as EW_Type,
               EW_Pric as Extended_Warranty,PPC_Chrgs as CCP_Chrgs,IIF(drpinsu=0,'Zero Dep.',IIF(drpinsu=1,'Normal',
               IIF(drpinsu=2,'Commercial',IIF(drpinsu=3,'Zero Dep. NCB',IIF(drpinsu=4,'Normal NCB',
               IIF(drpinsu=6,'LTCP','None')))))) as Insurance_Type,Ins_Pric as Insurance_Price,Nexa_Card as Nexa_Auto_Card,
               CNG_Chrgs,RC_Card,MCP_Chrgs,TCS_Chrgs,HPN_Chrgs,HSRP_Chrgs,EACHING_CHRG,Oth_Chrgs,FasTag,Meter_Patti,
               Parking_Tax,OnRoad_Price as Total_Charged_From_Customer, 0.0 as Cash,0.0 as Cards,0.0 as Cheque_Online,
               IsNull(Party_Trf_Amt_1,0)+IsNull(Party_Trf_Amt_2,0)+IsNull(Party_Trf_Amt_3,0)+IsNull(Party_Trf_Amt_4,0) 
               +IsNull(Party_Trf_Amt_5,0) +IsNull(Party_Trf_Amt_6,0) as Transfer_From_Others,
               (select top 1 Ledg_Name from Ledg_Mst where Prty_Name_1=Ledg_Code) + ' | '
               +(select top 1 Ledg_Name from Ledg_Mst where Prty_Name_2=Ledg_Code) + ' | '
               +(select top 1 Ledg_Name from Ledg_Mst where Prty_Name_3=Ledg_Code) as LEDGER_NAME_TRF_FROM_OTH,
               IsNull(Party_Rem_1,'') + ' | '+IsNull(Party_Rem_2,'') + ' | '+IsNull(Party_Rem_3,'') as REMARKS_TRF_FROM_OTH, 
               0.0 as Total_Payment_Received,Card_Charges as Credit_Card_Charges,PO_Amt as PO_Security_Amt,
               IsNull(DO_Amt,0)-IsNull(PF_Charges,0) as Net_Loan_Amt_After_PF_Chrgs,DO_Pymt_Recd,
               (select top 1 Misc_Name from Misc_Mst where Misc_Type=8 and Misc_code=Fin_Code) as Hypothecation_By,
               Convert(NVarchar(50),Pymt_Mode) as Leased_By,(select top 1 Misc_Name from Misc_Mst where Misc_Type=18 and  
               Misc_code=Pymt_Mode) as IN_House_Fin,0.0 as TV_Purchase_Amt,0.0 as Loan_Paid_By_RMPL,0.0 as Third_Party_Insu_Amt,
               TV_Amt as TV_NetAmt,TV_Pymt_Recd,TV_Pymt_Date,'' as Used_Car_Details_1,'' as Used_Car_Details_2,'' as Used_Car_Details_3,
               '' as Evaluator_Name, 0.0 as Short_Excess_from_Customers,iif(IsNull(IsMgmt,0)=1,'Yes','No') as Outstanding_Referred_By_Mgmt,
               (SElect top 1 EmpCode from EmployeeMaster where  SrNo=ERP_DSE) as DSE_EmpCode,(SElect top 1 EmpFirstName+' '+EmpLastName from 
               EmployeeMaster where  SrNo=ERP_DSE) as DSE_Name,(SElect top 1 EmpCode from EmployeeMaster where  SrNo=ERP_TL) as TL_EmpCode,
               (SElect top 1 EmpFirstName+' '+EmpLastName from EmployeeMaster where  SrNo=ERP_TL) as TL_Name, 
               (Select top 1 User_Name from USer_Tbl where ICM_MST.User_Code=USer_Tbl.User_Code) as File_Checked_By,
               GP_User,Spl_Rem as Remark,GM_Rem as GM_Sales_Remark,file_no,ledg_add1 as Cust_Add1,Ledg_Add2 as Cust_Add2
               ,Email_id,iif(drpCustType=0,'Individual Customer',iif(drpCustType=1,'CSD Customer',iif(drpCustType=2,
               'BSF Customer',iif(drpCustType=3,'CPC Customer','None')))) as Customer_Type,Pin_Code,Nomi_Name,NDOB,
               (select top 1 Misc_Name from Misc_Mst where Misc_Type=51 and Misc_code=Br_Code) as Fin_Branch ,Fin_Dono,
               PF_Charges,PO_No,PO_Amt,PO_Date,VIN,Engn_No,iif(drpRTO=1,'Temporary',iif(drprto=2,'commercial',
               iif(drprto=0,'Permanent',iif(drprto=3,'RTO+TRC','None')))) as RTO_Type, EW_PolicyAmt,EW_Date,EW_PolicyNo,
               DSE_Payout,Payout_Rate,Payout_Amt,Payout_GST,Net_Payout,FLoan_Status,FAccount_No,FRecd_Amt as Fin_Recd_Amt,
               FCredit_Ref as Fin_Credit_Ref,FRemark as Fin_Remark, '' as MI_DATE,'' as Policy_Type, '' as Insu_Company,
               '' as Part_A_Premium,'' as MI_Policy_Amt,'' as Zero_Dep_Status,'' as Engine_Cover_Status,'' as RTI_Status,
               '' as DOB,'' as Veh_Type,'' as YOM,'' as MUL_Invoice_No,'' as MUL_Invoice_Date,0.0 as DIRF_Amt,0.0 as Purchase_Price
               ,0.0 as Purchase_Discount,'' as Ledg_Code,'' as Group_Name,'' as Autovyn_Customer_Name,0 as Doc_Upload,'No' as  Insu_Fin_Post, 
               'No' as  EW_Fin_Post, 'No' as RTO_Fin_Post, 'No' as Fastag_FIn_Post, 'No' as HP_FIn_Post, 'No' as DIMS_FIn_Post, 
               'No' as PTax_FIn_Post, 'No' as NonMGA_FIn_Post, 'No' as MCP_FIn_Post, 'No' as CNG_FIn_Post, 'No' as MeterPatti_FIn_Post, 
               'No' as TCS_FIn_Post, 'No' as CCC_FIn_Post, 'No' as RC_Card_FIn_Post, 'No' as Choice_No_Fin_Post, 'No' as PANCard_FIn_Post,
               0.0 as MGA_Bill_Amt,0 as MGA_Diff,0.0 as MGA_Disc_Amt,Modl_Code,Emp_Disc_DLR,Emp_Disc_MSIL, '' as Gross_Total_Premium, 
               '' as Zero_Dep_Status,	0.0 as Zero_Dep_Premium,	0.0 as Engine_Cover_Premium,	0.0 as RTI_Premium,	'' as Free_Scheme,
               0.0 as Ledger_Bal,MSSF_Id,Adnl_MGA_Disc,OS_Clear,Del_OS  from ICM_MST,ICM_DTL where ICM_MST.Tran_Id=ICM_DTL.Tran_Id
                AND ICM_MST.Tran_Id > 0 and ICM_MST.Export_Type<5 ${DateSTr}`;

        if (RptOn == 2) {
            Ssql += `UNION ALL select distinct 0 as  SNo, ICM_MST.Tran_Id as Tran_Id,
              (Select top  1 Com_Name from Godown_Mst where Godw_Code=D.Loc_Code) AS  Billing_Branch,
              (Select top 1 Com_Name from Godown_Mst where Godw_Code=D.Loc_Code) AS Delivery_Branch_Location,N.Customer_Name,N.Customer_Id as Customer_Id,
              '' as Delivery_Customer_Id,N.Pan_No as Customer_PAN,N.CUST_GST_NUMBER as Customer_GST_No,
              PLACE_OF_SUPPLY as State_Of_Supply,City as District,Tehsil_Desc as Tehsil,Village_Desc as Village,
              '' as Aadhar_No,MOBILE2 as Customer_Mobile,INV_NO as Invoice_No,INV_DT as Invoice_Date, 
              NULL as ICM_Date,NULL as Date_Of_Veh_Delivery,NULL AS Verify_Date, '' as Gatepass_No,'' as Commercial_or_Not,
              '' as CH_No,'' as Registration_No,NULL as Regn_Date,N.CHASSIS as Chassis_No,NULL as Insurance_Date,
              N.Model,(Select top 1  Item_Code from Modl_MST where Convert(Varchar,Modl_Mst.Item_Code)=VARIANT_CD) as Model_Id,
              VARIANT_CD as Model_Variant,CLR_CD  as Colour,N.BASIC_PRICE,N.INV_AMT as ExShowroom_Price,
              ISNULL(CGST_PERC,0)+ISNULL(SGST_PERC,0)+ISNULL(IGST_PERC,0)+ISNULL(N.CESS_PERC,0) as Tax_Perc,
               N.DISCOUNT as Consumer_Offer,0.0 as Buffer,0 as MSSF,Discount_for_Corp_Institutional_Customer as Corporate_Offer,
               Exchange_Loyalty_Bonus_Discount as Exchange_Offer,0 as RIPS_Support1,0 as RIPS_Support2,0.0 as   RIPS_Support3,
               0 AS MDS_Offer,0 as Employee_Scheme_by_MSIL,0 as MSIL_Discount_with_Approval_by_GM_SM,0.0 as ISL_DISCOUNT_DEALER_SHARE,
               0.0 as EXCHANGE_DISCOUNT_DEALER_SHARE,0   as Post_Sale_Discount, 
               IsNull(Exchange_Loyalty_Bonus_Discount,0)+IsNull(Discount_for_Corp_Institutional_Customer,0)+IsNull(N.DISCOUNT,0) as Total_Discount, 
               D.INV_AMT as Total_Invoice_Value,0 as MGA,0 as Teflon,0 as Non_MGA,0 as Road_Tax,0 as TR,0 as Choice_No,'' as EW_Type,
               0 as Extended_Warranty,0 as CCP_Chrgs,'' as Insurance_Type,0 as Insurance_Price,0 as Nexa_Auto_Card,0 AS CNG_Chrgs,
               0 as RC_Card,0 AS MCP_Chrgs,0 AS TCS_Chrgs,0 AS HPN_Chrgs,0 AS HSRP_Chrgs,0 as EACHING_CHRG,0 AS Oth_Chrgs,
               0 AS FasTag,0 AS Meter_Patti,0 AS Parking_Tax,D.INV_AMT as Total_Charged_From_Customer, 0.0 as Cash,0.0 as Cards,
               0.0 as Cheque_Online,0.0 as Transfer_From_Others,'' AS LEDGER_NAME_TRF_FROM_OTH,'' AS REMARKS_TRF_FROM_OTH,
               0.0 as Total_Payment_Received,0.0 as Credit_Card_Charges,0.0 as PO_Security_Amt,0.0 as Net_Loan_Amt_After_PF_Chrgs,
               0.0 AS DO_Pymt_Recd,'' as Hypothecation_By,'' as Leased_By,'' as IN_House_Fin,0.0 as TV_Purchase_Amt,
               0.0 as Loan_Paid_By_RMPL,0.0 as Third_Party_Insu_Amt,TV_Amt as TV_NetAmt,0.0 as TV_Pymt_Recd,Null AS TV_Pymt_Date,
               '' as Used_Car_Details_1,'' as Used_Car_Details_2,'' as Used_Car_Details_3,'' as Evaluator_Name, 
               0.0 as Short_Excess_from_Customers,'No' as Outstanding_Referred_By_Mgmt,'' as DSE_EmpCode,N.DSE as DSE_Name,
               '' as TL_EmpCode,TEAM_LEAD as TL_Name, '' as File_Checked_By,'' as GP_User,'' as Remark,'' as GM_Sales_Remark,
               '' AS file_no,N.ADD1 as Cust_Add1,N.ADD2 as Cust_Add2,'' AS Email_id,N.SALE_TYPE as Customer_Type,N.PinCode,
               '' AS Nomi_Name,NULL AS NDOB,'' as Fin_Branch ,'' AS Fin_Dono,0 AS PF_Charges,'' AS PO_No,0 AS PO_Amt,NULL AS PO_Date,N.VIN,N.Engine as Engn_No,
               '' as RTO_Type, 0 as EW_PolicyAmt,null as EW_Date,'' as EW_PolicyNo,0 as DSE_Payout,0 as Payout_Rate,0 as Payout_Amt,0 as Payout_GST,0 as Net_Payout,
               '' as FLoan_Status,'' as FAccount_No,0 as Fin_Recd_Amt,'' as Fin_Credit_Ref,'' as Fin_Remark, '' as MI_DATE,'' as Policy_Type, '' as Insu_Company,
               '' as Part_A_Premium,'' as MI_Policy_Amt,'' as Zero_Dep_Status,'' as Engine_Cover_Status,'' as RTI_Status,'' as DOB,'' as Veh_Type,'' as YOM,
               '' as MUL_Invoice_No,'' as MUL_Invoice_Date,0.0 as DIRF_Amt,0.0 as Purchase_Price,0.0 as Purchase_Discount,'' as Ledg_Code,'' as Group_Name,
               '' as Autovyn_Customer_Name,0 as Doc_Upload,'No' as  Insu_Fin_Post, 'No' as  EW_Fin_Post, 'No' as RTO_Fin_Post, 'No' as Fastag_FIn_Post,
                'No' as HP_FIn_Post, 'No' as DIMS_FIn_Post, 'No' as PTax_FIn_Post, 'No' as NonMGA_FIn_Post, 'No' as MCP_FIn_Post, 'No' as CNG_FIn_Post,
                 'No' as MeterPatti_FIn_Post, 'No' as TCS_FIn_Post, 'No' as CCC_FIn_Post,'No' as RC_Card_FIn_Post, 'No' as Choice_No_Fin_Post,
                  'No' as PANCard_FIn_Post,0.0 as MGA_Disc_Amt,0.0 as MGA_Bill_Amt,0 as MGA_Diff,0 as Modl_Code,0 as Emp_Disc_DLR,0 as Emp_Disc_MSIL,
                   '' as Gross_Total_Premium, '' as Zero_Dep_Status,	0.0 as Zero_Dep_Premium,	0.0 as Engine_Cover_Premium,	0.0 as RTI_Premium,
                       '' as Free_Scheme,0.0 as Ledger_Bal,'' as MSSF_Id,'' as Adnl_MGA_Disc,OS_Clear,0 as Del_OS  from  NEWCAR_Sale_Register N,
                      DMS_ROW_DATA D where IsNull(ICM_Id,0)=0 and Tran_Type=1 and Inv_No=Bill_No and IsNull(Export_Type,0)<3 ${DateSTr.replace("File_Date", "INV_DT").replace("INV_DATE", "INV_DT").replace("ICM_MST", "D")}`
        }
        if (RptOn == 4) {
            await sequelize.query(`UPDATE DMS_ROW_DATA SET 
                  CANCEL_Date=(SELECT a.bILL_DATE FROM DMS_ROW_DATA A WHERE A.Bill_No=DMS_ROW_DATA.CANCEL_NO AND A.Export_Type IN (1,2) AND A.Tran_tYPE=10) 
                  WHERE Export_Type IN (1,2) AND Tran_tYPE=1 AND YEAR(BILL_DATE)=2021 AND MONTH(BILL_DATE)>=4 AND CANCEL_Date IS NULL AND ISNULL(CANCEL_NO,'')<>'' 
                  AND EXISTS (SELECT 1 FROM DMS_ROW_DATA A WHERE A.Bill_No=DMS_ROW_DATA.CANCEL_NO AND A.Export_Type IN (1,2) AND A.Tran_tYPE=10)`);

            DateSTr = `and ( Delv_Date is null or Delv_Date > '${DateUpto}') and inv_date <= '${DateUpto}'`;
            Ssql = `select distinct ICM_MST.Tran_Id as SNo, ICM_MST.Tran_Id as Tran_Id,
                  (Select top 1 Com_Name from Godown_Mst where Godw_Code=IsNull(Org_Loc,0)) AS Billing_Branch,
                  (Select top 1 Com_Name from Godown_Mst where Godw_Code=Loc_Code) AS Delivery_Branch_Location,
                  Ledg_Name as Customer_Name,Cust_Id as Customer_Id,Del_CustId as Delivery_Customer_Id,Pan_No as Customer_PAN,
                  GST_No as Customer_GST_No,(select top 1 Misc_Name  from Misc_Mst where Misc_Type=3 and Misc_code=Stat_Code) as State_Of_Supply,
                  Ph1 as Customer_Mobile,iif(IsNull(Inv_Number,'')='',DMS_Inv,IsNull(Inv_Number,'')) as Invoice_No,File_Date as Invoice_Date, 
                  INV_Date as ICM_Date,Delv_Date as Date_Of_Veh_Delivery,Verify_Date,'' as Dms_Cancel_Inv_No,Null as Dms_Inv_Cancel_Date, 
                  GP_Prefix as Gatepass_No,iif(IsNull(drpRTO,0)=2,'Yes','No') as Commercial_or_Not,RTO_RefNo as CH_No,Regn_No as Registration_No,
                  RTO_DAte as Regn_Date,Chas_No as Chassis_No,MI_Date as Insurance_Date,(select top 1 Misc_Name  from Misc_Mst where Misc_Type=14 
                  and Misc_code=Modl_Grp) as Model,Modl_Grp,ICM_MST.Modl_Code as Model_Id,(select top 1 Modl_Name from Modl_Mst where  
                  Convert(Integer,Modl_Mst.Item_Code)=Convert(Integer,ICM_MST.Modl_Code)) as Model_Variant,
                  (select top 1 Misc_Name  from Misc_Mst where Misc_Type=10 and Misc_code=Veh_Clr)  as Colour,
                  0.0 as BASIC_PRICE,MRP_Price as ExShowroom_Price,0.0 as Tax_Perc, Cons_Disc1 as Consumer_Offer,Buffer_Disc as Buffer,
                  MSSF,Corp_Disc as Corporate_Offer,Exch_Disc as Exchange_Offer,RIPS1_Disc as RIPS_Support1,RIPS2_Disc as RIPS_Support2,
                  RIPS3_Disc as   RIPS_Support3,MDS_Offer,Emp_Disc as Employee_Scheme_by_MSIL,MSIL_Disc as MSIL_Discount_with_Approval_by_GM_SM,
                  0.0 as ISL_DISCOUNT_DEALER_SHARE,0.0 as EXCHANGE_DISCOUNT_DEALER_SHARE, Totl_Disc as Total_Discount, OnRoad_Price as Total_Invoice_Value,
                  MGA_Pric as MGA,NonMGA_Chrgs as Teflon,NonMGA_Oth as Non_MGA,IsNull(RTO_Pric,0)+IsNull(RTO_Pric2,0) as Road_Tax,iif(isnull(drpEW,0)=2,
                  'Royal Platinum(5th Yr)',iif(isnull(drpEW,0)=1,'Gold (3rd Yr)',iif(isnull(drpEW,0)=3,'Rana EW Royal Platinum',iif(isnull(drpEW,0)=4,
                  'None','Platinum (4th Yr)')))) as EW_Type,EW_Pric as Extended_Warranty,IIF(drpinsu=0,'Zero Dep.',IIF(drpinsu=1,'Normal',
                  IIF(drpinsu=2,'Commercial',IIF(drpinsu=3,'Zero Dep. NCB',IIF(drpinsu=4,'Normal NCB',IIF(drpinsu=6,'LTCP','None')))))) as Insurance_Type,
                  Ins_Pric as Insurance_Price,Nexa_Card as Nexa_Auto_Card,CNG_Chrgs,RC_Card,MCP_Chrgs,TCS_Chrgs,HPN_Chrgs,HSRP_Chrgs,EACHING_CHRG,Oth_Chrgs,
                  FasTag,Meter_Patti,Parking_Tax,OnRoad_Price as Total_Charged_From_Customer,Adnl_Disc as Post_Sale_Discount, 0.0 as Cash,
                  0.0 as Cards,0.0 as Cheque_Online,IsNull(Party_Trf_Amt_1,0)+IsNull(Party_Trf_Amt_2,0)+IsNull(Party_Trf_Amt_3,0) as Transfer_From_Others,
                  0.0 as Total_Payment_Received,Card_Charges as Credit_Card_Charges,PO_Amt as PO_Security_Amt,IsNull(DO_Amt,0)-IsNull(PF_Charges,0) as Net_Loan_Amt_After_PF_Chrgs,
                  (select top 1 Misc_Name from Misc_Mst where Misc_Type=8 and Misc_code=Fin_Code) as Hypothecation_By,Convert(NVarchar(50),Pymt_Mode) as Leased_By,
                  (select top 1 Misc_Name from Misc_Mst where Misc_Type=18 and  Misc_code=Pymt_Mode) as IN_House_Fin,0.0 as TV_Purchase_Amt,0.0 as Loan_Paid_By_RMPL,
                  0.0 as Third_Party_Insu_Amt,0.0 as TV_NetAmt,'' as Used_Car_Details_1,'' as Used_Car_Details_2,'' as Used_Car_Details_3,'' as Evaluator_Name, 
                  0.0 as Short_Excess_from_Customers,(SElect top 1 EmpCode from EmployeeMaster where  SrNo=ERP_DSE) as DSE_EmpCode,
                  (SElect top 1 EmpFirstName+' '+EmpLastName from EmployeeMaster where  SrNo=ERP_DSE) as DSE_Name,
                  (SElect top 1 EmpCode from EmployeeMaster where  SrNo=ERP_TL) as TL_EmpCode,
                  (SElect top 1 EmpFirstName+' '+EmpLastName from EmployeeMaster where  SrNo=ERP_TL) as TL_Name, 
                  (Select top 1 User_Name from USer_Tbl where ICM_MST.User_Code=USer_Tbl.User_Code) as File_Checked_By,
                  GP_User,Spl_Rem as Remark,file_no,ledg_add1 as Cust_Add1,Ledg_Add2 as Cust_Add2,Email_id,
                  iif(drpCustType=0,'Individual Customer',iif(drpCustType=1,'CSD Customer',iif(drpCustType=2,
                  'BSF Customer',iif(drpCustType=3,'CPC Customer','None')))) as Customer_Type,Pin_Code,Nomi_Name,NDOB,
                  (select top 1 Misc_Name from Misc_Mst where Misc_Type=51 and Misc_code=Br_Code) as Fin_Branch ,Fin_Dono,PF_Charges,PO_No,
                  PO_Amt,PO_Date,VIN,Engn_No,iif(drpRTO=1,'Temporary',iif(drprto=2,'commercial',iif(drprto=0,'Permanent',
                  iif(drprto=3,'RTO+TRC','None')))) as RTO_Type, EW_PolicyAmt,EW_Date,EW_PolicyNo,DSE_Payout,Payout_Rate,Payout_Amt,Payout_GST,
                  Net_Payout,FLoan_Status,FAccount_No,FRecd_Amt as Fin_Recd_Amt,FCredit_Ref as Fin_Credit_Ref,FRemark as Fin_Remark, '' as MI_DATE,
                  '' as Policy_Type, '' as Insu_Company,'' as Part_A_Premium,'' as MI_Policy_Amt,'' as Zero_Dep_Status,'' as Engine_Cover_Status,
                  '' as RTI_Status,'' as DOB,'' as Veh_Type,'' as YOM,'' as MUL_Invoice_No,'' as MUL_Invoice_Date,0.0 as DIRF_Amt,0.0 as Purchase_Price,
                  0.0 as Purchase_Discount,'' as Ledg_Code,'' as Group_Name,'' as Autovyn_Customer_Name,0 as Doc_Upload,'No' as  Insu_Fin_Post, 
                  'No' as  EW_Fin_Post, 'No' as RTO_Fin_Post, 'No' as Fastag_FIn_Post, 'No' as HP_FIn_Post, 'No' as DIMS_FIn_Post, 'No' as PTax_FIn_Post, 
                  'No' as NonMGA_FIn_Post, 'No' as MCP_FIn_Post, 'No' as CNG_FIn_Post, 'No' as MeterPatti_FIn_Post, 'No' as TCS_FIn_Post, 'No' as CCC_FIn_Post, 
                  'No' as RC_Card_FIn_Post, 'No' as Choice_No_Fin_Post, 'No' as PANCard_FIn_Post,0.0 as MGA_Bill_Amt,0 as MGA_Diff,0.0 as MGA_Disc_Amt,
                  Modl_Code,Emp_Disc_DLR,Emp_Disc_MSIL, '' as Gross_Total_Premium, '' as Zero_Dep_Status,	0.0 as Zero_Dep_Premium,	
                  0.0 as Engine_Cover_Premium,	0.0 as RTI_Premium,	'' as Free_Scheme,0.0 as Ledger_Bal,'' as REMARKS_TRF_FROM_OTH from ICM_MST,ICM_DTL 
                  where ICM_MST.Tran_Id=ICM_DTL.Tran_Id AND  ICM_MST.Export_Type<5  '${DateSTr}'  and ICM_MST.Org_Loc in (${QueryLoc}) AND 
                  DMS_INV NOT IN (SELECT CANCEL_NO FROM DMS_ROW_DATA D WHERE D.CANCEL_NO=DMS_INV AND D.EXPORT_TYPE IN (1,2))
  
                  UNION ALL select distinct 0 as  SNo, ICM_MST.Tran_Id as Tran_Id,
                  (Select top  1 Com_Name from Godown_Mst where Godw_Code=D.Loc_Code) AS  Billing_Branch,
                  (Select top  1 Com_Name from Godown_Mst where Godw_Code=D.Loc_Code) AS Delivery_Branch_Location,
                  N.Customer_Name,N.Customer_Id as Customer_Id,'' as Delivery_Customer_Id,N.Pan_No as Customer_PAN,
                  N.CUST_GST_NUMBER as Customer_GST_No,PLACE_OF_SUPPLY as State_Of_Supply,MOBILE2 as Customer_Mobile,
                  INV_NO as Invoice_No,INV_DT as Invoice_Date, NULL as ICM_Date,NULL as Date_Of_Veh_Delivery,
                  NULL AS Verify_Date,'' as Dms_Cancel_Inv_No,Null as Dms_Inv_Cancel_Date, '' as Gatepass_No,'' as Commercial_or_Not,
                  '' as CH_No,'' as Registration_No,NULL as Regn_Date,N.CHASSIS as Chassis_No,NULL as Insurance_Date,N.Model,
                  (Select top 1  Item_Code from Modl_MST where Convert(Varchar,Modl_Mst.Item_Code)=VARIANT_CD) as Model_Id,
                  VARIANT_CD as Model_Variant,CLR_CD  as Colour,N.BASIC_PRICE,N.INV_AMT as ExShowroom_Price,
                  ISNULL(CGST_PERC,0)+ISNULL(SGST_PERC,0)+ISNULL(IGST_PERC,0)+ISNULL(N.CESS_PERC,0) as Tax_Perc, 
                  N.DISCOUNT as Consumer_Offer,0.0 as Buffer,0 as MSSF,Discount_for_Corp_Institutional_Customer as Corporate_Offer,
                  Exchange_Loyalty_Bonus_Discount as Exchange_Offer,0 as RIPS_Support1,0 as RIPS_Support2,0.0 as   RIPS_Support3,
                  0 AS MDS_Offer,0 as Employee_Scheme_by_MSIL,0 as MSIL_Discount_with_Approval_by_GM_SM,0.0 as ISL_DISCOUNT_DEALER_SHARE,
                  0.0 as EXCHANGE_DISCOUNT_DEALER_SHARE, 
                  IsNull(Exchange_Loyalty_Bonus_Discount,0)+IsNull(Discount_for_Corp_Institutional_Customer,0)+IsNull(N.DISCOUNT,0) as Total_Discount, 
                  D.INV_AMT as Total_Invoice_Value,0 as MGA,0 as Teflon,0 as Non_MGA,0 as Road_Tax,'' as EW_Type,0 as Extended_Warranty,'' as Insurance_Type,
                  0 as Insurance_Price,0 as Nexa_Auto_Card,0 AS CNG_Chrgs,0 as RC_Card,0 AS MCP_Chrgs,0 AS TCS_Chrgs,0 AS HPN_Chrgs,0 AS HSRP_Chrgs,
                  0 as EACHING_CHRG,0 AS Oth_Chrgs,0 AS FasTag,0 AS Meter_Patti,0 AS Parking_Tax,D.INV_AMT as Total_Charged_From_Customer,0   as Post_Sale_Discount, 
                  0.0 as Cash,0.0 as Cards,0.0 as Cheque_Online,0.0 as Transfer_From_Others,0.0 as Total_Payment_Received,0.0 as Credit_Card_Charges,
                  0.0 as PO_Security_Amt,0.0 as Net_Loan_Amt_After_PF_Chrgs,'' as Hypothecation_By,'' as Leased_By,'' as IN_House_Fin,
                  0.0 as TV_Purchase_Amt,0.0 as Loan_Paid_By_RMPL,0.0 as Third_Party_Insu_Amt,0.0 as TV_NetAmt,'' as Used_Car_Details_1,
                  '' as Used_Car_Details_2,'' as Used_Car_Details_3,'' as Evaluator_Name, 0.0 as Short_Excess_from_Customers,
                  '' as DSE_EmpCode,N.DSE as DSE_Name,'' as TL_EmpCode,TEAM_LEAD as TL_Name, '' as File_Checked_By,'' as GP_User,
                  '' as Remark,'' AS file_no,N.ADD1 as Cust_Add1,N.ADD2 as Cust_Add2,'' AS Email_id,N.SALE_TYPE as Customer_Type,
                  N.PinCode,'' AS Nomi_Name,NULL AS NDOB,'' as Fin_Branch ,'' AS Fin_Dono,0 AS PF_Charges,'' AS PO_No,0 AS PO_Amt,
                  NULL AS PO_Date,N.VIN,N.Engine as Engn_No,'' as RTO_Type, 0 as EW_PolicyAmt,null as EW_Date,'' as EW_PolicyNo,
                  0 as DSE_Payout,0 as Payout_Rate,0 as Payout_Amt,0 as Payout_GST,0 as Net_Payout,'' as FLoan_Status,'' as FAccount_No,
                  0 as Fin_Recd_Amt,'' as Fin_Credit_Ref,'' as Fin_Remark, '' as MI_DATE,'' as Policy_Type, '' as Insu_Company,
                  '' as Part_A_Premium,'' as MI_Policy_Amt,'' as Zero_Dep_Status,'' as Engine_Cover_Status,'' as RTI_Status,
                  '' as DOB,'' as Veh_Type,'' as YOM,'' as MUL_Invoice_No,'' as MUL_Invoice_Date,0.0 as DIRF_Amt,0.0 as Purchase_Price,
                  0.0 as Purchase_Discount,'' as Ledg_Code,'' as Group_Name,'' as Autovyn_Customer_Name,0 as Doc_Upload,'No' as  Insu_Fin_Post, 
                  'No' as  EW_Fin_Post, 'No' as RTO_Fin_Post, 'No' as Fastag_FIn_Post, 'No' as HP_FIn_Post, 'No' as DIMS_FIn_Post, 
                  'No' as PTax_FIn_Post, 'No' as NonMGA_FIn_Post, 'No' as MCP_FIn_Post, 'No' as CNG_FIn_Post, 'No' as MeterPatti_FIn_Post, 
                  'No' as TCS_FIn_Post, 'No' as CCC_FIn_Post,'No' as RC_Card_FIn_Post, 'No' as Choice_No_Fin_Post, 'No' as PANCard_FIn_Post,
                  0.0 as MGA_Bill_Amt,0 as MGA_Diff,0.0 as MGA_Disc_Amt,0 as Modl_Code,0 as Emp_Disc_DLR,0 as Emp_Disc_MSIL, '' as Gross_Total_Premium, 
                  '' as Zero_Dep_Status,	0.0 as Zero_Dep_Premium,	0.0 as Engine_Cover_Premium,	0.0 as RTI_Premium,	'' as Free_Scheme,
                  0.0 as Ledger_Bal,'' as REMARKS_TRF_FROM_OTH from  NEWCAR_Sale_Register N,DMS_ROW_DATA D where IsNull(ICM_Id,0)=0 and Tran_Type=1 
                  and Inv_No=Bill_No and IsNull(Export_Type,0)<3  and IsNull(D.Cancel_No,'')='' and D.Bill_Date<='${DateUpto}'  and D.Loc_Code in (${QueryLoc}) 
                  
                  UNION ALL select distinct 0 as  SNo, 
                  ICM_MST.Tran_Id as Tran_Id,
                  (Select top  1 Com_Name from Godown_Mst where Godw_Code=D.Loc_Code) AS  Billing_Branch,
                  (Select top  1 Com_Name from Godown_Mst where Godw_Code=D.Loc_Code) AS Delivery_Branch_Location,
                  N.Customer_Name,N.Customer_Id as Customer_Id,'' as Delivery_Customer_Id,
                  N.Pan_No as Customer_PAN,N.CUST_GST_NUMBER as Customer_GST_No,PLACE_OF_SUPPLY as State_Of_Supply,
                  MOBILE2 as Customer_Mobile,INV_NO as Invoice_No,INV_DT as Invoice_Date, NULL as ICM_Date,
                  NULL as Date_Of_Veh_Delivery,NULL AS Verify_Date,D.Cancel_No as Dms_Cancel_Inv_No,
                  D.Cancel_Date as Dms_Inv_Cancel_Date,  '' as Gatepass_No,'' as Commercial_or_Not,
                  '' as CH_No,'' as Registration_No,NULL as Regn_Date,N.CHASSIS as Chassis_No,
                  NULL as Insurance_Date,N.Model,(Select top 1  Item_Code from Modl_MST where Convert(Varchar,Modl_Mst.Item_Code)=VARIANT_CD) as Model_Id,
                  VARIANT_CD as Model_Variant,CLR_CD  as Colour,N.BASIC_PRICE,N.INV_AMT as ExShowroom_Price,
                  ISNULL(CGST_PERC,0)+ISNULL(SGST_PERC,0)+ISNULL(IGST_PERC,0)+ISNULL(N.CESS_PERC,0) as Tax_Perc,
                   N.DISCOUNT as Consumer_Offer,0.0 as Buffer,0 as MSSF,Discount_for_Corp_Institutional_Customer as Corporate_Offer,
                   Exchange_Loyalty_Bonus_Discount as Exchange_Offer,0 as RIPS_Support1,0 as RIPS_Support2,0.0 as   RIPS_Support3,
                   0 AS MDS_Offer,0 as Employee_Scheme_by_MSIL,0 as MSIL_Discount_with_Approval_by_GM_SM,0.0 as ISL_DISCOUNT_DEALER_SHARE,
                   0.0 as EXCHANGE_DISCOUNT_DEALER_SHARE, 
                   IsNull(Exchange_Loyalty_Bonus_Discount,0)+IsNull(Discount_for_Corp_Institutional_Customer,0)+IsNull(N.DISCOUNT,0) as Total_Discount, 
                   D.INV_AMT as Total_Invoice_Value,0 as MGA,0 as Teflon,0 as Non_MGA,0 as Road_Tax,'' as EW_Type,0 as Extended_Warranty,'' as Insurance_Type,
                   0 as Insurance_Price,0 as Nexa_Auto_Card,0 AS CNG_Chrgs,0 as RC_Card,0 AS MCP_Chrgs,0 AS TCS_Chrgs,0 AS HPN_Chrgs,0 AS HSRP_Chrgs,0 as EACHING_CHRG,
                   0 AS Oth_Chrgs,0 AS FasTag,0 AS Meter_Patti,0 AS Parking_Tax,D.INV_AMT as Total_Charged_From_Customer,0   as Post_Sale_Discount, 0.0 as Cash,
                   0.0 as Cards,0.0 as Cheque_Online,0.0 as Transfer_From_Others,0.0 as Total_Payment_Received,0.0 as Credit_Card_Charges,0.0 as PO_Security_Amt,
                   0.0 as Net_Loan_Amt_After_PF_Chrgs,'' as Hypothecation_By,'' as Leased_By,'' as IN_House_Fin,0.0 as TV_Purchase_Amt,0.0 as Loan_Paid_By_RMPL,
                   0.0 as Third_Party_Insu_Amt,0.0 as TV_NetAmt,'' as Used_Car_Details_1,'' as Used_Car_Details_2,'' as Used_Car_Details_3,'' as Evaluator_Name, 
                   0.0 as Short_Excess_from_Customers,'' as DSE_EmpCode,N.DSE as DSE_Name,'' as TL_EmpCode,TEAM_LEAD as TL_Name, '' as File_Checked_By,'' as GP_User,
                   '' as Remark,'' AS file_no,N.ADD1 as Cust_Add1,N.ADD2 as Cust_Add2,'' AS Email_id,N.SALE_TYPE as Customer_Type,N.PinCode,'' AS Nomi_Name,
                   NULL AS NDOB,'' as Fin_Branch ,'' AS Fin_Dono,0 AS PF_Charges,'' AS PO_No,0 AS PO_Amt,NULL AS PO_Date,N.VIN,N.Engine as Engn_No,'' as RTO_Type, 
                   0 as EW_PolicyAmt,null as EW_Date,'' as EW_PolicyNo,0 as DSE_Payout,0 as Payout_Rate,0 as Payout_Amt,0 as Payout_GST,0 as Net_Payout,
                   '' as FLoan_Status,'' as FAccount_No,0 as Fin_Recd_Amt,'' as Fin_Credit_Ref,'' as Fin_Remark, '' as MI_DATE,'' as Policy_Type, '' as Insu_Company,
                   '' as Part_A_Premium,'' as MI_Policy_Amt,'' as Zero_Dep_Status,'' as Engine_Cover_Status,'' as RTI_Status,'' as DOB,'' as Veh_Type,'' as YOM,
                   '' as MUL_Invoice_No,'' as MUL_Invoice_Date,0.0 as DIRF_Amt,0.0 as Purchase_Price,0.0 as Purchase_Discount,'' as Ledg_Code,'' as Group_Name,
                   '' as Autovyn_Customer_Name,0 as Doc_Upload,'No' as  Insu_Fin_Post, 'No' as  EW_Fin_Post, 'No' as RTO_Fin_Post, 'No' as Fastag_FIn_Post, 
                   'No' as HP_FIn_Post, 'No' as DIMS_FIn_Post, 'No' as PTax_FIn_Post, 'No' as NonMGA_FIn_Post, 'No' as MCP_FIn_Post, 'No' as CNG_FIn_Post, 
                   'No' as MeterPatti_FIn_Post, 'No' as TCS_FIn_Post, 'No' as CCC_FIn_Post,'No' as RC_Card_FIn_Post, 'No' as Choice_No_Fin_Post, 
                   'No' as PANCard_FIn_Post,0.0 as MGA_Bill_Amt,0 as MGA_Diff,0.0 as MGA_Disc_Amt,0 as Modl_Code,0 as Emp_Disc_DLR,0 as Emp_Disc_MSIL, 
                   '' as Gross_Total_Premium, '' as Zero_Dep_Status,	0.0 as Zero_Dep_Premium,	0.0 as Engine_Cover_Premium,	0.0 as RTI_Premium,	
                   '' as Free_Scheme,0.0 as Ledger_Bal,'' as REMARKS_TRF_FROM_OTH from  NEWCAR_Sale_Register N,DMS_ROW_DATA D where IsNull(ICM_Id,0)=0 
                   and Tran_Type=1 and Inv_No=Bill_No and IsNull(Export_Type,0)<3  and IsNull(D.Cancel_No,'')<>'' AND D.CANCEL_DATE IS NOT NULL 
                   and D.Bill_Date<='${DateUpto}' AND  D.CANCEL_Date>'${DateUpto}'  and D.Loc_Code in (${QueryLoc})`
        };
        if (RptOn == 5) {
            Ssql = `select Distinct ICM_MST.Tran_Id as SNo, ICM_MST.Tran_Id as Tran_Id,
                  (Select top 1 Com_Name from Godown_Mst where Godw_Code=IsNull(B.Loc_Code,0)) AS Billing_Branch,
                  (Select top 1 Com_Name from Godown_Mst where Godw_Code=B.Loc_Code) AS Delivery_Branch_Location,
                  Ledger_Name as Customer_Name,Customer_Id as Customer_Id,Del_CustId as Delivery_Customer_Id,
                  B.Pan_No as Customer_PAN,B.GST_No as Customer_GST_No,Place_Of_Supply as State_Of_Supply,
                  (select top 1 Misc_Name  from Misc_Mst where Misc_Type=2 and Misc_code=Dist_Code) as District,
                  (select top 1 Misc_Name  from Misc_Mst where Misc_Type=1 and Misc_code=Teh_Code) as Tehsil,
                  Village,B.Aadhar_No,Mobile_No as Customer_Mobile, B.Sale_Inv_Prefix+B.Invoice_No as Invoice_No,
                  Invoice_Date, INV_Date as ICM_Date,Delv_Date as Date_Of_Veh_Delivery,Verify_Date,GP_Prefix as Gatepass_No,
                  iif(IsNull(drpRTO,0)=2,'Yes','No') as Commercial_or_Not,RTO_RefNo as CH_No,Regn_No as Registration_No,
                  RTO_DAte as Regn_Date,Chas_No as Chassis_No,MI_Date as Insurance_Date,
                  (select top 1 Misc_Name  from Misc_Mst where Misc_Type=14 and Misc_code=Modl_Grp) as Model,Modl_Grp,
                  ICM_MST.Modl_Code as Model_Id,Modl_Desc as Model_Variant,Color  as Colour,Assessable_Value as BASIC_PRICE,
                  MRP_Price as ExShowroom_Price,ISNULL(B.CGST_PERC,0)+ISNULL(B.SGST_PERC,0)+ISNULL(B.IGST_PERC,0)+ISNULL(B.CESS_PERC,0) as Tax_Perc, 
                  Cons_Disc1 as Consumer_Offer,Buffer_Disc as Buffer,MSSF,ICM_DTL.Corp_Disc as Corporate_Offer,ICM_DTL.Exch_Disc as Exchange_Offer,
                  RIPS1_Disc as RIPS_Support1,RIPS2_Disc as RIPS_Support2,RIPS3_Disc as   RIPS_Support3,MDS_Offer,Emp_Disc as Employee_Scheme_by_MSIL,
                  MSIL_Disc as MSIL_Discount_with_Approval_by_GM_SM,0.0 as ISL_DISCOUNT_DEALER_SHARE,0.0 as EXCHANGE_DISCOUNT_DEALER_SHARE,
                  Adnl_Disc as Post_Sale_Discount, Totl_Disc as Total_Discount, OnRoad_Price as Total_Invoice_Value,MGA_Pric as MGA,
                  NonMGA_Chrgs as Teflon,NonMGA_Oth as Non_MGA,IsNull(RTO_Pric,0) as Road_Tax, IsNull(RTO_Pric2,0) as TR,Choice_No,
                  iif(isnull(drpEW,0)=2,'Royal Platinum(5th Yr)',iif(isnull(drpEW,0)=1,'Gold (3rd Yr)',iif(isnull(drpEW,0)=3,'Rana EW Royal Platinum',
                  iif(isnull(drpEW,0)=4,'None','Platinum (4th Yr)')))) as EW_Type,EW_Pric as Extended_Warranty,PPC_Chrgs as CCP_Chrgs,
                  IIF(drpinsu=0,'Zero Dep.',IIF(drpinsu=1,'Normal',IIF(drpinsu=2,'Commercial',IIF(drpinsu=3,'Zero Dep. NCB',IIF(drpinsu=4,'Normal NCB',
                  IIF(drpinsu=6,'LTCP','None')))))) as Insurance_Type,Ins_Pric as Insurance_Price,Nexa_Card as Nexa_Auto_Card,CNG_Chrgs,RC_Card,MCP_Chrgs,
                  TCS_Chrgs,HPN_Chrgs,HSRP_Chrgs,EACHING_CHRG,Oth_Chrgs,FasTag,Meter_Patti,Parking_Tax,OnRoad_Price as Total_Charged_From_Customer, 
                  0.0 as Cash,0.0 as Cards,0.0 as Cheque_Online,
                  IsNull(Party_Trf_Amt_1,0)+IsNull(Party_Trf_Amt_2,0)+IsNull(Party_Trf_Amt_3,0)+IsNull(Party_Trf_Amt_4,0) +IsNull(Party_Trf_Amt_5,0) +IsNull(Party_Trf_Amt_6,0) as Transfer_From_Others,
                  (select top 1 Ledg_Name from Ledg_Mst where Prty_Name_1=Ledg_Code) + ' | '+(select top 1 Ledg_Name from Ledg_Mst where Prty_Name_2=Ledg_Code) + ' | '+(select top 1 Ledg_Name from Ledg_Mst where Prty_Name_3=Ledg_Code) as LEDGER_NAME_TRF_FROM_OTH,
                  IsNull(Party_Rem_1,'') + ' | '+IsNull(Party_Rem_2,'') + ' | '+IsNull(Party_Rem_3,'') as REMARKS_TRF_FROM_OTH, 0.0 as Total_Payment_Received,
                  Card_Charges as Credit_Card_Charges,PO_Amt as PO_Security_Amt,IsNull(DO_Amt,0)-IsNull(PF_Charges,0) as Net_Loan_Amt_After_PF_Chrgs,DO_Pymt_Recd,
                  (select top 1 Misc_Name from Misc_Mst where Misc_Type=8 and Misc_code=Fin_Code) as Hypothecation_By,Convert(NVarchar(50),Pymt_Mode) as Leased_By,
                  (select top 1 Misc_Name from Misc_Mst where Misc_Type=18 and  Misc_code=Pymt_Mode) as IN_House_Fin,0.0 as TV_Purchase_Amt,0.0 as Loan_Paid_By_RMPL,
                  0.0 as Third_Party_Insu_Amt,TV_Amt as TV_NetAmt,TV_Pymt_Recd,TV_Pymt_Date,'' as Used_Car_Details_1,'' as Used_Car_Details_2,'' as Used_Car_Details_3,
                  '' as Evaluator_Name, 0.0 as Short_Excess_from_Customers,iif(IsNull(IsMgmt,0)=1,'Yes','No') as Outstanding_Referred_By_Mgmt,
                  (SElect top 1 EmpCode from EmployeeMaster where  SrNo=ERP_DSE) as DSE_EmpCode,(SElect top 1 EmpFirstName+' '+EmpLastName from EmployeeMaster where  SrNo=ERP_DSE) as DSE_Name,
                  (SElect top 1 EmpCode from EmployeeMaster where  SrNo=ERP_TL) as TL_EmpCode,(SElect top 1 EmpFirstName+' '+EmpLastName from EmployeeMaster where  SrNo=ERP_TL) as TL_Name, 
                  (Select top 1 User_Name from USer_Tbl where ICM_MST.User_Code=USer_Tbl.User_Code) as File_Checked_By,GP_User,Spl_Rem as Remark,GM_Rem as GM_Sales_Remark,
                  ICM_MST.file_no,ledg_add1 as Cust_Add1,Ledg_Add2 as Cust_Add2,Email_id,iif(drpCustType=0,'Individual Customer',iif(drpCustType=1,'CSD Customer',
                  iif(drpCustType=2,'BSF Customer',iif(drpCustType=3,'CPC Customer','None')))) as Customer_Type,Pin_Code,Nomi_Name,NDOB,
                  (select top 1 Misc_Name from Misc_Mst where Misc_Type=51 and Misc_code=Br_Code) as Fin_Branch ,Fin_Dono,PF_Charges,PO_No,PO_Amt,PO_Date,
                  VIN,Engn_No,iif(drpRTO=1,'Temporary',iif(drprto=2,'commercial',iif(drprto=0,'Permanent',iif(drprto=3,'RTO+TRC','None')))) as RTO_Type,
                   EW_PolicyAmt,EW_Date,EW_PolicyNo,DSE_Payout,Payout_Rate,Payout_Amt,Payout_GST,Net_Payout,FLoan_Status,FAccount_No,FRecd_Amt as Fin_Recd_Amt,
                   FCredit_Ref as Fin_Credit_Ref,FRemark as Fin_Remark, '' as MI_DATE,'' as Policy_Type, '' as Insu_Company,'' as Part_A_Premium,
                   '' as MI_Policy_Amt,'' as Zero_Dep_Status,'' as Engine_Cover_Status,'' as RTI_Status,'' as DOB,'' as Veh_Type,'' as YOM,'' as MUL_Invoice_No,
                   '' as MUL_Invoice_Date,0.0 as DIRF_Amt,0.0 as Purchase_Price,0.00 as Gross_Margin,0.0 as Purchase_Discount,'' as Ledg_Code,'' as Group_Name,
                   '' as Autovyn_Customer_Name,0 as Doc_Upload,'No' as  Insu_Fin_Post, 'No' as  EW_Fin_Post, 'No' as RTO_Fin_Post, 'No' as Fastag_FIn_Post, 
                   'No' as HP_FIn_Post, 'No' as DIMS_FIn_Post, 'No' as PTax_FIn_Post, 'No' as NonMGA_FIn_Post, 'No' as MCP_FIn_Post, 'No' as CNG_FIn_Post, 
                   'No' as MeterPatti_FIn_Post, 'No' as TCS_FIn_Post, 'No' as CCC_FIn_Post, 'No' as RC_Card_FIn_Post, 'No' as Choice_No_Fin_Post, 
                   'No' as PANCard_FIn_Post,0.0 as MGA_Bill_Amt,0 as MGA_Diff,0.0 as MGA_Disc_Amt,ICM_MST.Modl_Code,Emp_Disc_DLR,Emp_Disc_MSIL, 
                   '' as Gross_Total_Premium, '' as Zero_Dep_Status,	0.0 as Zero_Dep_Premium,	0.0 as Engine_Cover_Premium,	0.0 as RTI_Premium,	
                   '' as Free_Scheme,0.0 as Ledger_Bal,MSSF_Id,Adnl_MGA_Disc,OS_Clear,Del_OS  from ICM_MST,ICM_DTL,Bhatia_Invoice B where   
                   ICM_MST.Tran_Id=B.ICM_ID and B.Export_Type<3 AND  ICM_MST.Tran_Id=ICM_DTL.Tran_Id AND  ICM_MST.Export_Type<5  and B.Tran_Id>0  
                   and Invoice_Date between  '${DateFrom}' and '${DateUpto}'  and B.Loc_Code in (${QueryLoc})`
        };
        Ssql = Ssql + ' order by Invoice_No';
        let Mydt = await sequelize.query(Ssql);
        // Mydt = Mydt.orderBy('Invoice_No').filter(row => row.SNo >= 0);
        // let filteredData = Mydt.filter(row => row.SNo >= 0);
        // Mydt = Mydt[0]
        //   .filter(row => row.SNo >= 0) // Filter rows where SNo >= 0
        //   .sort((a, b) => a.Invoice_No - b.Invoice_No)           // Sort by Invoice_No
        // // .value();
        Mydt = Mydt[0].map(row => {
            row.Net_Loan_Amt_After_PF_Chrgs = parseFloat(row.Net_Loan_Amt_After_PF_Chrgs) || 0;
            row.DO_Pymt_Recd = parseFloat(row.DO_Pymt_Recd) || 0;
            return row;
        });
        // console.log(Mydt, 'Mydt')

        if (FIN_OS) {
            Mydt = Mydt.filter(row =>
                (row.Net_Loan_Amt_After_PF_Chrgs || 0) - (row.DO_Pymt_Recd || 0) > 0
            );
        }
        Mydt = Mydt.map(row => {
            row.REMARKS_TRF_FROM_OTH = row.REMARKS_TRF_FROM_OTH.replace(/\|  \|/g, "");
            if (parseInt(row.Leased_By) == 7) {
                row.Leased_By = row.Hypothecation_By.toString();
                row.Hypothecation_By = "";
            } else {
                row.Leased_By = "";
            }
            // console.log(row.Invoice_No.toString(), 'row.Invoice_No.toString()');
            if (row.Date_Of_Veh_Delivery?.toString() != "" && (!row.Gatepass_No || row.Gatepass_No.toString() == "")) {
                row.Gatepass_No = row.Invoice_No.toString();
            }
            return row;
        });
        // console.log(Mydt, 'uytytututututyy')
        // Mydt = Mydt.orderBy('Delivery_Branch_Location').filter(row => row.SNo >= 0);
        // let filteredData1 = Mydt.filter(row => row.SNo >= 0);
        Mydt = (Mydt).sort((a, b) => a.Delivery_Branch_Location - b.Delivery_Branch_Location)


        let MyLedgStr = `AND Ledg_Add6 in ('-XXXXXXXX-'`;
        MyLedgStr = "(" + Mydt.map(row => `'${row.Customer_Id}'`).join(",") + ")";
        // console.log(Mydt,'Mydt')
        let ICM_Id = ``;
        ICM_Id = Mydt.map(row => parseInt(row.SNo)).filter(SNo => SNo > 0).join(",");
        // console.log(ICM_Id,'ICM_Id')
        if (ICM_Id !== "") {
            ICM_Id = `Tran_Id in (${ICM_Id})`;
        }
        for (let i = 0; i < Mydt.length; i++) {

            let price = parseFloat(Mydt[i]["Basic_Price"]);
            Mydt[i]["Basic_Price"] = getCurrencyNull(price);
        }
        try {
            const ICMPost = await sequelize.query(`SELECT * FROM ICM_POst WHERE Tran_Id > 0 AND Export_Type < 5 AND  ${ICM_Id}`);
            Mydt.forEach(row => {
                let dtRow1 = ICMPost[0].filter(post => post.Tran_Id == row.SNo).sort((a, b) => a.Seq_No - b.Seq_No);
                dtRow1.forEach(post => {
                    switch (post.Seq_No) {
                        case 1: row.Insu_Fin_Post = "Yes"; break;
                        case 2: row.EW_Fin_Post = "Yes"; break;
                        case 3: row.RTO_Fin_Post = "Yes"; break;
                        case 4: row.RTO_Fin_Post = "Yes"; break;
                        case 5: row.Fastag_FIn_Post = "Yes"; break;
                        case 6: row.HP_FIn_Post = "Yes"; break;
                        case 7: row.DIMS_FIn_Post = "Yes"; break;
                        case 8: row.PTax_FIn_Post = "Yes"; break;
                        case 9: row.NonMGA_FIn_Post = "Yes"; break;
                        case 10: row.NonMGA_FIn_Post = "Yes"; break;
                        case 11: row.MCP_FIn_Post = "Yes"; break;
                        case 12: row.CNG_FIn_Post = "Yes"; break;
                        case 13: row.MeterPatti_FIn_Post = "Yes"; break;
                        case 14: row.TCS_FIn_Post = "Yes"; break;
                        case 15: row.CCC_FIn_Post = "Yes"; break;
                        case 16: row.RC_Card_FIn_Post = "Yes"; break;
                        case 17: row.Choice_No_Fin_Post = "Yes"; break;
                        case 18: row.PANCard_FIn_Post = "Yes"; break;
                    }
                });
            });
        } catch (error) {
            console.error(error);
        }
        try {
            let DocDt = await sequelize.query(`select Count(Tran_Id) as Count,Tran_Id from DOC_Upload where Doc_type='ICM' and ${ICM_Id} group by Tran_Id`);
            Mydt.forEach(row => {
                let dtRow1 = DocDt[0].filter(doc => doc.Tran_Id == row.SNo);
                if (dtRow1.length > 0) {
                    row.Doc_Upload = parseInt(dtRow1[0].Count);
                }
            });
        } catch (error) {
            console.error(error);
        }
        let EWDt
        try {
            EWDt = await sequelize.query(`Select VIN,Max(Trans_Ref_Num) as EW_No,Max(Trans_Date) as EW_Date,Max(Taxable_Value)*18/100  as Tax,Max(Taxable_Value) as Rate,Cust_Id as Customer_Id from gd_fdi_trans where    Trans_Type='EW'  group by gd_fdi_trans.UTD,VIN,cust_id`);
            EWDt[0].forEach(row => {
                if (row.VIN == "MBHCZC63SLB578258") {

                }
                if (parseFloat(row.Tax) == 0) {
                    row.Tax = (parseFloat(row.Rate) * 18 / 100).toFixed(2);
                }
                row.Rate = (parseFloat(row.Rate) + parseFloat(row.Tax)).toFixed(2);
            });
        } catch (error) {
            console.error(error);
        }

        let Acnt_Rcpt
        let Acnt_Rcpt2
        // Mydt = Mydt.orderBy('Delivery_Branch_Location').filter(row => row.SNo >= 0);
        Mydt = (Mydt).sort((a, b) => a.Delivery_Branch_Location - b.Delivery_Branch_Location);           // Sort by Invoice_No

        let MyLedgStr5 = ` AND Ledg_Add6 in ('-XXXXXXXX-'`;
        for (let i = 0; i < Mydt.length; i++) {
            MyLedgStr5 += `,'${Mydt[i]["Delivery_Customer_Id"]}','${Mydt[i]["Customer_Id"]}'`;
        }
        MyLedgStr5 += `)`;

        const a = await sequelize.query(`SELECT SALES_INTEGRATION FROM Godown_Mst WHERE Godw_Code in (${LocString})`);
        const SALES_INTEGRATION = a[0].SALES_INTEGRATION;
        let Ssql2 = ``;
        if (SALES_INTEGRATION !== 99) {
            Ssql2 = `SELECT distinct Acnt_Id,RECT_TYPE,
        (Select top 1 Com_Name from Godown_Mst where Godw_Code=ACNT_POST.Loc_Code) as Delivery_Branch_Location, 
        Ledg_Code,Ledg_Name as Autovyn_Customer_Name,  
        Convert(NVarchar(30),Ledg_Add6)   as Customer_Id, 
        Acnt_Post.Export_Type, DMS_REf1 as Rect_No,Acnt_Date as Rect_Date,
        iif(amt_drcr=1,Post_Amt*-1,Post_Amt) as Rect_Amt,Chq_No as Inst_No,
        Chq_Date as Inst_Date,Cost_Cntr as Pymt_Mode,'DMS Receipt' as Remark,
        ACNT_POST.Loc_Code FROM ACNT_POST,Ledg_Mst WHERE Ledg_Ac=Ledg_Code 
        and ACNT_POST.Loc_Code in (${QueryLoc}) and 
        Ledg_Mst.Loc_Code=Acnt_Post.Loc_Code ${MyLedgStr5} and 
        Acnt_Type IN (1,2,3,5) AND dms_ref1 LIKE '%REC%' and 
        Acnt_Post.Export_Type not in (3,4,5,33)
  
        Union All SELECT distinct Acnt_Id,RECT_TYPE,
        (Select top 1 Com_Name from Godown_Mst where Godw_Code=ACNT_POST.Loc_Code) as Delivery_Branch_Location, 
        Ledg_Code,Ledg_Name as Autovyn_Customer_Name,  
        Convert(NVarchar(30),Ledg_Add6)   as Customer_Id, 
        Acnt_Post.Export_Type, DMS_REf1 as Rect_No,Acnt_Date as Rect_Date,
        iif(amt_drcr=1,Post_Amt*-1,Post_Amt) as Rect_Amt,Chq_No as Inst_No,
        Chq_Date as Inst_Date,Cost_Cntr as Pymt_Mode,'DMS Receipt' as Remark,
        ACNT_POST.Loc_Code FROM ACNT_POST,Ledg_Mst WHERE Ledg_Ac=Ledg_Code and 
        ACNT_POST.Loc_Code in (${QueryLoc}) and 
        Ledg_Mst.Loc_Code=Acnt_Post.Loc_Code ${MyLedgStr5}  and 
        Acnt_Type IN (2,3,5) AND IsNull(RECT_TYPE,0) in (4,6)  and 
        dms_ref1 not LIKE '%REC%'   and Acnt_Post.Export_Type not in (3,4,5,33)
        
        Union All SELECT distinct Acnt_Id,RECT_TYPE,
        (Select top 1 Com_Name from Godown_Mst where Godw_Code=ACNT_POST.Loc_Code) as Delivery_Branch_Location, 
        Ledg_Code,Ledg_Name as Autovyn_Customer_Name,  
        Convert(NVarchar(30),Ledg_Add6)   as Customer_Id, 
        Acnt_Post.Export_Type, DMS_REf1 as Rect_No,Acnt_Date as Rect_Date,
        iif(amt_drcr=1,Post_Amt*-1,Post_Amt) as Rect_Amt,Chq_No as Inst_No,
        Chq_Date as Inst_Date,Cost_Cntr as Pymt_Mode,'DMS Receipt' as Remark,
        ACNT_POST.Loc_Code FROM ACNT_POST,Ledg_Mst WHERE Ledg_Ac=Ledg_Code and 
        ACNT_POST.Loc_Code in (${QueryLoc}) and 
        Ledg_Mst.Loc_Code=Acnt_Post.Loc_Code ${MyLedgStr5}  and 
        Acnt_Type IN (1)  and dms_ref1 not LIKE '%REC%'   and 
        Acnt_Post.Export_Type not in (3,4,5,33)`;

            Acnt_Rcpt2 = await sequelize.query(Ssql2);
        }
        else {
            Ssql2 = `Select Acnt_Id,RECT_TYPE,Group_Code,
        (Select top 1 Com_Name from Godown_Mst where  Godown_Mst.Export_type<3 and  
        Godw_Code=ACNT_POST.Loc_Code) as Delivery_Branch_Location, Ledg_Code,
        Ledg_Name as Autovyn_Customer_Name,0 as Doc_Upload,  
        Convert(NVarchar(30),Ledg_Add6)   as Customer_Id, Acnt_Post.Export_Type, 
        DMS_REf1 as Rect_No,Acnt_Date as Rect_Date,
        iif(amt_drcr=1,Post_Amt*-1,Post_Amt) as Rect_Amt,Chq_No as Inst_No,
        Chq_Date as Inst_Date,Cost_Cntr as Pymt_Mode,'DMS Receipt' as Remark,
        ACNT_POST.Loc_Code FROM ACNT_POST,Ledg_Mst WHERE    Ledg_Ac=Ledg_Code and 
        Acnt_Type IN (1,2)  ${MyLedgStr5} and IsNull(RECT_TYPE,0)=0 AND  
        Acnt_Post.Export_Type not in (3,5,33) and Ledg_Mst.Loc_Code=Acnt_Post.Loc_Code
        
        Union All Select Acnt_Id,RECT_TYPE,Group_Code,
        (Select top 1 Com_Name from Godown_Mst where  Godown_Mst.Export_type<3 and  
        Godw_Code=ACNT_POST.Loc_Code) as Delivery_Branch_Location, Ledg_Code,
        Ledg_Name as Autovyn_Customer_Name,0 as Doc_Upload,  
        Convert(NVarchar(30),Ledg_Add6)   as Customer_Id, Acnt_Post.Export_Type, 
        DMS_REf1 as Rect_No,Acnt_Date as Rect_Date,
        iif(amt_drcr=1,Post_Amt*-1,Post_Amt) as Rect_Amt,Chq_No as Inst_No,
        Chq_Date as Inst_Date,Cost_Cntr as Pymt_Mode,'DMS Receipt' as Remark,
        ACNT_POST.Loc_Code FROM ACNT_POST,Ledg_Mst WHERE   Ledg_Ac=Ledg_Code and  
        Acnt_Type IN (1,2,3)  ${MyLedgStr5}   and IsNull(RECT_TYPE,0)  in (4,6) AND  
        Acnt_Post.Export_Type not in (3,5,33) and Ledg_Mst.Loc_Code=Acnt_Post.Loc_Code`;

            Acnt_Rcpt2 = await sequelize.query(Ssql2);
        };

        let LedgBal = await sequelize.query(`SELECT (Select top 1 Com_Name from Godown_Mst where Godw_Code=MAX(ACNT_POST.Loc_Code)) as Delivery_Branch_Location, 
        MAX(Ledg_Code) AS Ledg_Code,MAX(Ledg_Name) as Autovyn_Customer_Name, Group_Code, 
        Convert(NVarchar(30),MAX(Ledg_Add6))   as Customer_Id,MAX(Ledg_Ac) AS Ledg_Ac,
        Sum(iif(Amt_Drcr=1,Post_Amt,Post_Amt*-1)) as Bal FROM ACNT_POST,Ledg_Mst WHERE Group_Code=53 and 
        Ledg_Ac=Ledg_Code and ACNT_POST.Loc_Code in (${QueryLoc}) and 
        Ledg_Mst.Loc_Code=Acnt_Post.Loc_Code ${MyLedgStr5} and 
        Acnt_Post.Export_Type<5 group by Ledg_Ac,Group_Code  `);
        try {
            for (let x = 0; x < Mydt.length; x++) {
                if (Mydt[x].Delivery_Customer_Id == "2356216100") {

                }
                const dtRow1 = LedgBal[0].filter(row =>
                    (row.Customer_Id == Mydt[x].Delivery_Customer_Id || row.Customer_Id == Mydt[x].Customer_Id) &&
                    row.Delivery_Branch_Location.trim() == Mydt[x].Delivery_Branch_Location.trim()
                );
                if (dtRow1.length > 0) {
                    Mydt[x].Ledg_Code = dtRow1[0].Ledg_Code;
                    Mydt[x].Autovyn_Customer_Name = dtRow1[0].Autovyn_Customer_Name;
                    Mydt[x].Ledger_Bal = parseFloat(dtRow1[0].Bal);
                }
            }
        } catch (ex) {
            console.error(ex);
        }

        let ICMRcpt = await sequelize.query(`Select Distinct ICM_RCPT.*  from ICM_RCPT where ICM_RCPT.Tran_Id=-111`);
        try {
            for (let x = 0; x < Mydt.length; x++) {
                if (Mydt[x].Customer_Id == "2353979775") {
                    // The original code does nothing here.
                }

                let OldDOPymtRecd = 0;
                if (parseFloat(Mydt[x].SNo) > 0) {
                    OldDOPymtRecd = parseFloat(Mydt[x].DO_Pymt_Recd);
                    Mydt[x].DO_Pymt_Recd = 0;
                    let Do_Pymt_Recd = parseFloat(Mydt[x].DO_Pymt_Recd);
                    let DO_AMT = parseFloat(Mydt[x].Net_Loan_Amt_After_PF_Chrgs);

                    if (Mydt[x].Customer_Id.trim() !== "") {
                        dtRow1 = Acnt_Rcpt2.filter(row =>
                            (row.Customer_Id == Mydt[x].Delivery_Customer_Id || row.Customer_Id == Mydt[x].Customer_Id) &&
                            row.Delivery_Branch_Location.trim() == Mydt[x].Delivery_Branch_Location.trim()
                        ).sort((a, b) => new Date(a.Rect_Date) - new Date(b.Rect_Date));

                        if (dtRow1.length > 0) {
                            Mydt[x].Ledg_Code = dtRow1[0].Ledg_Code;
                            Mydt[x].Autovyn_Customer_Name = dtRow1[0].Autovyn_Customer_Name;

                            Acnt_Rcpt = dtRow1;

                            try {
                                Do_Pymt_Recd = 0;
                                for (let i = 0; i < Acnt_Rcpt.length; i++) {
                                    if (i == 0) {
                                        ICMRcpt.push({ Tran_Id: Mydt[x].SNo.toString() });
                                    }
                                    if (i > 9) {
                                        if (parseFloat(Acnt_Rcpt[i].Rect_Type) == 6) {
                                            Do_Pymt_Recd += parseFloat(Acnt_Rcpt[i].Rect_Amt);
                                            Mydt[x].DO_Pymt_Recd = Do_Pymt_Recd;
                                            await sequelize.query(`Update ICM_MST set DO_Pymt_Recd=${Do_Pymt_Recd} where Tran_Id=${parseFloat(Mydt[x].SNo)}`);
                                        }
                                        ICMRcpt[ICMRcpt.length - 1]["Book10_Amt"] = parseFloat(ICMRcpt[ICMRcpt.length - 1]["Book10_Amt"]) + parseFloat(Acnt_Rcpt[i].Rect_Amt);
                                    } else {
                                        ICMRcpt[ICMRcpt.length - 1][`Rect${i + 1}_No`] = Acnt_Rcpt[i].Rect_No;
                                        ICMRcpt[ICMRcpt.length - 1][`Rect${i + 1}_Date`] = Acnt_Rcpt[i].Rect_Date;
                                        ICMRcpt[ICMRcpt.length - 1][`Pymt${i + 1}_Mode`] = parseFloat(Acnt_Rcpt[i].Pymt_Mode);
                                        ICMRcpt[ICMRcpt.length - 1][`InstName${i + 1}_No1`] = (parseFloat(Acnt_Rcpt[i].Export_Type) == 4 ? "REVERSED-" : (parseFloat(Acnt_Rcpt[i].Export_Type) == 99 ? "UNPOSTED-" : "POSTED-")) + Acnt_Rcpt[i].Remark;
                                        ICMRcpt[ICMRcpt.length - 1][`Book${i + 1}_Amt`] = parseFloat(Acnt_Rcpt[i].Rect_Amt);
                                        ICMRcpt[ICMRcpt.length - 1][`InstNo${i + 1}_No1`] = parseFloat(Acnt_Rcpt[i].Inst_No);
                                        ICMRcpt[ICMRcpt.length - 1][`InstDt${i + 1}_No1`] = parseFloat(Acnt_Rcpt[i].Inst_Date);

                                        if (parseFloat(Acnt_Rcpt[i].Rect_Type) == 6) {
                                            Do_Pymt_Recd += parseFloat(Acnt_Rcpt[i].Rect_Amt);
                                            Mydt[x].DO_Pymt_Recd = Do_Pymt_Recd;
                                            await sequelize.query(`Update ICM_MST set DO_Pymt_Recd=${Do_Pymt_Recd} where Tran_Id=${parseFloat(Mydt[x].SNo)}`);
                                        } else if (Do_Pymt_Recd == 0 && DO_AMT > 0) {
                                            let tmp1 = DO_AMT - parseFloat(ICMRcpt[ICMRcpt.length - 1][`Book${i + 1}_Amt`]);
                                            if (((tmp1 < 10000 && tmp1 >= 0) || (tmp1 > -10000 && tmp1 < 0)) && parseFloat(ICMRcpt[ICMRcpt.length - 1][`Book${i + 1}_Amt`]) >= 200000) {
                                                Do_Pymt_Recd = parseFloat(ICMRcpt[ICMRcpt.length - 1][`Book${i + 1}_Amt`]);
                                                Mydt[x].DO_Pymt_Recd += Do_Pymt_Recd;
                                                await sequelize.query(`Update ICM_MST set DO_Pymt_Recd=${Do_Pymt_Recd} where Tran_Id=${parseFloat(Mydt[x].SNo)}`);
                                            }
                                        }
                                    }
                                }
                            } catch (ex) {
                                console.error(ex);
                            }
                        }
                    }

                    if (parseFloat(Mydt[x].DO_Pymt_Recd) == 0 && OldDOPymtRecd > 0) {
                        Mydt[x].DO_Pymt_Recd = OldDOPymtRecd;
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        try {
            let MyLedgStr2 = "";
            for (let i = 0; i < Mydt.length; i++) {
                if (parseFloat(Mydt[i].Ledg_Code) == 0) {
                    if (MyLedgStr2 !== "") {
                        MyLedgStr2 += `,'${Mydt[i].Customer_Id}'`;
                    } else {
                        MyLedgStr2 = `'${Mydt[i].Customer_Id}'`;
                    }
                }
            }

            if (MyLedgStr2 !== "") {
                MyLedgStr2 = `Ledg_Add6 in (${MyLedgStr2})`;

                let MyLedg2 = await sequelize.query(`Select Ledg_Code, Ledg_Name, Ledg_Add6 as Customer_Id, Group_Code from Ledg_Mst where Ledg_Code > 0 and ${MyLedgStr2} and Loc_Code in ${QueryLoc}`);

                for (let c = 0; c < MyLedg2[0].length; c++) {
                    dtRow1 = Mydt.filter(row => row.Customer_Id.trim() == MyLedg2[c].Customer_Id.trim());
                    if (dtRow1.length > 0) {
                        dtRow1[0].Ledg_Code = MyLedg2[c].Ledg_Code;
                        dtRow1[0].Autovyn_Customer_Name = MyLedg2[c].Ledg_Name;

                        // if (parseFloat(MyLedg2[c].Group_Code) > 0) {
                        //     dtRow1[0].Group_Name = Gds.Tables("Grup_Mst").Compute("Max(Group_Name)", `Group_Code=${parseFloat(MyLedg2[c].Group_Code)}`).toString();
                        // }
                    }
                }
            }
        } catch (ex) {
            console.error(ex);
        }


        let RptStr = ``;
        for (let x = 0; x < Mydt.length; x++) {
            if (RptStr !== "") {
                RptStr += `,'${Mydt[x].VIN}'`
            }
            if (RptStr == "") {
                RptStr += `'${Mydt[x].VIN}'`
            }
        }
        if (RptStr.trim() !== "") {
            RptStr = `and VIN in (${RptStr})`;

            let MIDt = await sequelize.query(`Select Customer_Id,VIN,Policy_No,Tran_Date as MI_DATE,  
            Exl_Fld3 as Policy_Type,Exl_Fld7 as Insu_Company,Exl_Fld33 as Part_A_Premium,Exl_Fld36 as MI_Policy_Amt,
            Exl_Fld48 as Zero_Dep_Status, Iif(IsNull(Exl_Fld50,0)>0,'Yes','No') as Engine_Cover_Status,
            Iif(IsNull(Exl_Fld51,0)>0,'Yes','No') as RTI_Status,Exl_Fld81 as DOB,Exl_Fld89 as Veh_Type,
            Exl_Fld93 as YOM,Exl_Fld103 as VIN, Exl_Fld36 as Gross_Total_Premium, 	Exl_Fld49 as Zero_Dep_Premium,	
            Exl_Fld50 as Engine_Cover_Premium,	Exl_Fld51 as RTI_Premium,	Exl_Fld53 as Free_Scheme   from Insu_Register I,
            Insu_Auto_Debit A where A.POLICY_NO = i.Exl_Fld2 and IsNull(Export_Type,0)<3 and 
            IsNull(Transaction_Amount,0)<0 and IsNull(IsLapsed,0)=0 ${RptStr}`);

            try {
                for (let x = 0; x < Mydt.length; x++) {
                    if (Mydt[x].VIN.trim() !== "") {
                        const dtRow1 = MIDt[0].filter(row =>
                            row.VIN.trim() == Mydt[x].VIN.trim() &&
                            row.Customer_Id?.trim() == Mydt[x].Customer_Id?.trim()
                        ).sort((a, b) => new Date(b.MI_DATE) - new Date(a.MI_DATE));

                        if (dtRow1.length > 0) {
                            Mydt[x].MI_DATE = GetDate(dtRow1[0].MI_DATE);
                            Mydt[x].Policy_Type = dtRow1[0].Policy_Type;
                            Mydt[x].Insu_Company = dtRow1[0].Insu_Company;
                            Mydt[x].Part_A_Premium = dtRow1[0].Part_A_Premium;
                            Mydt[x].MI_Policy_Amt = dtRow1[0].MI_Policy_Amt;
                            Mydt[x].Zero_Dep_Status = dtRow1[0].Zero_Dep_Status;
                            Mydt[x].Engine_Cover_Status = dtRow1[0].Engine_Cover_Status;
                            Mydt[x].RTI_Status = dtRow1[0].RTI_Status;
                            Mydt[x].DOB = dtRow1[0].DOB;
                            Mydt[x].Veh_Type = dtRow1[0].Veh_Type;
                            Mydt[x].YOM = dtRow1[0].YOM;
                            Mydt[x].Free_Scheme = dtRow1[0].Free_Scheme;
                            Mydt[x].Gross_Total_Premium = parseFloat(dtRow1[0].Gross_Total_Premium);
                            Mydt[x].Zero_Dep_Premium = parseFloat(dtRow1[0].Zero_Dep_Premium);
                            Mydt[x].Engine_Cover_Premium = parseFloat(dtRow1[0].Engine_Cover_Premium);
                            Mydt[x].RTI_Premium = parseFloat(dtRow1[0].RTI_Premium);
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
            }

            let RptStr2 = ``;
            for (let x = 0; x < Mydt.length; x++) {
                if (RptStr2 !== "") {
                    RptStr2 += `,'${Mydt[x].Customer_Id}'`
                }
                if (RptStr2 == "") {
                    RptStr2 += `'${Mydt[x].Customer_Id}'`
                }
            }

            if (RptStr2.trim() !== "") {
                RptStr2 = `and Ledger_Id in (${RptStr2})`
                let MGADt = await sequelize.query(`Select MAx(iif(Tran_Type=4,Inv_Amt,Inv_Amt*-1)) as MGA_Amt,Sum(iif(Tran_Type=4,Disc_1,Disc_1*-1)) as MGA_Disc,Max(Ledger_Id) as Customer_Id,Max(VIN) as VIN  from DMS_ROW_DATA where IsNull(Export_Type,0) in (1,2) and  Tran_Type in (4,5)   AND (Bill_No LIKE '%/RS/%' or Cancel_No LIKE '%/RS/%') ${RptStr2} group by Tran_Id,Tran_Type,Ledger_Id`)

                try {
                    for (let x = 0; x < Mydt.length; x++) {
                        if (Mydt[x].Customer_Id.trim() !== "") {
                            const dtRow1 = MGADt[0].filter(row => row.Customer_Id == Mydt[x].Customer_Id.trim());
                            // console.log(dtRow1)
                            // console.log(Mydt,'Mydt')
                            if (dtRow1.length > 0) {
                                for (let j = 0; j < dtRow1.length; j++) {
                                    // console.log(parseFloat(dtRow1[j].MGA_Disc),'parseFloat(dtRow1[j].MGA_Disc)')
                                    // console.log(parseFloat(Mydt[x].MGA_Disc_Amt),'parseFloat(Mydt[x].MGA_Disc_Amt')
                                    Mydt[x].MGA_Bill_Amt = parseFloat(dtRow1[j].MGA_Amt) + parseFloat(Mydt[x].MGA_Bill_Amt || 0);
                                    Mydt[x].MGA_Disc_Amt = parseFloat(dtRow1[j].MGA_Disc) + parseFloat(Mydt[x].MGA_Disc_Amt || 0);
                                }
                            }
                        }
                        if (parseFloat(Mydt[x].MGA_Bill_Amt) < 0) {
                            Mydt[x].MGA_Bill_Amt = 0;
                        }
                        if (parseFloat(Mydt[x].MGA_Disc_Amt) < 0) {
                            Mydt[x].MGA_Disc_Amt = 0;
                        }
                        Mydt[x].MGA_Diff = parseFloat(Mydt[x].MGA) - parseFloat(Mydt[x].MGA_Bill_Amt);
                    }

                }
                catch (e) {
                    console.log(e)
                }

                try {
                    for (let x = 0; x < Mydt.length; x++) {
                        if (parseFloat(Mydt[x].MGA_Bill_Amt) > parseFloat(Mydt[x].MGA)) {
                            Mydt[x].MGA = parseFloat(Mydt[x].MGA_Bill_Amt);
                        }
                    }
                } catch (e) {
                    console.log(e)
                }
                let TVDt;
                try {
                    let TVLoc = "";
                    if (CompanyName.toUpperCase().includes("OCEAN")) TVLoc = "(10,36)";
                    if (CompanyName.toUpperCase().includes("SHUBH")) TVLoc = "(22, 23)";
                    if (CompanyName.toUpperCase().includes("MOTORCRAFT")) TVLoc = "(9)";
                    if (CompanyName.toUpperCase().includes("KAMTHI")) TVLoc = "(6)";
                    if (CompanyName.toUpperCase().includes("PLATINUM")) TVLoc = "(14,15)";
                    if (CompanyName.toUpperCase().includes("RANA")) TVLoc = "(5,8,25)";
                    if (CompanyName.toUpperCase().includes("MAGIC")) TVLoc = "(11)";
                    if (TVLoc == "") TVLoc = "(-1)";

                    let RptStr2 = "";
                    for (let x = 0; x < Mydt.length; x++) {
                        if (RptStr2 !== "") {
                            RptStr2 += `,'${Mydt[x].Ledg_Code}'`;
                        } else {
                            RptStr2 = `'${Mydt[x].Ledg_Code}'`;
                        }
                    }

                    if (RptStr2.trim() !== "") {
                        let Mystr = `Select Ledg_Ac2, Acnt_No, Acnt_Date, Post_Amt from Acnt_Post 
              where Loc_Code in ${TVLoc} and Rect_Type<>2 and Acnt_Type=3 And 
              Export_Type<3 and Ledg_Ac2 in (${RptStr2})
  
              Union All Select Ledg_ac as Ledg_Ac2, Acnt_No, Acnt_Date, 
              Post_Amt from Acnt_Post where rect_type=2 and Amt_DrCr=2 And 
              Export_Type<3 And Ledg_Ac In (${RptStr2})`;


                        TVDt = await sequelize.query(Mystr);

                        if (TVDt.length > 0) {
                            for (let x = 0; x < Mydt.length; x++) {
                                if (Mydt[x].Customer_Id == "2457291091") {
                                    x = x;
                                }
                                if (parseFloat(Mydt[x].Ledg_Code) > 0 && parseFloat(Mydt[x].TV_Pymt_Recd) == 0 && parseFloat(Mydt[x].TV_NetAmt) > 0) {
                                    dtRow2 = TVDt.filter(row => parseFloat(row.Ledg_Ac2) == parseFloat(Mydt[x].Ledg_Code));
                                    if (dtRow2.length > 0) {
                                        let TV_JV_No1 = dtRow2[0].Acnt_No;
                                        let TV_Pymt_Date1 = getDate(dtRow2[0].Acnt_Date);
                                        let TV_Pymt_Recd = parseFloat(dtRow2[0].Post_Amt);
                                        if (TV_Pymt_Recd > 0) {
                                            await sequelize.query(`Update Exch_Veh Set TV_Pymt_Recd=${TV_Pymt_Recd}, TV_Pymt_Date='${TV_Pymt_Date1}', TV_JV_No='${TV_JV_No1}' where IsNull(TV_Pymt_Recd,0)=0 and TVCust_Id_1='${Mydt[x].Customer_Id.trim()}' and NewChaSNo='${Mydt[x].Chassis_No.trim()}'`);
                                            await sequelize.query(`Update ICM_MST set TV_Pymt_Recd=${TV_Pymt_Recd}, TV_Pymt_Date='${TV_Pymt_Date1}', TV_JV_No='${TV_JV_No1}' where Tran_Id=${parseFloat(Mydt[x].Tran_Id)}`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
                let ICMExch = await sequelize.query(`Select Distinct Exch_Veh.*  from ICM_MST,Exch_Veh where ICM_MST.Loc_Code=Exch_Veh.Loc_Code and ICM_MST.Chas_No=Exch_Veh.NewChaSNo ${DateSTr}`)
                // 0.0 as Cash,0.0 as Cards,0.0 as Cheque_Online,

                let CashRcpt, CardRcpt, OthRcpt
                let GdModl = await sequelize.query(`select Distinct Model_Desc,Variant_Desc,EColor_Desc,Trans_Id,BASIC_PRICE from GD_FDI_TRANS,model_variant_master where Trans_Type='VS' and GD_FDI_TRANS.VARIANT_CD = model_variant_master.VARIANT_CD ${RptStr}`);
                // console.log(GdModl, 'GdModl')
                let TransIdStr = "";

                // Loop through Mydt
                const computeMax = (arr, field, conditionField, conditionValue) => {
                    const filteredArr = arr.filter(item => item[conditionField] == conditionValue);
                    return filteredArr;
                };

                const computeSum = (arr, field, conditionField, conditionValue) => {
                    return arr
                        .filter(item => conditionValue.includes(item[conditionField]))
                        .reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
                };


                const processData = (mydt, GdModl, ICMRcpt) => {
                    TransIdStr = '';

                    mydt.forEach(row => {
                        const invoiceNo = row['Invoice_No'];
                        const sno = row['Sno'];

                        if (TransIdStr) {
                            TransIdStr += `,'${invoiceNo}'`;
                        } else {
                            TransIdStr = `'${invoiceNo}'`;
                        }

                        if (invoiceNo == '20/VSL/20000371') {
                            // No operation needed here in JS
                        }

                        if (!row['Model']?.trim()) {
                            row['Model'] = computeMax(GdModl, 'Model_Desc', 'Trans_Id', invoiceNo).toString();
                        }

                        if (row['Model_Variant']?.trim()?.length < 8) {
                            row['Model_Variant'] = computeMax(GdModl, 'Variant_Desc', 'Trans_Id', invoiceNo).toString();
                        }

                        if (!row['Colour']?.trim()) {
                            row['Colour'] = computeMax(GdModl, 'EColor_Desc', 'Trans_Id', invoiceNo).toString();
                        }

                        if (parseFloat(row['BASIC_PRICE']) == 0) {
                            row['BASIC_PRICE'] = computeMax(GdModl, 'BASIC_PRICE', 'Trans_Id', invoiceNo);
                        }

                        row['Total_Invoice_Value'] = parseFloat(row['ExShowroom_Price']) - parseFloat(row['Total_Discount']);

                        const cashRcpt = computeSum(ICMRcpt, 'Book1_Amt', 'Pymt1_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book2_Amt', 'Pymt2_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book3_Amt', 'Pymt3_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book4_Amt', 'Pymt4_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book5_Amt', 'Pymt5_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book6_Amt', 'Pymt6_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book7_Amt', 'Pymt7_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book8_Amt', 'Pymt8_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book9_Amt', 'Pymt9_Mode', [1]) +
                            computeSum(ICMRcpt, 'Book10_Amt', 'Pymt10_Mode', [1]);

                        const cardRcpt = computeSum(ICMRcpt, 'Book1_Amt', 'Pymt1_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book2_Amt', 'Pymt2_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book3_Amt', 'Pymt3_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book4_Amt', 'Pymt4_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book5_Amt', 'Pymt5_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book6_Amt', 'Pymt6_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book7_Amt', 'Pymt7_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book8_Amt', 'Pymt8_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book9_Amt', 'Pymt9_Mode', [3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book10_Amt', 'Pymt10_Mode', [3, 9, 10]);

                        const othRcpt = computeSum(ICMRcpt, 'Book1_Amt', 'Pymt1_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book2_Amt', 'Pymt2_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book3_Amt', 'Pymt3_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book4_Amt', 'Pymt4_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book5_Amt', 'Pymt5_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book6_Amt', 'Pymt6_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book7_Amt', 'Pymt7_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book8_Amt', 'Pymt8_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book9_Amt', 'Pymt9_Mode', [1, 3, 9, 10]) +
                            computeSum(ICMRcpt, 'Book10_Amt', 'Pymt10_Mode', [1, 3, 9, 10]);

                        row['Cash'] = getCurrencyNull(cashRcpt);
                        row['Cards'] = getCurrencyNull(cardRcpt);
                        row['Cheque_Online'] = getCurrencyNull(othRcpt);
                    });
                };
                processData(Mydt, GdModl, ICMRcpt);
                // console.log(mydt);

                let GFTC
                const query = `SELECT DISTINCT Trans_Id, Dlr_Share, Charge_Type 
                         FROM GD_FDI_TRANS, GD_FDI_Trans_Charges 
                         WHERE Trans_Type='VS' 
                           AND GD_FDI_TRANS.UTD = GD_FDI_Trans_Charges.UTD 
                           AND Trans_Id IN (${TransIdStr})`;

                await sequelize.query(query).then(result => {
                    GFTC = result;

                    for (let i = 0; i < Mydt.length; i++) {

                        const maxDlrShareDic = GFTC[0].filter(item => item["Charge_Type"] == 'DIC' && item["Trans_Id"] == Mydt[i]["Invoice_No"])
                            .reduce((max, item) => item["Dlr_Share"] > max ? item["Dlr_Share"] : max, 0);

                        const maxDlrShareExb = GFTC[0].filter(item => item["Charge_Type"] == 'EXB' && item["Trans_Id"] == Mydt[i]["Invoice_No"])
                            .reduce((max, item) => item["Dlr_Share"] > max ? item["Dlr_Share"] : max, 0);

                        Mydt[i]["ISL_DISCOUNT_DEALER_SHARE"] = parseFloat(maxDlrShareDic);
                        Mydt[i]["EXCHANGE_DISCOUNT_DEALER_SHARE"] = parseFloat(maxDlrShareExb);
                    }
                });

                try {
                    for (let i = 0; i < Mydt.length; i++) {
                        const vin = Mydt[i]["VIN"];
                        const customerId = Mydt[i]["Customer_Id"].trim();

                        if (parseFloat(Mydt[i]["EW_PolicyAmt"]) == 0) {
                            const maxRate = EWDt.filter(item => item["VIN"] == vin && item["Customer_Id"] == customerId)
                                .reduce((max, item) => parseFloat(item["Rate"]) > max ? parseFloat(item["Rate"]) : max, 0);
                            Mydt[i]["EW_PolicyAmt"] = maxRate;
                        }

                        if (parseFloat(Mydt[i]["EW_PolicyAmt"]) > 0 && Mydt[i]["EW_PolicyNo"].trim() == "") {
                            const maxEWNo = EWDt.filter(item => item["VIN"] == vin && item["Customer_Id"] == customerId)
                                .reduce((max, item) => item["EW_No"] > max ? item["EW_No"] : max, "");

                            Mydt[i]["EW_PolicyNo"] = StrFormat(maxEWNo);

                            const maxEWDate = EWDt.filter(item => item["VIN"] == vin && item["Customer_Id"] == customerId)
                                .reduce((max, item) => item["EW_Date"] > max ? item["EW_Date"] : max, "");

                            if (maxEWDate !== "") {
                                Mydt[i]["EW_Date"] = GetDate(maxEWDate);
                            }
                        }
                    }
                } catch (ex) {
                    console.log(ex)
                }
                try {
                    const query = `SELECT VIN, Bill_No AS MUL_Invoice_No, DLR_3 AS Purchase_Discount,
                           ISNULL(Basic_Price, 0) - ISNULL(Taxable, 0) AS DIRF_Amt, Taxable AS Purchase_Price,
                           Bill_Date AS MUL_Invoice_Date, ISNULL(CGST_Perc, 0) + ISNULL(SGST_Perc, 0) +
                           ISNULL(IGST_Perc, 0) + ISNULL(Cess_Perc, 0) AS Tax_Perc
                           FROM DMS_ROW_DATA
                           WHERE ISNULL(Export_Type, 0) < 3 ${RptStr} AND Tran_Type IN (2)`;

                    await sequelize.query(query).then(DRDDt => {
                        for (let i = 0; i < Mydt.length; i++) {
                            const vin = Mydt[i]["VIN"];
                            const dtRow1 = DRDDt[0].filter(item => item["VIN"] == vin);
                            // console.log(dtRow1)
                            if (dtRow1.length > 0) {
                                Mydt[i]["MUL_Invoice_No"] = dtRow1[0]["MUL_Invoice_No"];
                                Mydt[i]["MUL_Invoice_Date"] = dtRow1[0]["MUL_Invoice_Date"];
                                Mydt[i]["DIRF_Amt"] = getCurrencyNull(parseFloat(dtRow1[0]["DIRF_Amt"]));

                                if (parseFloat(Mydt[i]["DIRF_Amt"]) < 0) {
                                    Mydt[i]["DIRF_Amt"] = 0;
                                }

                                Mydt[i]["Purchase_Discount"] = getCurrencyNull(parseFloat(dtRow1[0]["Purchase_Discount"]));
                                Mydt[i]["Purchase_Price"] = getCurrencyNull(parseFloat(dtRow1[0]["Purchase_Price"]));

                                if (Mydt[i]["Gross_Margin"] !== undefined) {
                                    Mydt[i]["Gross_Margin"] = parseFloat(Mydt[i]["Basic_Price"]) - parseFloat(Mydt[i]["Purchase_Price"]);
                                }
                                // console.log(Mydt[i]["Tax_Perc"],'Mydt[i]["Tax_Perc"]')
                                // console.log(dtRow1[0]["Tax_Perc"],'dtRow1[0]["Tax_Perc"]')
                                if (parseFloat(Mydt[i]["Tax_Perc"]) == 0) {
                                    Mydt[i]["Tax_Perc"] = getCurrencyNull(parseFloat(dtRow1[0]["Tax_Perc"]));
                                }
                            }
                        }
                    }).catch(err => {
                        console.error(err);
                    });
                } catch (ex) {
                    console.error(ex);
                }

                let CUST_IDs = Mydt.map(item => item["Customer_Id"]).join(',');
                let BkgDate;
                try {
                    BkgDate = await sequelize.query(`select CUST_ID, TRANS_DATE, GE1 from GD_FDI_TRANS where CUST_ID in (${CUST_IDs}) AND TRANS_TYPE = 'ordbk'`);

                    if (BkgDate && BkgDate[0] && BkgDate[0].length > 0) {
                        const BkgDateMap = BkgDate[0].reduce((acc, item) => {
                            acc[item.CUST_ID] = item;
                            return acc;
                        }, {});

                        Mydt.forEach(item => {
                            const custData = BkgDateMap[item["Customer_Id"]];
                            if (custData) {
                                if (custData.TRANS_DATE) {
                                    item["BKG_DATE"] = GetDate(custData.TRANS_DATE);
                                } else {
                                    // console.log(`No valid TRANS_DATE found for CUST_ID = '${item["Customer_Id"]}'`);
                                }
                                if (custData.GE1) {
                                    item["P_CNG"] = custData.GE1;
                                } else {
                                    // console.log(`No valid FUEL_TYPE found for CUST_ID = '${item["Customer_Id"]}'`);
                                }
                            }
                        });
                    } else {
                        // console.log('No valid results returned from the query');
                    }
                } catch (error) {
                    console.error('Error executing query:', error);
                }

                for (let i = 0; i < Mydt.length; i++) {
                    const chassiSNo = Mydt[i]["Chassis_No"];
                    const customerId = Mydt[i]["Customer_Id"];
                    dtRow1 = ICMExch.filter(item => item["NewChaSNo"] == chassiSNo && item["TVCust_Id_1"] == customerId);
                    if (dtRow1.length > 0) {
                        Mydt[i]["TV_Pymt_Recd"] = parseFloat(dtRow1[0]["TV_Pymt_Recd"]) || 0;
                        Mydt[i]["TV_Purchase_Amt"] = (parseFloat(dtRow1[0]["TV_PurcAmt_1"]) || 0) +
                            (parseFloat(dtRow1[0]["TV_PurcAmt_2"]) || 0) +
                            (parseFloat(dtRow1[0]["TV_PurcAmt_3"]) || 0);
                        Mydt[i]["Loan_Paid_By_RMPL"] = (parseFloat(dtRow1[0]["Loan_Paid_1"]) || 0) +
                            (parseFloat(dtRow1[0]["Loan_Paid_2"]) || 0) +
                            (parseFloat(dtRow1[0]["Loan_Paid_3"]) || 0);
                        Mydt[i]["Third_Party_Insu_Amt"] = (parseFloat(dtRow1[0]["Thirdparty_InsuAmt_1"]) || 0) +
                            (parseFloat(dtRow1[0]["Thirdparty_InsuAmt_2"]) || 0) +
                            (parseFloat(dtRow1[0]["Thirdparty_InsuAmt_3"]) || 0);
                        Mydt[i]["TV_NetAmt"] = (parseFloat(dtRow1[0]["TV_NetAmt_1"]) || 0) +
                            (parseFloat(dtRow1[0]["TV_NetAmt_2"]) || 0) +
                            (parseFloat(dtRow1[0]["TV_NetAmt_3"]) || 0);

                        Mydt[i]["Used_Car_Details_1"] = dtRow1[0]["OldRegNo_1"] || "";
                        if (dtRow1[0]["OldModel_1"]) Mydt[i]["Used_Car_Details_1"] += " - " + dtRow1[0]["OldModel_1"];
                        if (dtRow1[0]["OldMfgYr_1"]) Mydt[i]["Used_Car_Details_1"] += " - " + dtRow1[0]["OldMfgYr_1"];

                        Mydt[i]["Used_Car_Details_2"] = dtRow1[0]["OldRegNo_2"] || "";
                        if (dtRow1[0]["OldModel_2"]) Mydt[i]["Used_Car_Details_2"] += " - " + dtRow1[0]["OldModel_2"];
                        if (dtRow1[0]["OldMfgYr_2"]) Mydt[i]["Used_Car_Details_2"] += " - " + dtRow1[0]["OldMfgYr_2"];

                        Mydt[i]["Used_Car_Details_3"] = dtRow1[0]["OldRegNo_3"] || "";
                        if (dtRow1[0]["OldModel_3"]) Mydt[i]["Used_Car_Details_3"] += " - " + dtRow1[0]["OldModel_3"];
                        if (dtRow1[0]["OldMfgYr_3"]) Mydt[i]["Used_Car_Details_3"] += " - " + dtRow1[0]["OldMfgYr_3"];

                        if (parseFloat(dtRow1[0]["TV_Evaluator_1"]) > 0) {
                            const evaluatorQuery = `SELECT EmpCode + ' ' + EmpFirstName + ' ' + ISNULL(EmpLastName, '') 
                                            FROM EmployeeMaster 
                                            WHERE SrNo = ${parseFloat(dtRow1[0]["TV_Evaluator_1"])}`;
                            await sequelize.query(evaluatorQuery).then(result => {
                                Mydt[i]["Evaluator_Name"] = result;
                            }).catch(err => {
                                console.error(err);
                            });
                        }

                        let LedgDt = await sequelize.query("Select Ledg_Code, Group_Code from Ledg_Mst where Ledg_Class=29");

                        for (let i = 0; i < Mydt.length; i++) {
                            if (frmTag !== "DELV_REG") Mydt[i]["SNo"] = i + 1;

                            Mydt[i]["Total_Payment_Received"] = parseFloat(Mydt[i]["Cash"]) +
                                parseFloat(Mydt[i]["Cards"]) +
                                parseFloat(Mydt[i]["Cheque_Online"]) +
                                parseFloat(Mydt[i]["Transfer_From_Others"]);

                            Mydt[i]["Short_Excess_from_Customers"] = parseFloat(Mydt[i]["Total_Charged_From_Customer"]) -
                                parseFloat(Mydt[i]["Total_Payment_Received"]) -
                                parseFloat(Mydt[i]["Post_Sale_Discount"]) -
                                parseFloat(Mydt[i]["Credit_Card_Charges"]) -
                                parseFloat(Mydt[i]["PO_Security_Amt"]) -
                                parseFloat(Mydt[i]["Net_Loan_Amt_After_PF_Chrgs"]) -
                                parseFloat(Mydt[i]["TV_NetAmt"]) +
                                parseFloat(Mydt[i]["DO_PYMT_RECD"]);

                            if (parseFloat(Mydt[i]["Ledg_Code"]) > 0 && parseFloat(Mydt[i]["Group_Name"]) == 0) {
                                let GrpName = LedgDt[0].filter(row => parseFloat(row["Ledg_Code"]) == parseFloat(Mydt[i]["Ledg_Code"]))
                                    .map(row => parseFloat(row["Group_Code"])).reduce((max, value) => Math.max(max, value), 0);

                                Mydt[i]["Group_Name"] = GrpName;

                                let GroupNameQuery = `SELECT MAX(Group_Name) as Group_Name FROM Grup_Mst WHERE Group_Code = ${GrpName}`;
                                let groupNameResult = await sequelize.query(GroupNameQuery);
                                Mydt[i]["Group_Name"] = groupNameResult[0][0].Group_Name;
                            }
                        }

                        try {
                            let bufferIndex = Mydt.columns.findIndex(col => col.name == "Buffer");
                            if (bufferIndex !== -1) {
                                Mydt.columns[bufferIndex].name = "MGA_Disc";
                            }
                        } catch (ex) {
                            console.error(ex);
                        }
                    }
                }
                try {
                    // Generate a comma-separated list of Team Leader EMPCODEs
                    let TLCodes = Mydt.map(item => `'${item["TL_EmpCode"]}'`).join(',');
                    let DseCodes = Mydt.map(item => `'${item["DSE_EmpCode"]}'`).join(',');

                    // Fetch the corresponding Group_head EMPCODEs and names
                    let GhCode = await sequelize.query(`
              SELECT
                m1.Misc_Dtl1 AS GHempCodes,
                m1.Misc_Name AS TL_EmpCode,
                m2.Misc_Abbr AS GH_Name,
                DATEDIFF(MONTH, m1.Join_Date, DATEFROMPARTS(${yr}, ${mnth}, 1)) AS DOJ_MONTH
              FROM
                Misc_Mst m1
              JOIN
                Misc_Mst m2
              ON
                m1.Misc_Dtl1 = m2.Misc_Name
              WHERE
                m1.Misc_Name IN (${TLCodes}) AND m1.Misc_type = 620 AND m1.CC_Group =${mnth} and m1.CC_Ledg = ${yr} and m2.Misc_type = 619 and m1.export_type < 3 and m2.export_type < 3
            `);
                    let DSE_Codeeeee = await sequelize.query(`
                SELECT
                  m1.Misc_Name AS DSE_EmpCode,
                  m1.Misc_Abbr AS DSE_EmpName,
                  DATEDIFF(MONTH, m1.Join_Date, DATEFROMPARTS(${yr}, ${mnth}, 1)) AS DOJ_MONTH
                  FROM
                  Misc_Mst m1
                WHERE
                  m1.Misc_Name IN (${DseCodes}) AND m1.Misc_type in (621,620) and m1.export_type < 3 and CC_group ='${mnth}' and CC_Ledg = ${yr}
              `);
                    //   return Mydt;
                    // console.log(GhCode, 'GhCode');

                    if (GhCode && GhCode[0] && GhCode[0].length > 0) {
                        // Create a mapping of Team Leader EMPCODE to Group_head EMPCODE and name
                        const GHCodeMap = GhCode[0].reduce((acc, item) => {
                            acc[item.TL_EmpCode] = {
                                GHempCodes: item.GHempCodes,
                                GH_Name: item.GH_Name,
                                DOJ_MONTH: item.DOJ_MONTH
                            };
                            return acc;
                        }, {});

                        // console.log(GHCodeMap, 'GHCodeMap');

                        // Assign the Group_head EMPCODE and name to each Team_Leader in Mydt
                        Mydt.forEach(item => {
                            const GHData = GHCodeMap[item["TL_EmpCode"]];
                            if (GHData) {
                                item["GH_EMPCODE"] = GHData.GHempCodes;
                                item["GH_Name"] = GHData.GH_Name;
                                item["DOJ_MONTH_TL"] = GHData.DOJ_MONTH;
                            }
                        });
                    } else {
                        console.log('No valid results returned from the query');
                    }
                    if (DSE_Codeeeee && DSE_Codeeeee[0] && DSE_Codeeeee[0].length > 0) {
                        // Create a mapping of Team Leader EMPCODE to Group_head EMPCODE and name
                        const GHCodeMap = DSE_Codeeeee[0].reduce((acc, item) => {
                            acc[item.DSE_EmpCode] = {
                                DOJ_MONTH: item.DOJ_MONTH
                            };
                            return acc;
                        }, {});

                        // console.log(GHCodeMap, 'GHCodeMap');

                        // Assign the Group_head EMPCODE and name to each Team_Leader in Mydt
                        Mydt.forEach(item => {
                            const GHData = GHCodeMap[item["DSE_EmpCode"]];
                            if (GHData) {
                                item["DOJ_MONTH"] = GHData.DOJ_MONTH;
                            }
                        });
                    } else {
                        console.log('No valid results returned from the query');
                    }

                    let focusModelsResult = await sequelize.query(` WITH FocusModels AS (
                SELECT 
                    TRIM(value) AS FOCUS_MODEL
                FROM 
                    INC_POLICY
                CROSS APPLY 
                    STRING_SPLIT(FOCUS_MODEL, ',')
                WHERE 
                    Mnth = ${mnth} and yr = ${yr}
            )
           select Misc_Code from misc_mst where Misc_Dtl1 in (SELECT  Misc_Code
            FROM Misc_Mst 
            WHERE Misc_Code IN (SELECT FOCUS_MODEL FROM FocusModels) AND Misc_type = 15) and Misc_Type = 14;`);
                    if (focusModelsResult && focusModelsResult[0] && focusModelsResult[0].length > 0) {
                        const focusModels = focusModelsResult[0].map(item => item.Misc_Code);
                        // console.log(focusModels,'focusModels')
                        Mydt.forEach(item => {
                            const variant = item["Modl_Grp"];
                            const matchFound = focusModels.some(focusModel => variant == focusModel);
                            if (matchFound) {
                                item["FOCUS_MODEL"] = item["Model_Variant"];
                                item["FOCUS_MODEL_CODE"] = item["Model_Id"];
                            } else {
                                item["FOCUS_MODEL"] = " ";
                            }
                        });
                    } else {
                        console.log('No valid focus models returned from the query');
                    }
                } catch (error) {
                    console.error('Error executing query:', error);
                }
            }
        }
        // console.log(Mydt)

        const ExcelJS = require('exceljs');
        const PolicyInc = await sequelize.query(`SELECT * FROM INC_POLICY WHERE Mnth = ${mnth} and yr = ${yr}`);


        const groupedData = Mydt.reduce((acc, item) => {
            if (!acc[item.GH_Name]) {
                acc[item.GH_Name] = {
                    GH_EMPCODE: item.GH_EMPCODE,
                    Tls: {}
                };
            }
            if (!acc[item.GH_Name].Tls[item.TL_Name]) {
                acc[item.GH_Name].Tls[item.TL_Name] = {
                    TL_EmpCode: item.TL_EmpCode,
                    DSEs: {}
                };
            }
            if (!acc[item.GH_Name].Tls[item.TL_Name].DSEs[item.DSE_Name]) {
                acc[item.GH_Name].Tls[item.TL_Name].DSEs[item.DSE_Name] = {
                    DSE_EmpCode: item.DSE_EmpCode,
                    customers: []
                };
            }
            acc[item.GH_Name].Tls[item.TL_Name].DSEs[item.DSE_Name].customers.push({
                SNo: item.SNo,
                Customer_Name: item.Customer_Name,
                Invoice_Date: item.Invoice_Date
            });
            return acc;
        }, {});

        // console.log(groupedData, 'groupedData');
        // const outputFilePath = path.join(__dirname, 'excelData.json');

        // // Write the JSON data to a file
        // fs.writeFileSync(outputFilePath, JSON.stringify(Mydt, null, 2), 'utf-8');

        //   const workbook = new ExcelJS.Workbook();
        //   const worksheet = workbook.addWorksheet("Delivery_Sheet");
        //   const newReqHeader = [
        //     "SNo",
        //     "BKG DATE",
        //     "Customer Name",
        //     "Tehsil",
        //     "Mobile No",
        //     "P CNG",
        //     "Amt",
        //     "Variant",
        //     "Chassis",
        //     "Vehicle Price",
        //     "Finance Company",
        //     "Inhouse",
        //     "MSSF Id",
        //     "Loan Amt",
        //     "EW",
        //     "No Of EW",
        //     "INS DATE",
        //     "No Of MI",
        //     "MCP",
        //     "No Of MCP",
        //     "MSIL Discount",
        //     "Corporate",
        //     "Exchange Offer",
        //     // "No Of Exchange",
        //     "RTO",
        //     "Regn No",
        //     "Auto Card",
        //     // "No Of Autocard",
        //     "CCP",
        //     "MSSF",
        //     'MGA',
        //     'Teflon',
        //     "DSE",
        //     "DSE Code",
        //     // "DSE DOJ",
        //     "DOJ MNTH",
        //     "Group",
        //     "Group Code",
        //     "GH",
        //     "GH Code",
        //     // "Month",
        //     "File No",
        //     "Delivery Date",
        //     "RIPS Date",
        //     "Qualifying Model",
        //     "Qualifying Model Code"

        //   ]
        //   const headerOrder = [
        //     'Sno',
        //     'BKG_DATE',
        //     'Customer_Name',
        //     'Tehsil',
        //     'Customer_Mobile',
        //     'P_CNG',
        //     'Amt',
        //     'Model_Variant',
        //     'Chassis_No',
        //     'ExShowroom_Price',
        //     'Hypothecation_By',
        //     'IN_House_Fin',
        //     'MSSF_Id',
        //     'Net_Loan_Amt_After_PF_Chrgs',
        //     'EW_Fin_Post',
        //     'Extended_Warranty',
        //     'Insurance_Date',
        //     'Insurance_Price',
        //     'MCP',
        //     'No Of MCP',
        //     'Consumer_Offer',
        //     'Corporate_Offer',
        //     'Exchange_Offer',
        //     // 'Total_Discount',
        //     'RTO_Fin_Post',
        //     'Registration_No',
        //     'Nexa_Auto_Card',
        //     'CCP_Chrgs',
        //     'MSSF',
        //     'MGA',
        //     'Teflon',
        //     'DSE_Name',
        //     'DSE_EmpCode',
        //     'DOJ_MONTH',
        //     'TL_Name',
        //     'TL_EmpCode',
        //     'GH_Name',
        //     'GH_EMPCODE',
        //     'file_no',
        //     'Date_Of_Veh_Delivery',
        //     'RIPS_DATE',
        //     'FOCUS_MODEL',
        //     'FOCUS_MODEL_CODE',
        //   ];

        //   // Add headers to the first worksheet
        //   const headerRow = worksheet.addRow(newReqHeader);
        //   headerRow.eachCell((cell) => {
        //     cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        //     cell.fill = {
        //       type: "pattern",
        //       pattern: "solid",
        //       fgColor: { argb: "FF006400" },
        //     };
        //   });

        //   // Add rows to the first worksheet
        //   Mydt.forEach((obj, index) => {
        //     const values = [index + 1,
        //     ...headerOrder.slice(1).map(header => obj[header] || null)
        //     ];
        //     worksheet.addRow(values);
        //   });

        //   const worksheet2 = workbook.addWorksheet("Incentive_Sheet");
        //   const colors = {
        //     GH: 'FFFFD700', // Gold
        //     TL: 'FF87CEEB', // SkyBlue
        //     DSE: 'FFFFA07A' // LightSalmon
        //   };
        //   Object.keys(groupedData).forEach((ghName, groupIndex) => {
        //     const group = groupedData[ghName];
        //     const { GH_EMPCODE, Tls } = group;

        //     // Calculate the total number of customers under the GH
        //     let totalGHCases = 0;

        //     Object.keys(Tls).forEach(tlName => {
        //       const tl = Tls[tlName];
        //       Object.keys(tl.DSEs).forEach(dseName => {
        //         totalGHCases += tl.DSEs[dseName].customers.length;
        //       });
        //     });

        //     // Add Group Head row with the total cases and apply color
        //     const ghRow = worksheet2.addRow([`GROUP - ${groupIndex + 1}`, ghName, GH_EMPCODE, `Total Cases: ${totalGHCases}`]);
        //     ghRow.eachCell((cell) => {
        //       cell.fill = {
        //         type: 'pattern',
        //         pattern: 'solid',
        //         fgColor: { argb: colors.GH }
        //       };
        //     });

        //     // Add Team Leaders and their DSEs
        //     Object.keys(Tls).forEach((tlName, tlIndex) => {
        //       const tl = Tls[tlName];
        //       const { TL_EmpCode, DSEs } = tl;

        //       // Calculate the total number of customers under the TL
        //       let totalTLCases = 0;
        //       Object.keys(DSEs).forEach(dseName => {
        //         totalTLCases += DSEs[dseName].customers.length;
        //       });

        //       // Add Team Leader row with the total cases and apply color
        //       const tlRow = worksheet2.addRow([`TL - ${tlIndex + 1}`, tlName, TL_EmpCode, `Total Cases: ${totalTLCases}`]);
        //       tlRow.eachCell((cell) => {
        //         cell.fill = {
        //           type: 'pattern',
        //           pattern: 'solid',
        //           fgColor: { argb: colors.TL }
        //         };
        //       });

        //       // Add DSEs under the Team Leader
        //       Object.keys(DSEs).forEach((dseName, dseIndex) => {
        //         const dse = DSEs[dseName];
        //         const { DSE_EmpCode, customers } = dse;

        //         // Add DSE row with the count of cases and apply color
        //         const dseRow = worksheet2.addRow([`DSE - ${dseIndex + 1}`, dseName, DSE_EmpCode, `Cases: ${customers.length}`]);
        //         dseRow.eachCell((cell) => {
        //           cell.fill = {
        //             type: 'pattern',
        //             pattern: 'solid',
        //             fgColor: { argb: colors.DSE }
        //           };
        //         });
        //       });

        //       // Add a blank row between Team Leaders for readability
        //       worksheet2.addRow([]);
        //     });

        //     // Add a blank row between groups for readability
        //     worksheet2.addRow([]);
        //   });

        //   workbook.xlsx.writeFile('output.xlsx').then(() => {
        //     console.log('Excel file created successfully.');
        //   });

        //   res
        //     .status(200)
        //     .setHeader(
        //       "Content-Type",
        //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        //     );
        //   res.setHeader(
        //     "Content-Disposition",
        //     'attachment; filename="ICMRegister.xlsx"'
        //   );
        //   return workbook.xlsx
        //     .write(res)
        //     .then(() => {
        //       res.end();
        //     })
        //     .catch((error) => {
        //       console.error("Error creating workbook:", error);
        //       res.status(500).send("Internal Server Error");
        //     });
        return Mydt;
    } catch (e) {
        console.log(e);
        //   const workbook = new ExcelJS.Workbook();
        //   const worksheet = workbook.addWorksheet("Sheet1");

        //   res
        //     .status(200)
        //     .setHeader(
        //       "Content-Type",
        //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        //     );
        //   res.setHeader(
        //     "Content-Disposition",
        //     'attachment; filename="ICMRegister_NodataAvailable.xlsx"'
        //   );
        //   return workbook.xlsx
        //     .write(res)
        //     .then(() => {
        //       res.end();
        //     })
        //     .catch((error) => {
        //       console.error("Error creating workbook:", error);
        //       res.status(500).send("Internal Server Error");
        //     });
    } finally {
        // Close the Sequelize connection
        if (sequelize) {
            await sequelize.close();
        }
    }
};
function getCurrencyNull(value) {
    return value || 0;
}
const GetDate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
};
exports.makeInsentive = async function (req, res) {
    try {
        console.log(req.query)
        const yr = req.query.yr;
        const mnth = req.query.mnth;
        const sequelize = await dbname(req.query.compcode);
        const policy = await sequelize.query(`select * from INC_POLICY where yr = :yr and mnth = :mnth`,
            {
                replacements: {
                    yr: yr,
                    mnth: mnth
                }
            }
        )
        const GHheads = await sequelize.query(`
            select misc_name,Misc_Abbr,Misc_Dtl1,
    (select top 1 m.Misc_Abbr from Misc_Mst m where m.Misc_Type = 619 and m.Misc_Name = Misc_Mst.misc_dtl1)AS Name 
    from Misc_Mst where Misc_Type = 620 and CC_Group =${mnth} and CC_Ledg = ${yr} and loc_code in (${req.query.LocString}) and export_type < 3

            `);
        // console.log(GHheads[0]);
        const policyData = policy[0][0]
        const dseNFRetailSlabs = [
            policyData.NF_sale_dse_1,
            policyData.NF_sale_dse_2,
            policyData.NF_sale_dse_3,
            policyData.NF_sale_dse_4,
            policyData.NF_sale_dse_5,
            policyData.NF_sale_dse_6,
            policyData.NF_sale_dse_7,
            policyData.NF_sale_dse_8,
            policyData.NF_sale_dse_9,
            policyData.NF_sale_dse_10,
            policyData.NF_sale_dse_11
        ];
        const dseRetailSlabs = [
            policyData.sale_dse_1,
            policyData.sale_dse_2,
            policyData.sale_dse_3,
            policyData.sale_dse_4,
            policyData.sale_dse_5,
            policyData.sale_dse_6,
            policyData.sale_dse_7,
            policyData.sale_dse_8,
            policyData.sale_dse_9,
            policyData.sale_dse_10,
            policyData.sale_dse_11
        ];
        const TlRetailSlabs = [
            policyData.sale_tl_0 ? policyData.sale_tl_0 : 0,
            policyData.sale_tl_1,
            policyData.sale_tl_2,
            policyData.sale_tl_3,
            policyData.sale_tl_4,
            policyData.sale_tl_5,
            policyData.sale_tl_6,
            policyData.sale_tl_7,
            policyData.sale_tl_8,
            policyData.sale_tl_9,
            policyData.sale_tl_10,
            policyData.sale_tl_11
        ];
        const TlNFRetailSlabs = [
            policyData.NF_sale_tl_0 ? policyData.NF_sale_tl_0 : 0,
            policyData.NF_sale_tl_1,
            policyData.NF_sale_tl_2,
            policyData.NF_sale_tl_3,
            policyData.NF_sale_tl_4,
            policyData.NF_sale_tl_5,
            policyData.NF_sale_tl_6,
            policyData.NF_sale_tl_7,
            policyData.NF_sale_tl_8,
            policyData.NF_sale_tl_9,
            policyData.NF_sale_tl_10,
            policyData.NF_sale_tl_11
        ];
        const dseRtoSlab = [
            policyData.rto_dse_1,
            policyData.rto_dse_2,
            policyData.rto_dse_3,
            policyData.rto_dse_4,
            policyData.rto_dse_5,
            policyData.rto_dse_6,
            policyData.rto_dse_7,
            policyData.rto_dse_8,
            policyData.rto_dse_9,
            policyData.rto_dse_10,
            policyData.rto_dse_11,
        ]
        const tlRtoSlab = [
            policyData.rto_tl_1,
            policyData.rto_tl_2,
            policyData.rto_tl_3,
            policyData.rto_tl_4,
            policyData.rto_tl_5,
            policyData.rto_tl_6,
            policyData.rto_tl_7,
            policyData.rto_tl_8,
            policyData.rto_tl_9,
            policyData.rto_tl_10,
            policyData.rto_tl_11
        ]
        const dseMISlab = [
            policyData.MI_dse_1,
            policyData.MI_dse_2,
            policyData.MI_dse_3,
            policyData.MI_dse_4,
            policyData.MI_dse_5,
            policyData.MI_dse_6,
            policyData.MI_dse_7,
            policyData.MI_dse_8,
            policyData.MI_dse_9,
            policyData.MI_dse_10,
            policyData.MI_dse_11,
        ]
        const tlMISlab = [
            policyData.MI_tl_1,
            policyData.MI_tl_2,
            policyData.MI_tl_3,
            policyData.MI_tl_4,
            policyData.MI_tl_5,
            policyData.MI_tl_6,
            policyData.MI_tl_7,
            policyData.MI_tl_8,
            policyData.MI_tl_9,
            policyData.MI_tl_10,
            policyData.MI_tl_11
        ]
        const dseMCPSlab = [
            policyData.MCP_dse_1,
            policyData.MCP_dse_2,
            policyData.MCP_dse_3,
            policyData.MCP_dse_4,
            policyData.MCP_dse_5,
            policyData.MCP_dse_6,
            policyData.MCP_dse_7,
            policyData.MCP_dse_8,
            policyData.MCP_dse_9,
            policyData.MCP_dse_10,
            policyData.MCP_dse_11,
        ]
        const tlMCPSlab = [
            policyData.MCP_tl_1,
            policyData.MCP_tl_2,
            policyData.MCP_tl_3,
            policyData.MCP_tl_4,
            policyData.MCP_tl_5,
            policyData.MCP_tl_6,
            policyData.MCP_tl_7,
            policyData.MCP_tl_8,
            policyData.MCP_tl_9,
            policyData.MCP_tl_10,
            policyData.MCP_tl_11
        ]
        const dseMSRSlab = [
            policyData.MSR_dse_1,
            policyData.MSR_dse_2,
            policyData.MSR_dse_3,
            policyData.MSR_dse_4,
            policyData.MSR_dse_5,
            policyData.MSR_dse_6,
            policyData.MSR_dse_7,
            policyData.MSR_dse_8,
            policyData.MSR_dse_9,
            policyData.MSR_dse_10,
            policyData.MSR_dse_11,
        ]
        const tlMSRSlab = [
            policyData.MSR_tl_1,
            policyData.MSR_tl_2,
            policyData.MSR_tl_3,
            policyData.MSR_tl_4,
            policyData.MSR_tl_5,
            policyData.MSR_tl_6,
            policyData.MSR_tl_7,
            policyData.MSR_tl_8,
            policyData.MSR_tl_9,
            policyData.MSR_tl_10,
            policyData.MSR_tl_11
        ]
        const dseewSlab = [
            policyData.ew_dse_0 ? policyData.ew_dse_0 : 0,
            policyData.ew_dse_1,
            policyData.ew_dse_2,
            policyData.ew_dse_3,
            policyData.ew_dse_4,
            policyData.ew_dse_5,
            policyData.ew_dse_6,
            policyData.ew_dse_7,
            policyData.ew_dse_8,
            policyData.ew_dse_9,
            policyData.ew_dse_10,
        ]
        const tlewSlab = [
            policyData.ew_tl_0 ? policyData.ew_tl_0 : 0,
            policyData.ew_tl_1,
            policyData.ew_tl_2,
            policyData.ew_tl_3,
            policyData.ew_tl_4,
            policyData.ew_tl_5,
            policyData.ew_tl_6,
            policyData.ew_tl_7,
            policyData.ew_tl_8,
            policyData.ew_tl_9,
            policyData.ew_tl_10,
        ]

        function calculateTLtvIncentiveEBR(policyData, exchange, retailCount, TotalExRetail) {
            // Calculate the DSE NTV percentage
            const TLNtvpercentage = (TotalExRetail / retailCount) * 100;

            // Store the policies in arrays
            const TLPenPolicies = [
                policyData.NTV_Pen_TL_1,
                policyData.NTV_Pen_TL_2,
                policyData.NTV_Pen_TL_3,
                policyData.NTV_Pen_TL_4,
                policyData.NTV_Pen_TL_5
            ];

            const TLMvPolicies = [
                policyData.NTV_MV_TL_1,
                policyData.NTV_MV_TL_2,
                policyData.NTV_MV_TL_3,
                policyData.NTV_MV_TL_4,
                policyData.NTV_MV_TL_5
            ];

            const TLIncentiveAmounts = [
                policyData.NTV_IncAmt_TL_1,
                policyData.NTV_IncAmt_TL_2,
                policyData.NTV_IncAmt_TL_3,
                policyData.NTV_IncAmt_TL_4,
                policyData.NTV_IncAmt_TL_5
            ];

            let totalIncentive = 0;

            for (let i = TLPenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = TLPenPolicies[i];
                const minimumValue = TLMvPolicies[i];
                const incentiveAmount = TLIncentiveAmounts[i];
                // console.log(exchange, '--', retailCount, '--', incentiveAmount, '------', TLNtvpercentage, '-------', penetrationThreshold)
                const ass = isNaN(TLNtvpercentage) ? 0 : TLNtvpercentage;
                if (ass >= penetrationThreshold && penetrationThreshold > 0) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive / 2;
        }
        function calculateTLtvIncentive(policyData, exchange, retailCount, TotalExRetail) {
            // Calculate the DSE NTV percentage
            const TLNtvpercentage = (TotalExRetail / retailCount) * 100;

            // Store the policies in arrays
            const TLPenPolicies = [
                policyData.NTV_Pen_TL_1,
                policyData.NTV_Pen_TL_2,
                policyData.NTV_Pen_TL_3,
                policyData.NTV_Pen_TL_4,
                policyData.NTV_Pen_TL_5
            ];

            const TLMvPolicies = [
                policyData.NTV_MV_TL_1,
                policyData.NTV_MV_TL_2,
                policyData.NTV_MV_TL_3,
                policyData.NTV_MV_TL_4,
                policyData.NTV_MV_TL_5
            ];

            const TLIncentiveAmounts = [
                policyData.NTV_IncAmt_TL_1,
                policyData.NTV_IncAmt_TL_2,
                policyData.NTV_IncAmt_TL_3,
                policyData.NTV_IncAmt_TL_4,
                policyData.NTV_IncAmt_TL_5
            ];

            let totalIncentive = 0;

            for (let i = TLPenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = TLPenPolicies[i];
                const minimumValue = TLMvPolicies[i];
                const incentiveAmount = TLIncentiveAmounts[i];
                // console.log(exchange, '--', retailCount, '--', incentiveAmount, '------', TLNtvpercentage, '-------', penetrationThreshold)
                const ass = isNaN(TLNtvpercentage) ? 0 : TLNtvpercentage;
                if (ass >= penetrationThreshold && penetrationThreshold > 0) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive;
        }
        function calculateTLPenulty(policyData, exchange, retailCount, groupCount) {

            // Calculate the DSE NTV percentage
            const TLNtvpercentage = (exchange / retailCount) * 100;
            if (retailCount == 0) {
                return 0;
            }
            // Store the policies in arrays
            const TLPenPolicies = [
                policyData.LP_TL_1,
                policyData.LP_TL_2,
                policyData.LP_TL_3,
                policyData.LP_TL_4,
                policyData.LP_TL_5
            ];
            const TLIncentiveAmounts = [
                policyData.PENULTY_TL_1,
                policyData.PENULTY_TL_2,
                policyData.PENULTY_TL_3,
                policyData.PENULTY_TL_4,
                policyData.PENULTY_TL_5
            ];

            let totalIncentive = 0;

            for (let i = 0; i < TLPenPolicies.length; i++) {
                const penetrationThreshold = TLPenPolicies[i];
                const incentiveAmount = TLIncentiveAmounts[i];
                const abcd = isNaN(TLNtvpercentage) ? 0 : TLNtvpercentage;
                if (abcd < penetrationThreshold) {
                    totalIncentive = incentiveAmount * groupCount;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive;
        }
        function calculateTLNtvIncentiveEBR(policyData, exchange, retailCount, TotalExRetail) {
            // Calculate the DSE NTV percentage
            const TLNtvpercentage = (TotalExRetail / retailCount) * 100;

            // Store the policies in arrays
            const TLPenPolicies = [
                policyData.NTV_Pen_TL_1,
                policyData.NTV_Pen_TL_2,
                policyData.NTV_Pen_TL_3,
                policyData.NTV_Pen_TL_4,
                policyData.NTV_Pen_TL_5
            ];

            const TLMvPolicies = [
                policyData.NTV_MV_TL_1,
                policyData.NTV_MV_TL_2,
                policyData.NTV_MV_TL_3,
                policyData.NTV_MV_TL_4,
                policyData.NTV_MV_TL_5
            ];

            const TLIncentiveAmounts = [
                policyData.NTV_IncAmt_TL_1,
                policyData.NTV_IncAmt_TL_2,
                policyData.NTV_IncAmt_TL_3,
                policyData.NTV_IncAmt_TL_4,
                policyData.NTV_IncAmt_TL_5
            ];

            let totalIncentive = 0;

            for (let i = TLPenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = TLPenPolicies[i];
                const minimumValue = TLMvPolicies[i];
                const incentiveAmount = TLIncentiveAmounts[i];
                const ass = isNaN(TLNtvpercentage) ? 0 : TLNtvpercentage;
                if (ass >= penetrationThreshold && penetrationThreshold > 0) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive / 2;
        }
        function calculateTLNtvIncentive(policyData, exchange, retailCount, TotalExRetail) {
            // Calculate the DSE NTV percentage
            const TLNtvpercentage = (TotalExRetail / retailCount) * 100;

            // Store the policies in arrays
            const TLPenPolicies = [
                policyData.NTV_Pen_TL_1,
                policyData.NTV_Pen_TL_2,
                policyData.NTV_Pen_TL_3,
                policyData.NTV_Pen_TL_4,
                policyData.NTV_Pen_TL_5
            ];

            const TLMvPolicies = [
                policyData.NTV_MV_TL_1,
                policyData.NTV_MV_TL_2,
                policyData.NTV_MV_TL_3,
                policyData.NTV_MV_TL_4,
                policyData.NTV_MV_TL_5
            ];

            const TLIncentiveAmounts = [
                policyData.NTV_IncAmt_TL_1,
                policyData.NTV_IncAmt_TL_2,
                policyData.NTV_IncAmt_TL_3,
                policyData.NTV_IncAmt_TL_4,
                policyData.NTV_IncAmt_TL_5
            ];

            let totalIncentive = 0;

            for (let i = TLPenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = TLPenPolicies[i];
                const minimumValue = TLMvPolicies[i];
                const incentiveAmount = TLIncentiveAmounts[i];
                const ass = isNaN(TLNtvpercentage) ? 0 : TLNtvpercentage;
                if (ass >= penetrationThreshold && penetrationThreshold > 0) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive;
        }
        function calculateDseNtvIncentiveEBR(policyData, exchange, retailCount) {
            // Calculate the DSE NTV percentage
            const DseNtvpercentage = (exchange / retailCount) * 100;

            // Store the policies in arrays
            const dsePenPolicies = [
                policyData.NTV_Pen_dse_1,
                policyData.NTV_Pen_dse_2,
                policyData.NTV_Pen_dse_3,
                policyData.NTV_Pen_dse_4,
                policyData.NTV_Pen_dse_5
            ];

            const dseMvPolicies = [
                policyData.NTV_MV_dse_1,
                policyData.NTV_MV_dse_2,
                policyData.NTV_MV_dse_3,
                policyData.NTV_MV_dse_4,
                policyData.NTV_MV_dse_5
            ];

            const dseIncentiveAmounts = [
                policyData.NTV_IncAmt_dse_1,
                policyData.NTV_IncAmt_dse_2,
                policyData.NTV_IncAmt_dse_3,
                policyData.NTV_IncAmt_dse_4,
                policyData.NTV_IncAmt_dse_5
            ];

            let totalIncentive = 0;
            let lastValidIncentive = 0;

            // for (let i = 0; i < dsePenPolicies.length; i++) {
            for (let i = dsePenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = dsePenPolicies[i];
                const minimumValue = dseMvPolicies[i];
                const incentiveAmount = dseIncentiveAmounts[i];

                if (minimumValue <= exchange) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive / 2;
        }
        function calculateDseNtvIncentive(policyData, exchange, retailCount) {
            // Calculate the DSE NTV percentage
            const DseNtvpercentage = (exchange / retailCount) * 100;

            // Store the policies in arrays
            const dsePenPolicies = [
                policyData.NTV_Pen_dse_1,
                policyData.NTV_Pen_dse_2,
                policyData.NTV_Pen_dse_3,
                policyData.NTV_Pen_dse_4,
                policyData.NTV_Pen_dse_5
            ];

            const dseMvPolicies = [
                policyData.NTV_MV_dse_1,
                policyData.NTV_MV_dse_2,
                policyData.NTV_MV_dse_3,
                policyData.NTV_MV_dse_4,
                policyData.NTV_MV_dse_5
            ];

            const dseIncentiveAmounts = [
                policyData.NTV_IncAmt_dse_1,
                policyData.NTV_IncAmt_dse_2,
                policyData.NTV_IncAmt_dse_3,
                policyData.NTV_IncAmt_dse_4,
                policyData.NTV_IncAmt_dse_5
            ];

            let totalIncentive = 0;
            let lastValidIncentive = 0;

            // for (let i = 0; i < dsePenPolicies.length; i++) {
            for (let i = dsePenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = dsePenPolicies[i];
                const minimumValue = dseMvPolicies[i];
                const incentiveAmount = dseIncentiveAmounts[i];

                if (minimumValue <= exchange) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive;
        }
        function calculateDsepenultyIncentive(policyData, exchange, retailCount) {
            // Calculate the DSE NTV percentage
            if (retailCount == 0) {
                return 0;
            }
            const DseNtvpercentage = (exchange / retailCount) * 100;

            // Store the policies in arrays
            const dsePenPolicies = [
                policyData.LP_DSE_1,
                policyData.LP_DSE_2,
                policyData.LP_DSE_3,
                policyData.LP_DSE_4,
                policyData.LP_DSE_5
            ];

            const dseMvPolicies = [
                policyData.TV_MV_dse_1,
                policyData.TV_MV_dse_2,
                policyData.TV_MV_dse_3,
                policyData.TV_MV_dse_4,
                policyData.TV_MV_dse_5
            ];

            const dseIncentiveAmounts = [
                policyData.PENULTY_DSE_1,
                policyData.PENULTY_DSE_2,
                policyData.PENULTY_DSE_3,
                policyData.PENULTY_DSE_4,
                policyData.PENULTY_DSE_5
            ];

            let totalIncentive = 0;
            let lastValidIncentive = 0;
            // for (let i = 0; i < dsePenPolicies.length; i++) {
            for (let i = 0; i < dsePenPolicies.length; i++) {
                const penetrationThreshold = dsePenPolicies[i];
                const minimumValue = dseMvPolicies[i];
                const incentiveAmount = dseIncentiveAmounts[i];
                const abcd = isNaN(DseNtvpercentage) ? 0 : DseNtvpercentage;
                if (abcd < penetrationThreshold) {


                    totalIncentive = incentiveAmount;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }
            // console.log(totalIncentive);

            return totalIncentive;
        }
        function calculateDseTvIncentiveEBR(policyData, exchange, retailCount) {
            // Calculate the DSE NTV percentage
            const DseNtvpercentage = (exchange / retailCount) * 100;

            // Store the policies in arrays
            const dsePenPolicies = [
                policyData.TV_Pen_dse_1,
                policyData.TV_Pen_dse_2,
                policyData.TV_Pen_dse_3,
                policyData.TV_Pen_dse_4,
                policyData.TV_Pen_dse_5
            ];

            const dseMvPolicies = [
                policyData.TV_MV_dse_1,
                policyData.TV_MV_dse_2,
                policyData.TV_MV_dse_3,
                policyData.TV_MV_dse_4,
                policyData.TV_MV_dse_5
            ];

            const dseIncentiveAmounts = [
                policyData.TV_IncAmt_dse_1,
                policyData.TV_IncAmt_dse_2,
                policyData.TV_IncAmt_dse_3,
                policyData.TV_IncAmt_dse_4,
                policyData.TV_IncAmt_dse_5
            ];

            let totalIncentive = 0;
            let lastValidIncentive = 0;

            // for (let i = 0; i < dsePenPolicies.length; i++) {
            for (let i = dsePenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = dsePenPolicies[i];
                const minimumValue = dseMvPolicies[i];
                const incentiveAmount = dseIncentiveAmounts[i];

                if (minimumValue <= exchange) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive / 2;
        }
        function calculateDseTvIncentive(policyData, exchange, retailCount) {
            // Calculate the DSE NTV percentage
            const DseNtvpercentage = (exchange / retailCount) * 100;

            // Store the policies in arrays
            const dsePenPolicies = [
                policyData.TV_Pen_dse_1,
                policyData.TV_Pen_dse_2,
                policyData.TV_Pen_dse_3,
                policyData.TV_Pen_dse_4,
                policyData.TV_Pen_dse_5
            ];

            const dseMvPolicies = [
                policyData.TV_MV_dse_1,
                policyData.TV_MV_dse_2,
                policyData.TV_MV_dse_3,
                policyData.TV_MV_dse_4,
                policyData.TV_MV_dse_5
            ];

            const dseIncentiveAmounts = [
                policyData.TV_IncAmt_dse_1,
                policyData.TV_IncAmt_dse_2,
                policyData.TV_IncAmt_dse_3,
                policyData.TV_IncAmt_dse_4,
                policyData.TV_IncAmt_dse_5
            ];

            let totalIncentive = 0;
            let lastValidIncentive = 0;

            // for (let i = 0; i < dsePenPolicies.length; i++) {
            for (let i = dsePenPolicies.length - 1; i >= 0; i--) {
                const penetrationThreshold = dsePenPolicies[i];
                const minimumValue = dseMvPolicies[i];
                const incentiveAmount = dseIncentiveAmounts[i];

                if (minimumValue <= exchange) {
                    totalIncentive = incentiveAmount * exchange;
                    break;
                }

                // Add the last valid incentive to the total incentive
            }

            return totalIncentive;
        }
        async function createHierarchy(data) {
            const hierarchy = {};
            const groupHeadStats = {};
            const data1 = await sequelize.query(`SELECT DISTINCT misc_name AS groupCode1 , Misc_Abbr as group_name1 , (select count(*) from
                 Misc_Mst where Misc_Mst.misc_dtl1 = m.misc_name and Misc_Mst.Misc_Type = 621
                 and Misc_Mst.CC_Group = ${mnth} and Misc_Mst.CC_Ledg = ${yr} and 
                 isnull(Misc_Mst.Exp_Date,getDate()) > DATEFROMPARTS(${yr}, ${mnth}, 1)
                 ) as count
                                                 FROM misc_mst m
                                                 WHERE misc_type = 620 and CC_Group =${mnth} and CC_Ledg = ${yr} and loc_code in (${req.query.LocString}) and export_type < 3 and isnull(Exp_Date,getDate()) > DATEFROMPARTS(${yr}, ${mnth}, 1)`);

            // const data2 = await sequelize.query(`SELECT DISTINCT misc_dtl1 AS groupCode1, misc_name AS dseCode1 , Misc_Abbr as dse_Name1 , DATEDIFF(MONTH, Join_Date, GETDATE()) as DOJ_MONTH
            //                                      FROM misc_mst
            //                                      WHERE misc_type = 621 and loc_code in (${req.query.LocString}) and export_type < 3`);
            const data2 = await sequelize.query(` DECLARE @Year INT = ${yr}; -- Replace with your desired year
                        DECLARE @Month INT =${mnth};

                        WITH EmployeeHistory AS (
                                                    SELECT 
                                                        misc_dtl1 AS groupCode1,
                                                        misc_name AS dseCode1,
                                                        Misc_Abbr AS dse_Name1,
                                                        DATEDIFF(MONTH, Join_Date, DATEFROMPARTS(@Year, @Month, 1)) AS DOJ_MONTH,
                                                        Birth_Date,CC_group,CC_ledg,Exp_date
                                
                                                    FROM 
                                                        misc_mst
                                                    WHERE 
                                                        misc_type = 621 and CC_Group =@Month and CC_Ledg = @Year and Export_Type= 1
                                                        AND loc_code IN (${req.query.LocString})        
                                                )

                                                SELECT 
                                                    groupCode1,
                                                    dseCode1,
                                                    dse_Name1,
                                                    DOJ_MONTH,CC_group,CC_ledg,Exp_Date
                                                FROM 
                                                    EmployeeHistory
                                                WHERE 
                                                isnull(Exp_Date,getDate()) > DATEFROMPARTS(@Year, @Month, 1) 

         `);
            const dseLinks = data2[0];
            data1[0].forEach(groupCode => {
                groupHeadStats[groupCode.groupCode1] = {
                    totalRetail: 0,
                    totalEw: 0,
                    totalRto: 0,
                    totalMi: 0,
                    totalExchange: 0,
                    totalExchangeEBR: 0,
                    totalExchangeTv: 0,
                    totalExchangeTvEBR: 0,
                    totalMcp: 0,
                    totalMsr: 0,
                    totalQfModel: 0,
                    groupCount: groupCode.count ? groupCode.count : 1,
                    totalRetail_less6mnth: 0,
                    groupCount_less6mnth: 0

                };

                hierarchy[groupCode.groupCode1] = {
                    "CODE": groupCode.group_name1, // Assuming groupHead is same as groupCode for now
                    "NAME": groupCode.groupCode1,
                    "Retail": 0,
                    "DSE Members": {}
                };

            });

            // Initialize DSE Members in hierarchy for each groupCode
            dseLinks.forEach(link => {
                const { groupCode1, dseCode1, dse_Name1, DOJ_MONTH } = link;

                // If the groupCode already exists in hierarchy
                if (hierarchy[groupCode1]) {
                    hierarchy[groupCode1]["DSE Members"][dseCode1] = {
                        "NAME": dse_Name1, // Assuming dseName is same as dseCode for now
                        "CODE": dseCode1,
                        "Retail": 0,
                        "EW": 0,
                        "RTO": 0,
                        "MI": 0,
                        "Mcp": 0,
                        "Msr": 0,
                        "Exch Count": 0,
                        "Exch Amt": 0,
                        "TV Exch VEH": 0,
                        "TV/EBR Exch VEH": 0,
                        "NTV Exch VEH": 0,
                        "NTV/EBR Exch VEH": 0,
                        "QfModel": 0,
                        "QUALIFIED YN": "No",
                        "DOJ MONTH": DOJ_MONTH
                    };
                }
            });
            // console.log(hierarchy);
            data.forEach(entry => {
                const groupCode = entry["TL_EmpCode"];
                const groupHead = entry["TL_Name"];
                const dseName = entry["DSE_Name"];
                const EW = entry["EW_Fin_Post"];
                const RTO = entry["RTO_Fin_Post"];
                const dseCode = entry["DSE_EmpCode"];
                const MI = entry["Insurance_Price"];
                const Exchange = entry["Exchange_Offer"];
                const TV_NTV = entry["TV_NTV"];
                const IS_EBR = entry["IS_EBR"];
                const Mcp = entry["MCP_Chrgs"];
                const Msr = entry["Nexa_Auto_Card"];
                const QfModel = entry["FOCUS_MODEL_CODE"];
                if (!groupHeadStats[groupCode]) {
                    groupHeadStats[groupCode] = {
                        totalRetail: 0,
                        totalEw: 0,
                        totalRto: 0,
                        totalMi: 0,
                        totalExchange: 0,
                        totalExchangeEBR: 0,
                        totalExchangeTv: 0,
                        totalExchangeTvEBR: 0,
                        totalMcp: 0,
                        totalMsr: 0,
                        totalQfModel: 0,
                        groupCount: 0,
                        groupCount_less6mnth: 0,
                        totalRetail_less6mnth: 0
                    };
                }
                // Initialize the group in the hierarchy if it doesn't exist
                if (!hierarchy[groupCode]) {
                    hierarchy[groupCode] = {
                        "CODE": groupHead?.trim(),
                        "NAME": groupCode,
                        "Retail": 0,
                        "DSE Members": {}
                    };
                }

                // Initialize the DSE in the hierarchy if it doesn't exist
                if (!hierarchy[groupCode]["DSE Members"][dseCode]) {
                    hierarchy[groupCode]["DSE Members"][dseCode] = {
                        "NAME": dseName,
                        "CODE": dseCode,
                        "DOJ MONTH": entry["DOJ_MONTH"],
                        "Retail": 0,
                        "EW": 0,
                        "RTO": 0,
                        "MI": 0,
                        "Mcp": 0,
                        "Msr": 0,
                        "Exch Count": 0,
                        "Exch Amt": 0,
                        "TV Exch VEH": 0,
                        "TV/EBR Exch VEH": 0,
                        "NTV Exch VEH": 0,
                        "NTV/EBR Exch VEH": 0,
                        "QfModel": 0,
                        "QUALIFIED YN": "No"
                    };
                    groupHeadStats[groupCode].groupCount += 1;

                }


                // Increment the entry count for the DSE
                hierarchy[groupCode]["DSE Members"][dseCode]["Retail"]++;
                hierarchy[groupCode]["Retail"]++;
                hierarchy[groupCode]["DSE Members"][dseCode]["DOJ MONTH"] = entry["DOJ_MONTH"],
                    hierarchy[groupCode]["DOJ MONTH"] = entry["DOJ_MONTH_TL"],

                    // Increment the overall entry count for the group
                    // Track stats for group head
                    groupHeadStats[groupCode].totalRetail += 1;


                if (EW.toUpperCase() == "YES") {
                    hierarchy[groupCode]["DSE Members"][dseCode]["EW"]++;
                    groupHeadStats[groupCode].totalEw += 1;
                }
                if (RTO.toUpperCase() == "YES") {
                    hierarchy[groupCode]["DSE Members"][dseCode]["RTO"]++;
                    groupHeadStats[groupCode].totalRto += 1;
                }
                if (MI) {
                    hierarchy[groupCode]["DSE Members"][dseCode]["MI"]++;
                    groupHeadStats[groupCode].totalMi += 1;
                }
                if (TV_NTV == 'TV' && IS_EBR == 'EBR') {
                    hierarchy[groupCode]["DSE Members"][dseCode]["TV/EBR Exch VEH"]++;
                    groupHeadStats[groupCode].totalExchangeTvEBR += 1;
                } else if (TV_NTV == 'TV' && IS_EBR == 'PHYSICAL') {
                    hierarchy[groupCode]["DSE Members"][dseCode]["TV Exch VEH"]++;
                    groupHeadStats[groupCode].totalExchangeTv += 1;
                }
                if (TV_NTV == 'NTV' && IS_EBR == 'EBR') {
                    hierarchy[groupCode]["DSE Members"][dseCode]["NTV/EBR Exch VEH"]++;
                    groupHeadStats[groupCode].totalExchangeEBR += 1;
                } else if (TV_NTV == 'NTV' && IS_EBR == 'PHYSICAL') {
                    hierarchy[groupCode]["DSE Members"][dseCode]["NTV Exch VEH"]++;
                    groupHeadStats[groupCode].totalExchange += 1;
                }
                if (Mcp) {
                    hierarchy[groupCode]["DSE Members"][dseCode]["Mcp"]++;
                    groupHeadStats[groupCode].totalMcp += 1;
                }
                if (Msr) {
                    hierarchy[groupCode]["DSE Members"][dseCode]["Msr"]++;
                    groupHeadStats[groupCode].totalMsr += 1;
                }
                if (QfModel) {
                    hierarchy[groupCode]["DSE Members"][dseCode]["QfModel"]++;
                    hierarchy[groupCode]["DSE Members"][dseCode]["QUALIFIED YN"] = 'Yes';
                    groupHeadStats[groupCode].totalQfModel += 1;
                }
            });
            // console.log(hierarchy);



            // Convert the hierarchy object to an array and add Avg Entry Count
            return Object.keys(hierarchy).map(groupCode => {
                Object.values(hierarchy[groupCode]["DSE Members"]).forEach((member) => {
                    const dojMonth = parseInt(member["DOJ MONTH"]);

                    // Check if DOJ MONTH is greater than or equal to 6
                    if (dojMonth >= 6) {
                        groupHeadStats[groupCode].totalRetail_less6mnth += parseFloat(member["Retail"] || 0); // Assuming Retail is the property to sum
                        groupHeadStats[groupCode].groupCount_less6mnth += 1;
                    }
                });

                const DSEDATA = Object.values(hierarchy[groupCode]["DSE Members"])?.map(dse => {
                    const retailCount = dse.Retail;
                    const rtoCount = dse.RTO;
                    const MiCount = dse.MI;
                    const McpCount = dse.Mcp;
                    const MsrCount = dse.Msr;
                    const EwCount = dse.EW;
                    const Exchange = dse["NTV Exch VEH"];
                    const ExchangeEBR = dse["NTV/EBR Exch VEH"];
                    const TvExchange = dse["TV Exch VEH"];
                    const TvExchangeEBR = dse["TV/EBR Exch VEH"];
                    const QfModel = dse["QfModel"];
                    let slab = 0;
                    let Rslabi = 0;
                    let rtoslab = 0
                    let Mislab = 0
                    let Mcpslab = 0
                    let Msrslab = 0
                    let Ewslab = 0

                    // Compare retail count against each slab threshold
                    for (let i = dseRetailSlabs.length - 1; i >= 0; i--) {
                        if (retailCount > i) {
                            Rslabi = i;
                            if (QfModel) {
                                slab = retailCount * dseRetailSlabs[i];
                            } else {
                                slab = retailCount * dseNFRetailSlabs[i];
                                // let applicableRate = dseNFRetailSlabs[i];
                                // let applicableIndex = i;


                                // // Traverse backward to find the first occurrence of the same rate
                                // while (applicableIndex > 0 && dseNFRetailSlabs[applicableIndex - 1] == applicableRate) {
                                //     applicableIndex--;
                                // }
                                // if(dse.CODE == "BC2578"){
                                //     console.log(applicableIndex)
                                // }

                                // // Apply the rate from the first slab in the range
                                // slab = retailCount * dseNFRetailSlabs[applicableIndex];
                            }
                            break; // Slab starts from sale_dse_4, so add 4 to index
                        }
                    }
                    for (let i = dseRtoSlab.length - 1; i >= 0; i--) {

                        if (rtoCount > i) {
                            rtoslab = rtoCount * dseRtoSlab[i]
                            break; // Slab starts from sale_dse_4, so add 4 to index
                        }
                    }
                    for (let i = dseMISlab.length - 1; i >= 0; i--) {
                        if (MiCount > i) {
                            Mislab = MiCount * dseMISlab[i]
                            break; // Slab starts from sale_dse_4, so add 4 to index
                        }
                    }
                    for (let i = dseMCPSlab.length - 1; i >= 0; i--) {
                        if (McpCount > i) {
                            Mcpslab = McpCount * dseMCPSlab[i]
                            break; // Slab starts from sale_dse_4, so add 4 to index
                        }
                    }
                    const dseMsrPenetration = (MsrCount / retailCount) * 100
                    for (let i = dseMSRSlab.length - 1; i >= 0; i--) {
                        if (MsrCount > i && policyData.MSR_dse_Penetration <= dseMsrPenetration) {
                            Msrslab = MsrCount * dseMSRSlab[i]
                            break;
                        }
                    }
                    const percentage = (EwCount / retailCount) * 100; // Calculate percentage based on total possible count
                    for (let i = dseewSlab.length - 1; i >= 0; i--) {
                        if (percentage >= 80 && percentage < 81 && percentage >= i * 10) {
                            Ewslab = EwCount * dseewSlab[i - 1]; // Incentive value for 81% to 89.99% is 225
                            break;
                        }
                        if (percentage >= i * 10) {
                            Ewslab = EwCount * dseewSlab[i];
                            break; // Slab starts from sale_dse_4, so add 4 to index
                        }
                    }
                    // const DseNtvpercentage = (Exchange / retailCount) * 100; // Calculate percentage based on total possible count
                    const totalIncentive = calculateDseNtvIncentive(policyData, Exchange, retailCount);
                    const totalIncentiveEBR = calculateDseNtvIncentiveEBR(policyData, ExchangeEBR, retailCount);
                    const totalIncentiveTV = calculateDseTvIncentive(policyData, TvExchange, retailCount);
                    const totalIncentiveTVEBR = calculateDseTvIncentiveEBR(policyData, TvExchangeEBR, retailCount);
                    const totalpenultyDse = calculateDsepenultyIncentive(policyData, Exchange + TvExchange + TvExchangeEBR + ExchangeEBR, retailCount);
                    const Dsetvpercentage = ((Exchange + TvExchange + TvExchangeEBR + ExchangeEBR) / retailCount) * 100;

                    // Assign the slab to the DSE
                    // dse["DSE Incentive"] = slab ? slab : 0;
                    dse[`No${Rslabi + 1}`] = retailCount ? retailCount : 0;
                    dse[`No${Rslabi + 1} Amt`] = slab ? slab : 0;
                    dse["DSE Incentive"] = slab ? slab : 0;
                    dse["RTO Amt"] = rtoslab ? rtoslab : 0;
                    dse["MI AMT"] = Mislab ? Mislab : 0;
                    dse["MCP AMT"] = Mcpslab ? Mcpslab : 0;
                    dse["MSR AMT"] = Msrslab ? Msrslab : 0;
                    dse["EW AMT"] = Ewslab ? Ewslab : 0;
                    dse["EW %"] = percentage ? `${percentage?.toFixed(2)} %` : '0.00 %';
                    dse["Sub Total A"] = slab ? slab : 0;
                    dse["Exch Count"] = Exchange + ExchangeEBR + TvExchange + TvExchangeEBR;
                    dse["Exch Amt"] = totalIncentive + totalIncentiveEBR + totalIncentiveTV + totalIncentiveTVEBR;
                    dse["NTV Exch Amt"] = totalIncentive ? totalIncentive : 0;
                    dse["NTV/EBR Exch Amt"] = totalIncentiveEBR ? totalIncentiveEBR : 0;
                    dse["TV Exch Amt"] = totalIncentiveTV ? totalIncentiveTV : 0;
                    dse["TV/EBR Exch Amt"] = totalIncentiveTVEBR ? totalIncentiveTVEBR : 0;
                    dse["Sub Total B"] = rtoslab + Mislab + Mcpslab + Msrslab + Ewslab - totalpenultyDse;
                    dse["Exch %"] = Dsetvpercentage ? `${Dsetvpercentage?.toFixed(2)} %` : '0.00 %';
                    // dse["Sub Total B"] = rtoslab + Mislab + Mcpslab + Msrslab + Ewslab + totalIncentive + totalIncentiveTV + totalIncentiveEBR + totalIncentiveTVEBR - totalpenultyDse;
                    // dse["GRAND TOTAL"] = slab + rtoslab + Mislab + Mcpslab + Msrslab + Ewslab + totalIncentive + totalIncentiveTV + totalIncentiveEBR + totalIncentiveTVEBR - totalpenultyDse;
                    dse["GRAND TOTAL"] = slab + rtoslab + Mislab + Mcpslab + Msrslab + Ewslab - totalpenultyDse;
                    dse["Exch Penalty"] = totalpenultyDse ? totalpenultyDse : 0;
                    return dse;
                });
                // console.log(Object.values(hierarchy[groupCode]["DSE Members"]));
                // console.log(DSEDATA);
                const groupHead = hierarchy[groupCode]["CODE"];

                const tlCode = hierarchy[groupCode]?.NAME;
                let adjustedTotalRetail_SameTL = groupHeadStats[groupCode]?.totalRetail || 0;
                let adjustedTotalRetail = groupHeadStats[groupCode]?.totalRetail_less6mnth || 0;
                let adjustedGroupCount = groupHeadStats[groupCode]?.groupCount_less6mnth || 1;
                let adjustedtotalRto = groupHeadStats[groupCode]?.totalRto || 0;
                let adjustedtotalMi = groupHeadStats[groupCode]?.totalMi || 0;
                let adjustedtotalMcp = groupHeadStats[groupCode]?.totalMcp || 0;
                let adjustedtotalMsr = groupHeadStats[groupCode]?.totalMsr || 0;
                let adjustedtotalEw = groupHeadStats[groupCode]?.totalEw || 0;

                // Check if TL is also a DSE and adjust totals

                if (hierarchy[groupCode]['DSE Members'][tlCode]) {
                    const tlRetail = hierarchy[groupCode]['DSE Members'][tlCode].Retail || 0;
                    adjustedTotalRetail -= tlRetail; // Subtract TL's retail from total
                    adjustedTotalRetail_SameTL -= tlRetail; // Subtract TL's retail from total
                    adjustedGroupCount -= 1; // Reduce group count by one
                    adjustedtotalRto -= hierarchy[groupCode]['DSE Members'][tlCode].RTO || 0;
                    adjustedtotalMi -= hierarchy[groupCode]['DSE Members'][tlCode].MI || 0;
                    adjustedtotalMcp -= hierarchy[groupCode]['DSE Members'][tlCode].Mcp || 0;
                    adjustedtotalMsr -= hierarchy[groupCode]['DSE Members'][tlCode].Msr || 0;
                    adjustedtotalEw -= hierarchy[groupCode]['DSE Members'][tlCode].EW || 0;
                }

                // Calculate the adjusted average entry count
                const avgEntryCount = parseFloat((adjustedTotalRetail / (adjustedGroupCount > 0 ? adjustedGroupCount : 1)).toFixed(2));

                // const avgEntryCount = parseFloat((groupHeadStats[groupCode]?.totalRetail_less6mnth / (groupHeadStats[groupCode]?.groupCount_less6mnth ? groupHeadStats[groupCode]?.groupCount_less6mnth : 1))?.toFixed(2));

                // const avgTotalEwCount = parseFloat((groupHeadStats[groupCode]?.totalEw / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                // const avgTotalRtoCount = parseFloat((groupHeadStats[groupCode]?.totalRto / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                // const avgTotalMiCount = parseFloat((groupHeadStats[groupCode]?.totalMi / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                // const avgTotalExchangeCount = parseFloat((groupHeadStats[groupCode]?.totalExchange / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                // const avgTotalMcpCount = parseFloat((groupHeadStats[groupCode]?.totalMcp / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                // const avgTotalQfModelCount = parseFloat((groupHeadStats[groupCode]?.totalQfModel / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                // const avgTotalMsrCount = parseFloat((groupHeadStats[groupCode]?.totalMsr / groupHeadStats[groupCode]?.groupCount)?.toFixed(2));
                let tlRetailslab = 0;
                let tlRtoslab = 0;
                let tlMislab = 0;
                let tlMcpslab = 0;
                let tlMsrslab = 0;
                let tlewslab = 0;
                const isTlQf = DSEDATA?.length <= groupHeadStats[groupCode]["totalQfModel"] ? 1 : 0
                for (let i = TlRetailSlabs.length - 1; i >= 0; i--) {
                    // Adjusted total retail - Tl itself retail incase of same tl and DSE
                    if (avgEntryCount >= i) {
                        if (isTlQf) {
                            // tlRetailslab = groupHeadStats[groupCode]?.totalRetail * TlRetailSlabs[i]; // Slab starts from sale_dse_4, so add 4 to index
                            tlRetailslab = adjustedTotalRetail_SameTL * TlRetailSlabs[i]; // Slab starts from sale_dse_4, so add 4 to index
                        } else {
                            // // tlRetailslab = groupHeadStats[groupCode]?.totalRetail * TlNFRetailSlabs[i]; // Slab starts from sale_dse_4, so add 4 to index
                            tlRetailslab = adjustedTotalRetail_SameTL * TlNFRetailSlabs[i]; // Slab starts from sale_dse_4, so add 4 to index
                            //According to the Money slab down not by car 
                            // let applicableRate = TlNFRetailSlabs[i];
                            // let applicableIndex = i;

                            // // Traverse backwards to find the first occurrence of the same rate
                            // while (applicableIndex > 0 && TlNFRetailSlabs[applicableIndex - 1] == applicableRate) {
                            //     applicableIndex--;
                            // }

                            // // Apply the rate from the first slab in the range
                            // tlRetailslab = adjustedTotalRetail_SameTL * TlNFRetailSlabs[applicableIndex];

                        }
                        break;
                    }
                }
                for (let i = tlRtoSlab.length - 1; i >= 0; i--) {
                    if (adjustedtotalRto > i) {
                        tlRtoslab = adjustedtotalRto * tlRtoSlab[i]; // Slab starts from sale_dse_4, so add 4 to index
                        break;
                    }
                }
                for (let i = tlMISlab.length - 1; i >= 0; i--) {
                    if (adjustedtotalMi > i) {
                        tlMislab = adjustedtotalMi * tlMISlab[i]; // Slab starts from sale_dse_4, so add 4 to index
                        break;
                    }
                }
                for (let i = tlMCPSlab.length - 1; i >= 0; i--) {
                    if (adjustedtotalMcp > i) {
                        tlMcpslab = adjustedtotalMcp * tlMCPSlab[i]; // Slab starts from sale_dse_4, so add 4 to index
                        break;
                    }
                }
                const MsrPercentage = (groupHeadStats[groupCode]?.totalMsr / groupHeadStats[groupCode]?.totalRetail) * 100; // Calculate percentage based on total possible count
                for (let i = tlMSRSlab.length - 1; i >= 0; i--) {
                    if (adjustedtotalMsr > i && policyData.MSR_tl_Penetration <= MsrPercentage) {
                        tlMsrslab = adjustedtotalMsr * tlMSRSlab[i]; // Slab starts from sale_dse_4, so add 4 to index
                        break;
                    }
                }
                const percentage = (groupHeadStats[groupCode]?.totalEw / groupHeadStats[groupCode]?.totalRetail) * 100; // Calculate percentage based on total possible count
                for (let i = tlewSlab.length - 1; i >= 0; i--) {
                    if (percentage >= 80 && percentage <= 81 && percentage >= i * 10) {
                        tlewslab = adjustedtotalEw * tlewSlab[i - 1]; // Incentive value for 81% to 89.99% is 225
                        break;
                    }
                    if (percentage >= i * 10) {
                        tlewslab = adjustedtotalEw * tlewSlab[i]; // Slab starts from sale_dse_4, so add 4 to index
                        break;
                    }
                }
                // if ()
                const totalExchange = isNaN(parseInt(groupHeadStats[groupCode]?.totalExchange)) ? 0 : parseInt(groupHeadStats[groupCode]?.totalExchange);
                const totalExchangeEBR = isNaN(parseInt(groupHeadStats[groupCode]?.totalExchangeEBR)) ? 0 : parseInt(groupHeadStats[groupCode]?.totalExchangeEBR);
                const totalExchangeTv = isNaN(parseInt(groupHeadStats[groupCode]?.totalExchangeTv)) ? 0 : parseInt(groupHeadStats[groupCode]?.totalExchangeTv);
                const totalExchangeTvEBR = isNaN(parseInt(groupHeadStats[groupCode]?.totalExchangeTvEBR)) ? 0 : parseInt(groupHeadStats[groupCode]?.totalExchangeTvEBR);
                const totalEchangebyTL = totalExchange + totalExchangeEBR + totalExchangeTv + totalExchangeTvEBR;
                const totalIncentive = calculateTLNtvIncentive(policyData, totalExchange, groupHeadStats[groupCode]?.totalRetail, totalEchangebyTL);
                const totalIncentiveEBR = calculateTLNtvIncentiveEBR(policyData, totalExchangeEBR, groupHeadStats[groupCode]?.totalRetail, totalEchangebyTL);
                const totalIncentivetv = calculateTLtvIncentive(policyData, totalExchangeTv, groupHeadStats[groupCode]?.totalRetail, totalEchangebyTL);
                const totalIncentivetvEBR = calculateTLtvIncentiveEBR(policyData, totalExchangeTvEBR, groupHeadStats[groupCode]?.totalRetail, totalEchangebyTL);
                const tlPenulty = calculateTLPenulty(policyData, totalEchangebyTL, groupHeadStats[groupCode]?.totalRetail, groupHeadStats[groupCode]?.groupCount);
                const TLtvpercentage = (totalEchangebyTL / groupHeadStats[groupCode]?.totalRetail) * 100;

                return {
                    "CODE": groupCode,
                    "NAME": groupHead,
                    "Retail": hierarchy[groupCode]["Retail"],
                    "Avg Retail Per DSE": avgEntryCount,
                    "Incentive Rate TL": tlRetailslab,
                    "QfModel": groupHeadStats[groupCode]["totalQfModel"],
                    "RTO": groupHeadStats[groupCode]["totalRto"],
                    "RTO Amt": tlRtoslab,
                    "MI": groupHeadStats[groupCode]["totalMi"],
                    "MI AMT": tlMislab,
                    "Mcp": groupHeadStats[groupCode]["totalMcp"],
                    "MCP AMT": tlMcpslab,
                    "Msr": groupHeadStats[groupCode]["totalMsr"],
                    "MSR AMT": tlMsrslab,
                    "EW": groupHeadStats[groupCode]["totalEw"],
                    "EW AMT": tlewslab,
                    "EW %": percentage ? `${percentage?.toFixed(2)} %` : '0.00 %',
                    "Exch Count": totalExchange + totalExchangeEBR + totalExchangeTv + totalExchangeTvEBR,
                    "Exch Amt": totalIncentive + totalIncentiveEBR + totalIncentivetv + totalIncentivetvEBR,
                    "NTV Exch VEH": totalExchange,
                    "NTV/EBR Exch VEH": totalExchangeEBR,
                    "TV Exch VEH": totalExchangeTv,
                    "TV/EBR Exch VEH": totalExchangeTvEBR,
                    "Sub Total A": tlRetailslab,
                    "Sub Total B": tlRtoslab + tlMislab + tlMsrslab + tlMcpslab + tlewslab - tlPenulty,
                    // "Sub Total B": tlRtoslab + tlMislab + tlMsrslab + tlMcpslab + tlewslab + totalIncentive + totalIncentiveEBR + totalIncentivetv + totalIncentivetvEBR - tlPenulty,
                    // "GRAND TOTAL": tlRetailslab + tlRtoslab + tlMislab + tlMsrslab + tlMcpslab + tlewslab + totalIncentive + totalIncentiveEBR + totalIncentivetv + totalIncentivetvEBR - tlPenulty,
                    "GRAND TOTAL": tlRetailslab + tlRtoslab + tlMislab + tlMsrslab + tlMcpslab + tlewslab - tlPenulty,
                    "QUALIFIED YN": DSEDATA?.length <= groupHeadStats[groupCode]["totalQfModel"] ? 'Yes' : 'No',
                    "NTV Exch Amt": totalIncentive ? totalIncentive : 0,
                    "NTV/EBR Exch Amt": totalIncentiveEBR ? totalIncentiveEBR : 0,
                    "TV Exch Amt": totalIncentivetv ? totalIncentivetv : 0,
                    "TV/EBR Exch Amt": totalIncentivetvEBR ? totalIncentivetvEBR : 0,
                    "Exch %": TLtvpercentage ? `${TLtvpercentage?.toFixed(2)} %` : '0.00 %',
                    "Exch Penalty": tlPenulty ? tlPenulty : 0,
                    "DOJ MONTH": hierarchy[groupCode]["DOJ MONTH"],
                    "DSE Members": DSEDATA
                    // "Avg QfModel": avgTotalQfModelCount,
                    // "Avg Rto": avgTotalRtoCount,
                    // "Avg Mi": avgTotalMiCount,
                    // "Avg Mcp": avgTotalMcpCount,
                    // "Avg Msr": avgTotalMsrCount,
                    // "Avg Ew": avgTotalEwCount,
                    // "Avg Exchange": avgTotalExchangeCount,
                    // "DSE Members": Object.values(hierarchy[groupCode]["DSE Members"])
                };
            });
        }
        async function separateByHeadCode(groups, data) {
            const groupedData = {};
            const undefinedGroup = [];

            // Create a mapping of head codes to group heads
            const headCodeMap = {};
            const headCodeMap1 = {};
            groups.forEach(group => {
                headCodeMap[group.misc_name] = {
                    headCode: group.Misc_Dtl1,
                    groupName: group.Name ? group.Name : group.Misc_Dtl1,
                };
                headCodeMap1[group.Misc_Dtl1] = {
                    headCode: group.Misc_Dtl1,
                    groupName: group.Name ? group.Name : group.Misc_Dtl1,
                };
            });
            // console.log(headCodeMap);
            // Loop through the data to separate based on head codes
            data.forEach(item => {
                const groupInfo = headCodeMap[item['CODE']];

                if (groupInfo && groupInfo.headCode) {
                    if (!groupedData[groupInfo.headCode]) {
                        groupedData[groupInfo.headCode] = [];
                    }
                    groupedData[groupInfo.headCode].push(item);
                } else {
                    // If no head code matches, add to undefined group
                    undefinedGroup.push(item);
                }
            });
            // console.log(groupedData);
            // Convert grouped data into an array format
            const result = Object.keys(groupedData).map((groupName) => ({
                'CODE': headCodeMap1[groupName].headCode,
                'NAME': headCodeMap1[groupName].groupName,
                Teams: groupedData[groupName]
            }));

            // Add undefined group if there are any
            if (undefinedGroup.length > 0) {
                result.push({
                    'CODE': 'Not Defined',
                    'NAME': 'Not Defined',
                    Teams: undefinedGroup
                });
            }

            return result;
        }
        function convert(data) {
            const header = [
                "SR No",
                "EMP CODE",
                "NAME",
                "Retail",
                "No1",
                "No1 Amt",
                "No2",
                "No2 Amt",
                "No3",
                "No3 Amt",
                "No4",
                "No4 Amt",
                "No5",
                "No5 Amt",
                "No6",
                "No6 Amt",
                "No7",
                "No7 Amt",
                "No8",
                "No8 Amt",
                "No9",
                "No9 Amt",
                "No10",
                "No10 Amt",
                "No11",
                "No11 Amt",
                "Avg Retail Per DSE",
                "Incentive Rate TL",
                "Sub Total A",
                "QfModel",
                "RTO",
                "RTO Amt",
                "MI",
                "MI AMT",
                "EW",
                "EW AMT",
                "EW %",
                "Msr",
                "MSR AMT",
                "Mcp",
                "MCP AMT",
                "TV Exch VEH",
                "TV Exch Amt",
                "TV/EBR Exch VEH",
                "TV/EBR Exch Amt",
                "NTV Exch VEH",
                "NTV Exch Amt",
                "NTV/EBR Exch VEH",
                "NTV/EBR Exch Amt",
                "Exch Count",
                "Exch %",
                "Exch Amt",
                "Exch Penalty",
                "Sub Total B",
                "GRAND TOTAL",
                "DOJ MONTH",
                "QUALIFIED YN",
            ]

            let array = [];
            data.forEach((group, index) => {
                const { Teams, ...data1 } = group;
                array.push({ colors: 'FFFFFFFF', array: [] });
                array.push({
                    colors: 'FF90EE91', array: [
                        `TEAM - ${index + 1}`,
                        data1["CODE"],
                        data1["NAME"],
                        data1["Retail"],
                        data1["No1"] ? data1["No1"] : null,
                        data1["No1 Amt"] ? data1["No1 Amt"] : null,
                        data1["No2"] ? data1["No2"] : null,
                        data1["No2 Amt"] ? data1["No2 Amt"] : null,
                        data1["No3"] ? data1["No3"] : null,
                        data1["No3 Amt"] ? data1["No3 Amt"] : null,
                        data1["No4"] ? data1["No4"] : null,
                        data1["No4 Amt"] ? data1["No4 Amt"] : null,
                        data1["No5"] ? data1["No5"] : null,
                        data1["No5 Amt"] ? data1["No5 Amt"] : null,
                        data1["No6"] ? data1["No6"] : null,
                        data1["No6 Amt"] ? data1["No6 Amt"] : null,
                        data1["No7"] ? data1["No7"] : null,
                        data1["No7 Amt"] ? data1["No7 Amt"] : null,
                        data1["No8"] ? data1["No8"] : null,
                        data1["No8 Amt"] ? data1["No8 Amt"] : null,
                        data1["No9"] ? data1["No9"] : null,
                        data1["No9 Amt"] ? data1["No9 Amt"] : null,
                        data1["No10"] ? data1["No10"] : null,
                        data1["No10 Amt"] ? data1["No10 Amt"] : null,
                        data1["No11"] ? data1["No11"] : null,
                        data1["No11 Amt"] ? data1["No11 Amt"] : null,
                        data1["Avg Retail Per DSE"],
                        data1["Incentive Rate TL"],
                        data1["Sub Total A"],
                        data1["QfModel"],
                        data1["RTO"],
                        data1["RTO Amt"],
                        data1["MI"],
                        data1["MI AMT"],
                        data1["EW"],
                        data1["EW AMT"],
                        data1["EW %"],
                        data1["Msr"],
                        data1["MSR AMT"],
                        data1["Mcp"],
                        data1["MCP AMT"],
                        data1["TV Exch VEH"],
                        data1["TV Exch Amt"],
                        data1["TV/EBR Exch VEH"],
                        data1["TV/EBR Exch Amt"],
                        data1["NTV Exch VEH"],
                        data1["NTV Exch Amt"],
                        data1["NTV/EBR Exch VEH"],
                        data1["NTV/EBR Exch Amt"],
                        data1["Exch Count"],
                        data1["Exch %"],
                        data1["Exch Amt"],
                        data1["Exch Penalty"],
                        data1["Sub Total B"],
                        data1["GRAND TOTAL"],
                        data1["DOJ MONTH"],
                        data1["QUALIFIED YN"],
                    ]
                });
                Teams.forEach((group, index) => {
                    const { "DSE Members": dseMembers, ...data3 } = group;
                    array.push({
                        colors: 'FB7DEE8', array: [
                            `GH - ${index + 1}`,
                            data3["CODE"],
                            data3["NAME"],
                            data3["Retail"],
                            data3["No1"] ? data3["No1"] : 0,
                            data3["No1 Amt"] ? data3["No1 Amt"] : 0,
                            data3["No2"] ? data3["No2"] : 0,
                            data3["No2 Amt"] ? data3["No2 Amt"] : 0,
                            data3["No3"] ? data3["No3"] : 0,
                            data3["No3 Amt"] ? data3["No3 Amt"] : 0,
                            data3["No4"] ? data3["No4"] : 0,
                            data3["No4 Amt"] ? data3["No4 Amt"] : 0,
                            data3["No5"] ? data3["No5"] : 0,
                            data3["No5 Amt"] ? data3["No5 Amt"] : 0,
                            data3["No6"] ? data3["No6"] : 0,
                            data3["No6 Amt"] ? data3["No6 Amt"] : 0,
                            data3["No7"] ? data3["No7"] : 0,
                            data3["No7 Amt"] ? data3["No7 Amt"] : 0,
                            data3["No8"] ? data3["No8"] : 0,
                            data3["No8 Amt"] ? data3["No8 Amt"] : 0,
                            data3["No9"] ? data3["No9"] : 0,
                            data3["No9 Amt"] ? data3["No9 Amt"] : 0,
                            data3["No10"] ? data3["No10"] : 0,
                            data3["No10 Amt"] ? data3["No10 Amt"] : 0,
                            data3["No11"] ? data3["No11"] : 0,
                            data3["No11 Amt"] ? data3["No11 Amt"] : 0,
                            data3["Avg Retail Per DSE"],
                            data3["Incentive Rate TL"],
                            data3["Sub Total A"],
                            data3["QfModel"],
                            data3["RTO"],
                            data3["RTO Amt"],
                            data3["MI"],
                            data3["MI AMT"],
                            data3["EW"],
                            data3["EW AMT"],
                            data3["EW %"],
                            data3["Msr"],
                            data3["MSR AMT"],
                            data3["Mcp"],
                            data3["MCP AMT"],
                            data3["TV Exch VEH"],
                            data3["TV Exch Amt"],
                            data3["TV/EBR Exch VEH"],
                            data3["TV/EBR Exch Amt"],
                            data3["NTV Exch VEH"],
                            data3["NTV Exch Amt"],
                            data3["NTV/EBR Exch VEH"],
                            data3["NTV/EBR Exch Amt"],
                            data3["Exch Count"],
                            data3["Exch %"],
                            data3["Exch Amt"],
                            data3["Exch Penalty"],
                            data3["Sub Total B"],
                            data3["GRAND TOTAL"],
                            data3["DOJ MONTH"],
                            data3["QUALIFIED YN"],
                        ]
                    });


                    dseMembers.forEach((group, index) => {
                        array.push({
                            colors: 'FFFFFFFF', array: [
                                `${index + 1}`,
                                group["CODE"],
                                group["NAME"],
                                group["Retail"],
                                group["No1"] ? group["No1"] : 0,
                                group["No1 Amt"] ? group["No1 Amt"] : 0,
                                group["No2"] ? group["No2"] : 0,
                                group["No2 Amt"] ? group["No2 Amt"] : 0,
                                group["No3"] ? group["No3"] : 0,
                                group["No3 Amt"] ? group["No3 Amt"] : 0,
                                group["No4"] ? group["No4"] : 0,
                                group["No4 Amt"] ? group["No4 Amt"] : 0,
                                group["No5"] ? group["No5"] : 0,
                                group["No5 Amt"] ? group["No5 Amt"] : 0,
                                group["No6"] ? group["No6"] : 0,
                                group["No6 Amt"] ? group["No6 Amt"] : 0,
                                group["No7"] ? group["No7"] : 0,
                                group["No7 Amt"] ? group["No7 Amt"] : 0,
                                group["No8"] ? group["No8"] : 0,
                                group["No8 Amt"] ? group["No8 Amt"] : 0,
                                group["No9"] ? group["No9"] : 0,
                                group["No9 Amt"] ? group["No9 Amt"] : 0,
                                group["No10"] ? group["No10"] : 0,
                                group["No10 Amt"] ? group["No10 Amt"] : 0,
                                group["No11"] ? group["No11"] : 0,
                                group["No11 Amt"] ? group["No11 Amt"] : 0,
                                group["Avg Retail Per DSE"],
                                group["Incentive Rate TL"],
                                group["Sub Total A"],
                                group["QfModel"],
                                group["RTO"],
                                group["RTO Amt"],
                                group["MI"],
                                group["MI AMT"],
                                group["EW"],
                                group["EW AMT"],
                                group["EW %"],
                                group["Msr"],
                                group["MSR AMT"],
                                group["Mcp"],
                                group["MCP AMT"],
                                group["TV Exch VEH"],
                                group["TV Exch Amt"],
                                group["TV/EBR Exch VEH"],
                                group["TV/EBR Exch Amt"],
                                group["NTV Exch VEH"],
                                group["NTV Exch Amt"],
                                group["NTV/EBR Exch VEH"],
                                group["NTV/EBR Exch Amt"],
                                group["Exch Count"],
                                group["Exch %"],
                                group["Exch Amt"],
                                group["Exch Penalty"],
                                group["Sub Total B"],
                                group["GRAND TOTAL"],
                                group["DOJ MONTH"],
                                group["QUALIFIED YN"],
                            ]
                        });
                    });
                    array.push({ colors: 'FFFFFFFF', array: [] });

                });
            });

            // Return headers and rows
            return {
                header,
                array
            };
        }
        // const inputFilePath = path.join(__dirname, 'excelData.json');
        // const jsonString = await fs.readFileSync(inputFilePath, 'utf8');
        // const data = JSON.parse(jsonString);

        const data = await IcmReport(req.query);


        // const outputFilePath = path.join(__dirname, 'excelData.json');
        // fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
        const hierarchy = await createHierarchy(data);
        const separatedData = await separateByHeadCode(GHheads[0], hierarchy);
        const workbook1 = convert(separatedData);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Delivery_Sheet");
        const newReqHeader = [
            "SNo",
            "BKG DATE",
            "Customer Name",
            "Tehsil",
            "Mobile No",
            "P CNG",
            "Amt",
            "Variant",
            "Chassis",
            "Vehicle Price",
            "Finance Company",
            "Inhouse",
            "MSSF Id",
            "Loan Amt",
            "EW",
            "No Of EW",
            "INS DATE",
            "No Of MI",
            "MCP",
            "No Of MCP",
            "MSIL Discount",
            "Corporate",
            "Old veh Reg.",
            "Exchange Offer",
            "TV/NTV",
            "EBR/PHYSICAL",
            // "No Of Exchange",
            "RTO",
            "Regn No",
            "Auto Card",
            // "No Of Autocard",
            "CCP",
            "MSSF",
            'MGA',
            'Teflon',
            "DSE",
            "DSE Code",
            // "DSE DOJ",
            "DOJ MONTH",
            "Group",
            "Group Code",
            "GH",
            "GH Code",
            // "Month",
            "File No",
            "Delivery Date",
            "RIPS Date",
            "Qualifying Model",
            "Qualifying Model Code"

        ]
        const headerOrder = [
            'Sno',
            'BKG_DATE',
            'Customer_Name',
            'Tehsil',
            'Customer_Mobile',
            'P_CNG',
            'Amt',
            'Model_Variant',
            'Chassis_No',
            'ExShowroom_Price',
            'Hypothecation_By',
            'IN_House_Fin',
            'MSSF_Id',
            'Net_Loan_Amt_After_PF_Chrgs',
            'EW_Fin_Post',
            'Extended_Warranty',
            'Insurance_Date',
            'Insurance_Price',
            'MCP',
            'No Of MCP',
            'Consumer_Offer',
            'Corporate_Offer',
            'OldRegno_1',
            'Exchange_Offer',
            'TV_NTV',
            'IS_EBR',
            // 'Total_Discount',
            'RTO_Fin_Post',
            'Registration_No',
            'Nexa_Auto_Card',
            'CCP_Chrgs',
            'MSSF',
            'MGA',
            'Teflon',
            'DSE_Name',
            'DSE_EmpCode',
            'DOJ_MONTH',
            'TL_Name',
            'TL_EmpCode',
            'GH_Name',
            'GH_EMPCODE',
            'file_no',
            'Date_Of_Veh_Delivery',
            'RIPS_DATE',
            'FOCUS_MODEL',
            'FOCUS_MODEL_CODE',
        ];

        // Add headers to the first worksheet
        const headerRow = worksheet.addRow(newReqHeader);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF79FE00' }, // Bright green background color
            };
            cell.font = {
                bold: true,
                color: { argb: 'FF000000' }, // Black text color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });

        // Add rows to the first worksheet
        data.forEach((obj, index) => {
            const values = [index + 1,
            ...headerOrder.slice(1).map(header => obj[header] || null)
            ];
            worksheet.addRow(values);
        });
        // console.log(workbook);
        // Set the response headers for file download
        const worksheet2 = workbook.addWorksheet("insentive");

        const headerRow2 = worksheet2.addRow(workbook1.header);
        headerRow2.eachCell((cell, colNumber) => {

            cell.font = {
                bold: true,
                color: { argb: 'FF000000' }, // Black text color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
            if (colNumber == 29 || colNumber == 53) { // Column W is the 23rd column
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F6AA' } // Yellow background for column W
                };
            } else {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF79FE00' }, // Bright green background color
                };
            }
        });
        workbook1.array.forEach((obj, index) => {
            const row = worksheet2.addRow(obj.array);
            const lastColumnIndex = obj.array.length;
            const lastCellValue = obj.array[lastColumnIndex - 1];

            if (lastCellValue === 'No') {
                // Apply a dark background color to the remaining cells
                for (let i = 4; i < lastColumnIndex; i++) {
                    row.getCell(i + 1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }, // Dark background color (black)
                    };
                    row.getCell(i + 1).font = {
                        color: { argb: 'FF000000' }, // White text color
                    };
                }
            }
            // Apply colors to the first three cells based on obj.colors
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                if (colNumber == 1 || colNumber == 2 || colNumber == 3) {
                    row.getCell(colNumber).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: obj.colors },
                    };
                    row.getCell(colNumber).font = {
                        bold: true,
                        color: { argb: 'FF000000' }, // Black text color
                    };
                } else if (colNumber == 29 || colNumber == 53) { // Column W is the 23rd column
                    row.getCell(colNumber).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF5F6AA' } // Yellow background for column W
                    };
                }
            })

            // Check the last column's value

        });
        const minColumnWidth = 10; // Adjust as per your requirement
        worksheet.columns.forEach((column) => {
            let maxLength = 0;

            // Calculate the maximum content length in each column
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                if (rowNumber <= 50) { // Only consider the first 38 rows
                    const cellValue = cell.value ? cell.value.toString() : '';
                    maxLength = Math.max(maxLength, cellValue.length);
                } else {
                    return; // Break the loop after processing the first 38 rows
                }
            });

            // Apply the calculated width or the minimum width, whichever is greater
            column.width = Math.max(maxLength + 5, minColumnWidth);
        });
        worksheet2.columns.forEach((column, colNumber) => {
            let maxLength = 0;

            // Calculate the maximum content length in each column
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                const cellValue = cell.value ? cell.value.toString() : '';
                if (rowNumber <= 50) { // Only consider the first 38 rows
                    maxLength = Math.max(maxLength, cellValue.length);
                } else {
                    return; // Break the loop after processing the first 38 rows
                }
            });

            // Apply the calculated width or the minimum width, whichever is greater
            column.width = Math.max(maxLength + 2, minColumnWidth);
        });


        // Write the Excel file to the response

        // Output the hierarchy
        // console.log(hierarchy);
        if (!fs.existsSync(__dirname)) {
            fs.mkdirSync(__dirname);
        }

        // Define the output file path
        // const outputFilePath = path.join(__dirname, 'excelData.json');

        // Write the JSON data to a file
        // fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');

        const worksheet233 = workbook.getWorksheet(2);

        // Set the worksheet to be active when the workbook is opened
        worksheet233.views = [{ activeCell: 'A1' }];

        res.status(200).setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="Incentive_Report.xlsx"');

        return workbook.xlsx.write(res)
            .then(() => {
                res.end();
            }).catch((error) => {
                console.error("Error creating workbook:", error);
                res.status(500).send("Internal Server Error");
            });

    } catch (e) {
        console.log(e);
    }

}








//new car payout

exports.payoutMaster = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body.created_by)
    const t = await sequelize.transaction();
    try {
        const data = await sequelize.query(`DECLARE @cols AS NVARCHAR(MAX),
	@cols2 AS NVARCHAR(MAX),
        @query AS NVARCHAR(MAX);

        -- Step 1: Dynamically generate the list of Slab columns
        SELECT @cols = STRING_AGG(QUOTENAME(Misc_Code), ',')
        FROM Misc_Mst
        WHERE misc_type = 623 AND Export_Type < 3;
        SELECT @cols2 = STRING_AGG(QUOTENAME(Misc_Code) + ' as [>= ' + Misc_Add1 + '%]', ',')
        FROM Misc_Mst
        WHERE misc_type = 623 AND Export_Type < 3 and misc_add2 = ${req.body.Mnth} and misc_dtl1 = ${req.body.Yr};

        --SELECT @cols2;  -- To verify the output


        -- Step 2: Construct the dynamic SQL pivot query with proper handling of joins and CTE
        SET @query = '
        WITH ModelFuelType AS (
            SELECT DISTINCT 
                MODEL_CD, 

                fuel_type
            FROM (
                SELECT 
                    model_cd,
                    VARIANT_CD,
                    MAX(GE7) AS fuel_type
                FROM 
                    GD_FDI_TRANS 
                WHERE 
                    TRANS_TYPE = ''VS''
                GROUP BY  
                    model_cd, 
                    VARIANT_CD
            ) AS ab
        )
        , SourceTable AS (
            SELECT 
                mft.Model_Cd, 
                mft.Fuel_Type, 
                mm.Misc_Name,
                sp.Slab, 
                sp.Price,
                sp.target
            FROM 
                ModelFuelType mft
            LEFT JOIN 
                MISC_MST mm on mft.Model_Cd = mm.Misc_Abbr and mm.misc_type = 15
            LEFT JOIN 
                Maruti_Payout_scheme sp
            ON 
                mft.Model_Cd = sp.Model_Cd 
                AND mft.Fuel_Type = sp.Fuel_Type and sp.export_type < 3 and sp.Mnth = ${req.body.Mnth} and yr=${req.body.Yr}
        )
        SELECT 
            1 as UTD,
            Target,
            Model_Cd as [Model Code],
            Misc_Name as [Model Name], 
            Fuel_Type as [Fuel Type], 
            ' + @cols2 + '
        FROM 
            SourceTable
        PIVOT
        (
            MAX(Price)
            FOR Slab IN (' + @cols + ')
        ) AS PivotTable
        ORDER BY 
            Model_Cd, 
            Fuel_Type;';

        -- Step 3: Execute the dynamic query
        EXEC sp_executesql @query;

        `);
        const misc_mst = await sequelize.query(`DECLARE @cols AS NVARCHAR(MAX)
            
        SELECT @cols = STRING_AGG(CONCAT('"', '>= ', Misc_Add1, '%"', ': ', Misc_Code), ', ')
        FROM Misc_Mst
        WHERE misc_type = 623 AND Export_Type < 3 and misc_add2 = ${req.body.Mnth} and misc_dtl1 = ${req.body.Yr};



        SELECT concat('{',@cols ,'}')as abcd `)
        console.log(misc_mst[0][0].abcd)
        t.commit();
        await sequelize.close();
        res.status(200).send({ data: data[0], data2: JSON.parse(misc_mst[0][0].abcd) })
    } catch (error) {
        t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};
exports.SavePayoutMaster = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body)
    const t = await sequelize.transaction();
    try {
        await sequelize.query(`update Maruti_Payout_Scheme set export_type = 33 where Mnth = ${req.body.Mnth} and yr=${req.body.Yr}`, {
            transaction: t
        });
        const MarutiPayoutScheme = _MarutiPayoutScheme(sequelize, DataTypes);
        await MarutiPayoutScheme.bulkCreate(req.body.Array, {
            transaction: t
        });
        t.commit();
        await sequelize.close();
        res.status(200).send({})
    } catch (error) {
        t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};


exports.MarutiPayout = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const region = data.region;
    const location = data.location;
    const department = data.department;
    const Mnth = data.Mnth;
    const Yr = data.Yr;
    console.log(req.query, "body");
    // const result = getLaterMonthYear(dateFrom, dateto);
    var query;

    query = `select empcode from employeemaster where export_type<3 `;

    if (region) query += ` and sal_region in (${region}) `;
    if (location) query += `and location in (select misc_code from misc_mst where misc_type = 85 and misc_hod in (${location})) `;
    if (department) query += `and section in (${department}) `;

    try {
        let reportName = "Wholesale Incentive Report";
        const txnDetails = await sequelize.query(
            `DECLARE @count INT;
        DECLARE @deive INT;

        -- Get the target value
        SELECT @deive = [target]
        FROM Maruti_Payout_Scheme
        WHERE Mnth = ${Mnth} and yr = ${Yr}
            AND [target] IS NOT NULL
            AND export_type = 1;

        -- Count of transactions
        SELECT @count = COUNT(*)
        FROM GD_FDI_TRANS
        WHERE TRANS_TYPE = 'VP'
            AND MONTH(TRANS_DATE) = ${Mnth}
            AND YEAR(TRANS_DATE) = ${Yr};

        -- Step 1: Get the maximum Misc_Add1 value that meets your conditions
        WITH MaxMiscAdd1 AS (
            SELECT MAX(CAST(Misc_Add1 AS INT)) AS Max_Misc_Add1
            FROM Maruti_Payout_Scheme mps
            JOIN Misc_Mst ON Slab = Misc_Code
                AND Misc_Type = 623
                AND Misc_Mst.Export_Type = 1
            WHERE mps.Mnth = ${Mnth} and mps.yr = ${Yr}
                AND mps.export_type = 1
                AND CAST(Misc_Add1 AS INT) <= @count * 100 / @deive
        ),

        -- Step 2: Retrieve the main records with the maximum Misc_Add1
        FilteredData AS (
            SELECT mps.*, Misc_Mst.Misc_Add1
            FROM Maruti_Payout_Scheme mps
            JOIN Misc_Mst ON Slab = Misc_Code
                AND Misc_Type = 623
                AND Misc_Mst.Export_Type = 1
            JOIN MaxMiscAdd1 ON CAST(Misc_Mst.Misc_Add1 AS INT) = MaxMiscAdd1.Max_Misc_Add1
            WHERE mps.Mnth = ${Mnth} and mps.yr = ${Yr}
                AND mps.export_type = 1
                AND CAST(Misc_Mst.Misc_Add1 AS INT) <= @count * 100 / @deive
        )
            SELECT 
                VP.MODEL_CD,
                (select top 1 Misc_Name from Misc_Mst where Misc_Abbr = VP.MODEL_CD and Misc_Type  = 15 and export_type < 3)  Model_Name,
                VP.VARIANT_CD,
                VS.fuel_type,
                VP.VIN,
                FORMAT(CAST (VP.Trans_Date as date), 'dd-MMM-yyyy') as [Purchase Date],
                FD.price,
                fd.Mnth,
                fd.yr
                --sum(fd.price)
            FROM GD_FDI_TRANS VP
            LEFT JOIN (
                SELECT 
                    model_cd,
                    VARIANT_CD,
                    MAX(GE7) AS fuel_type
                FROM GD_FDI_TRANS
                WHERE TRANS_TYPE = 'VS'
                GROUP BY model_cd, VARIANT_CD
            ) AS VS ON VP.MODEL_CD = VS.MODEL_CD AND VP.VARIANT_CD = VS.VARIANT_CD
            left join FilteredData  FD ON FD.model_cd = vp.MODEL_CD and FD.Fuel_Type = vs.fuel_type
            WHERE VP.trans_type = 'VP'
                AND MONTH(VP.TRANS_DATE) = ${Mnth}
                AND YEAR(VP.TRANS_DATE) = ${Yr}
                `
        );
        const data = await sequelize.query(`DECLARE @cols AS NVARCHAR(MAX),
                @cols2 AS NVARCHAR(MAX),
                    @query AS NVARCHAR(MAX);
            
            -- Step 1: Dynamically generate the list of Slab columns
            SELECT @cols = STRING_AGG(QUOTENAME(Misc_Code), ',')
            FROM Misc_Mst
            WHERE misc_type = 623 AND Export_Type < 3;
            SELECT @cols2 = STRING_AGG(QUOTENAME(Misc_Code) + ' as [>= ' + Misc_Add1 + '%]', ',')
            FROM Misc_Mst
            WHERE misc_type = 623 AND Export_Type < 3 and misc_add2 = ${Mnth} and misc_dtl1 = ${Yr};
            
            --SELECT @cols2;  -- To verify the output
            
            
            -- Step 2: Construct the dynamic SQL pivot query with proper handling of joins and CTE
            SET @query = '
            WITH ModelFuelType AS (
                SELECT DISTINCT 
                    MODEL_CD, 
            
                    fuel_type
                FROM (
                    SELECT 
                        model_cd,
                        VARIANT_CD,
                        MAX(GE7) AS fuel_type
                    FROM 
                        GD_FDI_TRANS 
                    WHERE 
                        TRANS_TYPE = ''VS''
                    GROUP BY  
                        model_cd, 
                        VARIANT_CD
                ) AS ab
            )
            , SourceTable AS (
                SELECT 
                    mft.Model_Cd, 
                    mft.Fuel_Type, 
                    mm.Misc_Name,
                    sp.Slab, 
                    sp.Price,
                    sp.target
                FROM 
                    ModelFuelType mft
                LEFT JOIN 
                    MISC_MST mm on mft.Model_Cd = mm.Misc_Abbr and mm.misc_type = 15
                LEFT JOIN 
                    Maruti_Payout_scheme sp
                ON 
                    mft.Model_Cd = sp.Model_Cd 
                    AND mft.Fuel_Type = sp.Fuel_Type and sp.export_type < 3 and sp.Mnth = ${Mnth} and yr=${Yr}
            )
            SELECT 
                Model_Cd as [Model Code],
                Misc_Name as [Model Name], 
                Fuel_Type as [Fuel Type], 
                ' + @cols2 + '
            FROM 
                SourceTable
            PIVOT
            (
                MAX(Price)
                FOR Slab IN (' + @cols + ')
            ) AS PivotTable
            ORDER BY 
                Model_Cd, 
                Fuel_Type;';
            
            -- Step 3: Execute the dynamic query
            EXEC sp_executesql @query;
            
            `);
        const data2 = await sequelize.query(
            `DECLARE @count INT;
        DECLARE @deive INT;

        -- Get the target value
        SELECT @deive = [target]
        FROM Maruti_Payout_Scheme
        WHERE Mnth = ${Mnth} and Yr=${Yr}
            AND [target] IS NOT NULL
            AND export_type = 1;

        -- Count of transactions
        SELECT @count = COUNT(*)
        FROM GD_FDI_TRANS
        WHERE TRANS_TYPE = 'VP'
            AND MONTH(TRANS_DATE) = ${Mnth}
            AND YEAR(TRANS_DATE) = ${Yr};


        -- Step 1: Get the maximum Misc_Add1 value that meets your conditions
        WITH MaxMiscAdd1 AS (
            SELECT MAX(CAST(Misc_Add1 AS INT)) AS Max_Misc_Add1
            FROM Maruti_Payout_Scheme mps
            JOIN Misc_Mst ON Slab = Misc_Code
                AND Misc_Type = 623
                AND Misc_Mst.Export_Type = 1
            WHERE mps.Mnth = ${Mnth} and mps.yr=${Yr}
                AND mps.export_type = 1
                AND CAST(Misc_Add1 AS INT) <= @count * 100 / @deive
        ),

        -- Step 2: Retrieve the main records with the maximum Misc_Add1
        FilteredData AS (
            SELECT mps.*, Misc_Mst.Misc_Add1
            FROM Maruti_Payout_Scheme mps
            JOIN Misc_Mst ON Slab = Misc_Code
                AND Misc_Type = 623
                AND Misc_Mst.Export_Type = 1
            JOIN MaxMiscAdd1 ON CAST(Misc_Mst.Misc_Add1 AS INT) = MaxMiscAdd1.Max_Misc_Add1
            WHERE mps.Mnth = ${Mnth} and mps.yr=${Yr}
                AND mps.export_type = 1
                AND CAST(Misc_Mst.Misc_Add1 AS INT) <= @count * 100 / @deive
        )

    SELECT 
        VP.MODEL_CD,
        VS.fuel_type,
		MST.Misc_Name,
		FD.price,
		COunt(*) as [count],
		SUM(FD.price) as Payout
		--sum(fd.price)
    FROM GD_FDI_TRANS VP
    LEFT JOIN (
        SELECT 
            model_cd,
            VARIANT_CD,
            MAX(GE7) AS fuel_type
        FROM GD_FDI_TRANS
        WHERE TRANS_TYPE = 'VS'
        GROUP BY model_cd, VARIANT_CD
    ) AS VS ON VP.MODEL_CD = VS.MODEL_CD AND VP.VARIANT_CD = VS.VARIANT_CD
	left join FilteredData  FD ON FD.model_cd = vp.MODEL_CD and FD.Fuel_Type = vs.fuel_type
	left join Misc_Mst  MST ON VS.model_cd = MST.Misc_Abbr and Misc_Type = 15
    WHERE VP.trans_type = 'VP'
        AND MONTH(VP.TRANS_DATE) = ${Mnth}
        AND YEAR(VP.TRANS_DATE) = ${Yr}
	group by vp.MODEL_CD,VS.fuel_type,FD.price,MST.Misc_Name;
		`
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
        worksheet.mergeCells("K2:L2");
        worksheet.mergeCells("R2:S2");
        worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
        worksheet.getCell("K2").value = `Wholsale Incentive`; // Replace with your company name
        worksheet.getCell("R2").value = `Wholsale Incentive Policy`; // Replace with your company name
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
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });
        txnDetails[0]?.forEach((obj) => {
            const values = Object.values(obj);
            worksheet.addRow(values);
        });
        const data2Headers = Object.keys(data2[0][0]); // Assume data2 is an array of objects
        const startingRow = 3; // Starting row number for new data (K3 means row 3)
        const startingCol = 11; // Column K is the 11th column

        // Add headers for the second set of data
        data2Headers.forEach((header, index) => {
            const cell = worksheet.getCell(3, startingCol + index); // Start at row 3, column K
            cell.value = header;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White font color
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" }, // Blue background color (or any other)
            };
            cell.alignment = {
                vertical: "middle",
                horizontal: "center",
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });

        // Add data rows for the second dataset
        data2[0].forEach((obj, rowIndex) => {
            const values = Object.values(obj);
            values.forEach((value, colIndex) => {
                const cell = worksheet.getCell(startingRow + rowIndex + 1, startingCol + colIndex); // +1 to adjust for headers
                cell.value = value;
            });
        });
        const data3Headers = Object.keys(data[0][0]); // Assume data2 is an array of objects
        const startingRow2 = 3; // Starting row number for new data (K3 means row 3)
        const startingCol2 = 18; // Column K is the 11th column

        // Add headers for the second set of data
        data3Headers.forEach((header, index) => {
            const cell = worksheet.getCell(3, startingCol2 + index); // Start at row 3, column K
            cell.value = header;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White font color
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" }, // Blue background color (or any other)
            };
            cell.alignment = {
                vertical: "middle",
                horizontal: "center",
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });

        // Add data rows for the second dataset
        data[0].forEach((obj, rowIndex) => {
            const values = Object.values(obj);
            values.forEach((value, colIndex) => {
                const cell = worksheet.getCell(startingRow2 + rowIndex + 1, startingCol2 + colIndex); // +1 to adjust for headers
                cell.value = value;
            });
        });
        const heightarray = [11, 12, 11, 11, 17, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12, 18, 11, 11, 11];
        worksheet.columns.forEach((column, index) => {
            column.width = heightarray[index];
        });
        res.status(200)
            .setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="MarutiPayout.xlsx"'
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
            'attachment; filename="MarutiPayout_NoDataAvailable.xlsx"'
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

