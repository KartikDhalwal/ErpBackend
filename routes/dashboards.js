const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { _RtoDetails, rtoDetailsSchema } = require("../models/RtoDetails");
const { RtoImportSchema, _RTO_IMPORT } = require("../models/RtoImport");
const { _DispatchDump, dispatchDumpSchema } = require("../models/DispatchDump");
const { _DashboardMaster, dashboardMasterSchema } = require("../models/Dashboard_Master");


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
exports.SalesData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesString = req.body.branch;
    const branchesArray = branchesString;
    // console.log(branchesArray, "branchesArray");
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);

    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    // switch (parseInt(req.body.chartdatafor)) {
    //   case 1:
    const query1 = `SELECT
            SUM(CASE WHEN c.tran_type = 0 THEN 1 ELSE 0 END) +
            SUM(CASE WHEN c.tran_type = 1 THEN 1 ELSE 0 END) -
            SUM(CASE WHEN c.tran_type = 2 THEN 1 ELSE 0 END) -
            SUM(CASE WHEN c.tran_type = 3 THEN 1 ELSE 0 END) +
            SUM(CASE WHEN c.tran_type = 4 THEN 1 ELSE 0 END) +
            SUM(CASE WHEN c.tran_type = 5 THEN 1 ELSE 0 END) -
            SUM(CASE WHEN c.tran_type = 6 THEN 1 ELSE 0 END) AS chart_data,
            g.godw_name as loc_code
        FROM chas_tran c
        JOIN godown_mst g ON g.godw_code = c.loc_code
        WHERE c.loc_code IN (${branchesArray})
            AND c.tran_date < '${dates.start}'
            AND c.item_type = 2
            AND c.Export_Type < 5 and g.export_type < 3
        GROUP BY g.godw_name;`;
    //   break;
    // case 2:
    const query2 = `SELECT COALESCE(SUM(CASE WHEN tran_type = 2 THEN 1 ELSE 0 END) - SUM(CASE WHEN tran_type = 4 THEN 1 ELSE 0 END), 0) AS chart_data, g.godw_name as loc_code FROM GODOWN_MST g LEFT JOIN chas_tran c ON c.loc_code = g.godw_code AND item_type = 2 AND c.Export_Type < 5 and c.tran_date between'${dates.start}' and '${dates.end}' WHERE
            g.godw_code in (${branchesArray}) and g.export_type < 3 GROUP BY g.godw_name ORDER BY g.godw_name `;
    //   break;
    // case 3:
    const query3 = `SELECT
            g.godw_name AS loc_code,
            c.chart_data
         FROM godown_mst g
         JOIN (
            SELECT
                loc_code,
                SUM(CASE WHEN tran_type = 1 THEN 1 ELSE 0 END) -
                SUM(CASE WHEN tran_type = 3 THEN 1 ELSE 0 END) AS chart_data
            FROM chas_tran
            WHERE loc_code IN (${branchesArray}) 
                AND tran_date BETWEEN '${dates.start}' AND '${dates.end}' 
                AND Export_Type < 5 
                AND item_type = 2
            GROUP BY loc_code
         ) c ON g.godw_code = c.loc_code where g.export_type < 3 order by  g.godw_name;`;
    //   break;
    // case 4:
    const query4 = `SELECT
            SUM(CASE WHEN c.tran_type = 0 THEN 1 ELSE 0 END) +
            SUM(CASE WHEN c.tran_type = 1 THEN 1 ELSE 0 END) -
            SUM(CASE WHEN c.tran_type = 2 THEN 1 ELSE 0 END) -
            SUM(CASE WHEN c.tran_type = 3 THEN 1 ELSE 0 END) +
            SUM(CASE WHEN c.tran_type = 4 THEN 1 ELSE 0 END) +
            SUM(CASE WHEN c.tran_type = 5 THEN 1 ELSE 0 END) -
            SUM(CASE WHEN c.tran_type = 6 THEN 1 ELSE 0 END) AS chart_data,
            g.godw_name as loc_code
        FROM chas_tran c
        JOIN godown_mst g ON g.godw_code = c.loc_code
        WHERE c.loc_code IN (${branchesArray})
            AND c.tran_date < '${dates.end}'
            AND c.item_type = 2
            AND c.Export_Type < 5 and g.export_type < 3
        GROUP BY g.godw_name  order by  g.godw_name;`;
    //   break;
    // case 5:
    const query5 = `SELECT g.godw_name AS loc_code, c.chart_data FROM godown_mst g JOIN (SELECT loc_code, SUM(CASE WHEN tran_type = 5 THEN 1 ELSE 0 END) AS chart_data FROM chas_tran WHERE loc_code IN (${branchesArray}) AND tran_date BETWEEN '${dates.start}' AND '${dates.end}' AND Export_Type < 5 AND item_type = 2 GROUP BY loc_code) c ON g.godw_code = c.loc_code where g.export_type <3  order by  g.godw_name;`;
    //   break;
    // case 6:
    const query6 = `SELECT g.godw_name AS loc_code, c.chart_data FROM godown_mst g JOIN (SELECT loc_code, SUM(CASE WHEN tran_type = 6 THEN 1 ELSE 0 END) AS chart_data FROM chas_tran WHERE loc_code IN (${branchesArray}) AND tran_date BETWEEN '${dates.start}' AND '${dates.end}' AND Export_Type < 5 AND item_type = 2 GROUP BY loc_code) c ON g.godw_code = c.loc_code where g.export_type <3  order by  g.godw_name;`;
    //   break;
    // case 7:
    const query7 = `
            select sum(totl_disc)/count(*) as chart_data , g.godw_name as loc_code,count(*) as qty
                    from icm_mst JOIN godown_mst g ON icm_mst.loc_code = g.godw_code where icm_mst.loc_code in (${branchesArray}) and inv_date between'${dates.start}' and '${dates.end}'   and icm_mst.Export_Type<5 and g.export_type < 3 group by g.godw_name order by g.godw_name `;
    //   break;
    // case 8:
    const query8 = `SELECT AVG(ins_pric) AS chart_data ,loc_code,count(*) as qty FROM (
              SELECT DISTINCT dtl.tran_id, Ins_Pric, RTO_Pric, MGA_Pric ,g.godw_name as loc_code    
              FROM ICM_DTL dtl
              JOIN icm_mst mst ON mst.tran_id = dtl.tran_id
              JOIN godown_mst g ON mst.loc_code = g.godw_code where g.export_type < 3
              ) AS Distinct_ICM_DTL where 
              tran_id IN ( SELECT  tran_id    
              FROM icm_mst where loc_code in (${branchesArray}) and inv_date between'${dates.start}' and '${dates.end}'    and Export_Type<5)
              group  by loc_code order by loc_code`;

    //   break;
    // case 9:
    const query9 = `SELECT AVG(MGA_Pric) AS chart_data ,loc_code,count(*) as qty FROM (
              SELECT DISTINCT dtl.tran_id, Ins_Pric, RTO_Pric, MGA_Pric ,g.godw_name as loc_code    
              FROM ICM_DTL dtl
              JOIN icm_mst mst ON mst.tran_id = dtl.tran_id
              JOIN godown_mst g ON mst.loc_code = g.godw_code where g.export_type < 3
              ) AS Distinct_ICM_DTL where 
              tran_id IN ( SELECT  tran_id    
              FROM icm_mst where loc_code in (${branchesArray}) and inv_date between'${dates.start}' and '${dates.end}'    and Export_Type<5)
              group  by loc_code order by loc_code`;
    //   break;
    // case 10:
    const query10 = `SELECT AVG(RTO_Pric) AS chart_data ,loc_code,count(*) as qty FROM (
              SELECT DISTINCT dtl.tran_id, Ins_Pric, RTO_Pric, MGA_Pric ,g.godw_name as loc_code    
              FROM ICM_DTL dtl
              JOIN icm_mst mst ON mst.tran_id = dtl.tran_id
              JOIN godown_mst g ON mst.loc_code = g.godw_code WHERE g.export_type < 3
              ) AS Distinct_ICM_DTL where 
              tran_id IN ( SELECT  tran_id    
              FROM icm_mst where loc_code in (${branchesArray}) and inv_date between'${dates.start}' and '${dates.end}'    and Export_Type<5)
              group  by loc_code order by loc_code`;
    //   break;
    // case 11:
    const query11 = `SELECT SUM(nonDelivered) AS chart_data , loc_code
            FROM (
                SELECT COUNT(*) AS nonDelivered , g.godw_name as loc_code
                FROM icm_mst
            join godown_mst g on ICM_MST.loc_code = g.godw_code
                WHERE loc_code IN  (${branchesArray})
                    AND ( inv_date  <= '${dates.end}' AND icm_mst.Export_Type < 5)     
                    and (delv_date IS NULL) AND g.export_type < 3 group by g.godw_name
              UNION ALL
                SELECT COUNT(*) , g.godw_name as loc_code
                FROM (
                    SELECT DISTINCT *    
                    FROM NEWCAR_Sale_Register
                    WHERE
                        inv_dt <= '${dates.end}'
                        AND icm_id IS NULL  AND inv_no LIKE '%VSL%'
                        AND Location_Code 
        IN (SELECT NEWCAR_RCPT COLLATE Latin1_General_CI_AI FROM godown_mst WHERE godw_code IN  (${branchesArray}) and export_type < 3)  
        ) AS distinct_rows  join GODOWN_MST g on g.NEWCAR_RCPT = distinct_rows.Location_Code COLLATE Latin1_General_CI_AI where g.export_type < 3 group by g.godw_name ) AS subquery group by loc_code;`;

    //   break;
    // case 12:
    const query12 = `SELECT g.godw_name AS loc_code, c.chart_data FROM godown_mst g JOIN (SELECT loc_code, COUNT(*) AS chart_data FROM icm_mst WHERE loc_code IN (${branchesArray}) AND delv_date BETWEEN '${dates.start}' AND '${dates.end}' AND Export_Type < 5 AND inv_date >= '${dates.start}' GROUP BY loc_code) c ON g.godw_code = c.loc_code where g.export_type < 3 order by g.godw_name;`;
    //   break;
    // case 13:
    const query13 = `	WITH SubgroupHierarchy AS (
              SELECT group_code
              FROM grup_mst
              WHERE 14 IN (sub_group, Group_Code)
                AND group_code NOT IN (
                  SELECT group_code
                  FROM grup_mst
                  WHERE 38 IN (sub_group, Group_Code)
                )
              UNION ALL
              SELECT g.group_code        
              FROM grup_mst g
              INNER JOIN SubgroupHierarchy s ON g.sub_group = s.group_code
              WHERE g.group_code NOT IN (
                SELECT group_code
                FROM grup_mst
                WHERE 38 IN (sub_group, Group_Code)
              )
            )
            SELECT SUM(IIF(amt_drcr = 1, 
         post_amt * -1, post_amt)) as chart_data , g.godw_name as loc_code
            FROM acnt_post a
          join godown_mst g on g.godw_code = a.loc_code
            WHERE a.export_type < 5        
            and a.loc_code in (${branchesArray}) and g.export_type < 3
              AND a.ledg_ac IN (SELECT ledg_code FROM ledg_mst WHERE group_code IN (SELECT group_code FROM SubgroupHierarchy))
              and a.acnt_date between '${dates.start}' and '${dates.end}' group by g.godw_name order by g.godw_name `;
    //   break;
    // case 14:
    const query14 = `WITH SubgroupHierarchy AS (
              SELECT group_code
            FROM grup_mst
            WHERE 13 IN (sub_group, Group_Code)
              UNION ALL
              SELECT g.group_code        
              FROM grup_mst g
              INNER JOIN SubgroupHierarchy s ON g.sub_group = s.group_code    )
            SELECT SUM(IIF(amt_drcr = 1, 
        post_amt, post_amt * -1)) as chart_data , g.godw_name as loc_code
            FROM acnt_post a
          join godown_mst g on g.godw_code = a.loc_code
            WHERE a.export_type < 5        
            and a.loc_code in (${branchesArray}) and g.export_type <3
              AND a.ledg_ac IN (SELECT ledg_code FROM ledg_mst WHERE group_code IN (SELECT group_code FROM SubgroupHierarchy))
              and a.acnt_date between '${dates.start}' and '${dates.end}' group by g.godw_name order by g.godw_name`;
    //     break;
    //   default:
    //     query = ``;
    //     break;
    // }
    const data1 = await sequelize.query(query1);
    const data2 = await sequelize.query(query2);
    const data3 = await sequelize.query(query3);
    const data4 = await sequelize.query(query4);
    const data5 = await sequelize.query(query5);
    const data6 = await sequelize.query(query6);
    const data7 = await sequelize.query(query7);
    const data8 = await sequelize.query(query8);
    const data9 = await sequelize.query(query9);
    const data10 = await sequelize.query(query10);
    const data11 = await sequelize.query(query11);
    const data12 = await sequelize.query(query12);
    const data13 = await sequelize.query(query13);
    const data14 = await sequelize.query(query14);

    res.send({
      data1: data1[0],
      data2: data2[0],
      data3: data3[0],
      data4: data4[0],
      data5: data5[0],
      data6: data6[0],
      data7: data7[0],
      data8: data8[0],
      data9: data9[0],
      data10: data10[0],
      data11: data11[0],
      data12: data12[0],
      data13: data13[0],
      data14: data14[0],
    });
  } catch (e) {
    console.log(e);
    res.send({
      error: e,
    });
  } finally {
    await sequelize.close();
  }
};
exports.SalesData2 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    console.log(branchesArray);
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);
    const month = 4;
    const currentDate = new Date();

    const dates = calculateDates(year, monthStart, monthEnd, month);
    console.log(branchesArray.length, "branchesArray.length");
    if (branchesArray) {
      const data2 = await sequelize.query(`
            select sum(case when tran_type=0 then 1 else 0 end) 
           + sum(case when tran_type=1 then 1 else 0 end) 
           - sum(case when tran_type=2 then 1 else 0 end) 
           - sum(case when tran_type=3 then 1 else 0 end) 
           + sum(case when tran_type=4 then 1 else 0 end) 
           + sum(case when tran_type=5 then 1 else 0 end) 
           - sum(case when tran_type=6 then 1 else 0 end) as closingStock
            from chas_tran where loc_code in (${branchesArray}) and tran_date <= '${dates.end}' and item_type = 2 and Export_Type<5`);
      const data3 = await sequelize.query(`
            select sum(case when tran_type=0 then 1 else 0 end) 
           + sum(case when tran_type=1 then 1 else 0 end) 
           - sum(case when tran_type=2 then 1 else 0 end) 
           - sum(case when tran_type=3 then 1 else 0 end) 
           + sum(case when tran_type=4 then 1 else 0 end) 
           + sum(case when tran_type=5 then 1 else 0 end) 
           - sum(case when tran_type=6 then 1 else 0 end) as openingStock
            from chas_tran where loc_code in (${branchesArray}) and tran_date < '${dates.start}' and item_type = 2 and Export_Type<5`);

      const data = await sequelize.query(`select
             SUM(CASE WHEN tran_type = 2 THEN 1 ELSE 0 END) 
           - SUM(CASE WHEN tran_type = 4 THEN 1 ELSE 0 END) AS netSale ,
             SUM(CASE WHEN tran_type = 1 THEN 1 ELSE 0 END) 
           - SUM(CASE WHEN tran_type = 3 THEN 1 ELSE 0 END) AS netPurchase,
             SUM(CASE WHEN tran_type = 5 THEN 1 ELSE 0 END) AS tran_in, 
             SUM(CASE WHEN tran_type = 6 THEN 1 ELSE 0 END) AS tran_out
            from chas_tran where loc_code in (${branchesArray}) and tran_date between'${dates.start}' and '${dates.end}' and item_type = 2 and Export_Type<5`);

      const data4 = await sequelize.query(`select count(*) as delivered
             from icm_mst where loc_code in (${branchesArray}) and delv_date between'${dates.start}' and '${dates.end}' and Export_Type<5 and inv_date >= '${dates.start}'`);

      const data5 =
        await sequelize.query(` SELECT SUM(nonDelivered) AS nonDelivered
            FROM (
                SELECT COUNT(*) AS nonDelivered
                FROM icm_mst
                WHERE loc_code IN (${branchesArray})
                    AND ( inv_date  <='${dates.end}' COLLATE Latin1_General_CI_AI AND Export_Type < 5)
                    and (delv_date IS NULL)-- OR delv_date > '${dates.end}')
                UNION ALL
                SELECT COUNT(*)
                FROM (
                    SELECT DISTINCT *
                    FROM NEWCAR_Sale_Register
                    WHERE
                        inv_dt <= '${dates.end}'
                        AND icm_id IS NULL
                        AND inv_no LIKE '%VSL%'
                        AND Location_Code IN (SELECT NEWCAR_RCPT COLLATE Latin1_General_CI_AI FROM godown_mst where export_type < 3 and godw_code IN (${branchesArray})
                )) AS distinct_rows ) AS subquery;`);

      const data6 = await sequelize.query(`select 
          CONVERT(MONEY, CAST(AVG(Totl_Disc) AS DECIMAL(12, 2))) AS discount
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub
          where export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' and Totl_Disc>0 `);

      const data7 = await sequelize.query(`SELECT
             AVG(Ins_Pric) AS insurance,
             AVG(RTO_Pric) AS registration,
             AVG(MGA_Pric) AS accessories
         FROM
             (
                 SELECT DISTINCT tran_id, Ins_Pric, RTO_Pric, MGA_Pric
                 FROM ICM_DTL
             ) AS Distinct_ICM_DTL where  tran_id IN (
              SELECT DISTINCT tran_id
              FROM icm_mst where loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}'   and Export_Type<5) `);

      const data9 = await sequelize.query(`WITH SubgroupHierarchy AS (
        SELECT group_code
      FROM grup_mst
      WHERE 13 IN (sub_group, Group_Code)
        UNION ALL
        SELECT g.group_code
        FROM grup_mst g
        INNER JOIN SubgroupHierarchy s ON g.sub_group = s.group_code
      )
      SELECT SUM(IIF(amt_drcr = 1, post_amt, post_amt * -1)) as expenses
      FROM acnt_post
      WHERE export_type < 5
      and loc_code in (${branchesArray})
        AND ledg_ac IN (SELECT ledg_code FROM ledg_mst WHERE group_code IN (SELECT group_code FROM SubgroupHierarchy))
        and acnt_date between '${dates.start}' and '${dates.end}'`);

      const data8 = await sequelize.query(`	WITH SubgroupHierarchy AS (
          SELECT group_code
          FROM grup_mst
          WHERE 14 IN (sub_group, Group_Code)
            AND group_code NOT IN (
              SELECT group_code
              FROM grup_mst
              WHERE 38 IN (sub_group, Group_Code)
            )
          UNION ALL
          SELECT g.group_code        
          FROM grup_mst g
          INNER JOIN SubgroupHierarchy s ON g.sub_group = s.group_code
          WHERE g.group_code NOT IN (
            SELECT group_code
            FROM grup_mst
            WHERE 38 IN (sub_group, Group_Code)
          )
        )
        SELECT SUM(IIF(amt_drcr = 1, post_amt*-1, post_amt )) as income
        FROM acnt_post
        WHERE export_type < 5
        and loc_code in (${branchesArray})
          AND ledg_ac IN (SELECT ledg_code FROM ledg_mst WHERE group_code IN (SELECT group_code FROM SubgroupHierarchy))
          and acnt_date between '${dates.start}' and '${dates.end}'`);

      res.send({
        data: data[0],
        data2: data2[0],
        data3: data3[0],
        data4: data4[0],
        data5: data5[0],
        data6: data6[0],
        data7: data7[0],
        data8: data8[0],
        data9: data9[0],
      });
      return;
    }
    res.send({ data: "yes" });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.discountDashBoard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);
    const dates = calculateDates(year, monthStart, monthEnd, 4);
    const query = `select 
    CONVERT(MONEY, CAST(SUM(Cons_Disc + Exch_Disc + Corp_Disc + Adnl_Disc) AS DECIMAL(12, 2))) AS total_discount,
    CONVERT(MONEY, CAST(SUM(msil_disc) AS DECIMAL(12, 2))) AS total_add_disc,
    CONVERT(MONEY, CAST(SUM(Cons_Disc-msil_disc) AS DECIMAL(12, 2))) AS cons_disc,
    CONVERT(MONEY, CAST(SUM(Exch_Disc) AS DECIMAL(12, 2))) AS exch_disc,
    CONVERT(MONEY, CAST(SUM(corp_disc) AS DECIMAL(12, 2))) AS corp_disc,
    CONVERT(MONEY, CAST(SUM(Adnl_Disc) AS DECIMAL(12, 2))) AS adnl_disc,
    CONVERT(MONEY, CAST(AVG(Totl_Disc) AS DECIMAL(12, 2))) AS avg_total_disc,
  CONVERT(MONEY,CAST(AVG(msil_disc) AS DECIMAL(12, 2))) AS avg_add_disc,
  CONVERT(MONEY,CAST(AVG(Cons_Disc-msil_disc) AS DECIMAL(12, 2))) AS avg_cons_disc,
  CONVERT(MONEY,CAST(AVG(Exch_Disc) AS DECIMAL(12, 2))) AS avg_exch_disc,
  CONVERT(MONEY,CAST(AVG(corp_disc) AS DECIMAL(12, 2))) AS avg_corp_disc,
  count(*) as total,
  SUM(CASE WHEN Totl_Disc <> 0 THEN 1 ELSE 0 END) AS c_Totl_Disc,
  SUM(CASE WHEN msil_disc <> 0 THEN 1 ELSE 0 END) AS c_msil_disc,
  SUM(CASE WHEN (Cons_Disc-msil_disc) <> 0 THEN 1 ELSE 0 END) AS c_Cons_Disc,
  SUM(CASE WHEN Exch_Disc <> 0 THEN 1 ELSE 0 END) AS c_Exch_Disc,
  SUM(CASE WHEN corp_disc <> 0 THEN 1 ELSE 0 END) AS c_corp_disc   from 
      (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub
      where export_type < 5
      and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}'`;
    const data = await sequelize.query(query);
    res.send({
      data: data[0][0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.discountDashBoard2 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end
    // var query = "";
    // switch (parseInt(req.body.chartdatafor)) {
    //   case 6:
    const query6 = `select 
          CONVERT(MONEY,CAST(AVG(Totl_Disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl 
      join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
      where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' and Totl_Disc>0 group by g.godw_name `;
    //   break;
    // case 7:
    const query7 = `select 
          CONVERT(MONEY,CAST(AVG(msil_disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' and msil_disc>0 group by g.godw_name`;
    //   break;
    // case 8:
    const query8 = `select 
          CONVERT(MONEY,CAST(AVG(Cons_Disc-msil_disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' and Cons_Disc>0 group by g.godw_name`;
    //   break;
    // case 9:
    const query9 = `select 
          CONVERT(MONEY,CAST(AVG(Exch_Disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' and Exch_Disc>0 group by g.godw_name`;
    //   break;
    // case 10:
    const query10 = `select 
          CONVERT(MONEY,CAST(AVG(corp_disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' and corp_disc >0 group by g.godw_name`;
    //   break;
    // case 1:
    const query1 = `select 
          CONVERT(MONEY,CAST(SUM(Cons_Disc + Exch_Disc + Corp_Disc + Adnl_Disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' group by g.godw_name`;
    //   break;
    // case 2:
    const query2 = `select 
          CONVERT(MONEY,CAST(SUM(msil_disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' group by g.godw_name`;
    //   break;
    // case 3:
    const query3 = `select 
          CONVERT(MONEY,CAST(SUM(Cons_Disc-msil_disc) AS DECIMAL(12, 2)))  AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' group by g.godw_name`;
    //   break;
    // case 4:

    const query4 = `select 
          CONVERT(MONEY,CAST(SUM(Exch_Disc) AS DECIMAL(12, 2)))  AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' group by g.godw_name`;
    //   break;
    // case 5:
    const query5 = `select 
          CONVERT(MONEY,CAST(SUM(corp_disc) AS DECIMAL(12, 2))) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' group by g.godw_name`;
    //   break;
    // case 11:
    const query11 = `select 
        count(*) AS chart_data , count(*) as qty ,g.godw_name as loc_code
          from 
          (select distinct dtl.*,mst.INV_Date,mst.Totl_Disc,mst.Loc_Code from icm_dtl dtl join icm_mst mst on dtl.tran_id = mst.tran_id ) as sub join godown_mst g on g.godw_code = sub.loc_code
          where g.export_type < 3 and sub.export_type < 5 and sub.Totl_Disc > 0
          and loc_code in (${branchesArray}) and inv_date between '${dates.start}' and '${dates.end}' group by g.godw_name`;
    //   break;

    // default:
    //   query = ``;
    //   break;
    // }
    const data1 = await sequelize.query(query1);
    const data2 = await sequelize.query(query2);
    const data3 = await sequelize.query(query3);
    const data4 = await sequelize.query(query4);
    const data5 = await sequelize.query(query5);
    const data6 = await sequelize.query(query6);
    const data7 = await sequelize.query(query7);
    const data8 = await sequelize.query(query8);
    const data9 = await sequelize.query(query9);
    const data10 = await sequelize.query(query10);
    const data11 = await sequelize.query(query11);

    res.send({
      data1: data1[0],
      data2: data2[0],
      data3: data3[0],
      data4: data4[0],
      data5: data5[0],
      data6: data6[0],
      data7: data7[0],
      data8: data8[0],
      data9: data9[0],
      data10: data10[0],
      data11: data11[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.WorkshopDashBoard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);
    const month = 4;
    const dates = calculateDates(year, monthStart, monthEnd, month);
    if (branchesArray.length) {
      const data = await sequelize.query(`
      SELECT COUNT(DISTINCT bill_no) AS ws_count,
             SUM(taxable) AS ws_sum
      FROM dms_row_data AS d
      WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
      );`);
      const data2 = await sequelize.query(`
                SELECT COUNT(DISTINCT bill_no) AS ws_labour_count,
                SUM(taxable) AS ws_labour_sum
                FROM dms_row_data AS d
                WHERE tran_type = 7 And vin not in ('BANDP') and  Sale_Type='service' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
                AND NOT EXISTS (
                SELECT 1
                FROM dms_row_data AS d2
                WHERE d2.bill_no = d.bill_no
                AND d2.tran_type = 6 
                );`);
      const data3 = await sequelize.query(`
                SELECT COUNT(DISTINCT bill_no) AS ws_part_count,
                SUM(taxable) AS ws_part_sum
                FROM dms_row_data AS d
                WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
                AND NOT EXISTS (
                SELECT 1
                FROM dms_row_data AS d2
                WHERE d2.bill_no = d.bill_no
                AND d2.tran_type = 6 
                );`);

      const data4 = await sequelize.query(`
      SELECT COUNT(DISTINCT bill_no) AS bs_count,
             SUM(taxable) AS bs_sum
      FROM dms_row_data AS d
      WHERE tran_type = 7 And vin ='BANDP' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
      );`);

      const data5 = await sequelize.query(`
      SELECT COUNT(DISTINCT bill_no) AS bs_labour_count,
             SUM(taxable) AS bs_labour_sum
      FROM dms_row_data AS d
      WHERE tran_type = 7 And vin ='BANDP' and  Sale_Type='service' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
      );
      `);

      const data6 = await sequelize.query(`
      SELECT COUNT(DISTINCT bill_no) AS bs_part_count,
             SUM(taxable) AS bs_part_sum
      FROM dms_row_data AS d
      WHERE tran_type = 7 And vin ='BANDP' and  Sale_Type='goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
      );`);

      const data7 = await sequelize.query(`SELECT
      SUM(DISCOUNT) AS ws_discount_sum FROM
       GD_FDI_TRANS AS d WHERE trans_type = 'wi'
      And TRANS_SEGMENT not in ('BANDP') AND NOT EXISTS (SELECT 1 FROM GD_FDI_TRANS AS d2 WHERE d2.trans_id = d.trans_id AND
      d2.trans_type = 'wc') and trans_date between '${dates.start}' and '${dates.end}'  and loc_cd in (select newcar_rcpt collate database_default from godown_mst where godw_code in (${branchesArray}))`);

      const data9 = await sequelize.query(`SELECT
      SUM(DISCOUNT) AS bs_discount_sum FROM
       GD_FDI_TRANS AS d WHERE trans_type = 'wi'
      And TRANS_SEGMENT  in ('BANDP') AND NOT EXISTS (SELECT 1 FROM GD_FDI_TRANS AS d2 WHERE d2.trans_id = d.trans_id AND
      d2.trans_type = 'wc') and trans_date between '${dates.start}' and '${dates.end}'  and loc_cd in (select newcar_rcpt collate database_default from godown_mst where godw_code in (${branchesArray}))`);

      const data8 = await sequelize.query(`
                SELECT COUNT(DISTINCT bill_no) AS ws_oil_count,
                SUM(taxable) AS ws_oil_sum
                FROM dms_row_data AS d
                WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray}) and LEFT(HSN,4)='2710'
                AND NOT EXISTS (
                SELECT 1
                FROM dms_row_data AS d2
                WHERE d2.bill_no = d.bill_no
                AND d2.tran_type = 6 
                );`);
      const data10 = await sequelize.query(`
                SELECT COUNT(DISTINCT bill_no) AS bs_oil_count,
             SUM(taxable) AS bs_oil_sum
      FROM dms_row_data AS d
      WHERE tran_type = 7 And vin ='BANDP' and  Sale_Type='goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray}) and LEFT(HSN,4)='2710'
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
      );`);
      const a = [
        {
          id: 1,
          value: data[0][0].ws_count,
          name: "Work-Shop Load",
          visibility: true,
        },
        {
          id: 2,
          value: data[0][0].ws_sum,
          name: "Work-Shop Labour Total",
          visibility: true,
        },
        {
          id: 3,
          value: data7[0][0].ws_discount_sum,
          name: "Work-Shop Discount Total",
          visibility: true,
        },
        {
          id: 4,
          value: data4[0][0].bs_count,
          name: "Body-Shop Load",
          visibility: true,
        },
        {
          id: 5,
          value: data4[0][0].bs_sum,
          name: "Body-Shop Total",
          visibility: true,
        },
        {
          id: 6,
          value: data9[0][0].bs_discount_sum,
          name: "Body-Shop Discount",
          visibility: true,
        },
      ];
      const b = [
        {
          id: 7,
          value: data3[0][0].ws_part_sum,
          name: "Work-Shop Part Total",
          visibility: true,
        },
        {
          id: 8,
          value: data2[0][0].ws_labour_sum,
          name: "Work-Shop Labour Total",
          visibility: true,
        },
        {
          id: 9,
          value: data8[0][0].ws_oil_sum,
          name: "Work-Shop Oil Total",
          visibility: true,
        },
        {
          id: 10,
          value: data6[0][0].bs_part_sum,
          name: "Body-Shop Part Total",
          visibility: true,
        },
        {
          id: 11,
          value: data5[0][0].bs_labour_sum,
          name: "Body-Shop Labour Total",
          visibility: true,
        },
        {
          id: 12,
          value: data10[0][0].bs_oil_sum,
          name: "Body-Shop Oil Sum",
          visibility: true,
        },
        {
          id: 13,
          value: data6[0][0].bs_part_count,
          name: "Body-Shop Part Load",
          visibility: false,
        },
        {
          id: 14,
          value: data8[0][0].ws_oil_count,
          name: "Work-Shop Oil Load",
          visibility: false,
        },
        {
          id: 15,
          value: data10[0][0].bs_oil_count,
          name: "Body-Shop Oil Load",
          visibility: false,
        },
        {
          id: 16,
          value: data2[0][0].ws_labour_count,
          name: "Work-Shop Labour Load",
          visibility: false,
        },
        {
          id: 17,
          value: data3[0][0].ws_part_count,
          name: "Work-Shop Part Load",
          visibility: false,
        },
        {
          id: 18,
          value: data5[0][0].bs_labour_count,
          name: "Body-Shop Load",
          visibility: false,
        },
      ];
      res.send({ a, b });
      return;
    }
  } catch (e) {
    console.log(e);
    res.send({ data: "No Data" });
  } finally {
    await sequelize.close();
  }
};
exports.WorkshopDashBoard2 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesString = req.body.branch;
    const branchesArray = branchesString;
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);
    const dates = calculateDates(year, monthStart, monthEnd, 4);

    const query1 = ` SELECT COUNT(DISTINCT bill_no) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6) group by loc_code order by loc_code `;
    //     query1 = `SELECT *
    // FROM (
    //     SELECT MONTH(bill_date) AS bill_month, COUNT(DISTINCT bill_no) AS chart_data,
    //   (select top 1 godw_name from GODOWN_MST where GODOWN_MST.Godw_Code=DMS_ROW_DATA.Loc_Code and Export_Type<3) as loc_code
    //     FROM dms_row_data
    //     WHERE tran_type = 7
    //         AND vin NOT IN ('BANDP')
    //         AND bill_date BETWEEN '${dates.start}' and '${dates.end}'
    //         AND Export_Type < 5
    //         and loc_code in (${branchesArray})
    //         AND NOT EXISTS (
    //             SELECT 1
    //             FROM dms_row_data AS d2
    //             WHERE d2.bill_no = dms_row_data.bill_no
    //             AND d2.tran_type = 6
    //         )
    //     GROUP BY Loc_Code, MONTH(bill_date)
    // ) AS PivotData
    // PIVOT (
    //     SUM(chart_data)
    //     FOR bill_month IN ([4], [5], [6], [7], [8], [9], [10], [11], [12] , [1], [2], [3])
    // ) AS PivotTable`;

    const query2 = `SELECT COUNT(DISTINCT bill_no) AS qty, SUM(taxable) as chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6) group by loc_code order by loc_code `;
    // query1 = `
    // SELECT *
    // FROM (
    //         SELECT  MONTH(bill_date) AS bill_month, SUM(taxable) as chart_data,
    //         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //  FROM dms_row_data AS d
    //  WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray})
    //  AND NOT EXISTS (
    //      SELECT 1
    //      FROM dms_row_data AS d2
    //      WHERE d2.bill_no = d.bill_no
    //      AND d2.tran_type = 6) group by loc_code, MONTH(bill_date)
    //    ) AS PivotData
    // PIVOT (
    //     SUM(chart_data)
    //     FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    // ) AS PivotTable
    // ORDER BY Loc_Code;`;

    const query3 = `SELECT COUNT(DISTINCT trans_id) AS qty,ROUND(SUM(DISCOUNT), 2) AS chart_data,
               (select top 1 godw_name from godown_mst gm where REPLACE(gm.NEWCAR_RCPT, '-W', '') collate database_default  = d.loc_cd COLLATE DATABASE_DEFAULT and gm.export_type <3) as loc_code 
               FROM GD_FDI_TRANS AS d 
               WHERE trans_type = 'wi' And TRANS_SEGMENT not in ('BANDP') AND NOT EXISTS (SELECT 1 FROM GD_FDI_TRANS AS d2 WHERE d2.trans_id = d.trans_id    AND d2.trans_type = 'wc')
                and loc_cd in (select newcar_rcpt collate database_default from godown_mst where godw_code in (${branchesArray})) and trans_date between'${dates.start}' and '${dates.end}'  group by d.LOC_CD order by d.loc_cd`;
    // query1 = `SELECT *
    // FROM (
    // SELECT MONTH(TRANS_DATE) AS bill_month,ROUND(SUM(DISCOUNT), 2) AS chart_data,
    //                (select top 1 godw_name from godown_mst gm where REPLACE(gm.NEWCAR_RCPT, '-W', '') collate database_default  = d.loc_cd COLLATE DATABASE_DEFAULT and gm.export_type <3) as loc_code
    //                FROM GD_FDI_TRANS AS d
    //                WHERE trans_type = 'wi' And TRANS_SEGMENT not in ('BANDP') AND NOT EXISTS (SELECT 1 FROM GD_FDI_TRANS AS d2 WHERE d2.trans_id = d.trans_id    AND d2.trans_type = 'wc')
    //                 and loc_cd in (select newcar_rcpt collate database_default from godown_mst where godw_code in (${branchesArray}) ) and trans_date between '${dates.start}' and '${dates.end}' group by d.LOC_CD , MONTH(TRANS_DATE)
    //    ) AS PivotData
    // PIVOT (
    //     SUM(chart_data)
    //     FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    // ) AS PivotTable
    // ORDER BY Loc_Code;`;

    const query4 = ` SELECT COUNT(DISTINCT bill_no) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin ='BANDP' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 ) group by loc_code order by loc_code`;
    //   query1 = `SELECT *
    //   FROM (
    //   SELECT COUNT(DISTINCT bill_no) AS chart_data,MONTH(bill_date) AS bill_month,
    //           (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //    FROM dms_row_data AS d
    //    WHERE tran_type = 7 And vin ='BANDP' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray})
    //    AND NOT EXISTS (
    //        SELECT 1
    //        FROM dms_row_data AS d2
    //        WHERE d2.bill_no = d.bill_no
    //        AND d2.tran_type = 6 ) group by loc_code , MONTH(bill_date)
    //      ) AS PivotData
    //   PIVOT (
    //       SUM(chart_data)
    //       FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    //   ) AS PivotTable
    //   ORDER BY Loc_Code;`;
    //   break;
    // case 5:
    const query5 = `SELECT COUNT(DISTINCT bill_no) AS qty,SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin ='BANDP' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 ) group by loc_code order by loc_code`;
    //     query1 = `
    //  SELECT *
    //  FROM (
    //  SELECT MONTH(bill_date) AS bill_month,SUM(taxable) AS chart_data,
    //          (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //   FROM dms_row_data AS d
    //   WHERE tran_type = 7 And vin ='BANDP' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray})
    //   AND NOT EXISTS (
    //       SELECT 1
    //       FROM dms_row_data AS d2
    //       WHERE d2.bill_no = d.bill_no
    //       AND d2.tran_type = 6 ) group by loc_code , MONTH(bill_date)
    //     ) AS PivotData
    //  PIVOT (
    //      SUM(chart_data)
    //      FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    //  ) AS PivotTable
    //  ORDER BY Loc_Code; `;
    //     break;
    //   case 6:
    const query6 = `SELECT COUNT(DISTINCT trans_id) AS qty,ROUND(SUM(DISCOUNT), 2) AS chart_data,
        (select top 1 godw_name from godown_mst gm where REPLACE(gm.NEWCAR_RCPT, '-W', '') collate database_default  = d.loc_cd COLLATE DATABASE_DEFAULT and gm.export_type <3) as loc_code 
        FROM GD_FDI_TRANS AS d 
        WHERE trans_type = 'wi' And TRANS_SEGMENT  in ('BANDP') AND NOT EXISTS (SELECT 1 FROM GD_FDI_TRANS AS d2 WHERE d2.trans_id = d.trans_id    AND d2.trans_type = 'wc')
         and loc_cd in (select newcar_rcpt collate database_default from godown_mst where godw_code in (${branchesArray})) and trans_date between'${dates.start}' and '${dates.end}'  group by d.LOC_CD order by d.loc_cd`;
    //     query1 = `
    //  SELECT *
    //  FROM (
    //  SELECT MONTH(TRANS_DATE) AS bill_month,ROUND(SUM(DISCOUNT), 2) AS chart_data,
    //          (select top 1 godw_name from godown_mst gm where REPLACE(gm.NEWCAR_RCPT, '-W', '') collate database_default  = d.loc_cd COLLATE DATABASE_DEFAULT and gm.export_type <3) as loc_code
    //          FROM GD_FDI_TRANS AS d
    //          WHERE trans_type = 'wi' And TRANS_SEGMENT  in ('BANDP') AND NOT EXISTS (SELECT 1 FROM GD_FDI_TRANS AS d2 WHERE d2.trans_id = d.trans_id    AND d2.trans_type = 'wc')
    //           and loc_cd in (select newcar_rcpt collate database_default from godown_mst where godw_code in (${branchesArray})) and trans_date between '${dates.start}' and '${dates.end}' group by d.LOC_CD , MONTH(TRANS_DATE)
    //       ) AS PivotData
    //  PIVOT (
    //      SUM(chart_data)
    //      FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    //  ) AS PivotTable
    //  ORDER BY Loc_Code;
    //  `;
    //     break;
    //   case 7:
    const query7 = `
        SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
        )  group by loc_code order by loc_code; `;
    //     query1 = `
    //  SELECT *
    //  FROM (
    //  SELECT
    //          MONTH(bill_date) AS bill_month,SUM(taxable) AS chart_data,
    //          (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //          FROM dms_row_data AS d
    //          WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and  loc_code in (${branchesArray})
    //          AND NOT EXISTS (
    //          SELECT 1
    //          FROM dms_row_data AS d2
    //          WHERE d2.bill_no = d.bill_no
    //          AND d2.tran_type = 6
    //          )  group by loc_code , MONTH(bill_date)
    //       ) AS PivotData
    //  PIVOT (
    //      SUM(chart_data)
    //      FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    //  ) AS PivotTable
    //  ORDER BY Loc_Code; `;
    //     break;
    // case 8:
    const query8 = `SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
        )  group by loc_code order by loc_code;`;
    //   query1 = `
    //   SELECT *
    //   FROM (
    //   SELECT MONTH(bill_date) AS bill_month,
    //           SUM(taxable) AS chart_data,
    //           (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //           FROM dms_row_data AS d
    //           WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray})
    //           AND NOT EXISTS (
    //           SELECT 1
    //           FROM dms_row_data AS d2
    //           WHERE d2.bill_no = d.bill_no
    //           AND d2.tran_type = 6
    //           )  group by loc_code , MONTH(bill_date)
    //       ) AS PivotData
    //   PIVOT (
    //       SUM(chart_data)
    //       FOR bill_month IN ( [4], [5], [6], [7], [8], [9], [10], [11], [12],[1], [2], [3])
    //   ) AS PivotTable
    //   ORDER BY Loc_Code; `;
    //   break;
    // case 9:
    const query9 = `
        SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray}) and LEFT(HSN,4)='2710'
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
        )  group by loc_code order by loc_code; `;
    //     query1 = `
    //  SELECT *
    //  FROM (
    //  SELECT
    //          MONTH(bill_date) AS bill_month,SUM(taxable) AS chart_data,
    //          (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //          FROM dms_row_data AS d
    //          WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and  loc_code in (${branchesArray}) and LEFT(HSN,4)='2710'
    //          AND NOT EXISTS (
    //          SELECT 1
    //          FROM dms_row_data AS d2
    //          WHERE d2.bill_no = d.bill_no
    //          AND d2.tran_type = 6
    //          )  group by loc_code , MONTH(bill_date)
    //       ) AS PivotData
    //  PIVOT (
    //      SUM(chart_data)
    //      FOR bill_month IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
    //  ) AS PivotTable
    //  ORDER BY Loc_Code; `;
    //     break;
    //   case 10:
    const query10 = `
          SELECT COUNT(DISTINCT bill_no) AS qty,
          SUM(taxable) AS chart_data,
          (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
          FROM dms_row_data AS d
          WHERE tran_type = 7 And vin = 'BANDP' and Sale_Type = 'goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
          AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          )  group by loc_code order by loc_code; `;
    //     query1 = `
    //  SELECT *
    //  FROM (
    //  SELECT
    //           MONTH(bill_date) AS bill_month, SUM(taxable) AS chart_data,
    //            (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //            FROM dms_row_data AS d
    //            WHERE tran_type = 7 And vin = 'BANDP' and Sale_Type = 'goods' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray})
    //            AND NOT EXISTS (
    //            SELECT 1
    //            FROM dms_row_data AS d2
    //            WHERE d2.bill_no = d.bill_no
    //            AND d2.tran_type = 6
    //            )  group by loc_code , MONTH(bill_date)
    //      ) AS PivotData
    //  PIVOT (
    //      SUM(chart_data)
    //      FOR bill_month IN ( [4], [5], [6], [7], [8], [9], [10], [11], [12],[1], [2], [3])
    //  ) AS PivotTable
    //  ORDER BY Loc_Code; `;
    //     break;
    //   case 11:
    const query11 = `SELECT COUNT(DISTINCT bill_no) AS qty,
          SUM(taxable) AS chart_data,
          (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
          FROM dms_row_data AS d
          WHERE tran_type = 7 And vin = 'BANDP' and Sale_Type = 'service' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray})
          AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          )  group by loc_code order by loc_code;`;
    //   query1 = `
    //     SELECT *
    //     FROM (
    //     SELECT MONTH(bill_date) AS bill_month,
    //               SUM(taxable) AS chart_data,
    //               (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //               FROM dms_row_data AS d
    //               WHERE tran_type = 7 And vin = 'BANDP' and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray})
    //               AND NOT EXISTS (
    //               SELECT 1
    //               FROM dms_row_data AS d2
    //               WHERE d2.bill_no = d.bill_no
    //               AND d2.tran_type = 6
    //               )  group by loc_code, MONTH(bill_date)
    //         ) AS PivotData
    //     PIVOT (
    //         SUM(chart_data)
    //         FOR bill_month IN ( [4], [5], [6], [7], [8], [9], [10], [11], [12],[1], [2], [3])
    //     ) AS PivotTable
    //     ORDER BY Loc_Code; `;
    //   break;
    // case 12:
    const query12 = `
        SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin = 'BANDP' and Sale_Type = 'goods' and bill_date between'${dates.start}' and '${dates.end}'  and Export_Type<5 and loc_code in (${branchesArray}) and LEFT(HSN,4)='2710'
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
        )  group by loc_code order by loc_code; `;
    //       query1 = `
    //  SELECT *
    //  FROM (
    //  SELECT
    //           MONTH(bill_date) AS bill_month, SUM(taxable) AS chart_data,
    //            (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //            FROM dms_row_data AS d
    //            WHERE tran_type = 7 And vin = 'BANDP' and Sale_Type = 'goods' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type<5 and loc_code in (${branchesArray}) and LEFT(HSN,4)='2710'
    //            AND NOT EXISTS (
    //            SELECT 1
    //            FROM dms_row_data AS d2
    //            WHERE d2.bill_no = d.bill_no
    //            AND d2.tran_type = 6
    //            )  group by loc_code , MONTH(bill_date)
    //      ) AS PivotData
    //  PIVOT (
    //      SUM(chart_data)
    //      FOR bill_month IN ( [4], [5], [6], [7], [8], [9], [10], [11], [12],[1], [2], [3])
    //  ) AS PivotTable
    //  ORDER BY Loc_Code; `;

    // const data = await sequelize.query(query);
    const data1 = await sequelize.query(query1);
    const data2 = await sequelize.query(query2);
    const data3 = await sequelize.query(query3);
    const data4 = await sequelize.query(query4);
    const data5 = await sequelize.query(query5);
    const data6 = await sequelize.query(query6);
    const data7 = await sequelize.query(query7);
    const data8 = await sequelize.query(query8);
    const data9 = await sequelize.query(query9);
    const data10 = await sequelize.query(query10);
    const data11 = await sequelize.query(query11);
    const data12 = await sequelize.query(query12);
    res.send({
      data1: data1[0],
      data2: data2[0],
      data3: data3[0],
      data4: data4[0],
      data5: data5[0],
      data6: data6[0],
      data7: data7[0],
      data8: data8[0],
      data9: data9[0],
      data10: data10[0],
      data11: data11[0],
      data12: data12[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.modalwisedata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesString = req.body.branch;
    const modalgrp = req.body.modalgrp;
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);

    const dates = calculateDates(year, monthStart, monthEnd, 4);
    const query = `SELECT
    4 as orderdate,
    misc_mst.misc_name AS modl_name,
    SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END) 
    - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data 
FROM
    chas_tran
JOIN
    chas_mst ON chas_tran.chas_id = chas_mst.chas_id
JOIN
    modl_mst ON modl_mst.item_code = chas_mst.modl_code
JOIN
    misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
WHERE
    chas_tran.tran_date BETWEEN '${dates.start}' AND '${dates.end}'
    AND chas_tran.item_type = 2
    AND chas_tran.Export_Type < 5
    AND misc_mst.misc_type = 14
    AND modl_mst.modl_grp IN (${modalgrp})
    AND chas_tran.loc_code IN (${branchesString})
GROUP BY
    misc_mst.misc_name;
`;
    const data = await sequelize.query(query);
    res.send({
      data: data[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};

const getMonthStartAndEndDates = (year, month) => {
  // Calculate the start date of the month
  const startDate = new Date(year, month - 1, 2); // Subtract 1 to adjust for 0-indexed month

  // Calculate the end date of the month
  const endDate = new Date(year, month, 1);

  return { startDate, endDate };
};
exports.modaldaywisedata = async function (req, res) {
  // const sequelize = await dbname("VAPL");
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesString = req.body.branch;
    const modalgrp = req.body.modalgrp;
    const date = req.body.date;

    const [year, month, day] = date.split("-").map(Number);

    // Get the start and end dates of the current month
    const currentMonth = getMonthStartAndEndDates(year, month);

    // Get the start and end dates of the previous month
    const previousMonth = getMonthStartAndEndDates(year, month - 1);

    // Get the start and end dates of the month before the previous month
    const monthBeforePrevious = getMonthStartAndEndDates(year, month - 2);

    const currentyear = parseInt(req.body.year);
    const dates = calculateDates(
      currentyear,
      req.body.monthFrom,
      req.body.monthTo,
      4
    );
    const datesforprev = calculateDates(
      currentyear - 1,
      req.body.monthFrom,
      req.body.monthTo,
      4
    );

    // const onemonth = calculateDates(year, monthStart - 1, monthEnd - 1, 4);
    // const twomonth = calculateDates(year, monthStart - 2, monthEnd - 2, 4);
    const yesterday = moment(date).subtract(1, "days").format("YYYY-MM-DD");

    // Calculate day before yesterday
    const dayBeforeYesterday = moment(date)
      .subtract(2, "days")
      .format("YYYY-MM-DD");
    const query = `SELECT
        1 as orderdate,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    WHERE
        chas_tran.tran_date = '${date}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name
        union all
        SELECT
        2 as orderdate,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    WHERE
        chas_tran.tran_date = '${yesterday}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name
        union all
        SELECT
        3 as orderdate,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    WHERE
        chas_tran.tran_date = '${dayBeforeYesterday}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name
        union all
        SELECT
        4 as orderdate,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    WHERE
        chas_tran.tran_date BETWEEN '${currentMonth?.startDate
        .toISOString()
        ?.slice(0, 10)}' AND '${currentMonth?.endDate
          .toISOString()
          ?.slice(0, 10)}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name
        union All
        SELECT
        5 as orderdate,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    WHERE
        chas_tran.tran_date BETWEEN '${previousMonth?.startDate
        .toISOString()
        ?.slice(0, 10)}' AND '${previousMonth?.endDate
          .toISOString()
          ?.slice(0, 10)}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name
        union All
        SELECT
        6 as orderdate,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    WHERE
        chas_tran.tran_date BETWEEN '${monthBeforePrevious?.startDate
        .toISOString()
        ?.slice(0, 10)}' AND '${monthBeforePrevious?.endDate
          .toISOString()
          ?.slice(0, 10)}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name  
        `;

    const query2 = `SELECT
        7 as orderdate,
        Godown_Mst.godw_name as branch,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    JOIN
        Godown_Mst ON Godown_Mst.Godw_Code= chas_mst.loc_code
    WHERE
        chas_tran.tran_date BETWEEN '${currentMonth?.startDate
        .toISOString()
        ?.slice(0, 10)}' AND '${currentMonth?.endDate
          .toISOString()
          ?.slice(0, 10)}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name,Godown_Mst.godw_name`;
    const query3 = `SELECT
        7 as orderdate,
        Godown_Mst.godw_name as branch,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    JOIN
        Godown_Mst ON Godown_Mst.Godw_Code= chas_mst.loc_code
    WHERE
        chas_tran.tran_date BETWEEN '${dates.start}' AND '${dates.end}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name,Godown_Mst.godw_name`;
    const query4 = `SELECT
        7 as orderdate,
        Godown_Mst.godw_name as branch,
        misc_mst.misc_name AS modl_name,
        SUM(CASE WHEN chas_tran.tran_type = 2 THEN 1 ELSE 0 END)
        - SUM(CASE WHEN chas_tran.tran_type = 4 THEN 1 ELSE 0 END) AS data
    FROM
        chas_tran
    JOIN
        chas_mst ON chas_tran.chas_id = chas_mst.chas_id
    JOIN
        modl_mst ON modl_mst.item_code = chas_mst.modl_code
    JOIN
        misc_mst ON misc_mst.misc_code = modl_mst.modl_grp
    JOIN
        Godown_Mst ON Godown_Mst.Godw_Code= chas_mst.loc_code
    WHERE
        chas_tran.tran_date BETWEEN '${datesforprev.start}' AND '${datesforprev.end}'
        AND chas_tran.item_type = 2
        AND chas_tran.Export_Type < 5
        AND misc_mst.misc_type = 14
        AND modl_mst.modl_grp IN (${modalgrp})
        AND chas_tran.loc_code IN (${branchesString})
    GROUP BY
        misc_mst.misc_name,Godown_Mst.godw_name`;

    const sqldaTA = await sequelize.query(query);
    const sqldaTA2 = await sequelize.query(query2);
    const sqldaTA3 = await sequelize.query(query3);
    const sqldaTA4 = await sequelize.query(query4);
    let currentdata = [];
    let yesterdaydata = [];
    let daybeforeyesterdaydata = [];
    let firstmonth = [];
    let secondmonth = [];
    let thirdmonth = [];

    sqldaTA[0]?.forEach((item) => {
      switch (item.orderdate) {
        case 1:
          currentdata.push({ modl_name: item.modl_name, data: item.data });
          break;
        case 2:
          yesterdaydata.push({ modl_name: item.modl_name, data: item.data });
          break;
        case 3:
          daybeforeyesterdaydata.push({
            modl_name: item.modl_name,
            data: item.data,
          });
          break;
        case 4:
          firstmonth.push({
            modl_name: item.modl_name,
            data: item.data,
          });
          break;
        case 5:
          secondmonth.push({
            modl_name: item.modl_name,
            data: item.data,
          });
          break;
        case 6:
          thirdmonth.push({
            modl_name: item.modl_name,
            data: item.data,
          });
          break;
        default:
          break;
      }
    });

    const data = [
      { current: currentdata },
      { date: date },
      { yesterday: yesterdaydata },
      { yesterdaydate: yesterday },
      { dayBeforeYesterday: dayBeforeYesterday },
      { daybeforeyesterdaydata: daybeforeyesterdaydata },
      { firstmonthdata: firstmonth },
      { currentMonth: currentMonth },
      { secoundmonthdata: secondmonth },
      { previousMonth: previousMonth },
      { thirdmonthdata: thirdmonth },
      { monthBeforePrevious: monthBeforePrevious },
      { branchwisedata: sqldaTA2[0] },
      { currentyear: sqldaTA3[0] },
      { prevyear: sqldaTA4[0] },
    ];
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};

exports.Modeldaywisemodels = async function (req, res) {
  // const sequelize = await dbname("VAPL");

  const sequelize = await dbname(req.headers.compcode);
  try {
    const query = `select distinct  * from (
      select mt.Misc_Code as value,mt.Misc_Name as label from modl_mst mds join misc_mst mt on mds.modl_grp = mt.Misc_Code where mt.misc_type = 14
      and mt.export_type<3) as query order by label`;
    const data = await sequelize.query(query);
    res.send({
      data: data[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.AttendanceDash = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DATE_FROM = req.body.DATE_FROM ? req.body.DATE_FROM : "";
    const DATE_TO = req.body.DATE_TO;
    let abstsevendayg = [];
    const Employees = await sequelize.query(
      `select COUNT(DISTINCT(EMPCODE)) Employees from EMPLOYEEMASTER where Export_Type = 1`
    );
    const Present =
      await sequelize.query(`		select COUNT(DISTINCT(Emp_Code)) as Present from attendancetable where 
    dateoffice between '${DATE_TO}' and '${DATE_TO}' AND flag= 'P' and in1 is not null`);
    const Absent =
      await sequelize.query(`select COUNT(DISTINCT(Emp_Code)) as Absent from attendancetable where 
    dateoffice between '${DATE_TO}' and '${DATE_TO}' AND flag= 'A'`);
    const HalfDays =
      await sequelize.query(`select COUNT(DISTINCT(Emp_Code)) AS HalfDays 
    from attendancetable where 
    dateoffice between '${DATE_TO}' and '${DATE_TO}' and presentvalue = '0.50'`);
    const LateComers =
      await sequelize.query(`SELECT DISTINCT(Emp_Code) AS EMPCODE,
    (SELECT TOP 1 EMPFIRSTNAME from EMPLOYEEMASTER where EMPCODE = Emp_Code) AS EMP_NAME,
      FORMAT(in1, 'HH:mm') AS ActualIn,
      FORMAT(out1, 'HH:mm') AS Actualout,
    DATEPART(HOUR, in1) * 60 + DATEPART(MINUTE, in1) AS TotalMinutesIn1,
    CASE WHEN CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) > 0 THEN 
      CAST(LEFT(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) - 1) AS INT) * 60 + 
      CAST(SUBSTRING(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) + 1, LEN(CONVERT(VARCHAR, shiftstarttime)) - CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime))) AS INT)
    ELSE 
      CAST(shiftstarttime AS INT) * 60 
    END AS TotalMinutesShiftStart,
    shiftstarttime,
      shiftendtime 
    FROM attendancetable 
    WHERE dateoffice BETWEEN '${DATE_TO}' AND '${DATE_TO}' 
      AND in1 IS NOT NULL 
    AND shiftstarttime <> '0.00'
    AND shiftendtime <> '0.00'
      AND DATEPART(HOUR, in1) * 60 + DATEPART(MINUTE, in1) > 
      CASE WHEN CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) > 0 THEN 
      CAST(LEFT(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) - 1) AS INT) * 60 + 
      CAST(SUBSTRING(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) + 1, LEN(CONVERT(VARCHAR, shiftstarttime)) - CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime))) AS INT)
    ELSE 
      CAST(shiftstarttime AS INT) * 60 
    END;`);
    const abstsevenday =
      await sequelize.query(`select COUNT(DISTINCT(Emp_Code)) AS y, CONVERT(VARCHAR,dateoffice, 23)  As name
    from attendancetable where 
    dateoffice between '${DATE_FROM}' and '${DATE_TO}' and flag = 'A'
	group by dateoffice`);
    const abstmonth = await sequelize.query(`
	select  COUNT(Emp_Code) AS y, MONTH(dateoffice) AS name from attendancetable where flag = 'P' and MONTH(dateoffice) between '1' AND '12' group by MONTH(dateoffice)`);
    const lateseven =
      await sequelize.query(`	SELECT COUNT(DISTINCT(Emp_Code)) AS y,
    CONVERT(VARCHAR,dateoffice, 23)  As name
FROM attendancetable 
WHERE dateoffice BETWEEN '${DATE_FROM}' AND '${DATE_TO}' 
    AND in1 IS NOT NULL 
	AND shiftstarttime <> '0.00'
	AND shiftendtime <> '0.00'
    AND DATEPART(HOUR, in1) * 60 + DATEPART(MINUTE, in1) > 
    CASE WHEN CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) > 0 THEN 
		CAST(LEFT(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) - 1) AS INT) * 60 + 
		CAST(SUBSTRING(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) + 1, LEN(CONVERT(VARCHAR, shiftstarttime)) - CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime))) AS INT)
	ELSE 
		CAST(shiftstarttime AS INT) * 60 
	END
	group by dateoffice;`);
    res.send({
      Employees: Employees[0][0].Employees,
      Present: Present[0][0].Present,
      Absent: Absent[0][0].Absent,
      HalfDays: HalfDays[0][0].HalfDays,
      LateComers: LateComers[0].length,
      abstsevenday: abstsevenday[0],
      abstmonth: abstmonth[0],
      lateseven: lateseven[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.HrDashBoard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Employees = await sequelize.query(
      `SELECT DISTINCT(COUNT(EMPCODE)) AS TOTALEMPLOYEE FROM EMPLOYEEMASTER where Export_Type = 1`
    );
    const Male = await sequelize.query(
      `select DISTINCT(COUNT(EMPCODE)) AS MALE from EMPLOYEEMASTER where GENDER = 'male' and Export_Type = 1`
    );
    const Female = await sequelize.query(
      `select DISTINCT(COUNT(EMPCODE)) AS FEMALE from  EMPLOYEEMASTER where GENDER = 'female' and Export_Type = 1`
    );
    const EmpDept = await sequelize.query(
      `SELECT (SELECT TOP 1 Misc_Name from Misc_Mst where Misc_Type = 68 and Misc_Code = DIVISION) As name, COUNT(EMPCODE) as y FROM EMPLOYEEMASTER GRoup by Division`
    );
    const Retention = await sequelize.query(`SELECT 
    CASE 
        WHEN DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) <= 6 THEN '0 to 6 months' 
        WHEN DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) > 6 AND DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) <= 12 THEN '6 months to 1 year'
        WHEN DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) > 12 AND DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) <= 24 THEN '1 to 2 years'
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 BETWEEN 2 AND 3 THEN '2 to 3 years' 
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 BETWEEN 3 AND 4 THEN '3 to 4 years' 
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 BETWEEN 4 AND 5 THEN '4 to 5 years' 
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 > 5 THEN '5+ years'
    END AS Joining_Year_Group,
    COUNT(*) AS Total_Employees
FROM 
    EMPLOYEEMASTER
GROUP BY 
    CASE 
               WHEN DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) <= 6 THEN '0 to 6 months' 
        WHEN DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) > 6 AND DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) <= 12 THEN '6 months to 1 year'
        WHEN DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) > 12 AND DATEDIFF(MONTH, CURRENTJOINDATE, GETDATE()) <= 24 THEN '1 to 2 years'
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 BETWEEN 2 AND 3 THEN '2 to 3 years' 
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 BETWEEN 3 AND 4 THEN '3 to 4 years' 
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 BETWEEN 4 AND 5 THEN '4 to 5 years' 
        WHEN DATEDIFF(DAY, CURRENTJOINDATE, GETDATE()) / 365.25 > 5 THEN '5+ years'
    END;`);
    const deptSal = await sequelize.query(`
WITH SourceTable AS (
    SELECT 
        (SELECT TOP 1 Misc_Name 
         FROM Misc_Mst 
         WHERE Misc_Type = 68 
           AND Misc_Code = E.DIVISION 
           AND Misc_Name <> '') AS Department,
        SalMnth,
        SUM(S.Gross) AS Total_Gross_Salary
    FROM 
        EMPLOYEEMASTER E
    JOIN 
        SALARYFILE S ON E.EMPCODE = S.Emp_Code
    WHERE
        SalYear = 2024  
        AND E.DIVISION IS NOT NULL
        AND (SELECT TOP 1 Misc_Name 
             FROM Misc_Mst 
             WHERE Misc_Type = 68 
               AND Misc_Code = E.DIVISION 
               AND Misc_Name <> '') IS NOT NULL
    GROUP BY  
        E.division, SalMnth
)
, PivotTable AS (
    SELECT 
        Department,
        ISNULL([1], 0) AS 'JAN', 
        ISNULL([2], 0) AS 'FEB', 
        ISNULL([3], 0) AS 'MAR', 
        ISNULL([4], 0) AS 'APR', 
        ISNULL([5], 0) AS 'MAY', 
        ISNULL([6], 0) AS 'JUN', 
        ISNULL([7], 0) AS 'JUL', 
        ISNULL([8], 0) AS 'AUG', 
        ISNULL([9], 0) AS 'SEP', 
        ISNULL([10], 0) AS 'OCT', 
        ISNULL([11], 0) AS 'NOV', 
        ISNULL([12], 0) AS 'DEC',
        ISNULL([1], 0) + ISNULL([2], 0) + ISNULL([3], 0) + ISNULL([4], 0) + ISNULL([5], 0) + ISNULL([6], 0) + ISNULL([7], 0) + ISNULL([8], 0) + ISNULL([9], 0) + ISNULL([10], 0) + ISNULL([11], 0) + ISNULL([12], 0) AS 'Total'
    FROM (
        SELECT 
            Department,
            [1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12]
        FROM SourceTable
        PIVOT (
            SUM(Total_Gross_Salary)
            FOR SalMnth IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
        ) AS P
    ) AS PT
)
SELECT * FROM PivotTable
UNION ALL
SELECT 
    'Total' AS Department,
    SUM(JAN), 
    SUM(FEB), 
    SUM(MAR), 
    SUM(APR), 
    SUM(MAY), 
    SUM(JUN), 
    SUM(JUL), 
    SUM(AUG), 
    SUM(SEP), 
    SUM(OCT), 
    SUM(NOV), 
    SUM(DEC), 
    SUM(Total)
FROM PivotTable
`);


    console.log(deptSal)
    res.send({
      Employees: Employees[0][0].TOTALEMPLOYEE,
      Male: Male[0][0].MALE,
      Female: Female[0][0].FEMALE,
      EmpDept: EmpDept[0],
      Retention: Retention[0],
      deptSal: deptSal[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.AttendanceDashAbst = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DATE_TO = req.body.DATE_TO;
    const abstsevendayg =
      await sequelize.query(`select DISTINCT(Emp_Code) AS EMPCODE, 
    (SELECT TOP 1 (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code)  As EMP_NAME,
    CONVERT(VARCHAR, dateoffice, 103) AS Date
    from attendancetable where 
    dateoffice between '${DATE_TO}' and '${DATE_TO}' and flag = 'A'`);
    console.log(abstsevendayg[0].length);
    res.send({
      a: abstsevendayg[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.abstmonthg = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DATE_TO = req.body.DATE_TO;
    const abstsevendayg = await sequelize.query(`select Emp_Code AS EMPCODE, 
    (SELECT TOP 1 (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) FROM EMPLOYEEMASTER WHERE EMPCODE = Emp_Code)  As EMP_NAME,
    CONVERT(VARCHAR, dateoffice, 103) AS Date
    from attendancetable where 
    MONTH(dateoffice) = '${DATE_TO}' and flag = 'A'`);
    console.log(abstsevendayg[0].length);

    res.send({
      a: abstsevendayg[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.LateComersg = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DATE_TO = req.body.DATE_TO;
    const abstsevendayg =
      await sequelize.query(`SELECT DISTINCT(Emp_Code) AS EMPCODE,
    (SELECT TOP 1 (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) from EMPLOYEEMASTER where EMPCODE = Emp_Code) AS EMP_NAME,
      FORMAT(in1, 'HH:mm') AS ActualIn,
      FORMAT(out1, 'HH:mm') AS Actualout,
    DATEPART(HOUR, in1) * 60 + DATEPART(MINUTE, in1) AS TotalMinutesIn1,
    CASE WHEN CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) > 0 THEN 
      CAST(LEFT(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) - 1) AS INT) * 60 + 
      CAST(SUBSTRING(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) + 1, LEN(CONVERT(VARCHAR, shiftstarttime)) - CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime))) AS INT)
    ELSE 
      CAST(shiftstarttime AS INT) * 60 
    END AS TotalMinutesShiftStart,
    TRIM(CAST(shiftstarttime AS CHAR)) AS StTime,
    TRIM(CAST(shiftendtime AS CHAR)) AS EndTime
    FROM attendancetable 
    WHERE dateoffice BETWEEN '${DATE_TO}' AND '${DATE_TO}' 
      AND in1 IS NOT NULL 
    AND shiftstarttime <> '0.00'
    AND shiftendtime <> '0.00'
      AND DATEPART(HOUR, in1) * 60 + DATEPART(MINUTE, in1) > 
      CASE WHEN CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) > 0 THEN 
      CAST(LEFT(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) - 1) AS INT) * 60 + 
      CAST(SUBSTRING(CONVERT(VARCHAR, shiftstarttime), CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime)) + 1, LEN(CONVERT(VARCHAR, shiftstarttime)) - CHARINDEX('.', CONVERT(VARCHAR, shiftstarttime))) AS INT)
    ELSE 
      CAST(shiftstarttime AS INT) * 60 
    END;`);
    console.log(abstsevendayg[0].length);

    res.send({
      a: abstsevendayg[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.deprtemp = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DIVISION = req.body.DIVISION;
    const code = await sequelize.query(
      `SELECT Misc_Code from Misc_Mst Where Misc_Name = '${DIVISION}' AND Misc_Type = 68`
    );
    const EmpDept = await sequelize.query(`SELECT 
    (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) AS name, 
    EMPCODE as y FROM EMPLOYEEMASTER WHERE Division = ${code[0][0].Misc_Code}`);
    res.send({
      a: EmpDept[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};


exports.bankbal = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  // const sequelize = await dbname("PATL");
  const year = req.body.date.slice(0, 4);
  const month = req.body.date.slice(5, 7);
  const day = req.body.date.slice(8, 10);

  try {
    // const DIVISION = req.body.DIVISION;
    const balance = await sequelize.query(
      `select (select top 1 ledg_name from ledg_mst where ledg_code=bank_code )as bank_Name,Date_${day} as Balance from BANK_BAL where mnth=${month} and yr=${year} and Date_${day}>0`
    );
    const groupedData = [];
    balance[0].forEach((entry) => {
      const bankNameMatch = entry?.bank_Name?.match(/^.+?(?=\d)/);
      if (bankNameMatch && bankNameMatch.length > 0) {
        const bankName = bankNameMatch[0].trim();
        const existingBankIndex = groupedData.findIndex(
          (arr) => arr[0] === bankName
        );
        if (existingBankIndex !== -1) {
          groupedData[existingBankIndex].push(entry);
        } else {
          groupedData.push([bankName, entry]);
        }
      } else {
        // Handle case where bank_Name is null or doesn't match the regex
        console.log("", entry.bank_Name);
      }
    });

    res.send(groupedData);
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.cashBal = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  // const sequelize = await dbname("VAPL");
  const year = req.body.date.slice(0, 4);
  const month = req.body.date.slice(5, 7);
  const day = req.body.date.slice(8, 10);

  try {
    // const DIVISION = req.body.DIVISION;
    const balance = await sequelize.query(
      `select * from (select (select top 1 ledg_name from ledg_mst where ledg_code=CASH_CODE and Group_Code=24)as bank_Name,(select top 1 ledg_name2 from ledg_mst where ledg_code=CASH_CODE and Group_Code=24)as ledg_name2,Date_${day} as Balance from cash_Bal where  mnth=${month} and yr=${year} and Date_${day}>0) as subquery  group by ledg_name2 ,bank_Name,Balance
    `
    );

    const groupedData = {};
    balance[0].forEach((entry) => {
      const bankName = entry.bank_Name.trim();
      if (!(bankName in groupedData)) {
        groupedData[bankName] = [];
      }
      groupedData[bankName].push(entry);
    });

    // Convert the groupedData object into an array of arrays
    const formattedData = Object.entries(groupedData).map(
      ([bankName, entries]) => {
        return [bankName, ...entries];
      }
    );

    // console.log(formattedData);

    res.send(formattedData);
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.MissPunchDashboard = async function (req, res) {
  console.log(req.body, 'body')
  const sequelize = await dbname(req.headers.compcode);
  try {
    console.log(req.body)
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);
    const branch = req.body.branch;
    const dates = calculateDates(year, monthStart, monthEnd, 4);

    const result = await sequelize.query(
      `SELECT 
         (SELECT TOP 1 misc_abbr FROM Misc_Mst WHERE Misc_Code = ccbcb.mipunch_reason AND misc_type = 92) AS loc_code,* from
         (select distinct mipunch_reason, COUNT(mipunch_reason) AS chart_data FROM (
          SELECT mipunch_reason,
          (select top 1 LOCATION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default) as LOCATION
          FROM attendancetable WHERE 
          mipunch_reason IS NOT NULL AND 
          dateoffice BETWEEN '${dates.start}' AND '${dates.end}'
          ) AS abd where LOCATION in (${branch}) group by mipunch_reason ) as ccbcb ORDER BY ccbcb.chart_data 
        DESC`
    );

    const location =
      await sequelize.query(`select count(mipunch_reason)chart_data ,loc_code from (
        select (select top 1 misc_abbr from Misc_Mst where Misc_Code = mipunch_reason and misc_type = 92) as misc_abbr,* from (
        select mipunch_reason,(select top 1 misc_name from Misc_Mst where  misc_type = 85 and misc_code
        = (select top 1 location from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default))
                as loc_code,
        (select top 1 LOCATION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default) as LOCATION
        from attendancetable where mipunch_reason is not null  and dateoffice between '${dates.start}' AND '${dates.end}' 
        ) as abd where LOCATION in (${branch})) as ansbd where loc_code is not null  group by loc_code order by chart_data desc`);

    const Region =
      await sequelize.query(`select count(mipunch_reason)chart_data ,loc_code from (
        select (select top 1 misc_abbr from Misc_Mst where Misc_Code = mipunch_reason and misc_type = 92) as misc_abbr,* from (
        select mipunch_reason,(select top 1 misc_name from Misc_Mst where  misc_type = 91 and misc_code
        = (select top 1 sal_region from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default))
                as loc_code,
        (select top 1 LOCATION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default) as LOCATION
        from attendancetable where mipunch_reason is not null  and dateoffice between '${dates.start}' AND '${dates.end}' 
      ) as abd where LOCATION in (${branch}) ) as ansbd where loc_code is not null  group by loc_code order by chart_data desc`);

    const Division =
      await sequelize.query(`select count(mipunch_reason)chart_data ,loc_code from (
        select (select top 1 misc_abbr from Misc_Mst where Misc_Code = mipunch_reason and misc_type = 92) as misc_abbr,* from (
        select mipunch_reason,(select top 1 misc_name from Misc_Mst where  misc_type = 68 and misc_code
        = (select top 1 DIVISION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default))
        as loc_code,
        (select top 1 LOCATION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default) as LOCATION
        from attendancetable where mipunch_reason is not null  and dateoffice between '${dates.start}' AND '${dates.end}'
        ) as abd where LOCATION in (${branch})) as ansbd where loc_code is not null group by loc_code order by chart_data desc`);

    const Section =
      await sequelize.query(`select count(mipunch_reason)chart_data ,loc_code from (
        select (select top 1 misc_abbr from Misc_Mst where Misc_Code = mipunch_reason and misc_type = 92) as misc_abbr,* from (
        select mipunch_reason,(select top 1 misc_name from Misc_Mst where  misc_type = 81 and misc_code
        = (select top 1 SECTION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default))
                as loc_code,
        (select top 1 LOCATION from EMPLOYEEMASTER where empcode collate database_default = Emp_Code collate database_default) as LOCATION
        from attendancetable where mipunch_reason is not null  and dateoffice between '${dates.start}' AND '${dates.end}'
        ) as abd where LOCATION in (${branch})) as ansbd where loc_code is not null group by loc_code order by chart_data desc`);

    res.send({
      Result: result[0],
      location: location[0],
      Region: Region[0],
      Division: Division[0],
      Section: Section[0],
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
function getPreviousMonthDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the same day of the previous month
  const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, start.getDate());
  const prevMonthEnd = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());

  return {
    start: prevMonthStart.toISOString().split("T")[0], // Format to 'YYYY-MM-DD'
    end: prevMonthEnd.toISOString().split("T")[0] // Format to 'YYYY-MM-DD'
  };
}
function getPreviousYearDates(startDate, endDate) {
  const start = new Date(startDate); // Parse DATE_FROM
  const end = new Date(endDate); // Parse DATE_TO

  // Subtract one year from the start and end dates
  start.setFullYear(start.getFullYear() - 1);
  end.setFullYear(end.getFullYear() - 1);

  return {
    start: start.toISOString().split("T")[0], // Format to 'YYYY-MM-DD'
    end: end.toISOString().split("T")[0] // Format to 'YYYY-MM-DD'
  };
}

exports.discountDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    const discount = req.body.discount

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );

    const query1 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code
    WHERE 
       
        sub.export_type < 5
        AND sub.loc_code IN (${branchesArray}) 
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.godw_name

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code
    WHERE 
       
        sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.godw_name
) AS combined
GROUP BY loc_code;`
    const query1pv = `
          SELECT 
          loc_code,
          SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year

      FROM (
          -- Subquery for previous year (2023-2024)
          SELECT 
              0 AS CurrentYear,
              CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
              COUNT(*) AS qty,
              g.godw_name AS loc_code
          FROM 
              (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
              FROM icm_dtl dtl 
              JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
          JOIN godown_mst g ON g.godw_code = sub.loc_code
          WHERE 
              sub.export_type < 5
              AND sub.loc_code IN (${branchesArray}) 
              AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
          GROUP BY g.godw_name
      
          UNION ALL
      
          -- Subquery for current year (2024-2025)
          SELECT 
              1 AS CurrentYear,
              CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
              COUNT(*) AS qty,
              g.godw_name AS loc_code
          FROM 
              (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
              FROM icm_dtl dtl 
              JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
          JOIN godown_mst g ON g.godw_code = sub.loc_code
          WHERE 
             sub.export_type < 5
              AND sub.loc_code IN (${branchesArray})
              AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
          GROUP BY g.godw_name
      ) AS combined
      GROUP BY loc_code;`;

    const query2 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END) AS qty_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END) AS qty_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
       (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.Br_Segment

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
       and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.Br_Segment
) AS combined
GROUP BY loc_code;`

    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END) AS qty_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END) AS qty_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.Br_Location

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code= g.Br_Location) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
        sub.export_type < 5
         and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END) AS qty_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END) AS qty_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_Name as loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
       AND g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.Godw_Name

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_Name as loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
        sub.export_type < 5
       AND g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.Godw_Name
) AS combined
GROUP BY loc_code`
    const query5 = `SELECT 
    Modl_Group_Name as loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END) AS qty_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END) AS qty_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
		sub.Modl_Grp,
		 (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=sub.Modl_Grp)as Modl_Group_Name
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date,mst.Modl_Grp, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
   
    WHERE sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
		group by sub.Modl_Grp
    
    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
		sub.Modl_Grp,
		 (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=sub.Modl_Grp)as Modl_Group_Name
    
       
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date,mst.Modl_Grp, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub
    WHERE 
        sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}' 
		group by sub.Modl_Grp
) AS combined
group by Modl_Group_Name`
    const query5pv = `SELECT 
    Modl_Group_Name as loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year

FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
		sub.Modl_Grp,
		 (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=sub.Modl_Grp)as Modl_Group_Name
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date,mst.Modl_Grp, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
   
    WHERE sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
		group by sub.Modl_Grp
    
    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
		sub.Modl_Grp,
		 (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=sub.Modl_Grp)as Modl_Group_Name
    
       
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date,mst.Modl_Grp, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl  
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub
    WHERE 
        sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}' 
		group by sub.Modl_Grp
) AS combined
group by Modl_Group_Name`
    const query6 = `SELECT 
    FUEL_TYPE as loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END) AS qty_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END) AS qty_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
		FUEL_TYPE
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date,mst.FUEL_TYPE, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
   
    WHERE sub.export_type < 5
        AND sub.loc_code IN
		(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
		group by sub.FUEL_TYPE
    
    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
		FUEL_TYPE
       
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date,mst.FUEL_TYPE, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub
    WHERE 
        sub.export_type < 5
        AND sub.loc_code 
		IN (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
		group by sub.FUEL_TYPE
    
) AS combined
group by FUEL_TYPE`
    const query6pv = `SELECT 
        FUEL_TYPE as loc_code,
        SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
    
    FROM (
        -- Subquery for previous year (2023-2024)
        SELECT 
            0 AS CurrentYear,
            CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
            COUNT(*) AS qty,
        FUEL_TYPE
        FROM 
            (SELECT DISTINCT dtl.*, mst.INV_Date,mst.FUEL_TYPE, mst.Totl_Disc, mst.Loc_Code 
            FROM icm_dtl dtl 
            JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
       
        WHERE sub.export_type < 5
            AND sub.loc_code IN 
        (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
            AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        group by sub.FUEL_TYPE
        
        UNION ALL
    
        -- Subquery for current year (2024-2025)
        SELECT 
            1 AS CurrentYear,
            CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
            COUNT(*) AS qty,
        FUEL_TYPE
           
        FROM 
            (SELECT DISTINCT dtl.*, mst.INV_Date,mst.FUEL_TYPE, mst.Totl_Disc, mst.Loc_Code 
            FROM icm_dtl dtl 
            JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub
        WHERE 
            sub.export_type < 5
            AND sub.loc_code IN 
        (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
            AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
        group by sub.FUEL_TYPE
        
    ) AS combined
    group by FUEL_TYPE`

    const query7 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END) AS qty_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END) AS qty_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevMonthStart}' and '${prevMonthEnd}'
    GROUP BY g.godw_name

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${currentMonthStart}' and '${currentMonthEnd}'
    GROUP BY g.godw_name
) AS combined
GROUP BY loc_code;`
    const query7pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
        sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevMonthStart}' and '${prevMonthEnd}'
    GROUP BY g.godw_name

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
        sub.export_type < 5
        AND sub.loc_code IN (${branchesArray})
        AND sub.INV_Date BETWEEN '${currentMonthStart}' and '${currentMonthEnd}'
    GROUP BY g.godw_name
) AS combined
GROUP BY loc_code;`

    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
        SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
    FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
        sub.export_type < 5 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.Br_Segment
    
    UNION ALL
    
    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
      (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray}) 
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.Br_Segment
    ) AS combined
    GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
        SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
    FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
        sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.Br_Location
    
    UNION ALL
    
    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.Br_Location
    ) AS combined
    GROUP BY loc_code`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
    
    FROM (
    -- Subquery for previous year (2023-2024)
    SELECT 
        0 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    GROUP BY g.godw_name
    
    UNION ALL
    
    -- Subquery for current year (2024-2025)
    SELECT 
        1 AS CurrentYear,
        CONVERT(MONEY, CAST(SUM(${discount}) AS DECIMAL(12, 2))) AS chart_data, 
        COUNT(*) AS qty,
        g.godw_name AS loc_code
    FROM 
        (SELECT DISTINCT dtl.*, mst.INV_Date, mst.Totl_Disc, mst.Loc_Code 
        FROM icm_dtl dtl 
        JOIN icm_mst mst ON dtl.tran_id = mst.tran_id and  mst.EXPORT_TYPE<5) AS sub 
    JOIN godown_mst g ON g.godw_code = sub.loc_code and g.Export_Type<3
    WHERE 
         sub.export_type < 5
        and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND sub.INV_Date BETWEEN '${dates.start}' and '${dates.end}'
    GROUP BY g.godw_name
    ) AS combined
    GROUP BY loc_code;`

    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)
    const data7 = await sequelize.query(query7)
    const data7pv = await sequelize.query(query7pv)
    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2: data2[0],
      data2pv: data2pv[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
      data7: data7[0],
      data7pv: data7pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.workshopDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(dates.start, dates.end);


    const query1 = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
0 AS CurrentYear,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray}) 
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)) group by loc_code 

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
1 AS CurrentYear,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray}) 
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)) group by loc_code 
) AS combined
GROUP BY loc_code;`;
    const query2 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
   SELECT 
    COUNT(DISTINCT d.bill_no) AS chart_data,
    0 AS CurrentYear,
    (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
FROM 
    dms_row_data AS d
LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE 
    d.tran_type = 7 
    AND d.vin NOT IN ('BANDP') 
    AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2)
    ) 
GROUP BY 
    g.Br_Segment

    UNION ALL

    -- Subquery for current year (2024-2025)
   SELECT 
    COUNT(DISTINCT d.bill_no) AS chart_data,
    1 AS CurrentYear,
   (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
FROM 
    dms_row_data AS d
LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE 
    d.tran_type = 7 
    AND d.vin NOT IN ('BANDP') 
    AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
    AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
	AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2)
    ) 
GROUP BY 
    g.Br_Segment
) AS combined
GROUP BY loc_code;
    `
    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
   SELECT 
    COUNT(DISTINCT d.bill_no) AS chart_data,
    0 AS CurrentYear,
    (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
FROM 
    dms_row_data AS d
LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE 
    d.tran_type = 7 
    AND d.vin NOT IN ('BANDP') 
    AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    ) 
GROUP BY 
    g.Br_Location

    UNION ALL

    -- Subquery for current year (2024-2025)
   SELECT 
    COUNT(DISTINCT d.bill_no) AS chart_data,
    1 AS CurrentYear,
   (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
FROM 
    dms_row_data AS d
LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE 
    d.tran_type = 7 
    AND d.vin NOT IN ('BANDP') 
    AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
    AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
	AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    ) 
GROUP BY 
    g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
   SELECT 
    COUNT(DISTINCT d.bill_no) AS chart_data,
    0 AS CurrentYear,
   g.Godw_Name AS loc_code
FROM 
    dms_row_data AS d
LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE 
    d.tran_type = 7 
    AND d.vin NOT IN ('BANDP') 
    AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
    AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    ) 
GROUP BY 
    g.Godw_Name


    UNION ALL

    -- Subquery for current year (2024-2025)
   SELECT 
    COUNT(DISTINCT d.bill_no) AS chart_data,
    1 AS CurrentYear,
   g.Godw_Name AS loc_code
FROM 
    dms_row_data AS d
LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE 
    d.tran_type = 7 
    AND d.vin NOT IN ('BANDP') 
    AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
    AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
	AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    ) 
GROUP BY 
    g.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query5 = `   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
0 AS CurrentYear,
        vin as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2)  and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}))
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by vin 

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
1 AS CurrentYear,
        vin as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2)  and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}))
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by vin 
) AS combined
GROUP BY loc_code;`

    const query6 = `   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
0 AS CurrentYear,
      right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2)  and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}))
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )) group by executive 

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
1 AS CurrentYear,
       right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2)  and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}))
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )) group by executive 
) AS combined
GROUP BY loc_code;`


    const data1 = await sequelize.query(query1)
    console.log(1)
    const data2 = await sequelize.query(query2)
    console.log(2)
    const data3 = await sequelize.query(query3)
    console.log(3)
    const data4 = await sequelize.query(query4)
    console.log(4)
    const data5 = await sequelize.query(query5)
    console.log(5)
    const data6 = await sequelize.query(query6)
    console.log(6)



    res.send({
      data1: data1[0],
      data2: data2[0],
      data3: data3[0],
      data4: data4[0],
      data5: data5[0],
      data6: data6[0],

    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};

exports.workshopLabourDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );


    const query1 = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
) AS combined
GROUP BY loc_code;`;
    const query1pv = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and  Export_Type in (1,2) and loc_code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6  and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
) AS combined
GROUP BY loc_code;`;
    const query2 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Segment

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
		and d.Export_Type in (1,2) and  g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Segment

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Segment
) AS combined
GROUP BY loc_code;`

    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2) 
		 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})

        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Location

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2) 
		 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = ` SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        ) 
        ) group by g.Br_Location

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2) 
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        g.Godw_Name AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  GROUP BY 
    g.Godw_Name

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        g.Godw_Name AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  GROUP BY 
    g.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
         g.Godw_Name AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2) 
			and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )    GROUP BY 
    g.Godw_Name

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
         g.Godw_Name AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )    GROUP BY 
    g.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query5 = `   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
    SELECT sum(Taxable) AS chart_data,
0 AS CurrentYear,
        vin as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between  '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and Sale_Type='service'
 and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by vin 

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT sum(Taxable) AS chart_data,
1 AS CurrentYear,
        vin as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'   and Export_Type in (1,2)  and Sale_Type='service'
 and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by vin 
) AS combined
GROUP BY loc_code;`
    const query5pv = `   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        vin  as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) 
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by vin

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        vin as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) 
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by vin
) AS combined
GROUP BY loc_code;`
    const query6 = ` SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
    SELECT sum(Taxable) AS chart_data,
0 AS CurrentYear,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between  '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and Sale_Type='service'
 and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by executive 

    UNION ALL

    -- Subquery for current year (2024-2025)
    SELECT sum(Taxable) AS chart_data,
1 AS CurrentYear,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
 FROM dms_row_data AS d
 WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'   and Export_Type in (1,2)  and Sale_Type='service'
 and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 6 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by executive 
) AS combined
GROUP BY loc_code;`
    const query6pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) 
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by executive

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) 
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by executive
) AS combined
GROUP BY loc_code;`

    const query7 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT Executive) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Segment

    UNION ALL

    SELECT COUNT(DISTINCT Executive) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query8 = ` SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT Executive) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        ) 
        ) group by g.Br_Location

    UNION ALL

    SELECT COUNT(DISTINCT Executive) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2) 
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query9 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(DISTINCT Executive) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
         g.Godw_Name AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2) 
			and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )    GROUP BY 
    g.Godw_Name

    UNION ALL

    SELECT COUNT(DISTINCT Executive) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
         g.Godw_Name AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )    GROUP BY 
    g.Godw_Name
) AS combined
GROUP BY loc_code;`

    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)
    const data7 = await sequelize.query(query7)
    const data8 = await sequelize.query(query8)
    const data9 = await sequelize.query(query9)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2pv: data2pv[0],
      data2: data2[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
      data7: data7[0],
      data8: data8[0],
      data9: data9[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};

exports.bodyshopLoadDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    // const branchesArray = req.body.branch;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);

    const query1 = `
    SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
 FROM (
     SELECT COUNT(DISTINCT bill_no) AS chart_data,
 0 AS CurrentYear,
         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
  FROM dms_row_data AS d
  WHERE tran_type = 7 And vin  in ('BANDP') and bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray}) 
  AND NOT EXISTS (
      SELECT 1
      FROM dms_row_data AS d2
      WHERE d2.bill_no = d.bill_no
      AND d2.tran_type = 6 and d2.Export_Type in (1,2)
      and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      ) group by loc_code 
 
     UNION ALL
 
     -- Subquery for current year (2024-2025)
     SELECT COUNT(DISTINCT bill_no) AS chart_data,
 1 AS CurrentYear,
         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
  FROM dms_row_data AS d
  WHERE tran_type = 7 And vin  in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray}) 
  AND NOT EXISTS (
      SELECT 1
      FROM dms_row_data AS d2
      WHERE d2.bill_no = d.bill_no
      AND d2.tran_type = 6 and d2.Export_Type in (1,2)
      and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      ) group by loc_code 
 ) AS combined
 GROUP BY loc_code;`;
    const query2 = `
     SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
 FROM (
    SELECT 
     COUNT(DISTINCT d.bill_no) AS chart_data,
     0 AS CurrentYear,
     (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
 FROM 
     dms_row_data AS d
 LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE 
     d.tran_type = 7 
     AND d.vin  IN ('BANDP') 
     AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
     AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
     AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) 
 GROUP BY 
     g.Br_Segment
 
     UNION ALL
 
     -- Subquery for current year (2024-2025)
    SELECT 
     COUNT(DISTINCT d.bill_no) AS chart_data,
     1 AS CurrentYear,
    (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
 FROM 
     dms_row_data AS d
 LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE 
     d.tran_type = 7 
     AND d.vin  IN ('BANDP') 
     AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
     AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
   AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) 
 GROUP BY 
     g.Br_Segment
 ) AS combined
 GROUP BY loc_code;
     `
    const query3 = `SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
 FROM (
    SELECT 
     COUNT(DISTINCT d.bill_no) AS chart_data,
     0 AS CurrentYear,
     (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
 FROM 
     dms_row_data AS d
 LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE 
     d.tran_type = 7 
     AND d.vin  IN ('BANDP') 
     AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
     AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
     AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) 
 GROUP BY 
     g.Br_Location
 
     UNION ALL
 
     -- Subquery for current year (2024-2025)
    SELECT 
     COUNT(DISTINCT d.bill_no) AS chart_data,
     1 AS CurrentYear,
    (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
 FROM 
     dms_row_data AS d
 LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE 
     d.tran_type = 7 
     AND d.vin  IN ('BANDP') 
     AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
     AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
   AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) 
 GROUP BY 
     g.Br_Location
 ) AS combined
 GROUP BY loc_code;`
    const query4 = `SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
 FROM (
    SELECT 
     COUNT(DISTINCT d.bill_no) AS chart_data,
     0 AS CurrentYear,
    g.Godw_Name AS loc_code
 FROM 
     dms_row_data AS d
 LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE 
     d.tran_type = 7 
     AND d.vin  IN ('BANDP') 
     AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
     AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
     AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) 
 GROUP BY 
     g.Godw_Name
 
 
     UNION ALL
 
     -- Subquery for current year (2024-2025)
    SELECT 
     COUNT(DISTINCT d.bill_no) AS chart_data,
     1 AS CurrentYear,
    g.Godw_Name AS loc_code
 FROM 
     dms_row_data AS d
 LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE 
     d.tran_type = 7 
     AND d.vin  IN ('BANDP') 
     AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
     AND d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
   AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) 
 GROUP BY 
     g.Godw_Name
 ) AS combined
 GROUP BY loc_code;`
    const query5 = `WITH CTE_GD_FDI_TRANS AS (
  SELECT DISTINCT cust_id, CUST_NAME
  FROM GD_FDI_TRANS
  WHERE trans_type = 'WI'
    AND trans_segment = 'BANDP'
    AND LEN(cust_id) < 10
),
CTE_DMS_ROW_DATA AS (
  SELECT 
      COUNT(DISTINCT d.bill_no) AS chart_data,
      CASE 
          WHEN d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  THEN 0
          WHEN d.bill_date BETWEEN '${dates.start}' and '${dates.end}' THEN 1
      END AS CurrentYear,
      d.ledger_id AS loc_code
  FROM dms_row_data AS d
  WHERE d.tran_type = 7
    AND d.vin IN ('BANDP')
    AND d.Export_Type In (1,2)
    AND d.loc_code IN (${branchesArray})
    AND d.ledger_id IN (SELECT cust_id FROM CTE_GD_FDI_TRANS)
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )
  GROUP BY d.ledger_id, d.bill_date
)
SELECT 
  trans.CUST_NAME as loc_code,
  SUM(CASE WHEN dms.CurrentYear = 0 THEN dms.chart_data ELSE 0 END) AS chart_data_prev_year,
  SUM(CASE WHEN dms.CurrentYear = 1 THEN dms.chart_data ELSE 0 END) AS chart_data_current_year
FROM CTE_DMS_ROW_DATA AS dms
JOIN CTE_GD_FDI_TRANS AS trans
ON dms.loc_code = trans.cust_id
GROUP BY dms.loc_code, trans.CUST_NAME;
`

    const query6 = `   SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS chart_data,
0 AS CurrentYear,
  right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
FROM dms_row_data AS d
WHERE tran_type = 7 And vin  in ('BANDP') and bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2)  and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}))
AND NOT EXISTS (
 SELECT 1
 FROM dms_row_data AS d2
 WHERE d2.bill_no = d.bill_no
 AND d2.tran_type = 6 and d2.Export_Type in (1,2)
 and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
 ) group by executive 

UNION ALL

-- Subquery for current year (2024-2025)
SELECT COUNT(DISTINCT bill_no) AS chart_data,
1 AS CurrentYear,
   right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
FROM dms_row_data AS d
WHERE tran_type = 7 And vin  in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2)  and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}))
AND NOT EXISTS (
 SELECT 1
 FROM dms_row_data AS d2
 WHERE d2.bill_no = d.bill_no
 AND d2.tran_type = 6 and d2.Export_Type in (1,2)
 and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
 ) group by executive 
) AS combined
GROUP BY loc_code;`

    const data1 = await sequelize.query(query1)
    const data2 = await sequelize.query(query2)
    const data3 = await sequelize.query(query3)
    const data4 = await sequelize.query(query4)
    const data5 = await sequelize.query(query5)
    const data6 = await sequelize.query(query6)

    res.send({
      data1: data1[0],
      data2: data2[0],
      data3: data3[0],
      data4: data4[0],
      data5: data5[0],
      data6: data6[0],

    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.bodyshopLabourDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    // const branchesArray = req.body.branch;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );

    const query1 = `
    SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
 FROM (
     SELECT COUNT(DISTINCT bill_no) AS qty,
 0 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
         FROM dms_row_data AS d
         WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray})
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  group by loc_code
 
     UNION ALL
 
     SELECT COUNT(DISTINCT bill_no) AS qty,
 1 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
         FROM dms_row_data AS d
         WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray})
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  group by loc_code
 ) AS combined
 GROUP BY loc_code;`;
    const query1pv = `
    SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
 FROM (
     SELECT COUNT(DISTINCT bill_no) AS qty,
 0 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
         FROM dms_row_data AS d
         WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (${branchesArray})
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  group by loc_code
 
     UNION ALL
 
     SELECT COUNT(DISTINCT bill_no) AS qty,
 1 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
         FROM dms_row_data AS d
         WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and  Export_Type in (1,2) and loc_code in (${branchesArray})
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6  and d2.Export_Type in (1,2) 
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  group by loc_code
 ) AS combined
 GROUP BY loc_code;`;
    const query2 = `SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
 FROM (
     SELECT COUNT(DISTINCT bill_no) AS qty,
 0 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
         FROM dms_row_data AS d
     LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
         WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'
     and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         ) group by g.Br_Segment
 
     UNION ALL
 
     SELECT COUNT(DISTINCT bill_no) AS qty,
 1 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
         FROM dms_row_data AS d
         LEFT JOIN
      godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
         WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
     and d.Export_Type in (1,2) and  g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
     AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         ) group by g.Br_Segment
 ) AS combined
 GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type = 'service' THEN taxable ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE misc_type = 302 AND export_type < 3 AND misc_code = g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
      AND d.vin IN ('BANDP') 
      AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  
      and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          AND d2.Export_Type IN (1, 2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY g.Br_Segment

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type = 'service' THEN taxable ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE misc_type = 302 AND export_type < 3 AND misc_code = g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
      AND d.vin IN ('BANDP') 
      AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'  
     and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          AND d2.Export_Type IN (1, 2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY g.Br_Segment
) AS combined
GROUP BY loc_code;
`
    const query3 = `SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
 FROM (
     SELECT COUNT(DISTINCT bill_no) AS qty,
 0 AS CurrentYear,
         SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
         FROM dms_row_data AS d
     LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
         WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2) 
      and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
 
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  group by g.Br_Location
 
     UNION ALL
 
     SELECT COUNT(DISTINCT bill_no) AS qty,
 1 AS CurrentYear,
         SUM(taxable) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
         FROM dms_row_data AS d
         LEFT JOIN
      godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
         WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2) 
      and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
     AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  group by g.Br_Location
 ) AS combined
 GROUP BY loc_code;`
    const query3pv = ` SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type = 'service' THEN taxable ELSE 0 END) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
      AND d.vin IN ('BANDP') 
      AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  
      and d.Export_Type in (1,2) 
 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})     
 AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          AND d2.Export_Type IN (1, 2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY g.Br_Location

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type = 'service' THEN taxable ELSE 0 END) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
      AND d.vin IN ('BANDP') 
      AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'  
     and d.Export_Type in (1,2)
 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})      
 AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          AND d2.Export_Type IN (1, 2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY g.Br_Location
) AS combined
GROUP BY loc_code;
`
    const query4 = `SELECT 
     loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
 FROM (
     SELECT COUNT(DISTINCT bill_no) AS qty,
 0 AS CurrentYear,
         SUM(taxable) AS chart_data,
         g.Godw_Name AS loc_code
         FROM dms_row_data AS d
     LEFT JOIN 
     godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
         WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
     and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
         AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  GROUP BY 
     g.Godw_Name
 
     UNION ALL
 
     SELECT COUNT(DISTINCT bill_no) AS qty,
 1 AS CurrentYear,
         SUM(taxable) AS chart_data,
         g.Godw_Name AS loc_code
         FROM dms_row_data AS d
         LEFT JOIN
      godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
         WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
     and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
     AND NOT EXISTS (
         SELECT 1
         FROM dms_row_data AS d2
         WHERE d2.bill_no = d.bill_no
         AND d2.tran_type = 6 and d2.Export_Type in (1,2)
         and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
         )  GROUP BY 
     g.Godw_Name
 ) AS combined
 GROUP BY loc_code;`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type = 'service' THEN taxable ELSE 0 END) AS chart_data,
g.Godw_Name AS loc_code
FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
      AND d.vin IN ('BANDP') 
      AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  
      and d.Export_Type in (1,2) 
 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})     
 AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          AND d2.Export_Type IN (1, 2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY g.Godw_Name

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type = 'service' THEN taxable ELSE 0 END) AS chart_data,
g.Godw_Name AS loc_code
FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
      AND d.vin IN ('BANDP') 
      AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'  
     and d.Export_Type in (1,2)
 and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})      
 AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6 
          AND d2.Export_Type IN (1, 2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY g.Godw_Name
) AS combined
GROUP BY loc_code;
`
    const query5 = `WITH CTE_GD_FDI_TRANS AS (
    SELECT DISTINCT cust_id, CUST_NAME
    FROM GD_FDI_TRANS
    WHERE trans_type = 'WI'
      AND trans_segment = 'BANDP'
      AND LEN(cust_id) < 10
),
CTE_DMS_ROW_DATA AS (
    SELECT 
        SUM(taxable) AS chart_data,
        CASE 
            WHEN d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  THEN 0
            WHEN d.bill_date BETWEEN '${dates.start}' and '${dates.end}' THEN 1
        END AS CurrentYear,
        d.ledger_id AS loc_code
    FROM dms_row_data AS d
    WHERE d.tran_type = 7
      AND d.vin IN ('BANDP')
      AND d.Export_Type < 5
      AND d.loc_code IN (${branchesArray})
      AND d.ledger_id IN (SELECT cust_id FROM CTE_GD_FDI_TRANS)
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
            AND d2.tran_type = 6
            and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY d.ledger_id, d.bill_date
)
SELECT 
    trans.CUST_NAME as loc_code,
    SUM(CASE WHEN dms.CurrentYear = 0 THEN dms.chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN dms.CurrentYear = 1 THEN dms.chart_data ELSE 0 END) AS chart_data_current_year
FROM CTE_DMS_ROW_DATA AS dms
JOIN CTE_GD_FDI_TRANS AS trans
ON dms.loc_code = trans.cust_id
GROUP BY dms.loc_code, trans.CUST_NAME;
`
    const query5pv = `WITH CTE_GD_FDI_TRANS AS (
    SELECT DISTINCT cust_id, CUST_NAME
    FROM GD_FDI_TRANS
    WHERE trans_type = 'WI'
      AND trans_segment = 'BANDP'
      AND LEN(cust_id) < 10
),
CTE_DMS_ROW_DATA AS (
    SELECT 
        SUM(taxable) AS chart_data,
         COUNT(DISTINCT bill_no) AS qty,
        CASE 
            WHEN d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  THEN 0
            WHEN d.bill_date BETWEEN '${dates.start}' and '${dates.end}' THEN 1
        END AS CurrentYear,
        d.ledger_id AS loc_code
    FROM dms_row_data AS d
    WHERE d.tran_type = 7
      AND d.vin IN ('BANDP')
      AND d.Export_Type < 5
       AND d.loc_code IN (${branchesArray})
      AND d.ledger_id IN (SELECT cust_id FROM CTE_GD_FDI_TRANS)
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
            AND d2.tran_type = 6
            and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY d.ledger_id, d.bill_date
)
SELECT 
    trans.CUST_NAME as loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM CTE_DMS_ROW_DATA AS dms
JOIN CTE_GD_FDI_TRANS AS trans
ON dms.loc_code = trans.cust_id
GROUP BY dms.loc_code, trans.CUST_NAME;
`
    const query6 = ` SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year
FROM (
SELECT sum(Taxable) AS chart_data,
0 AS CurrentYear,
    right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
FROM dms_row_data AS d
WHERE tran_type = 7 And vin  in ('BANDP') and bill_date  between  '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and Sale_Type='service'
and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) AND NOT EXISTS (
 SELECT 1
 FROM dms_row_data AS d2
 WHERE d2.bill_no = d.bill_no
 AND d2.tran_type = 6 and d2.Export_Type in (1,2)
 and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
 ) group by executive 

UNION ALL

-- Subquery for current year (2024-2025)
SELECT sum(Taxable) AS chart_data,
1 AS CurrentYear,
    right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
FROM dms_row_data AS d
WHERE tran_type = 7 And vin  in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'   and Export_Type in (1,2)  and Sale_Type='service'
and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
AND NOT EXISTS (
 SELECT 1
 FROM dms_row_data AS d2
 WHERE d2.bill_no = d.bill_no
 AND d2.tran_type = 6 and d2.Export_Type in (1,2)
 and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
 ) group by executive 
) AS combined
GROUP BY loc_code;`
    const query6pv = `SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
    SUM(taxable) AS chart_data,
    right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM dms_row_data AS d
    WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and Export_Type in (1,2) and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) 
    AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )  group by executive

UNION ALL

SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
    SUM(taxable) AS chart_data,
    right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM dms_row_data AS d
    WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'service' and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type in (1,2) and loc_code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3) 
    AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )  group by executive
) AS combined
GROUP BY loc_code;`



    const query7 = `SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT Executive) AS qty,
0 AS CurrentYear,
    SUM(taxable) AS chart_data,
    (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
LEFT JOIN 
godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  
and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
    and d2.loc_code in (select godw_code from godown_mst where 
    Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
    )
    )  group by g.Br_Segment

UNION ALL

SELECT COUNT(DISTINCT Executive) AS qty,
1 AS CurrentYear,
    SUM(taxable) AS chart_data,
    (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN
 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
    and d2.loc_code in (select godw_code from godown_mst where 
    Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
    )
    )  group by g.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query8 = ` SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT Executive) AS qty,
0 AS CurrentYear,
    SUM(taxable) AS chart_data,
    (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
LEFT JOIN 
godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
    Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
    ) 
    ) group by g.Br_Location

UNION ALL

SELECT COUNT(DISTINCT Executive) AS qty,
1 AS CurrentYear,
    SUM(taxable) AS chart_data,
   (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN
 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2) 
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
    Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
    )
    )  group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query9 = `SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT Executive) AS qty,
0 AS CurrentYear,
    SUM(taxable) AS chart_data,
     g.Godw_Name AS loc_code
    FROM dms_row_data AS d
LEFT JOIN 
godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2) 
  and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})

    AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
    Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
    )
    )    GROUP BY 
g.Godw_Name

UNION ALL

SELECT COUNT(DISTINCT Executive) AS qty,
1 AS CurrentYear,
    SUM(taxable) AS chart_data,
     g.Godw_Name AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN
 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type = 'service' and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    
AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
    Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
    )
    )    GROUP BY 
g.Godw_Name
) AS combined
GROUP BY loc_code;`

    const [
      data1, data1pv,
      data2, data2pv,
      data3, data3pv,
      data4, data4pv,
      data5, data5pv,
      data6, data6pv,
      data7, data8,
      data9
    ] = await Promise.all([
      sequelize.query(query1),
      sequelize.query(query1pv),
      sequelize.query(query2),
      sequelize.query(query2pv),
      sequelize.query(query3),
      sequelize.query(query3pv),
      sequelize.query(query4),
      sequelize.query(query4pv),
      sequelize.query(query5),
      sequelize.query(query5pv),
      sequelize.query(query6),
      sequelize.query(query6pv),
      sequelize.query(query7),
      sequelize.query(query8),
      sequelize.query(query9),


    ]);

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2: data2[0],
      data2pv: data2pv[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
      data7: data7[0],
      data8: data8[0],
      data9: data9[0],


    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.workshopSparesDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    // const branchesArray = req.body.branch;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);

    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );

    const query1 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})        
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code 
) AS combined
GROUP BY loc_code;`;
    const query1pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})        
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code 
) AS combined
GROUP BY loc_code;`;
    const query2 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Segment

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
		and d.Export_Type in (1,2) and  g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2) 
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE misc_type = 302 AND export_type < 3 AND misc_code = g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin NOT IN ('BANDP') 
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray}) 
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
    GROUP BY g.Br_Segment

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE misc_type = 302 AND export_type < 3 AND misc_code = g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin NOT IN ('BANDP') 
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
    GROUP BY g.Br_Segment
) AS combined
GROUP BY loc_code;
`
    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and d.Export_Type in (1,2)
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Location

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${dates.start}' and '${dates.end}' and d.Export_Type in (1,2) 
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin NOT IN ('BANDP') 
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Br_Location

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin NOT IN ('BANDP') 
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        g.Godw_Name AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  GROUP BY 
    g.Godw_Name
    UNION ALL
    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        g.Godw_Name AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin not in ('BANDP') and d.Sale_Type <> 'service'  and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  GROUP BY 
    g.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 g.Godw_Name AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin NOT IN ('BANDP') 
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        AND d.Export_Type IN (1,2) and  
       g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Godw_Name
    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 g.Godw_Name AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin NOT IN ('BANDP') 
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Godw_Name
) AS combined
GROUP BY loc_code;
`
    const query5 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        vin as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and d.Sale_Type <> 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) 
        and loc_code in 
(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)   
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by vin

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        vin as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and d.Sale_Type <> 'service' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by vin 
) AS combined
GROUP BY loc_code;
`
    const query5pv = `
     SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 d.vin AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7
        AND d.vin NOT IN ('BANDP')
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
        AND d.Export_Type IN (1,2) and
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )
   group by  d.vin
    UNION ALL

    SELECT
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 d.vin AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7
        AND d.vin NOT IN ('BANDP')
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and
         g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )
   group by  d.vin
) AS combined
GROUP BY loc_code;
`
    const query6 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and d.Sale_Type <> 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) 
        and loc_code in 
(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)   
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by executive

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and d.Sale_Type <> 'service' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by executive 
) AS combined
GROUP BY loc_code;
`
    const query6pv = `
     SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 d.executive AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7
        AND d.vin NOT IN ('BANDP')
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
        AND d.Export_Type IN (1,2) and
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )
   group by  d.executive
    UNION ALL

    SELECT
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 d.executive AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7
        AND d.vin NOT IN ('BANDP')
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and
         g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )
   group by  d.executive
) AS combined
GROUP BY loc_code;
`


    //     const query6 = `SELECT 
    //     loc_code,
    //     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    //     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    //     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    //     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
    // FROM (
    // SELECT
    //      SUM(taxable) AS chart_data,
    //           COUNT(DISTINCT bill_no) AS qty,

    // 0 AS CurrentYear,
    //         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //  FROM dms_row_data AS d
    //  WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${prevMonthStart}' and '${prevMonthEnd}'   and Export_Type in (1,2) and loc_code in 
    // (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
    //  AND NOT EXISTS (
    //      SELECT 1
    //      FROM dms_row_data AS d2
    //      WHERE d2.bill_no = d.bill_no
    //      AND d2.tran_type = 6 and d2.Export_Type in (1,2)) group by loc_code 

    //     UNION ALL

    //     -- Subquery for current year (2024-2025)
    //     SELECT
    //      SUM(taxable) AS chart_data,
    //           COUNT(DISTINCT bill_no) AS qty,
    // 1 AS CurrentYear,
    //         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //  FROM dms_row_data AS d
    // (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
    //  AND NOT EXISTS (
    //      SELECT 1
    //      FROM dms_row_data AS d2
    //      WHERE d2.bill_no = d.bill_no
    //      AND d2.tran_type = 6 and d2.Export_Type in (1,2)) group by loc_code 
    // ) AS combined
    // GROUP BY loc_code;`
    //     const query6pv = `SELECT 
    //     loc_code,
    //      SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    //     SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
    // FROM (
    // SELECT
    //      SUM(taxable) AS chart_data,
    //           COUNT(DISTINCT bill_no) AS qty,

    // 0 AS CurrentYear,
    //         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //  FROM dms_row_data AS d
    //  WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${prevMonthStart}' and '${prevMonthEnd}'    and Export_Type in (1,2) and loc_code in
    // (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
    //  AND NOT EXISTS (
    //      SELECT 1
    //      FROM dms_row_data AS d2
    //      WHERE d2.bill_no = d.bill_no
    //      AND d2.tran_type = 6 and d2.Export_Type in (1,2)) group by loc_code 

    //     UNION ALL

    //     -- Subquery for current year (2024-2025)
    //     SELECT
    //      SUM(taxable) AS chart_data,
    //           COUNT(DISTINCT bill_no) AS qty,
    // 1 AS CurrentYear,
    //         (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
    //  FROM dms_row_data AS d
    //  WHERE tran_type = 7 And vin not in ('BANDP') and bill_date  between '${currentMonthStart}' and '${currentMonthEnd}' and Export_Type in (1,2) and loc_code in 
    // (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
    //  AND NOT EXISTS (
    //      SELECT 1
    //      FROM dms_row_data AS d2
    //      WHERE d2.bill_no = d.bill_no
    //      AND d2.tran_type = 6 and d2.Export_Type in (1,2)) group by loc_code 
    // ) AS combined
    // GROUP BY loc_code;`


    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    console.log(1)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    console.log(2)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    console.log(3)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    console.log(4)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    console.log(5)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)
    console.log(6)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2: data2[0],
      data2pv: data2pv[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],

    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.bodyshopSparesDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);

    const query1 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})        
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code 
) AS combined
GROUP BY loc_code;`;
    const query1pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})        
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code 
) AS combined
GROUP BY loc_code;`;
    const query2 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'
		and d.Export_Type in (1,2) and g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Segment

    UNION ALL

    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=g.Br_Segment) AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between  '${dates.start}' and '${dates.end}' 
		and d.Export_Type in (1,2) and  g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        ) 
        ) group by g.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE misc_type = 302 AND export_type < 3 AND misc_code = g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin  IN ('BANDP') 
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray}) 
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
    GROUP BY g.Br_Segment

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE misc_type = 302 AND export_type < 3 AND misc_code = g.Br_Segment) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin  IN ('BANDP') 
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment})  and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
    GROUP BY g.Br_Segment
) AS combined
GROUP BY loc_code;
`
    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
   SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and d.Export_Type in (1,2)
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        ) group by g.Br_Location

    UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${dates.start}' and '${dates.end}' and d.Export_Type in (1,2) 
and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin  IN ('BANDP') 
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Br_Location

    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
         (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=g.Br_Location) AS loc_code
    FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin  IN ('BANDP') 
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Br_Location
) AS combined
GROUP BY loc_code;`
    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
        SUM(taxable) AS chart_data,
        g.Godw_Name AS loc_code
        FROM dms_row_data AS d
		LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type <> 'service' and d.bill_date between '${prevYearDates.start}' and '${prevYearDates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  GROUP BY 
    g.Godw_Name
    UNION ALL
    SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
        SUM(taxable) AS chart_data,
        g.Godw_Name AS loc_code
        FROM dms_row_data AS d
        LEFT JOIN
		 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
        WHERE d.tran_type = 7 And d.vin  in ('BANDP') and d.Sale_Type <> 'service'  and d.bill_date between  '${dates.start}' and '${dates.end}'  and d.Export_Type in (1,2)
		and g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
		AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )  GROUP BY 
    g.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 g.Godw_Name AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin  IN ('BANDP') 
        AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
        AND d.Export_Type IN (1,2) and  
       g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Godw_Name
    UNION ALL

    SELECT 
        COUNT(DISTINCT bill_no) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
 g.Godw_Name AS loc_code
 FROM dms_row_data AS d
    LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE d.tran_type = 7 
        AND d.vin  IN ('BANDP') 
        AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
        AND d.Export_Type IN (1,2) and  
        g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
        AND NOT EXISTS (
            SELECT 1
            FROM dms_row_data AS d2
            WHERE d2.bill_no = d.bill_no
              AND d2.tran_type = 6 
              AND d2.Export_Type IN (1,2)
              and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
        )   
   group by g.Godw_Name
) AS combined
GROUP BY loc_code;
`
    const query5 = `WITH CTE_GD_FDI_TRANS AS (
    SELECT DISTINCT cust_id, CUST_NAME
    FROM GD_FDI_TRANS
    WHERE trans_type = 'WI'
      AND trans_segment = 'BANDP'
      AND LEN(cust_id) < 10
),
CTE_DMS_ROW_DATA AS (
    SELECT 
        SUM(taxable) AS chart_data,
        CASE 
            WHEN d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  THEN 0
            WHEN d.bill_date BETWEEN '${dates.start}' and '${dates.end}' THEN 1
        END AS CurrentYear,
        d.ledger_id AS loc_code
    FROM dms_row_data AS d
    WHERE d.tran_type = 7 And d.vin  in ('BANDP')
      AND d.Export_Type < 5
      AND d.loc_code IN (${branchesArray}) 
      AND d.ledger_id IN (SELECT cust_id FROM CTE_GD_FDI_TRANS)
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
            AND d2.tran_type = 6
            and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY d.ledger_id, d.bill_date
)
SELECT 
    trans.CUST_NAME as loc_code,
    SUM(CASE WHEN dms.CurrentYear = 0 THEN dms.chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN dms.CurrentYear = 1 THEN dms.chart_data ELSE 0 END) AS chart_data_current_year
FROM CTE_DMS_ROW_DATA AS dms
JOIN CTE_GD_FDI_TRANS AS trans
ON dms.loc_code = trans.cust_id
GROUP BY dms.loc_code, trans.CUST_NAME;
`
    const query5pv = `WITH CTE_GD_FDI_TRANS AS (
    SELECT DISTINCT cust_id, CUST_NAME
    FROM GD_FDI_TRANS
    WHERE trans_type = 'WI'
      AND trans_segment = 'BANDP'
      AND LEN(cust_id) < 10
),
CTE_DMS_ROW_DATA AS (
    SELECT 
        SUM(taxable) AS chart_data,
        COUNT(DISTINCT bill_no) AS qty,
        CASE 
            WHEN d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'  THEN 0
            WHEN d.bill_date BETWEEN '${dates.start}' and '${dates.end}' THEN 1
        END AS CurrentYear,
        d.ledger_id AS loc_code
    FROM dms_row_data AS d
    WHERE d.tran_type = 7 And d.vin  in ('BANDP')
      AND d.Export_Type < 5
      AND d.loc_code IN (${branchesArray}) 
      AND d.ledger_id IN (SELECT cust_id FROM CTE_GD_FDI_TRANS)
      AND NOT EXISTS (
          SELECT 1
          FROM dms_row_data AS d2
          WHERE d2.bill_no = d.bill_no
            AND d2.tran_type = 6
            and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
      )
    GROUP BY d.ledger_id, d.bill_date
)
SELECT 
    trans.CUST_NAME as loc_code,
         SUM(CASE WHEN dms.CurrentYear = 0 THEN dms.chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN dms.CurrentYear = 0 THEN dms.qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN dms.CurrentYear = 1 THEN dms.chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN dms.CurrentYear = 1 THEN dms.qty ELSE 0 END), 0) AS chart_data_current_year
FROM CTE_DMS_ROW_DATA AS dms
JOIN CTE_GD_FDI_TRANS AS trans
ON dms.loc_code = trans.cust_id
GROUP BY dms.loc_code, trans.CUST_NAME;
`

    const query6 = `
SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
0 AS CurrentYear,
    SUM(taxable) AS chart_data,
    right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM dms_row_data AS d
    WHERE tran_type = 7 And vin  in ('BANDP') and d.Sale_Type <> 'service' and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type in (1,2) 
    and loc_code in 
(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)   
AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )  group by executive

UNION ALL
SELECT COUNT(DISTINCT bill_no) AS qty,
1 AS CurrentYear,
    SUM(taxable) AS chart_data,
    right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM dms_row_data AS d
    WHERE tran_type = 7 And vin  in ('BANDP') and d.Sale_Type <> 'service' and bill_date between '${dates.start}' and '${dates.end}' and Export_Type in (1,2) and loc_code in 
(select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
AND NOT EXISTS (
    SELECT 1
    FROM dms_row_data AS d2
    WHERE d2.bill_no = d.bill_no
    AND d2.tran_type = 6 and d2.Export_Type in (1,2)
    and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )  group by executive 
) AS combined
GROUP BY loc_code;
`
    const query6pv = `
 SELECT 
loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
SELECT
    COUNT(DISTINCT bill_no) AS qty,
    0 AS CurrentYear,
    SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
    right(d.executive, CHARINDEX(' - ', d.executive) - 1) loc_code
FROM dms_row_data AS d
LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE d.tran_type = 7
    AND d.vin  IN ('BANDP')
    AND d.bill_date BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
    AND d.Export_Type IN (1,2) and
    g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6
          AND d2.Export_Type IN (1,2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )
group by  d.executive
UNION ALL

SELECT
    COUNT(DISTINCT bill_no) AS qty,
    1 AS CurrentYear,
    SUM(CASE WHEN d.Sale_Type <> 'service' THEN taxable ELSE 0 END) AS chart_data,
    right(d.executive, CHARINDEX(' - ', d.executive) - 1) loc_code
FROM dms_row_data AS d
LEFT JOIN godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
WHERE d.tran_type = 7
    AND d.vin  IN ('BANDP')
    AND d.bill_date BETWEEN '${dates.start}' and '${dates.end}'
    AND d.Export_Type IN (1,2) and
     g.Br_Segment in (${Br_Segment}) and g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
          AND d2.tran_type = 6
          AND d2.Export_Type IN (1,2)
          and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
    )
group by  d.executive
) AS combined
GROUP BY loc_code;
`


    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2: data2[0],
      data2pv: data2pv[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],

    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.workshopLabourdiscountDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );
    const query1 = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where Godw_Code in (${branchesArray}) and Export_Type<3)
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by LOC_CD

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) )
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by LOC_CD
) AS combined
GROUP BY loc_code;`;

    const query1pv = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
          group by LOC_CD

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) )
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by LOC_CD
) AS combined
GROUP BY loc_code;`;

    const query2 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Br_Segment

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
          group by gm.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
    (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Br_Segment

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
            group by gm.Br_Segment
) AS combined
GROUP BY loc_code;`

    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          GROUP BY 
    gm.Br_Location

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998'  and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
          GROUP BY 
    gm.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
      SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}' )
        GROUP BY  gm.Br_Location

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
        GROUP BY   gm.Br_Location
) AS combined
GROUP BY loc_code;`

    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     gm.godw_Name as loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and  gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Godw_Name

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
gm.godw_Name as loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
                group by gm.Godw_Name
) AS combined
GROUP BY loc_code`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     gm.godw_Name as loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Godw_Name

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
gm.godw_Name as loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by gm.Godw_Name
) AS combined
GROUP BY loc_code`

    const query5 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by TRANS_SEGMENT
    UNION ALL
     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code
    `
    const query5pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by TRANS_SEGMENT

    UNION ALL

     SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code
    `
    const query6 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by executive
    UNION ALL
     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by executive
) AS combined
GROUP BY loc_code
    `
    const query6pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by executive

    UNION ALL

     SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by executive
) AS combined
GROUP BY loc_code
    `

    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2pv: data2pv[0],
      data2: data2[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.bodyshopLabourdiscountDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );


    const query1 = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where Godw_Code in (${branchesArray}) and Export_Type<3)
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by LOC_CD

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) )
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by LOC_CD
) AS combined
GROUP BY loc_code;`;

    const query1pv = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
          group by LOC_CD

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) )
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by LOC_CD
) AS combined
GROUP BY loc_code;`;

    const query2 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Br_Segment

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
          group by gm.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
     SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
    (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Br_Segment

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
            group by gm.Br_Segment
) AS combined
GROUP BY loc_code;`

    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          GROUP BY 
    gm.Br_Location

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998'  and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
          GROUP BY 
    gm.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
      SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
   SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}' )
        GROUP BY  gm.Br_Location

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}' )
        GROUP BY   gm.Br_Location
) AS combined
GROUP BY loc_code;`

    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     gm.godw_Name as loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and  gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Godw_Name

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
gm.godw_Name as loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
                group by gm.Godw_Name
) AS combined
GROUP BY loc_code`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     gm.godw_Name as loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by gm.Godw_Name

    UNION ALL

    SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
gm.godw_Name as loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) = '998' and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by gm.Godw_Name
) AS combined
GROUP BY loc_code`

    const query5 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by TRANS_SEGMENT
    UNION ALL
     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code
    `
    const query5pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by TRANS_SEGMENT

    UNION ALL

     SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code
    `
    const query6 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by executive
    UNION ALL
     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by executive
) AS combined
GROUP BY loc_code
    `
    const query6pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${prevYearDates.start}' and '${prevYearDates.end}')
          group by executive

    UNION ALL

     SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) = '998' and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
   and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between '${dates.start}' and '${dates.end}')
          group by executive
) AS combined
GROUP BY loc_code
    `

    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2pv: data2pv[0],
      data2: data2[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.workshopSpearsdiscountDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );


    const query1 = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) not in ('998')and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where Godw_Code in (${branchesArray}) )
and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
          group by LOC_CD

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) )
  and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')
          group by LOC_CD
) AS combined
GROUP BY loc_code;`;
    const query1pv = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD and gm.export_type < 3 ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) and Export_Type<3)
  and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by LOC_CD

    UNION ALL

     SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD and gm.export_type < 3 ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) and Export_Type<3)
    and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by LOC_CD
) AS combined
GROUP BY loc_code;`;


    const query2 = `
SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
    and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
 
group by gm.Br_Segment

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
      and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by gm.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name 
         FROM Misc_Mst 
         WHERE misc_type = 302 
           AND export_type < 3 
           AND misc_code = gm.Br_Segment) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}' 
      AND gm.Br_Segment IN (${Br_Segment}) 
      AND gm.Godw_Code IN (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
    GROUP BY gm.Br_Segment

    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name 
         FROM Misc_Mst 
         WHERE misc_type = 302 
           AND export_type < 3 
           AND misc_code = gm.Br_Segment) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}'
      AND gm.Br_Segment IN (${Br_Segment}) 
      AND gm.Godw_Code IN (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    GROUP BY gm.Br_Segment
) AS combined
GROUP BY loc_code;`

    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
   (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
        and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          GROUP BY 
    gm.Br_Location

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
          and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

         GROUP BY 
    gm.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
           (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}' 
      and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
    GROUP BY gm.Br_Location

    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
           (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}'
      and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    GROUP BY gm.Br_Location
) AS combined
GROUP BY loc_code;`

    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
    gm.godw_Name as loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) not in ( '998') and  gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
            and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by gm.Godw_Name

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
gm.godw_Name as loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ( '998') and  gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
    and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by gm.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
         gm.godw_Name as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'  and 
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
   group by gm.Godw_Name
    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        gm.godw_Name as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}' and
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    group by gm.Godw_Name
) AS combined
GROUP BY loc_code;

`

    const query5 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
                and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by TRANS_SEGMENT

    UNION ALL

     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
        and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code
    `
    const query5pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
         TRANS_SEGMENT as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'  and 
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
   group by TRANS_SEGMENT
    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        TRANS_SEGMENT as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}' and
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code;
    `
    const query6 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
                and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by executive

    UNION ALL

     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
        and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by executive
) AS combined
GROUP BY loc_code
    `
    const query6pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
         right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'  and 
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
   group by executive
    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT NOT IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}' and
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    group by executive
) AS combined
GROUP BY loc_code;
    `

    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2pv: data2pv[0],
      data2: data2[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.bodyshopSpearsdiscountDashBoardseva = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    // const currentDate = new Date(dates.end); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );

    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    const query1 = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3)  in ('998')and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where Godw_Code in (${branchesArray}) )
and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
          group by LOC_CD

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3)  in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) )
  and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')
          group by LOC_CD
) AS combined
GROUP BY loc_code;`;
    const query1pv = `
   SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT COUNT(distinct(trans_id)) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD and gm.export_type < 3 ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3)  in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) and Export_Type<3)
  and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by LOC_CD

    UNION ALL

     SELECT COUNT(distinct(trans_id)) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
        (select top 1 godw_name from godown_mst gm where Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD and gm.export_type < 3 ) as loc_code
        FROM gd_fdi_trans AS g
        WHERE trans_type = 'wi' And  TRANS_SEGMENT NOT IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3)  in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-S','') from Godown_Mst where Godw_Code in (${branchesArray}) and Export_Type<3)
    and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by LOC_CD
) AS combined
GROUP BY loc_code;`;


    const query2 = `
SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     (select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
    and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')
 
group by gm.Br_Segment

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=302 and export_type<3 and misc_code=gm.Br_Segment) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment})  and gm.Godw_Code in (${branchesArray})
      and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by gm.Br_Segment
) AS combined
GROUP BY loc_code;`
    const query2pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name 
         FROM Misc_Mst 
         WHERE misc_type = 302 
           AND export_type < 3 
           AND misc_code = gm.Br_Segment) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}' 
      AND gm.Br_Segment IN (${Br_Segment}) 
      AND gm.Godw_Code IN (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
    GROUP BY gm.Br_Segment

    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        (SELECT TOP 1 Misc_name 
         FROM Misc_Mst 
         WHERE misc_type = 302 
           AND export_type < 3 
           AND misc_code = gm.Br_Segment) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}'
      AND gm.Br_Segment IN (${Br_Segment}) 
      AND gm.Godw_Code IN (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    GROUP BY gm.Br_Segment
) AS combined
GROUP BY loc_code;`

    const query3 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
   (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
        and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          GROUP BY 
    gm.Br_Location

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
(select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}' 
  AND LEFT(HSN_NO, 3) not in ('998')  and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
          and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

         GROUP BY 
    gm.Br_Location
) AS combined
GROUP BY loc_code;`
    const query3pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
           (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}' 
      and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
    GROUP BY gm.Br_Location

    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
           (select top 1 Misc_name from Misc_Mst where misc_type=303 and export_type<3 and misc_code=gm.Br_Location) AS loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}'
      and gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    GROUP BY gm.Br_Location
) AS combined
GROUP BY loc_code;`

    const query4 = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
    gm.godw_Name as loc_code
        FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-S','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}' 
  AND LEFT(HSN_NO, 3) not in ( '998') and  gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
            and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by gm.Godw_Name

    UNION ALL

    SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
gm.godw_Name as loc_code
FROM gd_fdi_trans AS g
		LEFT JOIN 
    godown_mst AS gm ON Replace(gm.NEWCAR_RCPT,'-W','') = g.LOC_CD 
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ( '998') and  gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
    and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by gm.Godw_Name
) AS combined
GROUP BY loc_code;`
    const query4pv = `SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
         gm.godw_Name as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'  and 
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
   group by gm.Godw_Name
    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        gm.godw_Name as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}' and
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    group by gm.Godw_Name
) AS combined
GROUP BY loc_code;

`

    const query5 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
                and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by TRANS_SEGMENT

    UNION ALL

     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     TRANS_SEGMENT as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
        and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code
    `
    const query5pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
         TRANS_SEGMENT as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'  and 
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
   group by TRANS_SEGMENT
    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        TRANS_SEGMENT as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}' and
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    group by TRANS_SEGMENT
) AS combined
GROUP BY loc_code;
    `
    const query6 = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,        
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,     
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS per_vehicle_cost_current_year
FROM (
    SELECT COUNT(trans_id) AS qty,
0 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' and '${prevYearDates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
                and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${prevYearDates.start}' and '${prevYearDates.end}')

          group by executive

    UNION ALL

     SELECT COUNT(trans_id) AS qty,
1 AS CurrentYear,
        SUM(discount) AS chart_data,
     right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
        FROM gd_fdi_trans AS g   
        WHERE trans_type = 'wi' And  TRANS_SEGMENT  IN ('BANDP')
  AND CAST(TRANS_DATE AS DATE) BETWEEN  '${dates.start}' and '${dates.end}'
  AND LEFT(HSN_NO, 3) not in ('998') and  LOC_CD in (select Replace(NEWCAR_RCPT,'-W','') from Godown_Mst where  Br_Segment in (${Br_Segment}) AND BR_LOCATION in (${Br_Location}) and Godw_Code in (${branchesArray}))
        and TRANS_ID not in (select trans_id from  GD_FDI_TRANS where  trans_type='wc'  and trans_date between  '${dates.start}' and '${dates.end}')

          group by executive
) AS combined
GROUP BY loc_code
    `
    const query6pv = `
    SELECT 
    loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 0 THEN qty ELSE 0 END), 0) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) / NULLIF(SUM(CASE WHEN CurrentYear = 1 THEN qty ELSE 0 END), 0) AS chart_data_current_year
FROM (
    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        0 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
         right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'  and 
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${prevYearDates.start}' AND '${prevYearDates.end}'
      )
   group by executive
    UNION ALL

    SELECT 
        COUNT(DISTINCT trans_id) AS qty,
        1 AS CurrentYear,
        SUM(CASE WHEN LEFT(HSN_NO, 3) NOT IN ('998') THEN discount ELSE 0 END) AS chart_data,
        right(executive, CHARINDEX(' - ', executive) - 1) as loc_code
    FROM gd_fdi_trans AS g
    LEFT JOIN godown_mst AS gm 
        ON REPLACE(gm.NEWCAR_RCPT, '-W', '') = g.LOC_CD 
    WHERE trans_type = 'wi' 
      AND TRANS_SEGMENT  IN ('BANDP')
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${dates.start}' AND '${dates.end}' and
     gm.Br_Segment in (${Br_Segment}) and gm.Br_Location in (${Br_Location}) and gm.Godw_Code in (${branchesArray})
      AND TRANS_ID NOT IN (
          SELECT trans_id 
          FROM GD_FDI_TRANS 
          WHERE trans_type = 'wc' 
            AND TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      )
    group by executive
) AS combined
GROUP BY loc_code;
    `

    const data1 = await sequelize.query(query1)
    const data1pv = await sequelize.query(query1pv)
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)
    const data4 = await sequelize.query(query4)
    const data4pv = await sequelize.query(query4pv)
    const data5 = await sequelize.query(query5)
    const data5pv = await sequelize.query(query5pv)
    const data6 = await sequelize.query(query6)
    const data6pv = await sequelize.query(query6pv)

    res.send({
      data1: data1[0],
      data1pv: data1pv[0],
      data2pv: data2pv[0],
      data2: data2[0],
      data3: data3[0],
      data3pv: data3pv[0],
      data4: data4[0],
      data4pv: data4pv[0],
      data5: data5[0],
      data5pv: data5pv[0],
      data6: data6[0],
      data6pv: data6pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.VasDashboard = async function (req, res) {
  console.log(req.body, 'body')
  const sequelize = await dbname(req.headers.compcode);
  try {
    console.log(req.body)
    const monthStart = parseInt(req.body.monthFrom);
    const monthEnd = parseInt(req.body.monthTo);
    const year = parseInt(req.body.year);
    const branch = req.body.branch;
    const dates = req.body;

    const DuracoatNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 35) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`
    );

    const AntirustNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 32) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`
    );

    const CeramicNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 33) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`
    );

    const CarpetNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 40) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`
    );

    const DuracoatArena = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 35) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`
    );
    const AntirustArena = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 32) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`
    );

    const CeramicArena = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 33) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`
    );

    const CarpetArena = await sequelize.query(
      `select COUNT(*) AS chart_data,
      (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code 
      from SPARE_LAB_DTL where 
      CODE in (select Misc_Code from Misc_Mst where Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code = 40) 
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND DESCRIPTION not in ('RAT REPELLENT') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`
    );
    const RatRepArena = await sequelize.query(
      `select COUNT(*) AS chart_data,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where 
      ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 1 AND Misc_Code = 7) AND DESCRIPTION like '%Rat%'
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);

    const RatRepNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where   
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 1 AND Misc_Code = 7) AND DESCRIPTION like '%Rat%'  
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}')  
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const DoorLamNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code = 36) AND DESCRIPTION like '%Door Lamination%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const DoorLamArena = await sequelize.query(
      `select COUNT(*) AS chart_data,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code = 36) AND DESCRIPTION like '%Door Lamination%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);

    const FilmFrontNexa = await sequelize.query(
      `select COUNT(*) AS TotalCount,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS Location, DESCRIPTION from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code in (37)) AND DESCRIPTION like '%Film - Front%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const FilmFullNexa = await sequelize.query(
      `select COUNT(*) AS TotalCount,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS Location, DESCRIPTION from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code in (38)) AND DESCRIPTION like '%Film - Full%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const FilmRSNexa = await sequelize.query(
      `select COUNT(*) AS TotalCount,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS Location, DESCRIPTION from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code in (39)) AND DESCRIPTION like '%Film - Rear%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const FilmFrontArena = await sequelize.query(
      `select COUNT(*) AS TotalCount,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS Location, DESCRIPTION from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code in (37)) AND DESCRIPTION like '%Film - Front%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);

    const FilmFullArena = await sequelize.query(
      `select COUNT(*) AS TotalCount,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS Location, DESCRIPTION from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code in (38)) AND DESCRIPTION like '%Film - Full%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);

    const FilmRSArena = await sequelize.query(
      `select COUNT(*) AS TotalCount,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS Location, DESCRIPTION from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code in (39)) AND DESCRIPTION like '%Film - Rear%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${branch}) AND INV_DATE BETWEEN '${dates.start}' AND '${dates.end}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);

    const TotalCarSale = await sequelize.query(`SELECT 
    COALESCE(SUM(CASE WHEN tran_type = 2 THEN 1 ELSE 0 END) - 
    SUM(CASE WHEN tran_type = 4 THEN 1 ELSE 0 END), 0) AS chart_data, 
    g.godw_name as loc_code FROM 
    GODOWN_MST g LEFT JOIN chas_tran c ON c.loc_code = g.godw_code 
    AND item_type = 2 AND c.Export_Type < 5 
    and c.tran_date between'${dates.start}' and '${dates.end}' WHERE
    g.godw_code in (${branch}) and g.export_type < 3 
    GROUP BY g.godw_name ORDER BY g.godw_name `);
    const BranchWiseVasSaleNexa = await sequelize.query(`SELECT 
    COUNT(*) AS chart_data,
    SUM(RATE * (CASE 
        WHEN QUANTITY IS NULL THEN 0
        ELSE QUANTITY
    END)) AS TotalAmount,
    (SELECT TOP 1 Godw_Name 
     FROM Godown_Mst 
     WHERE Godw_Code = LOC_CODE AND export_type < 3) AS loc_code
FROM 
    SPARE_LAB_DTL 
WHERE 
    TRAN_ID IN (
        SELECT TRAN_ID 
        FROM SPARE_LAB_MST 
        WHERE 
            VAS_TYPE = 'SALES' 
            AND EXPORT_TYPE <> 33 
            AND LOC_CODE IN (${branch}) 
            AND INV_DATE BETWEEN '${dates.start}' and '${dates.end}'
    ) 
    AND LOC_CODE IN (
        SELECT Godw_Code 
        FROM Godown_Mst 
        WHERE Godw_Name LIKE '%NEXA%'
    ) 
GROUP BY 
    LOC_CODE;`);
    const BranchWiseVasSaleArena = await sequelize.query(`SELECT 
    COUNT(*) AS chart_data,
    SUM(RATE * (CASE 
        WHEN QUANTITY IS NULL THEN 0
        ELSE QUANTITY
    END)) AS TotalAmount,
    (SELECT TOP 1 Godw_Name 
     FROM Godown_Mst 
     WHERE Godw_Code = LOC_CODE AND export_type < 3) AS loc_code
FROM 
    SPARE_LAB_DTL 
WHERE 
    TRAN_ID IN (
        SELECT TRAN_ID 
        FROM SPARE_LAB_MST 
        WHERE 
            VAS_TYPE = 'SALES' 
            AND EXPORT_TYPE <> 33 
            AND LOC_CODE IN (${branch}) 
            AND INV_DATE BETWEEN '${dates.start}' and '${dates.end}'
    ) 
    AND LOC_CODE IN (
        SELECT Godw_Code 
        FROM Godown_Mst 
        WHERE Godw_Name LIKE '%ARENA%'
    ) 
GROUP BY 
    LOC_CODE;`);
    const FilteredNexaVP = BranchWiseVasSaleNexa[0].map(
      (item) => {
        const totalSale = TotalCarSale[0]?.find(
          (sale) =>
            sale.loc_code.toUpperCase() === item.loc_code.toUpperCase()
        );
        const penetration =
          totalSale && totalSale.chart_data > 0
            ? item.TotalAmount / totalSale.chart_data
            : 0;
        return {
          loc_code: totalSale.loc_code,
          chart_data: parseInt(penetration),
        };
      }
    );
    const FilteredArenaVP = BranchWiseVasSaleArena[0].map(
      (item1) => {
        const totalSale1 = TotalCarSale[0]?.find(
          (sale1) =>
            sale1.loc_code.toUpperCase() === item1.loc_code.toUpperCase()
        );
        const penetration1 =
          totalSale1 && totalSale1.chart_data > 0
            ? item1.TotalAmount / totalSale1.chart_data
            : 0;
        return {
          loc_code: totalSale1?.loc_code ? totalSale1?.loc_code : '',
          chart_data: parseInt(penetration1),
        };
      }
    );
    const FilmNexa = {
      FilmFrontNexa: FilmFrontNexa[0],
      FilmFullNexa: FilmFullNexa[0],
      FilmRSNexa: FilmRSNexa[0],
    }
    const FilmArena = {
      FilmFrontNexa: FilmFrontArena[0],
      FilmFullNexa: FilmFullArena[0],
      FilmRSNexa: FilmRSArena[0],
    }
    res.send({
      DuracoatNexa: DuracoatNexa[0],
      AntirustNexa: AntirustNexa[0],
      CeramicNexa: CeramicNexa[0],
      CarpetNexa: CarpetNexa[0],
      DuracoatArena: DuracoatArena[0],
      AntirustArena: AntirustArena[0],
      CeramicArena: CeramicArena[0],
      CarpetArena: CarpetArena[0],
      RatRepArena: RatRepArena[0],
      RatRepNexa: RatRepNexa[0],
      DoorLamNexa: DoorLamNexa[0],
      DoorLamArena: DoorLamArena[0],
      FilteredNexaVP: FilteredNexaVP,
      FilteredArenaVP: FilteredArenaVP,
      FilmNexa: FilmNexa,
      FilmArena: FilmArena,
      TotalCarSale: TotalCarSale[0]
    });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
  }
};
exports.VasGlanceExport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  const data = req.query;
  const dateto = data.dateto;
  const dateFrom = data.dateFrom;
  const Loc_Code = data.Loc_Code;

  try {
    let NexaDetails = await sequelize.query(
      `SELECT COUNT(*) AS chart_data, DESCRIPTION,
          (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code
          FROM SPARE_LAB_DTL 
          WHERE CODE IN (SELECT Misc_Code FROM Misc_Mst WHERE Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code IN (35,32,33,40))
          AND DESCRIPTION NOT IN ('RAT REPELLENT')
          AND TRAN_ID IN (SELECT TRAN_ID FROM SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE IN (${Loc_Code}) AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}')
          AND LOC_CODE IN (SELECT Godw_Code FROM Godown_Mst WHERE Godw_Name LIKE '%NEXA%') 
          GROUP BY DESCRIPTION, LOC_CODE ORDER BY DESCRIPTION`
    );

    let ArenaDetails = await sequelize.query(
      `SELECT COUNT(*) AS chart_data, DESCRIPTION,
          (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code
          FROM SPARE_LAB_DTL 
          WHERE CODE IN (SELECT Misc_Code FROM Misc_Mst WHERE Misc_Type = 605 AND Misc_Phon = 1 AND Misc_Code IN (35,32,33,40))
          AND DESCRIPTION NOT IN ('RAT REPELLENT')
          AND TRAN_ID IN (SELECT TRAN_ID FROM SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE IN (${Loc_Code}) AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}')
          AND LOC_CODE IN (SELECT Godw_Code FROM Godown_Mst WHERE Godw_Name LIKE '%ARENA%') 
          GROUP BY DESCRIPTION, LOC_CODE ORDER BY DESCRIPTION`
    );
    const RatRepArena = await sequelize.query(
      `select COUNT(*) AS chart_data,DESCRIPTION,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where 
      ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 1 AND Misc_Code = 7) AND DESCRIPTION like '%Rat%'
      AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${Loc_Code}) AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}') 
      AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);

    const RatRepNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,DESCRIPTION,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where   
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 1 AND Misc_Code = 7) AND DESCRIPTION like '%Rat%'  
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${Loc_Code}) AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}')  
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const DoorLamNexa = await sequelize.query(
      `select COUNT(*) AS chart_data,DESCRIPTION,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code = 36) AND DESCRIPTION like '%Door Lamination%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${Loc_Code}) AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%NEXA%') Group by DESCRIPTION , LOC_CODE`);

    const DoorLamArena = await sequelize.query(
      `select COUNT(*) AS chart_data,DESCRIPTION,(SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code from SPARE_LAB_DTL where 
    ITEM_CODE in (select Misc_Code from Misc_Mst where Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code = 36) AND DESCRIPTION like '%Door Lamination%'
    AND TRAN_ID in (select TRAN_ID from SPARE_LAB_MST WHERE VAS_TYPE = 'SALES' AND EXPORT_TYPE <> 33 AND LOC_CODE in (${Loc_Code}) AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}') 
    AND LOC_CODE in (SELECT Godw_Code FROM Godown_Mst where Godw_Name like '%ARENA%') Group by DESCRIPTION , LOC_CODE`);
    const FilmNexa = await sequelize.query(
      `SELECT 
    (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code,
    'Film' AS DESCRIPTION,
    COUNT(*) AS chart_data
FROM 
    SPARE_LAB_DTL 
WHERE 
    ITEM_CODE IN (SELECT Misc_Code FROM Misc_Mst WHERE Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code IN (37, 38, 39)) 
    AND DESCRIPTION LIKE '%Film%'
    AND TRAN_ID IN (
        SELECT TRAN_ID 
        FROM SPARE_LAB_MST 
        WHERE VAS_TYPE = 'SALES' 
        AND EXPORT_TYPE <> 33 
        AND LOC_CODE IN (${Loc_Code}) 
        AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}'
    ) 
    AND LOC_CODE IN (
        SELECT Godw_Code 
        FROM Godown_Mst 
        WHERE Godw_Name LIKE '%NEXA%'
    ) 
GROUP BY LOC_CODE 
ORDER BY LOC_CODE;
`);
    const FilmArena = await sequelize.query(
      `SELECT 
    (SELECT TOP 1 Godw_Name FROM Godown_Mst where Godw_Code = LOC_CODE AND export_type < 3) AS loc_code,
    'Film' AS DESCRIPTION,
    COUNT(*) AS chart_data
FROM 
    SPARE_LAB_DTL 
WHERE 
    ITEM_CODE IN (SELECT Misc_Code FROM Misc_Mst WHERE Misc_Type = 604 AND Misc_Phon = 2 AND Misc_Code IN (37, 38, 39)) 
    AND DESCRIPTION LIKE '%Film%'
    AND TRAN_ID IN (
        SELECT TRAN_ID 
        FROM SPARE_LAB_MST 
        WHERE VAS_TYPE = 'SALES' 
        AND EXPORT_TYPE <> 33 
        AND LOC_CODE IN (${Loc_Code}) 
        AND INV_DATE BETWEEN '${dateFrom}' AND '${dateto}'
    ) 
    AND LOC_CODE IN (
        SELECT Godw_Code 
        FROM Godown_Mst 
        WHERE Godw_Name LIKE '%ARENA%'
    ) 
GROUP BY LOC_CODE 
ORDER BY LOC_CODE;`);
    const AutovynRetails = await sequelize.query(`SELECT 
      COALESCE(SUM(CASE WHEN tran_type = 2 THEN 1 ELSE 0 END) - 
      SUM(CASE WHEN tran_type = 4 THEN 1 ELSE 0 END), 0) AS chart_data, 
      g.godw_name as loc_code FROM 
      GODOWN_MST g LEFT JOIN chas_tran c ON c.loc_code = g.godw_code 
      AND item_type = 2 AND c.Export_Type < 5 
      and c.tran_date between'${dateFrom}' and '${dateto}' WHERE
      g.godw_code in (${Loc_Code}) and g.export_type < 3 
      GROUP BY g.godw_name ORDER BY g.godw_name `);
    const BranchWiseVasSaleNexa = await sequelize.query(`SELECT 
        COUNT(*) AS chart_data,
        SUM(RATE * (CASE 
            WHEN QUANTITY IS NULL THEN 0
            ELSE QUANTITY
        END)) AS TotalAmount,
        (SELECT TOP 1 Godw_Name 
         FROM Godown_Mst 
         WHERE Godw_Code = LOC_CODE AND export_type < 3) AS loc_code
    FROM 
        SPARE_LAB_DTL 
    WHERE 
        TRAN_ID IN (
            SELECT TRAN_ID 
            FROM SPARE_LAB_MST 
            WHERE 
                VAS_TYPE = 'SALES' 
                AND EXPORT_TYPE <> 33 
                AND LOC_CODE IN (${Loc_Code}) 
                AND INV_DATE BETWEEN '${dateFrom}' and '${dateto}'
        ) 
        AND LOC_CODE IN (
            SELECT Godw_Code 
            FROM Godown_Mst 
            WHERE Godw_Name LIKE '%NEXA%'
        ) 
    GROUP BY 
        LOC_CODE;`);
    const BranchWiseVasSaleArena = await sequelize.query(`SELECT 
        COUNT(*) AS chart_data,
        SUM(RATE * (CASE 
            WHEN QUANTITY IS NULL THEN 0
            ELSE QUANTITY
        END)) AS TotalAmount,
        (SELECT TOP 1 Godw_Name 
         FROM Godown_Mst 
         WHERE Godw_Code = LOC_CODE AND export_type < 3) AS loc_code
    FROM 
        SPARE_LAB_DTL 
    WHERE 
        TRAN_ID IN (
            SELECT TRAN_ID 
            FROM SPARE_LAB_MST 
            WHERE 
                VAS_TYPE = 'SALES' 
                AND EXPORT_TYPE <> 33 
                AND LOC_CODE IN (${Loc_Code}) 
                AND INV_DATE BETWEEN '${dateFrom}' and '${dateto}'
        ) 
        AND LOC_CODE IN (
            SELECT Godw_Code 
            FROM Godown_Mst 
            WHERE Godw_Name LIKE '%ARENA%'
        ) 
    GROUP BY 
        LOC_CODE;`);
    const FilteredNexaVP = BranchWiseVasSaleNexa[0].map(
      (item) => {
        const totalSale = AutovynRetails[0]?.find(
          (sale) =>
            sale.loc_code.toUpperCase() === item.loc_code.toUpperCase()
        );
        const penetration =
          totalSale && totalSale.chart_data > 0
            ? item.TotalAmount / totalSale.chart_data
            : 0;
        return {
          AutoVynRetail: totalSale.chart_data.toFixed(2),
          TotalAmountVas: item.TotalAmount.toFixed(2),
          loc_code: totalSale.loc_code,
          pv: penetration.toFixed(2),
        };
      }
    );
    const FilteredArenaVP = BranchWiseVasSaleArena[0].map(
      (item1) => {
        const totalSale1 = AutovynRetails[0]?.find(
          (sale1) =>
            sale1.loc_code.toUpperCase() === item1.loc_code.toUpperCase()
        );
        const penetration1 =
          totalSale1 && totalSale1.chart_data > 0
            ? item1.TotalAmount / totalSale1.chart_data
            : 0;
        return {
          TotalAmountVas: item1.TotalAmount.toFixed(2),
          AutoVynRetail: totalSale1.chart_data.toFixed(2),
          loc_code: totalSale1?.loc_code ? totalSale1?.loc_code : '',
          pv: penetration1.toFixed(2),
        };
      }
    );
    console.log(FilteredNexaVP, 'FilteredNexaVP')
    console.log(FilteredArenaVP, 'FilteredArenaVP')
    NexaDetails = [...NexaDetails[0], ...RatRepNexa[0], ...DoorLamNexa[0], ...FilmNexa[0]]
    ArenaDetails = [...ArenaDetails[0], ...RatRepArena[0], ...DoorLamArena[0], ...FilmArena[0]]

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("VAS Glance Report");

    const companyName = await sequelize.query(`SELECT TOP 1 comp_name FROM Comp_Mst`);
    worksheet.mergeCells("A1:H1");
    worksheet.getCell("A1").value = companyName[0][0].comp_name || 'Company Name';
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getCell("A1").font = { bold: true, size: 16 };

    worksheet.mergeCells("A2:H2");
    worksheet.getCell("A2").value = "VAS Glance Report";
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getCell("A2").font = { bold: true, size: 14 };

    const NexaLocationDataMap = {};
    const ArenaLocationDataMap = {};

    function prepareData(details, locationDataMap) {
      details.forEach(item => {
        const locCode = item.loc_code;
        const description = item.DESCRIPTION;

        if (!locationDataMap[locCode]) {
          locationDataMap[locCode] = { loc_code: locCode, Antirust: '', Carpet_Lamination: '', Ceramic_Coating: '', Duracoat: '', Rat_Repellant: '', Door_Lamination: '', Film: '' };
        }

        if (description === 'Antirust') {
          locationDataMap[locCode].Antirust = item.chart_data;
        } else if (description === 'Carpet Lamination') {
          locationDataMap[locCode].Carpet_Lamination = item.chart_data;
        } else if (description === 'Ceramic Coating') {
          locationDataMap[locCode].Ceramic_Coating = item.chart_data;
        } else if (description === 'Duracoat') {
          locationDataMap[locCode].Duracoat = item.chart_data;
        } else if (description === 'RAT REPELLENT') {
          locationDataMap[locCode].Rat_Repellant = item.chart_data;
        } else if (description === 'Door Lamination') {
          locationDataMap[locCode].Door_Lamination = item.chart_data;
        } else if (description === 'Film') {
          locationDataMap[locCode].Film = item.chart_data;
        }
      });
    }
    prepareData(NexaDetails, NexaLocationDataMap);
    prepareData(ArenaDetails, ArenaLocationDataMap);
    const headers = ['Location', 'AutoVYN Retail', 'Antirust', 'Penetration %', 'Carpet Lamination', 'Penetration %', 'Ceramic Coating', 'Penetration %', 'Duracoat', 'Penetration %', 'Rat Repellant', 'Penetration %', 'Door Lamination', 'Penetration %', 'Film', 'Penetration %'];
    worksheet.addRow(['Nexa Channel']);
    worksheet.addRow(headers);

    let NexaTotalAutoVYN = 0, NexaTotalAntirust = 0, NexaTotalCarpet = 0, NexaTotalCeramic = 0, NexaTotalDuracoat = 0;
    let NexaTotalRatRep = 0, NexaTotalDoorLam = 0, NexaTotalFilm = 0
    Object.keys(NexaLocationDataMap).forEach(locCode => {
      const row = NexaLocationDataMap[locCode];
      const autoVynData = AutovynRetails[0].find(item => item.loc_code === locCode);
      const autoVynRetail = autoVynData ? autoVynData.chart_data : 0;

      NexaTotalAutoVYN += autoVynRetail;
      NexaTotalAntirust += Number(row.Antirust) || 0;
      NexaTotalCarpet += Number(row.Carpet_Lamination) || 0;
      NexaTotalCeramic += Number(row.Ceramic_Coating) || 0;
      NexaTotalDuracoat += Number(row.Duracoat) || 0;
      NexaTotalRatRep += Number(row.Rat_Repellant) || 0;
      NexaTotalDoorLam += Number(row.Door_Lamination) || 0;
      NexaTotalFilm += Number(row.Film) || 0;

      worksheet.addRow([
        row.loc_code,
        autoVynRetail || '0',
        row.Antirust || '0',
        autoVynRetail ? ((row.Antirust / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Carpet_Lamination || '0',
        autoVynRetail ? ((row.Carpet_Lamination / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Ceramic_Coating || '0',
        autoVynRetail ? ((row.Ceramic_Coating / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Duracoat || '0',
        autoVynRetail ? ((row.Duracoat / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Rat_Repellant || '0',
        autoVynRetail ? ((row.Rat_Repellant / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Door_Lamination || '0',
        autoVynRetail ? ((row.Door_Lamination / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Film || '0',
        autoVynRetail ? ((row.Film / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
      ]);
    });

    const nexaTotalRow = worksheet.addRow([
      'Total',
      NexaTotalAutoVYN,
      NexaTotalAntirust,
      NexaTotalAutoVYN ? ((NexaTotalAntirust / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      NexaTotalCarpet,
      NexaTotalAutoVYN ? ((NexaTotalCarpet / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      NexaTotalCeramic,
      NexaTotalAutoVYN ? ((NexaTotalCeramic / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      NexaTotalDuracoat,
      NexaTotalAutoVYN ? ((NexaTotalDuracoat / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      NexaTotalRatRep,
      NexaTotalAutoVYN ? ((NexaTotalRatRep / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      NexaTotalDoorLam,
      NexaTotalAutoVYN ? ((NexaTotalDoorLam / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      NexaTotalFilm,
      NexaTotalAutoVYN ? ((NexaTotalFilm / NexaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
    ]);

    nexaTotalRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    worksheet.addRow(['']);
    worksheet.addRow(['Arena Channel']);
    worksheet.addRow(headers);

    let ArenaTotalAutoVYN = 0, ArenaTotalAntirust = 0, ArenaTotalCarpet = 0, ArenaTotalCeramic = 0, ArenaTotalDuracoat = 0;
    let ArenaTotalRatRep = 0, ArenaTotalDoorLam = 0, ArenaTotalFilm = 0
    Object.keys(ArenaLocationDataMap).forEach(locCode => {
      const row = ArenaLocationDataMap[locCode];
      const autoVynData = AutovynRetails[0].find(item => item.loc_code === locCode);
      const autoVynRetail = autoVynData ? autoVynData.chart_data : 0;

      ArenaTotalAutoVYN += autoVynRetail;
      ArenaTotalAntirust += Number(row.Antirust) || 0;
      ArenaTotalCarpet += Number(row.Carpet_Lamination) || 0;
      ArenaTotalCeramic += Number(row.Ceramic_Coating) || 0;
      ArenaTotalDuracoat += Number(row.Duracoat) || 0;
      ArenaTotalRatRep += Number(row.Rat_Repellant) || 0;
      ArenaTotalDoorLam += Number(row.Door_Lamination) || 0;
      ArenaTotalFilm += Number(row.Film) || 0;

      worksheet.addRow([
        row.loc_code,
        autoVynRetail || '0',
        row.Antirust || '0',
        autoVynRetail ? ((row.Antirust / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Carpet_Lamination || '0',
        autoVynRetail ? ((row.Carpet_Lamination / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Ceramic_Coating || '0',
        autoVynRetail ? ((row.Ceramic_Coating / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Duracoat || '0',
        autoVynRetail ? ((row.Duracoat / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Rat_Repellant || '0',
        autoVynRetail ? ((row.Rat_Repellant / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Door_Lamination || '0',
        autoVynRetail ? ((row.Door_Lamination / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
        row.Film || '0',
        autoVynRetail ? ((row.Film / autoVynRetail) * 100).toFixed(2) + '%' : '0%',
      ]);
    });

    const arenaTotalRow = worksheet.addRow([
      'Total',
      ArenaTotalAutoVYN,
      ArenaTotalAntirust,
      ArenaTotalAutoVYN ? ((ArenaTotalAntirust / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      ArenaTotalCarpet,
      ArenaTotalAutoVYN ? ((ArenaTotalCarpet / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      ArenaTotalCeramic,
      ArenaTotalAutoVYN ? ((ArenaTotalCeramic / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      ArenaTotalDuracoat,
      ArenaTotalAutoVYN ? ((ArenaTotalDuracoat / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      ArenaTotalRatRep,
      ArenaTotalAutoVYN ? ((ArenaTotalRatRep / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      ArenaTotalDoorLam,
      ArenaTotalAutoVYN ? ((ArenaTotalDoorLam / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
      ArenaTotalFilm,
      ArenaTotalAutoVYN ? ((ArenaTotalFilm / ArenaTotalAutoVYN) * 100).toFixed(2) + '%' : '0%',
    ]);
    const sheet2 = workbook.addWorksheet('VAS per Vehicle');

    // Define columns with headers and make them bold
    sheet2.columns = [
      { header: 'Location', key: 'loc_code', width: 20 },
      { header: 'Auto Vyn Retail', key: 'AutoVynRetail', width: 20 },
      { header: 'Total VAS Amount', key: 'TotalAmountVas', width: 20 },
      { header: 'P/V', key: 'pv', width: 20 }
    ];

    // Apply bold font to the headers
    sheet2.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Add Nexa Channel Header
    sheet2.addRow({ loc_code: 'Nexa Channel' });

    let NexaTotalAutoVynRetail = 0;
    let NexaTotalVASAmount = 0;
    let NexaTotalPV = 0;

    // Add Nexa Channel data and calculate totals
    FilteredNexaVP.forEach(item => {
      NexaTotalAutoVynRetail += Number(item.AutoVynRetail) || 0;
      NexaTotalVASAmount += Number(item.TotalAmountVas) || 0;
      NexaTotalPV += Number(item.pv) || 0;
      sheet2.addRow(item); // Only add row once here
    });

    // Add a "Total" row for Nexa Channel
    const nexaTotalRow1 = sheet2.addRow({
      loc_code: 'Total',
      AutoVynRetail: NexaTotalAutoVynRetail,
      TotalAmountVas: NexaTotalVASAmount,
      pv: (NexaTotalVASAmount / NexaTotalAutoVynRetail).toFixed(2)
    });

    // Make the "Total" row bold for Nexa Channel
    nexaTotalRow1.eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Add Arena Channel Header
    sheet2.addRow({ loc_code: 'Arena Channel' });

    let ArenaTotalAutoVynRetail = 0;
    let ArenaTotalVASAmount = 0;
    let ArenaTotalPV = 0;

    // Add Arena Channel data and calculate totals
    FilteredArenaVP.forEach(item => {
      ArenaTotalAutoVynRetail += Number(item.AutoVynRetail) || 0;
      ArenaTotalVASAmount += Number(item.TotalAmountVas) || 0;
      ArenaTotalPV += Number(item.pv) || 0;
      sheet2.addRow(item); // Only add row once here
    });

    // Add a "Total" row for Arena Channel
    const arenaTotalRow1 = sheet2.addRow({
      loc_code: 'Total',
      AutoVynRetail: ArenaTotalAutoVynRetail,
      TotalAmountVas: ArenaTotalVASAmount,
      pv: (ArenaTotalVASAmount / ArenaTotalAutoVynRetail).toFixed(2)
    });

    // Make the "Total" row bold for Arena Channel
    arenaTotalRow1.eachCell((cell) => {
      cell.font = { bold: true };
    });



    res.status(200)
      .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .setHeader('Content-Disposition', 'attachment; filename=VAS_Glance_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'An error occurred while generating the report.' });
  }
};

exports.Stockandbooking = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesString = req.body.branch;
    const states = req.body.state;
    const branchesArray = branchesString;
    let dates = {}; // Use 'let' instead of 'const' so you can modify it
    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end
    let branchdata;
    if (states && !branchesString)
      branchdata = `SELECT godw_code AS value, godw_name AS label FROM Godown_Mst WHERE sales_integration IN (1, 9) and export_type<3 and state in (${states})`
    else
      branchdata = `SELECT godw_code AS value, godw_name AS label FROM Godown_Mst WHERE sales_integration IN (1, 9) and export_type<3 and godw_code in (${branchesString})`

    let query;
    query = `WITH GD_FDI_TRANS_EXT AS (
    -- Join GD_FDI_TRANS with Modl_Mst to get the item_code based on VARIANT_CD
    SELECT 
        GD_FDI_TRANS.VARIANT_CD,
        GD_FDI_TRANS.LOC_CD,
        GD_FDI_TRANS.TRANS_ID,
        GD_FDI_TRANS.TRANS_TYPE,
        GD_FDI_TRANS.TRANS_DATE,
		GD_FDI_TRANS.ECOLOR_CD,
        Modl_Mst.Item_Code
    FROM GD_FDI_TRANS
    INNER JOIN Modl_Mst
        ON Modl_Mst.Modl_Code = GD_FDI_TRANS.VARIANT_CD
    WHERE GD_FDI_TRANS.TRANS_TYPE = 'ordbk' 
      AND GD_FDI_TRANS.TRANS_DATE BETWEEN '${dates.start}' AND '${dates.end}'
      AND GD_FDI_TRANS.TRANS_ID NOT IN (
          SELECT TRANS_ID 
          FROM GD_FDI_TRANS gda 
          WHERE gda.TRANS_TYPE = 'ordbc' 
            AND gda.LOC_CD = GD_FDI_TRANS.LOC_CD 
            AND gda.TRANS_ID = GD_FDI_TRANS.TRANS_ID)
      AND GD_FDI_TRANS.TRANS_ID NOT IN (
          SELECT TRANS_ID 
          FROM GD_FDI_TRANS geda 
          WHERE geda.TRANS_TYPE = 'vs' 
            AND geda.LOC_CD = GD_FDI_TRANS.LOC_CD 
            AND geda.TRANS_REF_NUM = GD_FDI_TRANS.TRANS_ID
      ) 
      AND GD_FDI_TRANS.LOC_CD IN (
          SELECT TOP 1 REPLACE(newcar_rcpt, '-S', '') 
          FROM Godown_Mst 
          WHERE Godw_Code in  (${branchesArray}) AND Export_Type < 3
      )
),
ModelNames AS (
    SELECT 
        Modl_Mst.Item_Code,
        -- Conditional logic to handle "K10" specifically
        CASE 
            WHEN Modl_Mst.Modl_Name LIKE '%K10%' THEN 
                LEFT(Modl_Mst.Modl_Name, CHARINDEX('K10', Modl_Mst.Modl_Name) + 2)  -- Keep everything up to "K10"
            ELSE 
                LEFT(Modl_Mst.Modl_Name, 
                     PATINDEX('%[0-9]%', Modl_Mst.Modl_Name + '0') - 1)  -- Truncate at the first numeric character
        END AS ModelPrefix,
        Modl_Mst.Modl_Grp
    FROM Modl_Mst
),
CombinedData AS (
    SELECT 
        (SELECT TOP 1 Misc_Name 
         FROM Misc_mst 
         WHERE Misc_type = 14 
           AND Export_Type < 3 
           AND Misc_Code = (SELECT TOP 1 Modl_Grp 
                            FROM ModelNames 
                            WHERE ModelNames.Item_Code = CHAS_MST.Modl_Code)) AS ModelGroup,
    ModelNames.ModelPrefix AS ModelName,
    CASE
    WHEN Clr_No LIKE '%BLACK%' THEN 'Black'
    WHEN Clr_No LIKE '%WHITE%' THEN 'White'
    WHEN Clr_No LIKE '%RED%' THEN 'Red'
    WHEN Clr_No LIKE '%BLUE%' THEN 'Blue'
    WHEN Clr_No LIKE '%SILVER%' THEN 'Silver'
    WHEN Clr_No LIKE '%GREY%' OR Clr_No LIKE '%GRAY%' THEN 'Grey'
    WHEN Clr_No LIKE '%BROWN%' THEN 'Brown'
    WHEN Clr_No LIKE '%YELLOW%' THEN 'Yellow'
    WHEN Clr_No LIKE '%ORANGE%' THEN 'Orange'
    WHEN Clr_No LIKE '%GREEN%' THEN 'Green'
    WHEN Clr_No LIKE '%BRONZE%' THEN 'Bronze'
    WHEN Clr_No LIKE '%BEIGE%' THEN 'Beige'
    WHEN Clr_No LIKE '%PURPLE%' THEN 'Purple'
    WHEN Clr_No LIKE '%GOLD%' THEN 'Gold'
    WHEN Clr_No LIKE '%PINK%' THEN 'Pink'
    WHEN Clr_No is null THEN 'No Color'
            ELSE Clr_No
        END AS ColorGroup,
        COUNT(DISTINCT CHAS_MST.CHAS_ID) AS StockCount,
        CHAS_MST.Loc_Code,
        COUNT(DISTINCT GD_FDI_TRANS_EXT.TRANS_ID) AS PendingCount
    FROM CHAS_MST
    -- Join with the extended GD_FDI_TRANS result based on item_code
    LEFT JOIN GD_FDI_TRANS_EXT
        ON GD_FDI_TRANS_EXT.Item_Code = CHAS_MST.Modl_Code
        AND GD_FDI_TRANS_EXT.LOC_CD IN (
            SELECT  Replace(NEWCAR_RCPT,'-S','') 
            FROM Godown_Mst 
            WHERE Godw_Code in (${branchesArray})
              AND Export_Type < 3
        ) and GD_FDI_TRANS_EXT.ECOLOR_CD=CHAS_MST.Clr_Abbr
    LEFT JOIN ModelNames
        ON ModelNames.Item_Code = CHAS_MST.Modl_Code

    WHERE CHAS_MST.CHAS_ID IN (
        SELECT DISTINCT CHAS_ID
        FROM CHAS_TRAN
        WHERE Export_Type < 5 
          AND Item_Type = 2 
          AND Loc_Code IN (${branchesArray})
        GROUP BY CHAS_ID
        HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0
    ) AND Loc_Code IN (${branchesArray})
    GROUP BY 
        ModelNames.ModelPrefix,
        CHAS_MST.Loc_Code,
        CHAS_MST.Modl_Code,
        Clr_No,
		GD_FDI_TRANS_EXT.ECOLOR_CD
)
SELECT 
    ModelGroup,
   CONCAT(REPLACE(ModelName, 'MARUTI', ''), ' -  ', ColorGroup) AS ModelName,
    SUM(StockCount) AS Stock,
	   (SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code=Loc_Code and Export_Type<3)as BranchCode,
    SUM(PendingCount) AS MTD_BK
FROM CombinedData
GROUP BY 
    ModelGroup,
    ModelName,
	Loc_Code,
    ColorGroup
ORDER BY 
    Loc_Code,ModelName;`
    const [data] = await sequelize.query(query);
    const transformedData = {};
    const totals = {};
    // Step 2: Iterate through each record in the data array
    data.forEach((curr) => {
      const { ModelGroup, ModelName, Stock, BranchCode, MTD_BK } = curr;

      // Create a unique key for each model group and name
      const key = `${ModelGroup}_${ModelName}`;

      // If the entry does not exist, create it
      if (!transformedData[key]) {
        transformedData[key] = {
          ModelGroup,
          ModelName,
          columns: {} // Use an object to hold branch-related data
        };
      }

      // Step 3: Push branch-related data into the columns object
      transformedData[key].columns[BranchCode] = {
        Stock,
        MTD_BK
      };

      // Step 4: Update the totals for ModelGroup
      if (!totals[ModelGroup]) {
        totals[ModelGroup] = { totalStock: 0, totalMTD_BK: 0 };
      }
      totals[ModelGroup].totalStock += Stock;
      totals[ModelGroup].totalMTD_BK += MTD_BK;
    })
    // Step 5: Convert the transformedData object back to an array
    const result = Object.keys(transformedData).map((key) => {
      const { ModelGroup, ModelName, columns } = transformedData[key];

      // Flatten the columns into a single object with dynamic keys
      const flattened = Object.keys(columns).reduce((acc, branchCode) => {
        acc[`Stock_${branchCode}`] = columns[branchCode].Stock;
        acc[`BranchCode_${branchCode}`] = branchCode;
        acc[`MTD_BK_${branchCode}`] = columns[branchCode].MTD_BK;
        return acc;
      }, {});

      return {
        ModelGroup,
        ModelName,
        ...flattened
      };
    });
    // Step 6: Add totals to the result array
    const finalResult = [];
    const modelGroups = new Set();
    result.forEach(item => {
      finalResult.push(item);
      modelGroups.add(item.ModelGroup);
    });

    const groupedByModelGroup = finalResult.reduce((acc, curr) => {
      // Get the ModelGroup for the current object
      const group = curr.ModelGroup;

      // Check if the group already exists in the accumulator
      if (!acc[group]) {
        acc[group] = []; // Create a new array for this ModelGroup
      }

      // Push the current object into the corresponding group
      acc[group].push(curr);

      return acc;
    }, {});

    // Convert the grouped object into an array of arrays
    const arrayOfArrays = Object.values(groupedByModelGroup);
    res.send(arrayOfArrays)
  } catch (e) {
    console.log(e);
    res.send({
      error: e,
    });
  } finally {
    await sequelize.close();
  }
};
exports.Predata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const branchesString = req.body.branch;
  try {
    const states = await sequelize.query(`SELECT DISTINCT state AS value, state AS label FROM Godown_Mst WHERE sales_integration IN (1, 9) and export_type<3`)
    const branches = await sequelize.query(`SELECT godw_code AS value, godw_name AS label FROM Godown_Mst WHERE sales_integration IN (1, 9) and export_type<3 and godw_code in (${branchesString})`)
    const Br_Location = await sequelize.query(`WITH MiscData AS (
    SELECT 
        Misc_Name AS label,
        CAST(misc_code AS VARCHAR(MAX)) AS value
    FROM misc_mst
    WHERE misc_type = 303 
    AND export_type < 3
)
SELECT 
    'ALL CLUSTER' AS label, 
    STRING_AGG(CAST(misc_code AS VARCHAR(MAX)), ',') AS value,
    0 AS sort_order  -- 'ALL' row comes first
FROM misc_mst
WHERE misc_type = 303 
AND export_type < 3

UNION ALL

SELECT 
    label, 
    value,
    1 AS sort_order  -- Other rows come after 'ALL'
FROM MiscData
ORDER BY sort_order;
`)
    const Br_Segment = await sequelize.query(`WITH MiscData AS (
    SELECT 
        Misc_Name AS label,
        CAST(misc_code AS VARCHAR(MAX)) AS value
    FROM misc_mst
    WHERE misc_type = 302 
    AND export_type < 3
)
SELECT 
    'ALL SEGMENT' AS label, 
    STRING_AGG(CAST(misc_code AS VARCHAR(MAX)), ',') AS value,
    0 AS sort_order  -- 'ALL' row comes first
FROM misc_mst
WHERE misc_type = 302 
AND export_type < 3

UNION ALL

SELECT 
    label, 
    value,
    1 AS sort_order  -- Other rows come after 'ALL'
FROM MiscData
ORDER BY sort_order;
`)
    const Locations = await sequelize.query(`WITH GodownData AS (
    SELECT 
        Godw_Name AS label,
        CAST(Godw_Code AS VARCHAR(MAX)) AS value
    FROM Godown_Mst
    WHERE Godw_Code IN (${branchesString})
    AND export_type < 3
)
-- Get the 'ALL' row for Godown
SELECT 
    'ALL BRANCH' AS label, 
    STRING_AGG(CAST(Godw_Code AS VARCHAR(MAX)), ',') AS value,
    0 AS sort_order  -- 'ALL ' row first
FROM Godown_Mst
WHERE Godw_Code IN (${branchesString})
AND export_type < 3

UNION ALL

-- Get Godown_Mst data
SELECT 
    label, 
    value,
    1 AS sort_order  -- Other rows after 'ALL'
FROM GodownData
ORDER BY sort_order;`)

    res.send({ states: states[0], branches: branches[0], Br_Location: Br_Location[0], Br_Segment: Br_Segment[0], Locations: Locations[0] })
  } catch (e) {
    console.log(e);
    res.send({
      error: e,
    });
  } finally {
    await sequelize.close();
  }
};


exports.newcarsalerepoort = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    // const prevdates = getPreviousMonthDates(
    //   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    //   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    // );

    const query1 = `
SELECT 
    (SELECT TOP 1 godw_name 
     FROM Godown_Mst 
     WHERE Godw_Code = Loc_Code 
       AND Export_Type < 3) AS Loc_Code,
    COUNT(*) AS Total
FROM 
    ICM_MST
WHERE 
    Delv_Date BETWEEN '${dates.start}' AND '${dates.end}'  
    AND EXPORT_TYPE < 5
    AND Loc_Code IN (
        SELECT godw_code 
        FROM Godown_Mst 
        WHERE Br_Segment IN (${Br_Segment}) 
          AND Br_Location IN (${Br_Location}) 
          AND Godw_Code IN (${branchesArray}) 
          AND Export_Type < 3
    )
GROUP BY 
    Loc_Code
UNION ALL
SELECT 
    'Total' AS Loc_Code,
    COUNT(*) AS Total
FROM 
    ICM_MST
WHERE 
    Delv_Date BETWEEN '${dates.start}' AND '${dates.end}'  
    AND EXPORT_TYPE < 5
    AND Loc_Code IN (
        SELECT godw_code 
        FROM Godown_Mst 
        WHERE Br_Segment IN (${Br_Segment}) 
          AND Br_Location IN (${Br_Location}) 
          AND Godw_Code IN (${branchesArray}) 
          AND Export_Type < 3
    )
ORDER BY 
    Loc_Code;
`
    const query2 = `
    SELECT 
    (SELECT TOP 1 Misc_Name 
     FROM Misc_mst 
     WHERE Misc_type = 14 
       AND Export_Type < 3 
       AND Misc_Code = Modl_Grp 
       AND Export_Type < 3) AS Model,
    COUNT(*) AS Total,
    (SELECT TOP 1 godw_name 
     FROM Godown_Mst 
     WHERE Godw_Code = Loc_Code 
       AND Export_Type < 3) AS Loc_Code 
FROM 
    ICM_MST
WHERE 
    Delv_Date BETWEEN '${dates.start}' AND '${dates.end}'  
    AND EXPORT_TYPE < 5
    AND Loc_Code IN (
        SELECT godw_code 
        FROM Godown_Mst 
        WHERE Br_Segment IN (${Br_Segment}) 
          AND Br_Location IN (${Br_Location}) 
          AND Godw_Code IN (${branchesArray}) 
          AND Export_Type < 3
    )
GROUP BY 
    Modl_Grp, Loc_Code 
UNION ALL
SELECT 
    'Total' AS Model,
    COUNT(*) AS Total,
    NULL AS Loc_Code
FROM 
    ICM_MST
WHERE 
    Delv_Date BETWEEN '${dates.start}' AND '${dates.end}'  
    AND EXPORT_TYPE < 5
    AND Loc_Code IN (
        SELECT godw_code 
        FROM Godown_Mst 
        WHERE Br_Segment IN (${Br_Segment}) 
          AND Br_Location IN (${Br_Location}) 
          AND Godw_Code IN (${branchesArray}) 
          AND Export_Type < 3
    )
ORDER BY 
    Loc_Code
`

    const data1 = await sequelize.query(query1)
    const data2 = await sequelize.query(query2)
    res.send({
      data1: data1[0],
      data2: data2[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};



exports.importformatmini = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "RTO Excel Import";
    const Headeres = [
      'Inv_No',
      'MI_Date',
      'Month',
      'Reg_No',
      'VAH_REGNO',
      'VAH_CLASS',
      'VAH_MODEL',
      'VAH_VEHICLECOLOUR',
      'VAH_TYPE',
      'VAH_OWNER',
      'VAH_PRES_ADD',
      'VAH_PRES_ADD_DISTRICT',
      'VAH_PRES_ADD_STATE',
      'VAH_PRES_ADD_CITY',
      'VAH_PRES_ADD_PIN',
      'VAH_REGAUTHORITY',
      'VAH_REGDATE',
      'VAH_VEHICLEINSCOMPNAME',
      'VAH_RCFINANCER',
      'VAH_ISCOMMERCIAL'

    ];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

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
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Insurance_Import_Tamplate.xlsx"'
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


exports.excelimportmini = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Data = _RTO_IMPORT(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file

    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }

    const user = req.body.user;
    const branch = req.body.branch;

    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }

    const renameKeys = (obj) => {
      const keyMap = {
        'Inv_No': 'Inv_No',
        'MI_Date': 'MI_Date',
        'Month': 'Month',
        'Reg_No': 'Reg_No',
        'VAH_REGNO': 'VAH_REGNO',
        'VAH_CLASS': 'VAH_CLASS',
        'VAH_MODEL': 'VAH_MODEL',
        'VAH_VEHICLECOLOUR': 'VAH_VEHICLECOLOUR',
        'VAH_TYPE': 'VAH_TYPE',
        'VAH_OWNER': 'VAH_OWNER',
        'VAH_PRES_ADD': 'VAH_PRES_ADD',
        'VAH_PRES_ADD_DISTRICT': 'VAH_PRES_ADD_DISTRICT',
        'VAH_PRES_ADD_STATE': 'VAH_PRES_ADD_STATE',
        'VAH_PRES_ADD_CITY': 'VAH_PRES_ADD_CITY',
        'VAH_PRES_ADD_PIN': 'VAH_PRES_ADD_PIN',
        'VAH_REGAUTHORITY': 'VAH_REGAUTHORITY',
        'VAH_REGDATE': 'VAH_REGDATE',
        'VAH_VEHICLEINSCOMPNAME': 'VAH_VEHICLEINSCOMPNAME',
        'VAH_RCFINANCER': 'VAH_RCFINANCER',
        'VAH_ISCOMMERCIAL': 'VAH_ISCOMMERCIAL',
      };

      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        if (newKey === "MI_Date") {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]);
            // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        } else if (newKey === "VAH_REGDATE") {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]);
            // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        }

        else {
          // Convert empty string values to null
          acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        }
        return acc;
      }, {});
    };

    const data = transformedData.map(renameKeys);

    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10); // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }
    const ErroredData = [];
    const CorrectData = [];

    data.forEach((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];
      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons.join(""),
        });
      } else {
        obj.Created_By = user;
        obj.Location = branch;
        CorrectData.push(obj);
      }
    });

    const InsuData1 = await Insu_Data.bulkCreate(CorrectData, {
      transaction: t,
    });
    await t.commit();
    await sequelize.close();

    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${InsuData1.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};



exports.newcarrtorepoort = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end



    const query1 = `
SELECT
Loc_Code as code,
    (SELECT TOP 1 godw_name 
     FROM Godown_Mst 
     WHERE Godw_Code = Loc_Code 
       AND Export_Type < 3) AS Loc_Code,
    COUNT(*) AS Total,
    COUNT(CASE WHEN ri.VAH_REGNO IS NOT NULL THEN ri.Inv_No END) AS [RtoDone],
    COUNT(*) - COUNT(CASE WHEN ri.VAH_REGNO IS NOT NULL THEN ri.Inv_No END) AS [Pending],
	COUNT(Case When Rd.INHOUSE is Null THEN rD.INVOICE_NUMBER END)as [INHouse],
	COUNT(Case When Rd.SAME_STATE is Null and Rd.INHOUSE is not Null THEN rD.INVOICE_NUMBER END)as [SAME_STATE],
	COUNT(Case When Rd.PERMANENT_TAX_PAID is Null and Rd.SAME_STATE is not Null and Rd.INHOUSE is not Null  THEN rD.INVOICE_NUMBER END)as [PERMANENT_TAX_PAID],
	COUNT(Case When Rd.NUMBER_GENERATED is Null and  Rd.PERMANENT_TAX_PAID is not Null and Rd.SAME_STATE is not Null and Rd.INHOUSE is not Null  THEN rD.INVOICE_NUMBER END)as [NUMBER_GENERATED],
	COUNT(Case When Rd.DOCUMENTS_UPLOADED is Null and Rd.NUMBER_GENERATED is not Null and  Rd.PERMANENT_TAX_PAID is not Null and Rd.SAME_STATE is not Null and Rd.INHOUSE is not Null  THEN rD.INVOICE_NUMBER END)as [DOCUMENTS_UPLOADED],
	COUNT(Case When Rd.FILE_SUBMITTED is Null and Rd.DOCUMENTS_UPLOADED is not Null  and Rd.NUMBER_GENERATED is not Null and  Rd.PERMANENT_TAX_PAID is not Null and Rd.SAME_STATE is not Null and Rd.INHOUSE is not Null  THEN rD.INVOICE_NUMBER END)as FILE_SUBMITTED,
    COUNT(Case When Rd.RTO_APPROVAL_DONE is Null and  Rd.FILE_SUBMITTED is not Null and Rd.DOCUMENTS_UPLOADED is not Null  and Rd.NUMBER_GENERATED is not Null and  Rd.PERMANENT_TAX_PAID is not Null and Rd.SAME_STATE is not Null and Rd.INHOUSE is not Null  THEN rD.INVOICE_NUMBER END)as RTO_APPROVAL_DONE,
    COUNT(Case When Rd.UPDATED_IN_DMS is Null and Rd.RTO_APPROVAL_DONE is Null  and  Rd.FILE_SUBMITTED is Null and Rd.DOCUMENTS_UPLOADED is not Null  and Rd.NUMBER_GENERATED is not Null and  Rd.PERMANENT_TAX_PAID is not Null and Rd.SAME_STATE is not Null and Rd.INHOUSE is not Null  THEN rD.INVOICE_NUMBER END)as UPDATED_IN_DMS
FROM 
    ICM_MST
LEFT JOIN 
    RTO_IMPORT ri ON ri.Inv_No = ICM_MST.DMS_Inv
Left Join 
    Rto_Details rd on rd.INVOICE_NUMBER= ICM_MST.DMS_Inv
WHERE 
    Delv_Date BETWEEN '${dates.start}' AND '${dates.end}'  
    AND EXPORT_TYPE < 5
	AND Loc_Code IN (
       SELECT godw_code 
        FROM Godown_Mst 
        WHERE Br_Segment IN (${Br_Segment}) 
          AND Br_Location IN (${Br_Location}) 
          AND Godw_Code IN (${branchesArray}) 
          AND Export_Type < 3
    )
    
GROUP BY 
    Loc_Code
ORDER BY 
    Loc_Code;
`

    const data1 = await sequelize.query(query1)
    res.send({
      data1: data1[0]
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.newcarrtototalrepoort = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const query2 = `
select DMS_Inv as INVOICE_NUMBER,INV_Date as INVOICE_Date,RD.Mi_Date,
(select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=ICM_MST.Modl_Grp)as Model,
Cust_Id,
Ledg_Name,
VIN,
RD.REG_NUMBER,
RD.VAHAN_REG_NUMBER,
RD.INHOUSE,
RD.SAME_STATE,
RD.PERMANENT_TAX_PAID,
RD.NUMBER_GENERATED,
RD.DOCUMENTS_UPLOADED,
RD.FILE_SUBMITTED,
RD.RTO_APPROVAL_DONE,
RD.UPDATED_IN_DMS,
RD.REMARKS,
RD.UTD,
RD.Mi_Date
from ICM_MST
left Join Rto_Details RD on RD.INVOICE_NUMBER=ICM_MST.DMS_Inv
where Delv_Date BETWEEN '${dates.start}' AND '${dates.end}'  and
Loc_Code IN (${req.body.row.code}) and dms_inv not in (select inv_no from RTO_IMPORT where VAH_REGNO is not null)
`
    const data2 = await sequelize.query(query2)
    res.send({
      data2: data2[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};

exports.liveStock = async function (req, res) {
  const Valid_From = req.body.Valid_From;
  const Valid_Upto = req.body.Valid_Upto
  const model_group = req.body.State
  const branch = req.body.branch
  const firstDayOfCurrentMonth = req.body.firstDayOfCurrentMonth
  const LastDayOfCurrentMonth = req.body.LastDayOfCurrentMonth
  const Status = req.body.Status
  let result;
  try {
    const sequelize = await dbname(req.headers.compcode);
    [result] = await sequelize.query(`
             select *,
	  -- Status Calculation
         CASE
             WHEN entrystatus=1  THEN 'In-Transit'
             WHEN Allotment_Date IS NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Free'
             WHEN Allotment_Date IS NOT NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Allot'
             WHEN DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL AND (SMS_Inv_No IS NULL and SMS_Inv_Date IS NULL) THEN 'Sale in DMS'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is Null THEN 'Sold'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is not NULL THEN 'Delivered'
             ELSE 'Unknown'
         END AS Status
	 from (
	 SELECT 
         CHAS_MST.Chas_Id as Chas_Id,
         CHAS_MST.Vin as Chasmstvin,
         CHAS_MST.Loc_Code,
         (SELECT REPLACE(newcar_rcpt, '-S', '') FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS Outlet,
                  (select top 1 vin from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as Qr,
                  (select top 1 UTD from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as UTDAudit,
         (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Variant,
         (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Group,
         (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
         (SELECT TOP 1 Modl_Code FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Code,
         CHAS_MST.Chas_No AS Chassis,
         CHAS_MST.Eng_No AS Engine,
         CHAS_MST.Purc_Amt AS [Purc_Amt],
         (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Color,
         CHAS_MST.Clr_Abbr AS Color_Code,
         (SELECT Godw_Name FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS St,
         CHAS_MST.PInv_Date AS [Desp_Date],
         DATEDIFF(DAY, CHAS_MST.PInv_Date, GETDATE()) AS [Vintage_Days],
         Year(PInv_Date) AS type,
         im.Ledg_Name AS [Customer_Name],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_DSE) AS [RM],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_TL) AS [SRM],
         (SELECT TOP 1 Booking_ID FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1 ) AS [Booking_ID],
         (SELECT TOP 1 created_at FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Date],
         (SELECT TOP 1 Customer_Name FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Customer_Name1],
         (SELECT TOP 1 DATEDIFF(DAY, created_at, GETDATE()) FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Vintage],
         im.inv_number AS [SMS_Inv_No],
         im.Bhatia_Inv_Date AS [SMS_Inv_Date],
         im.Delv_Date AS [Delv_Date],
         im.DMS_Inv AS [DMS_Inv_No],
         im.INV_Date AS [DMS_Inv_Date],
         0 as entrystatus,
         (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 8 AND misc_mst.misc_code = im.fin_code) AS [Financier]
     FROM 
         CHAS_MST 
         LEFT JOIN icm_mst im ON im.Chas_No = CHAS_MST.Chas_No AND im.Engn_No = CHAS_MST.Eng_No AND im.EXPORT_TYPE < 5 AND CHAS_MST.Export_Type < 5
     WHERE 
         CHAS_MST.CHAS_ID IN (
             SELECT DISTINCT CHAS_ID
             FROM CHAS_TRAN
             WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code IN (${branch})
             and Tran_Date <='${LastDayOfCurrentMonth}'
             GROUP BY CHAS_ID
             HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0
         )
         union all
         SELECT 
         CHAS_MST.Chas_Id as Chas_Id,
          CHAS_MST.Vin as Chasmstvin,
          CHAS_MST.Loc_Code,
         (SELECT REPLACE(newcar_rcpt, '-S', '') FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS Outlet,
                  (select top 1 vin from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as Qr,
                  (select top 1 UTD from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as UTDAudit,
         (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Variant,
         (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Group,
         (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
         (SELECT TOP 1 Modl_Code FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Code,
         CHAS_MST.Chas_No AS Chassis,
         CHAS_MST.Eng_No AS Engine,
         CHAS_MST.Purc_Amt AS [Purc_Amt],
         (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Color,
         CHAS_MST.Clr_Abbr AS Color_Code,
         (SELECT Godw_Name FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS St,
         CHAS_MST.PInv_Date AS [Desp_Date],
         DATEDIFF(DAY, CHAS_MST.PInv_Date, GETDATE()) AS [Vintage_Days],
         Year(PInv_Date) AS type,
         im.Ledg_Name AS [Customer_Name],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_DSE) AS [RM],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_TL) AS [SRM],
         (SELECT TOP 1 Booking_ID FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1 ) AS [Booking_ID],
         (SELECT TOP 1 created_at FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Date],
         (SELECT TOP 1 Customer_Name FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Customer_Name1],
         (SELECT TOP 1 DATEDIFF(DAY, created_at, GETDATE()) FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Vintage],
         im.inv_number AS [SMS_Inv_No],
         im.Bhatia_Inv_Date AS [SMS_Inv_Date],
         im.Delv_Date AS [Delv_Date],
         im.DMS_Inv AS [DMS_Inv_No],
         im.INV_Date AS [DMS_Inv_Date],
         1 as entrystatus,
         (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 8 AND misc_mst.misc_code = im.fin_code) AS [Financier]
     FROM 
         CHAS_MST 
         LEFT JOIN icm_mst im ON im.Chas_No = CHAS_MST.Chas_No AND im.Engn_No = CHAS_MST.Eng_No AND im.EXPORT_TYPE < 5 AND CHAS_MST.Export_Type < 5
     WHERE 
         CHAS_MST.CHAS_ID IN (
 SELECT DISTINCT CHAS_ID
             FROM CHAS_TRANSIT
             WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code IN (${branch})
             and Tran_Date  <='${LastDayOfCurrentMonth}'
             and CHAS_ID not in (SELECT DISTINCT CHAS_ID
             FROM CHAS_TRAN
             WHERE Export_Type < 5 AND Item_Type = 2 AND Loc_Code IN (${branch})
             and Tran_Date <='${LastDayOfCurrentMonth}'
             GROUP BY CHAS_ID
             HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0)
             GROUP BY CHAS_ID
             HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0  
         )      
         
         union all

          SELECT 
         CHAS_MST.Chas_Id as Chas_Id,
         CHAS_MST.Vin as Chasmstvin,
         CHAS_MST.Loc_Code,
         (SELECT REPLACE(newcar_rcpt, '-S', '') FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS Outlet,
                  (select top 1 vin from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as Qr,
                  (select top 1 UTD from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as UTDAudit,
         (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Variant,
         (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Group,
         (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
         (SELECT TOP 1 Modl_Code FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Code,
         CHAS_MST.Chas_No AS Chassis,
         CHAS_MST.Eng_No AS Engine,
         CHAS_MST.Purc_Amt AS [Purc_Amt],
         (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Color,
         CHAS_MST.Clr_Abbr AS Color_Code,
         (SELECT Godw_Name FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS St,
         CHAS_MST.PInv_Date AS [Desp_Date],
         DATEDIFF(DAY, CHAS_MST.PInv_Date, GETDATE()) AS [Vintage_Days],
         Year(PInv_Date) AS type,
         im.Ledg_Name AS [Customer_Name],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_DSE) AS [RM],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_TL) AS [SRM],
         (SELECT TOP 1 Booking_ID FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1 ) AS [Booking_ID],
         (SELECT TOP 1 created_at FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Date],
         (SELECT TOP 1 Customer_Name FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Customer_Name1],
         (SELECT TOP 1 DATEDIFF(DAY, created_at, GETDATE()) FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Vintage],
         im.inv_number AS [SMS_Inv_No],
         im.Bhatia_Inv_Date AS [SMS_Inv_Date],
         im.Delv_Date AS [Delv_Date],
         im.DMS_Inv AS [DMS_Inv_No],
         im.INV_Date AS [DMS_Inv_Date],
         2 as entrystatus,
         (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 8 AND misc_mst.misc_code = im.fin_code) AS [Financier]
     FROM 
         CHAS_MST 
         LEFT JOIN icm_mst im ON im.Chas_No = CHAS_MST.Chas_No AND im.Engn_No = CHAS_MST.Eng_No AND im.EXPORT_TYPE < 5 AND CHAS_MST.Export_Type < 5
     WHERE 
         CHAS_MST.Chas_No IN (
		 select chas_no from icm_mst where Delv_Date is null and TRAN_ID in (select Icm_id from BHATIA_INVOICE)
         and Loc_Code in (${branch})
         )
         
      ) as ab
	  ORDER BY 
         [Vintage_Days] DESC
    `)
    if (Valid_From && Valid_From != '') {
      [result] = await sequelize.query(`
        select *,
	  -- Status Calculation
         CASE
             WHEN Allotment_Date IS NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Free'
             WHEN Allotment_Date IS NOT NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Allot'
             WHEN DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL AND (SMS_Inv_No IS NULL and SMS_Inv_Date IS NULL) THEN 'Sale in DMS'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is  NULL THEN 'Sold'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is not NULL THEN 'Delivered'
             ELSE 'Unknown'
         END AS Status
	 from (
	 SELECT
         CHAS_MST.Vin as Chasmstvin, 
         CHAS_MST.Loc_Code,
         (SELECT REPLACE(newcar_rcpt, '-S', '') FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS Outlet,
          (select top 1 vin from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as Qr,
                  (select top 1 UTD from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as UTDAudit,
         (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Variant,
         (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Group,
         (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
         (SELECT TOP 1 Modl_Code FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Code,
         CHAS_MST.Chas_No AS Chassis,
         CHAS_MST.Eng_No AS Engine,
         CHAS_MST.Purc_Amt AS [Purc_Amt],
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Color,
         CHAS_MST.Clr_Abbr AS Color_Code,
         (SELECT Godw_Name FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS St,
         CHAS_MST.PInv_Date AS [Desp_Date],
         DATEDIFF(DAY, CHAS_MST.PInv_Date, GETDATE()) AS [Vintage_Days],
         Year(PInv_Date) AS type,
         im.Ledg_Name AS [Customer_Name],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_DSE) AS [RM],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_TL) AS [SRM],
         (SELECT TOP 1 Booking_ID FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND DeAlot_Date IS NULL) AS [Booking_ID],
         (SELECT TOP 1 created_at FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND DeAlot_Date IS NULL) AS [Allotment_Date],
         (SELECT TOP 1 DATEDIFF(DAY, created_at, GETDATE()) FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND DeAlot_Date IS NULL) AS [Allotment_Vintage],
         im.inv_number AS [SMS_Inv_No],
         im.Bhatia_Inv_Date AS [SMS_Inv_Date],
         im.DMS_Inv AS [DMS_Inv_No],
         im.INV_Date AS [DMS_Inv_Date],
         im.Delv_Date AS [Delv_Date],
         (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 8 AND misc_mst.misc_code = im.fin_code) AS [Financier]
     FROM 
         CHAS_MST 
         LEFT JOIN icm_mst im ON im.Chas_No = CHAS_MST.Chas_No AND im.Engn_No = CHAS_MST.Eng_No AND im.EXPORT_TYPE < 5 AND CHAS_MST.Export_Type < 5
     WHERE  
CHAS_MST.Vin  like '%${Valid_From}%'
      ) as ab
	  ORDER BY 
         [Vintage_Days] DESC
`)
    }
    const filteredResult = model_group && !Valid_From
      ? result.filter(row => row.Model_Group == model_group)
      : result;
    const finalfilter = Status === 'ALL'
      ? filteredResult
      : Status === 'ERP'
        ? filteredResult.filter(row => row.entrystatus === 0)
        : Status === 'TRANSIT'
          ? filteredResult.filter(row => row.entrystatus === 1)
          : Status === 'SOLD' ? filteredResult.filter(row => row.entrystatus === 2) : filteredResult; // Fallback for unexpected Status values

    const transformedData = finalfilter.reduce((acc, row) => {
      // Find or create the group for this Model_Group
      let group = acc.find(g => g.Model_Group === row.Model_Group);
      if (!group) {
        group = {
          Model_Group: row.Model_Group,
          Model_Group_Name: row.Basic_Model,
          models: []
        };
        acc.push(group);
      }
      // Add model details to the group
      group.models.push({
        Outlet: row.Outlet,
        Model_Variant: row.Model_Variant,
        Model_Group: row.Model_Group,
        Basic_Model: row.Basic_Model,
        Model_Code: row.Model_Code,
        Chassis: row.Chassis,
        Engine: row.Engine,
        Chas_Id: row.Chas_Id,
        Booking_ID: row.Booking_ID,
        Purc_Amt: row.Purc_Amt,
        Color: row.Color,
        Loc_Code: row.Loc_Code,
        Color_Code: row.Color_Code,
        St: row.St,
        Qr: row.Qr,
        Chasmstvin: row.Chasmstvin,
        Desp_Date: row.Desp_Date,
        Vintage_Days: row.Vintage_Days,
        type: row.type,
        Status: row.Status,
        entrystatus: row.entrystatus,
        Customer_Name: row.Customer_Name ? row.Customer_Name : row.Customer_Name1,
        RM: row.RM,
        SRM: row.SRM,
        Allotment_Date: row.Allotment_Date,
        Allotment_Vintage: row.Allotment_Vintage,
        SMS_Inv_No: row.SMS_Inv_No,
        SMS_Inv_Date: row.SMS_Inv_Date,
        DMS_Inv_No: row.DMS_Inv_No,
        DMS_Inv_Date: row.DMS_Inv_Date,
        Financier: row.Financier,
        UTDAudit: row.UTDAudit
      });

      return acc;
    }, []);
    const total = result.length;
    const transit = result.filter((item) => item.entrystatus == 1)
    const erp = result.filter((item) => item.entrystatus == 0)
    const sold = result.filter((item) => item.entrystatus == 2)
    return res.status(200).send({ transformedData: transformedData, result: finalfilter, total: total, transit: transit.length, erp: erp.length, sold: sold.length });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};

exports.DeliveredStock = async function (req, res) {
  const Valid_From = req.body.Valid_From;
  const Valid_Upto = req.body.Valid_Upto
  const model_group = req.body.State
  const branch = req.body.branch
  const firstDayOfCurrentMonth = req.body.firstDayOfCurrentMonth
  const LastDayOfCurrentMonth = req.body.LastDayOfCurrentMonth
  const Status = req.body.Status
  let result;
  try {
    const sequelize = await dbname(req.headers.compcode);
    [result] = await sequelize.query(`
             select *,
	  -- Status Calculation
         CASE
             WHEN entrystatus=1  THEN 'In-Transit'
             WHEN Allotment_Date IS NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Free'
             WHEN Allotment_Date IS NOT NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Allot'
             WHEN DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL AND (SMS_Inv_No IS NULL and SMS_Inv_Date IS NULL) THEN 'Sale in DMS'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is Null THEN 'Sold'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is not NULL THEN 'Delivered'
             ELSE 'Unknown'
         END AS Status
	 from (
	 SELECT 
         CHAS_MST.Chas_Id as Chas_Id,
         CHAS_MST.Vin as Chasmstvin,
         CHAS_MST.Loc_Code,
         (SELECT REPLACE(newcar_rcpt, '-S', '') FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS Outlet,
                  (select top 1 vin from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as Qr,
                  (select top 1 UTD from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as UTDAudit,
         (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Variant,
         (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Group,
         (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
         (SELECT TOP 1 Modl_Code FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Code,
         CHAS_MST.Chas_No AS Chassis,
         CHAS_MST.Eng_No AS Engine,
         CHAS_MST.Purc_Amt AS [Purc_Amt],
         (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Color,
         CHAS_MST.Clr_Abbr AS Color_Code,
         (SELECT Godw_Name FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS St,
         CHAS_MST.PInv_Date AS [Desp_Date],
         DATEDIFF(DAY, CHAS_MST.PInv_Date, GETDATE()) AS [Vintage_Days],
         Year(PInv_Date) AS type,
         im.Ledg_Name AS [Customer_Name],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_DSE) AS [RM],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_TL) AS [SRM],
         (SELECT TOP 1 Booking_ID FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1 ) AS [Booking_ID],
         (SELECT TOP 1 created_at FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Date],
         (SELECT TOP 1 Customer_Name FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Customer_Name1],
         (SELECT TOP 1 DATEDIFF(DAY, created_at, GETDATE()) FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND CHAS_ALot.export_type=1) AS [Allotment_Vintage],
         im.inv_number AS [SMS_Inv_No],
         im.Bhatia_Inv_Date AS [SMS_Inv_Date],
         im.Delv_Date AS [Delv_Date],
         im.DMS_Inv AS [DMS_Inv_No],
         im.INV_Date AS [DMS_Inv_Date],
         0 as entrystatus,
         (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 8 AND misc_mst.misc_code = im.fin_code) AS [Financier]
     FROM 
         CHAS_MST 
         LEFT JOIN icm_mst im ON im.Chas_No = CHAS_MST.Chas_No AND im.Engn_No = CHAS_MST.Eng_No AND im.EXPORT_TYPE < 5 AND CHAS_MST.Export_Type < 5
     WHERE 
         CHAS_MST.CHAS_No IN (

         select chas_no from icm_mst where Delv_Date between '${firstDayOfCurrentMonth}' AND '${LastDayOfCurrentMonth}' and TRAN_ID in (select Icm_id from BHATIA_INVOICE)
         and Loc_Code in (${branch})
         )
      ) as ab
	  ORDER BY 
         [Vintage_Days] DESC
    `)
    if (Valid_From && Valid_From != '') {
      [result] = await sequelize.query(`
        select *,
	  -- Status Calculation
         CASE
             WHEN Allotment_Date IS NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Free'
             WHEN Allotment_Date IS NOT NULL AND SMS_Inv_No IS NULL AND SMS_Inv_Date IS NULL AND DMS_Inv_No IS NULL AND DMS_Inv_Date IS NULL THEN 'Allot'
             WHEN DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL AND (SMS_Inv_No IS NULL and SMS_Inv_Date IS NULL) THEN 'Sale in DMS'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is  NULL THEN 'Sold'
             WHEN SMS_Inv_No IS NOT NULL AND SMS_Inv_Date IS NOT NULL AND DMS_Inv_No IS NOT NULL AND DMS_Inv_Date IS NOT NULL and Delv_Date is not NULL THEN 'Delivered'
             ELSE 'Unknown'
         END AS Status
	 from (
	 SELECT
         CHAS_MST.Vin as Chasmstvin, 
         CHAS_MST.Loc_Code,
         (SELECT REPLACE(newcar_rcpt, '-S', '') FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS Outlet,
          (select top 1 vin from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as Qr,
                  (select top 1 UTD from NewCar_StockAudit where NewCar_StockAudit.vin=CHAS_MST.vin)as UTDAudit,
         (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Variant,
         (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Group,
         (SELECT TOP 1 Misc_Name FROM Misc_mst WHERE Misc_type = 14 AND Export_Type < 3 AND Misc_Code =
             (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS Basic_Model,
         (SELECT TOP 1 Modl_Code FROM Modl_Mst WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code) AS Model_Code,
         CHAS_MST.Chas_No AS Chassis,
         CHAS_MST.Eng_No AS Engine,
         CHAS_MST.Purc_Amt AS [Purc_Amt],
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Color,
         CHAS_MST.Clr_Abbr AS Color_Code,
         (SELECT Godw_Name FROM Godown_Mst WHERE Godw_Code = CHAS_MST.Loc_Code AND Godown_Mst.Export_Type < 3) AS St,
         CHAS_MST.PInv_Date AS [Desp_Date],
         DATEDIFF(DAY, CHAS_MST.PInv_Date, GETDATE()) AS [Vintage_Days],
         Year(PInv_Date) AS type,
         im.Ledg_Name AS [Customer_Name],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_DSE) AS [RM],
         (SELECT TOP 1 CONCAT(EmpFirstName, '', EmpLastName) AS EmpName FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SrNo = im.ERP_TL) AS [SRM],
         (SELECT TOP 1 Booking_ID FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND DeAlot_Date IS NULL) AS [Booking_ID],
         (SELECT TOP 1 created_at FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND DeAlot_Date IS NULL) AS [Allotment_Date],
         (SELECT TOP 1 DATEDIFF(DAY, created_at, GETDATE()) FROM CHAS_ALot WHERE CHAS_ALot.chas_id = CHAS_MST.Chas_id AND DeAlot_Date IS NULL) AS [Allotment_Vintage],
         im.inv_number AS [SMS_Inv_No],
         im.Bhatia_Inv_Date AS [SMS_Inv_Date],
         im.DMS_Inv AS [DMS_Inv_No],
         im.INV_Date AS [DMS_Inv_Date],
         im.Delv_Date AS [Delv_Date],
         (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 8 AND misc_mst.misc_code = im.fin_code) AS [Financier]
     FROM 
         CHAS_MST 
         LEFT JOIN icm_mst im ON im.Chas_No = CHAS_MST.Chas_No AND im.Engn_No = CHAS_MST.Eng_No AND im.EXPORT_TYPE < 5 AND CHAS_MST.Export_Type < 5
     WHERE  
CHAS_MST.Vin  like '%${Valid_From}%'
      ) as ab
	  ORDER BY 
         [Vintage_Days] DESC
`)
    }
    const filteredResult = model_group && !Valid_From
      ? result.filter(row => row.Model_Group == model_group)
      : result;
    const finalfilter = Status === 'ALL'
      ? filteredResult
      : Status === 'ERP'
        ? filteredResult.filter(row => row.entrystatus === 0)
        : Status === 'TRANSIT'
          ? filteredResult.filter(row => row.entrystatus === 1)
          : filteredResult; // Fallback for unexpected Status values

    const transformedData = finalfilter.reduce((acc, row) => {
      // Find or create the group for this Model_Group
      let group = acc.find(g => g.Model_Group === row.Model_Group);
      if (!group) {
        group = {
          Model_Group: row.Model_Group,
          Model_Group_Name: row.Basic_Model,
          models: []
        };
        acc.push(group);
      }
      // Add model details to the group
      group.models.push({
        Outlet: row.Outlet,
        Model_Variant: row.Model_Variant,
        Model_Group: row.Model_Group,
        Basic_Model: row.Basic_Model,
        Model_Code: row.Model_Code,
        Chassis: row.Chassis,
        Engine: row.Engine,
        Chas_Id: row.Chas_Id,
        Booking_ID: row.Booking_ID,
        Purc_Amt: row.Purc_Amt,
        Color: row.Color,
        Loc_Code: row.Loc_Code,
        Color_Code: row.Color_Code,
        St: row.St,
        Qr: row.Qr,
        Chasmstvin: row.Chasmstvin,
        Desp_Date: row.Desp_Date,
        Vintage_Days: row.Vintage_Days,
        type: row.type,
        Status: row.Status,
        entrystatus: row.entrystatus,
        Customer_Name: row.Customer_Name ? row.Customer_Name : row.Customer_Name1,
        RM: row.RM,
        SRM: row.SRM,
        Allotment_Date: row.Allotment_Date,
        Allotment_Vintage: row.Allotment_Vintage,
        SMS_Inv_No: row.SMS_Inv_No,
        SMS_Inv_Date: row.SMS_Inv_Date,
        DMS_Inv_No: row.DMS_Inv_No,
        DMS_Inv_Date: row.DMS_Inv_Date,
        Financier: row.Financier,
        UTDAudit: row.UTDAudit
      });

      return acc;
    }, []);
    const total = result.length;
    const transit = result.filter((item) => item.entrystatus == 1)
    return res.status(200).send({ transformedData: transformedData, result: finalfilter, total: total, transit: transit.length });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};
exports.modelGroups = async function (req, res) {
  const branch = req.body.branch
  try {
    const sequelize = await dbname(req.headers.compcode);

    const [model_group_dropdown] = await sequelize.query(`
      SELECT DISTINCT
    (SELECT TOP 1 Modl_Grp 
     FROM Modl_Mst 
     WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)  as value,
     
    (SELECT TOP 1 Misc_Name 
     FROM Misc_mst 
     WHERE Misc_type = 14 
       AND Export_Type < 3 
       AND Misc_Code = 
         (SELECT TOP 1 Modl_Grp 
          FROM Modl_Mst 
          WHERE Modl_Mst.Item_Code = CHAS_MST.Modl_Code)) AS label
FROM CHAS_MST
WHERE CHAS_ID IN (
    SELECT DISTINCT CHAS_ID
    FROM CHAS_TRAN
    WHERE Export_Type < 5 
      AND Item_Type = 2 
      AND Loc_Code IN (${branch})
    GROUP BY CHAS_ID
    HAVING SUM(IIF(TRAN_TYPE IN (0, 1, 4, 5), 1, -1)) > 0
);

	`)
    return res.status(200).send(model_group_dropdown);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};



async function validateBulkData(Modl_Array) {
  try {
    // Validate each item in the Modl_Array
    const validatedData = await Promise.all(
      Modl_Array.map((item) => rtoDetailsSchema.validateAsync(item))
    );

    return validatedData; // Return the validated data (optional)
  } catch (err) {
    throw new Error(`Validation error: ${err.message}`); // If any item fails validation, throw an error
  }
}
exports.savevahandetails = async function (req, res) {
  const data2 = req.body.data2
  const user = req.body.user
  let Modl_Array = []
  try {
    const sequelize = await dbname(req.headers.compcode);
    for (const item of data2) {
      const data = {
        INVOICE_NUMBER: item.INVOICE_NUMBER,
        REG_NUMBER: item.REG_NUMBER,
        VAHAN_REG_NUMBER: item.VAHAN_REG_NUMBER,
        INHOUSE: item.INHOUSE,
        SAME_STATE: item.SAME_STATE,
        PERMANENT_TAX_PAID: item.PERMANENT_TAX_PAID,
        NUMBER_GENERATED: item.NUMBER_GENERATED,
        DOCUMENTS_UPLOADED: item.DOCUMENTS_UPLOADED,
        FILE_SUBMITTED: item.FILE_SUBMITTED,
        RTO_APPROVAL_DONE: item.RTO_APPROVAL_DONE,
        UPDATED_IN_DMS: item.UPDATED_IN_DMS,
        REMARKS: item.REMARKS,
        Created_By: user,
        Mi_Date: item.Mi_Date
      }
      Modl_Array.push(data)
    }
    const validatedData = await validateBulkData(Modl_Array);
    const RtoDetails = _RtoDetails(sequelize, DataTypes);
    const t = await sequelize.transaction();
    const RtoDetails1 = await RtoDetails.bulkCreate(validatedData, {
      transaction: t,
    });
    await t.commit();
    return res.status(200).send("done");
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, err: e, Message: "Internal Server Error" });
  }
};


exports.updatevahandetails = async function (req, res) {
  const data2 = req.body.data2
  const user = req.body.user;
  let Modl_Array = [];
  try {
    const sequelize = await dbname(req.headers.compcode);
    for (const item of data2) {
      const data = {
        INVOICE_NUMBER: item.INVOICE_NUMBER,
        REG_NUMBER: item.REG_NUMBER,
        VAHAN_REG_NUMBER: item.VAHAN_REG_NUMBER,
        INHOUSE: item.INHOUSE,
        SAME_STATE: item.SAME_STATE,
        PERMANENT_TAX_PAID: item.PERMANENT_TAX_PAID,
        NUMBER_GENERATED: item.NUMBER_GENERATED,
        DOCUMENTS_UPLOADED: item.DOCUMENTS_UPLOADED,
        FILE_SUBMITTED: item.FILE_SUBMITTED,
        RTO_APPROVAL_DONE: item.RTO_APPROVAL_DONE,
        UPDATED_IN_DMS: item.UPDATED_IN_DMS,
        REMARKS: item.REMARKS,
        Created_By: user,
        Mi_Date: item.Mi_Date,
        UTD: item.UTD
      };
      Modl_Array.push(data);
    }
    const validatedData = await validateBulkData(Modl_Array);
    const Discount_Offer = _RtoDetails(sequelize, DataTypes);
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



exports.importformatdispatch = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Dispatch Excel Import";
    const Headeres = [
      'DELR',
      'CITY', 'INVOICETYPE', 'Fin No', 'Invoice GP No', 'GR No', 'ACCOUNTCODE', 'MODELCODE', 'COLOR', 'CHASSISPREFIX', 'CHASSISNO', 'ENGINENO', 'INVOICEDATE', 'INV_DATE_FOR_ROAD_PERMIT', 'Basic Value', 'Discount(Spot)', 'DRF', 'Assessable Value', 'IGST 28%', 'Cess', 'TCS', 'InvoiceAmt(Rs)', 'ORDERCATEGORY', 'PLANT', 'TIN', 'SENTBY', 'TRIPNO/CONSIGNMENTNO', 'TRANSPORTREGNUMBER', 'INDENT / ALLOTNO', 'TRANSNAME', 'EMAILID', 'FINANCIER',

    ];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

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
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Dispatch_Import_Tamplate.xlsx"'
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


async function validateBulkData(data) {
  try {
    // Validate each item in the Modl_Array
    const validatedData = await Promise.all(
      data.map((item) => dispatchDumpSchema.validateAsync(item))
    );

    return validatedData; // Return the validated data (optional)
  } catch (err) {
    throw new Error(`Validation error: ${err.message}`); // If any item fails validation, throw an error
  }
}

exports.excelimportdispatch = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Data = _DispatchDump(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file

    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }

    const user = req.body.user;
    const branch = req.body.branch;

    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }

    const renameKeys = (obj) => {
      const keyMap = {
        'DELR': 'DELR',
        'CITY': 'CITY',
        'INVOICETYPE': 'INVOICETYPE',
        'Fin No': 'Fin_No',
        'Invoice GP No': 'Invoice_GP_No',
        'GR No': 'GR_No',
        'ACCOUNTCODE': 'ACCOUNTCODE',
        'MODELCODE': 'MODELCODE',
        'COLOR': 'COLOR',
        'CHASSISPREFIX': 'CHASSISPREFIX',
        'CHASSISNO': 'CHASSISNO',
        'ENGINENO': 'ENGINENO',
        'INVOICEDATE': 'INVOICEDATE',
        'INV_DATE_FOR_ROAD_PERMIT': 'INV_DATE_FOR_ROAD_PERMIT',
        'Basic Value': 'Basic_Value',
        'Discount(Spot)': 'Discount',
        'DRF': 'DRF',
        'Assessable Value': 'Assessable_Value',
        'IGST 28%': 'IGST',
        'Cess': 'Cess',
        'TCS': 'TCS',
        'InvoiceAmt(Rs)': 'InvoiceAmt',
        'ORDERCATEGORY': 'ORDERCATEGORY',
        'PLANT': 'PLANT',
        'TIN': 'TIN',
        'SENTBY': 'SENTBY',
        'TRIPNO/CONSIGNMENTNO': 'TRIPNO',
        'TRANSPORTREGNUMBER': 'TRANSPORTREGNUMBER',
        'INDENT / ALLOTNO': 'INDENT',
        'TRANSNAME': 'TRANSNAME',
        'EMAILID': 'EMAILID',
        'FINANCIER': 'FINANCIER',

      };

      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        if (newKey === "INVOICEDATE") {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]);
            // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        } else if (newKey === "INV_DATE_FOR_ROAD_PERMIT") {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]);
            // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        }
        else {
          // Convert empty string values to null
          acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        }
        return acc;
      }, {});
    };

    const data = transformedData.map(renameKeys);
    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10); // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }
    const ErroredData = [];
    const CorrectData = [];

    data.forEach((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];
      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons.join(""),
        });
      } else {
        obj.Created_By = user;
        CorrectData.push(obj);
      }
    });
    const validatedData = await validateBulkData(CorrectData);

    const InsuData1 = await Insu_Data.bulkCreate(validatedData, {
      transaction: t,
    });
    await t.commit();
    const result = await processValidatedData(validatedData, req.headers.compcode);
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: result,
      Chasis: CorrectData,
      Message: `${InsuData1.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

const processValidatedData = async (validatedData, compcode) => {
  const sequelize = await dbname(compcode);
  try {
    const results = await Promise.all(
      validatedData.map((mainData, index) => ChasTransit(mainData, index, sequelize))
    );
    return results; // Return all results with statuses
  } catch (err) {
    console.log(err);
    // Handle error if needed
  }
};

const ChasTransit = async (mainData, index, sequelize) => {
  try {
    // Fetch related data concurrently
    const [
      CheckChassis,
      CheckEngine,
      ModlMst,
      Godw_Code,
      MaxChasId,
      MaxChasTranId,
    ] = await Promise.all([
      sequelize.query(`SELECT * FROM Chas_Mst WHERE Chas_No = '${mainData?.CHASSISNO}' and Eng_No = '${mainData?.ENGINENO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
      sequelize.query(`SELECT * FROM Chas_Mst WHERE Eng_No = '${mainData?.ENGINENO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
      sequelize.query(`SELECT top 1 Item_Code,HSN,Asset_Ledg,Income_Ledg,Modl_Code,Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg FROM modl_Mst WHERE Modl_Code like '%${mainData?.MODELCODE?.slice(0, 6)}%'`),
      sequelize.query(`SELECT Godw_Code FROM Godown_mst WHERE br_extranet='${mainData?.DELR || ''}-${mainData?.CITY || ''}'`),
      sequelize.query(`SELECT ISNULL(MAX(Chas_Id) + 1, 1) AS MaxChasId FROM CHAS_MST`),
      sequelize.query(`SELECT ISNULL(MAX(Tran_Id) + 1, 1) AS MaxChasTranId FROM CHAS_TRANSIT`),
    ]);

    // Skip if duplicate chassis or engine
    if (CheckChassis[0].length > 0) {
      console.log("Duplicate Chassis and Engine found, skipping entry.");
      mainData.status = "Duplicate Chassis or Engine, skipping entry";
      return mainData;
    }
    if (Godw_Code[0].length == 0) {
      console.log("Location Not found, skipping entry.");
      mainData.status = `Location Not found ${mainData?.DELR + mainData.CITY}, skipping entry`;
      return mainData;
    }
    // Generate unique Chas_Id and Tran_Id using Max + 1 + index
    const Chas_Id = MaxChasId[0][0]?.MaxChasId + index; // Using Max + 1 + index to generate unique ID
    const ChasTran_Id = MaxChasTranId[0][0]?.MaxChasTranId + index; // Same for transaction ID

    // Insert into CHAS_TRANSIT and CHAS_MST
    await Promise.all([
      sequelize.query(
        `INSERT INTO CHAS_TRANSIT (Tran_Id, CHAS_ID, TRAN_TYPE, Tran_Date, Tran_Amt, Asset_Ledg, Income_Ledg, Loc_Code, Export_Type, Item_Type, Item_Seq)
         VALUES (${ChasTran_Id}, ${Chas_Id}, 1, '${mainData?.INVOICEDATE?.toISOString().slice(0, 10)}', '${mainData?.InvoiceAmt}', 
         ${ModlMst[0][0]?.Asset_Ledg || null}, ${ModlMst[0][0]?.Income_Ledg || null}, '${Godw_Code[0][0]?.Godw_Code}', 1, 2, 1)`
      ),
      sequelize.query(
        `INSERT INTO CHAS_MST (Chas_Id, Chas_No, Eng_No, Modl_Code, Loc_Code, Export_Type, PInv_Date, Vin,Clr_Abbr)
         VALUES (${Chas_Id}, '${mainData?.CHASSISNO}', '${mainData?.ENGINENO}', ${ModlMst[0][0]?.Item_Code || null}, '${Godw_Code[0][0]?.Godw_Code}', 1, 
         '${mainData?.INVOICEDATE?.toISOString().slice(0, 10)}', '${mainData?.CHASSISPREFIX}${mainData?.CHASSISNO}','${mainData.COLOR}')`
      )
    ]);

    mainData.status = "Successfully inserted";
    return mainData;

  } catch (err) {
    console.error("Error in ChasTransit:", err);
    mainData.status = `Error: ${err.message}`;
    return mainData;
  }
};
exports.SaveInternal = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Misc_Name = req.body.Misc_Name;
  const Misc_Hod = req.body.Misc_Hod
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `Insert into Misc_Mst(misc_code,Misc_Name,misc_type,Export_Type,ServerId,Misc_Hod,Loc_Code)
      values ((SELECT COALESCE(MAX(misc_code + 1), 1001) AS next_misc_code FROM Misc_Mst WHERE Misc_Type = 631),
      '${Misc_Name}',631,1,1,'${Misc_Hod}',1)`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.UpdateInternal = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Misc_Name = req.body.Misc_Name;
  const Misc_Hod = req.body.Misc_Hod;
  const misc_code = req.body.misc_code;
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `update Misc_Mst set Misc_Name = '${Misc_Name}', Misc_Hod = '${Misc_Hod}' where Misc_Type = '631' and export_type <3 and misc_code ='${misc_code}'`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};


exports.findMasterdata = async function (req, res) {
  const Branch = req.body.Branch;
  const validfrom = req.body.validfrom;
  const validTo = req.body.validTo;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`
      SELECT UTD, name, Branch, amount, validfrom, validTo 
      FROM Dashboard_Master
      WHERE Branch = :Branch
    `, {
      replacements: { Branch }, // Using parameterized query for safety
      type: sequelize.QueryTypes.SELECT
    });
    res.status(200).send({ result: result });
  } catch (err) {
    console.error("Error fetching master data:", err);
    res.status(500).send({ error: "Failed to fetch data" });
  }
};

exports.SaveParameter = async function (req, res) {

  // Validate the amounts array using Joi
  const { error: financeError, value: FinancerMasters } = Joi.array()
    .items(dashboardMasterSchema)
    .validate(req.body.amounts, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Handle validation errors
  if (financeError) {
    const errors = financeError.details || [];
    const errorMessage = errors.map((err) => err.message).join(', ');
    return res.status(400).send({ success: false, message: errorMessage });
  }

  let transaction;
  try {
    // Get the Sequelize instance and model
    const sequelize = await dbname(req.headers.compcode);
    const Finance_Master = _DashboardMaster(sequelize, Sequelize.DataTypes);
    // Start a transaction
    transaction = await sequelize.transaction();
    const InsuData1 = await Finance_Master.bulkCreate(FinancerMasters, {
      transaction: transaction,
    });
    // Commit the transaction after successful inserts
    await transaction.commit();
    // Send a success response with inserted records
    return res.status(200).send({
      success: true,
      message: ' data inserted successfully',
    });
  } catch (err) {
    // Rollback the transaction in case of error
    if (transaction) await transaction.rollback();
    console.log('Error saving Data:', err);
    return res.status(500).send({
      success: false,
      message: 'Error saving Data ',
      error: err.message,
    });
  }
};

exports.UpdateParameter = async function (req, res) {
  // Validate the amounts array using Joi
  const { error: financeError, value: FinancerMasters } = Joi.array()
    .items(dashboardMasterSchema)
    .validate(req.body.amounts, {
      abortEarly: false,
      stripUnknown: true,
    });
  // Handle validation errors
  if (financeError) {
    const errors = financeError.details || [];
    const errorMessage = errors.map((err) => err.message).join(', ');
    return res.status(400).send({ success: false, message: errorMessage });
  }
  let transaction;
  try {
    // Get the Sequelize instance and model
    const sequelize = await dbname(req.headers.compcode);
    const Finance_Master = _DashboardMaster(sequelize, Sequelize.DataTypes);

    // Start a transaction
    transaction = await sequelize.transaction();

    // Insert each valid financer into the database
    const insertedRecords = await Promise.all(
      FinancerMasters.map((financerData) => {
        const { UTD, ...otherFields } = financerData; // Extract UTD and remaining fields

        return Finance_Master.update(
          {
            ...otherFields, // Spread the remaining fields into the update object
          },
          {
            where: { UTD }, // Use UTD to identify the record to update
            transaction, // Pass the transaction object for atomic updates
          }
        );
      })
    );
    // Commit the transaction after successful inserts
    await transaction.commit();
    // Send a success response with inserted records
    return res.status(200).send({
      success: true,
      message: ' data inserted successfully',
      data: insertedRecords,
    });
  } catch (err) {
    // Rollback the transaction in case of error
    if (transaction) await transaction.rollback();
    console.log('Error saving data:', err);
    return res.status(500).send({
      success: false,
      message: 'Error saving  data',
      error: err.message,
    });
  }
};


exports.workshopDashBoardProfit = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(dates.start, dates.end);
    const query2 = `
    SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN profit ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN profit ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and LEFT(HSN,4)<>'2710' and Export_Type<5 and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5 and
     LEFT(HSN,4)<>'2710' and
    loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
    `
    const query2pv = `
    SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN PerVehicle ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN PerVehicle ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and LEFT(HSN,4)<>'2710' and Export_Type<5 and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5 and LEFT(HSN,4)<>'2710' and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
    `
    const query3 = `
     SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN profit ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN profit ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type<5 and LEFT(HSN,4)='2710' and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5 and LEFT(HSN,4)='2710' and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
   `
    const query3pv = `
      SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN PerVehicle ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN PerVehicle ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type<5  and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='WorkShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5  and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
     `
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)

    res.send({
      data2: data2[0],
      data2pv: data2pv[0],
      data3: data3[0],
      data3pv: data3pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};
exports.bodyshopDashBoardProfit = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    // const monthStart = parseInt(req.body.monthFrom);
    // const monthEnd = parseInt(req.body.monthTo);
    // const year = parseInt(req.body.year);
    // const dates = calculateDates(year, monthStart, monthEnd, 4);
    // const prevdates = calculateDates(year - 1, monthStart, monthEnd, 4);

    // const currentDate = new Date();
    // const currentyear = currentDate.getFullYear();
    // const currentmonth = currentDate.getMonth() + 1;

    // const currentMonth = getMonthStartAndEndDates(currentyear, currentmonth);
    // // Get the start and end dates of the previous month
    // if (currentmonth == 1) {
    //   currentmonth = 13
    //   currentyear = currentyear - 1
    // }
    // const previousMonth = getMonthStartAndEndDates(currentyear, currentmonth - 1);
    let dates = {}; // Use 'let' instead of 'const' so you can modify it

    dates.start = req.body.DATE_FROM; // Assign DATE_FROM to dates.start
    dates.end = req.body.DATE_TO; // Assign DATE_TO to dates.end

    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const currentDate = new Date(dates.end) // Use the end date to calculate previous month dates
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().slice(0, 10);

    // Get the start and end dates for the previous month
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 2).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10); // Use the end date to calculate previous month dates
    // const prevdates = getPreviousMonthDates(dates.start, dates.end);
    const query2 = `
    SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN profit ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN profit ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and LEFT(HSN,4)<>'2710' and Export_Type<5 and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5 and
     LEFT(HSN,4)<>'2710' and
    loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
    `
    const query2pv = `
    SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN PerVehicle ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN PerVehicle ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and LEFT(HSN,4)<>'2710' and Export_Type<5 and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Parts')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Parts'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}' and LEFT(HSN,4)<>'2710'  and Export_Type<5 and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
    `
    const query3 = `
     SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN profit ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN profit ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type<5 and LEFT(HSN,4)='2710' and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5 and LEFT(HSN,4)='2710' and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
   `
    const query3pv = `
      SELECT loc_code,
SUM(CASE WHEN CurrentYear = 0 THEN PerVehicle ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN PerVehicle ELSE 0 END) AS chart_data_current_year
FROM (
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${prevYearDates.start}' and '${prevYearDates.end}' and Export_Type<5  and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        )
        )  group by loc_code
union all
SELECT COUNT(DISTINCT bill_no) AS qty,
        SUM(taxable) AS chart_data,
		1 AS CurrentYear,
		(select top 1 amount from Dashboard_Master where branch=loc_code and name='bodyShop_Oil')as Percentage,
        (select top 1 godw_name from godown_mst g where g.godw_code = d.loc_code and g.export_type < 3 ) as loc_code,
		 (SUM(COALESCE(d.taxable, 0)) * 
         (COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100)
        ) AS profit,
		(SUM(COALESCE(d.taxable, 0)) * 
         ((COALESCE((SELECT TOP 1 amount 
                FROM Dashboard_Master 
                WHERE branch = d.loc_code AND name = 'bodyShop_Oil'), 0) / 100))/COUNT(DISTINCT bill_no)
        )PerVehicle
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin  in ('BANDP') and Sale_Type = 'goods' 
		and bill_date between '${dates.start}' and '${dates.end}'  and Export_Type<5  and loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment})  and Godw_Code in (${branchesArray})
        )
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and Godw_Code in (${branchesArray})
        ))  group by loc_code
		) AS combined
GROUP BY loc_code,qty,chart_data,CurrentYear,Percentage,profit,PerVehicle  order by loc_code
     `
    const data2 = await sequelize.query(query2)
    const data2pv = await sequelize.query(query2pv)
    const data3 = await sequelize.query(query3)
    const data3pv = await sequelize.query(query3pv)

    res.send({
      data2: data2[0],
      data2pv: data2pv[0],
      data3: data3[0],
      data3pv: data3pv[0],
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};

function getYearAndMonth(date) {
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0'); // Ensure two digits for month
  return { year, month };
}

exports.stockview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;

    // Extract Year and Month
    const fromData = getYearAndMonth(req.body.DATE_FROM);
    const toData = getYearAndMonth(req.body.DATE_TO);

    const data = await sequelize.query(`DECLARE @StartYear INT = ${fromData.year}; -- Set your start year
    DECLARE @StartMonth INT = ${fromData.month}; -- Set your start month
    DECLARE @EndYear INT = ${toData.year}; -- Set your end year
    DECLARE @EndMonth INT = ${toData.month}; -- Set your end month

     WITH Transactions AS (
    SELECT 
        YEAR(Tran_Date) AS Tran_Year,
        MONTH(Tran_Date) AS Tran_Month,
		Modl_Mst.Modl_Grp,
        -- Amount calculations
        SUM(CASE WHEN Tran_Type = 0 THEN Tran_Amt ELSE 0 END) AS Opening_Amt,
        SUM(CASE WHEN Tran_Type = 1 THEN Tran_Amt ELSE 0 END) AS Purchase_Amt,
        SUM(CASE WHEN Tran_Type = 2 THEN Tran_Amt ELSE 0 END) AS Sale_Amt,
        SUM(CASE WHEN Tran_Type = 3 THEN Tran_Amt ELSE 0 END) AS Purchase_Return_Amt, -- Purchase Return
        SUM(CASE WHEN Tran_Type = 4 THEN Tran_Amt ELSE 0 END) AS Sale_Return_Amt, -- Sale Return
        SUM(CASE WHEN Tran_Type = 5 THEN Tran_Amt ELSE 0 END) AS Trf_In_Amt,
        SUM(CASE WHEN Tran_Type = 6 THEN Tran_Amt ELSE 0 END) AS Trf_Out_Amt,
        -- Quantity calculations
        SUM(CASE WHEN Tran_Type = 0 THEN 1 ELSE 0 END) AS Opening_Qty,
        SUM(CASE WHEN Tran_Type = 1 THEN 1 ELSE 0 END) AS Purchase_Qty,
        SUM(CASE WHEN Tran_Type = 2 THEN 1 ELSE 0 END) AS Sale_Qty,
        SUM(CASE WHEN Tran_Type = 3 THEN 1 ELSE 0 END) AS Purchase_Return_Qty, -- Purchase Return
        SUM(CASE WHEN Tran_Type = 4 THEN 1 ELSE 0 END) AS Sale_Return_Qty, -- Sale Return
        SUM(CASE WHEN Tran_Type = 5 THEN 1 ELSE 0 END) AS Trf_In_Qty,
        SUM(CASE WHEN Tran_Type = 6 THEN 1 ELSE 0 END) AS Trf_Out_Qty
    FROM 
        chas_tran
		left join CHAS_MST on CHAS_MST.Chas_Id=chas_tran.CHAS_ID
	    left join Modl_Mst on Modl_Mst.Item_Code=CHAS_MST.Modl_Code
    WHERE 
        chas_tran.Item_Type = 2 -- Filter for new cars
        AND chas_tran.Loc_Code in (select godw_code from Godown_Mst where Br_Segment in (${Br_Segment}) and Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray}) and Export_Type<3)
        AND chas_tran.Export_Type < 5 
    GROUP BY 
        YEAR(Tran_Date), MONTH(Tran_Date),Modl_Mst.Modl_Grp),
Cumulative AS (
    SELECT 
        Tran_Year,
        Tran_Month,
        Modl_Grp,
        -- Cumulative amounts
        SUM(Opening_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Opening_Amt,
        SUM(Purchase_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Purchase_Amt,
        SUM(Sale_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Sale_Amt,
        SUM(Purchase_Return_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Purchase_Return_Amt,
        SUM(Sale_Return_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Sale_Return_Amt,
        SUM(Trf_In_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Trf_In_Amt,
        SUM(Trf_Out_Amt) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Trf_Out_Amt,
        -- Cumulative quantities
        SUM(Opening_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Opening_Qty,
        SUM(Purchase_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Purchase_Qty,
        SUM(Sale_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Sale_Qty,
        SUM(Purchase_Return_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Purchase_Return_Qty,
        SUM(Sale_Return_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Sale_Return_Qty,
        SUM(Trf_In_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Trf_In_Qty,
        SUM(Trf_Out_Qty) OVER (PARTITION BY Modl_Grp ORDER BY Tran_Year, Tran_Month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_Trf_Out_Qty
    FROM Transactions
),
StockReport AS (
    SELECT 
        t.Tran_Year,
        t.Tran_Month,
        t.Modl_Grp,
        
        -- Opening balances (amount and quantity)
        ISNULL(LAG(
            c.Cumulative_Opening_Amt + c.Cumulative_Purchase_Amt + c.Cumulative_Trf_In_Amt 
            - c.Cumulative_Sale_Amt - c.Cumulative_Trf_Out_Amt 
            + c.Cumulative_Sale_Return_Amt - c.Cumulative_Purchase_Return_Amt, 1
        ) OVER (PARTITION BY t.Modl_Grp ORDER BY t.Tran_Year, t.Tran_Month), 
        c.Cumulative_Opening_Amt) AS Opening_Amt,
        
        ISNULL(LAG(
            c.Cumulative_Opening_Qty + c.Cumulative_Purchase_Qty + c.Cumulative_Trf_In_Qty 
            - c.Cumulative_Sale_Qty - c.Cumulative_Trf_Out_Qty 
            + c.Cumulative_Sale_Return_Qty - c.Cumulative_Purchase_Return_Qty, 1
        ) OVER (PARTITION BY t.Modl_Grp ORDER BY t.Tran_Year, t.Tran_Month), 
        c.Cumulative_Opening_Qty) AS Opening_Qty,
        
        -- Current month metrics
        t.Purchase_Amt,
        t.Purchase_Qty,
        t.Sale_Amt,
        t.Sale_Qty,
        t.Purchase_Return_Amt,
        t.Purchase_Return_Qty,
        t.Sale_Return_Amt,
        t.Sale_Return_Qty,
        t.Trf_In_Amt,
        t.Trf_In_Qty,
        t.Trf_Out_Amt,
        t.Trf_Out_Qty,
        
        -- Closing balances (amount and quantity)
        ISNULL(
            c.Cumulative_Opening_Amt + c.Cumulative_Purchase_Amt + c.Cumulative_Trf_In_Amt 
            - c.Cumulative_Sale_Amt - c.Cumulative_Trf_Out_Amt 
            + c.Cumulative_Sale_Return_Amt - c.Cumulative_Purchase_Return_Amt, 0
        ) AS Closing_Amt,
        
        ISNULL(
            c.Cumulative_Opening_Qty + c.Cumulative_Purchase_Qty + c.Cumulative_Trf_In_Qty 
            - c.Cumulative_Sale_Qty - c.Cumulative_Trf_Out_Qty 
            + c.Cumulative_Sale_Return_Qty - c.Cumulative_Purchase_Return_Qty, 0
        ) AS Closing_Qty
    FROM Transactions t
    JOIN Cumulative c
        ON t.Tran_Year = c.Tran_Year 
        AND t.Tran_Month = c.Tran_Month 
        AND t.Modl_Grp = c.Modl_Grp
)
SELECT 
Tran_Year,
    Tran_Month,
    CASE 
    WHEN Tran_Month = 1 THEN 'Jan'
    WHEN Tran_Month = 2 THEN 'Feb'
    WHEN Tran_Month = 3 THEN 'Mar'
    WHEN Tran_Month = 4 THEN 'Apr'
    WHEN Tran_Month = 5 THEN 'May'
    WHEN Tran_Month = 6 THEN 'Jun'
    WHEN Tran_Month = 7 THEN 'Jul'
    WHEN Tran_Month = 8 THEN 'Aug'
    WHEN Tran_Month = 9 THEN 'Sep'
    WHEN Tran_Month = 10 THEN 'Oct'
    WHEN Tran_Month = 11 THEN 'Nov'
    WHEN Tran_Month = 12 THEN 'Dec'
END AS Tran_Month_Name,
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 14 
       AND Misc_Code = Modl_Grp) AS Modl_Grp,
    ROUND(Opening_Amt, 2) AS Opening_Amt,
    ROUND(Opening_Qty, 2) AS Opening_Qty,
    ROUND(Purchase_Amt, 2) AS Purchase_Amt,
    ROUND(Purchase_Qty, 2) AS Purchase_Qty,
    ROUND(Sale_Amt, 2) AS Sale_Amt,
    ROUND(Sale_Qty, 2) AS Sale_Qty,
    ROUND(Purchase_Return_Amt, 2) AS Purchase_Return_Amt,
    ROUND(Purchase_Return_Qty, 2) AS Purchase_Return_Qty,
    ROUND(Sale_Return_Amt, 2) AS Sale_Return_Amt,
    ROUND(Sale_Return_Qty, 2) AS Sale_Return_Qty,
    ROUND(Trf_In_Amt, 2) AS Trf_In_Amt,
    ROUND(Trf_In_Qty, 2) AS Trf_In_Qty,
    ROUND(Trf_Out_Amt, 2) AS Trf_Out_Amt,
    ROUND(Trf_Out_Qty, 2) AS Trf_Out_Qty,
    ROUND(Closing_Amt, 2) AS Closing_Amt,
    ROUND(Closing_Qty, 2) AS Closing_Qty
FROM StockReport
WHERE 
    (Tran_Year > @StartYear OR (Tran_Year = @StartYear AND Tran_Month >= @StartMonth))
    AND (Tran_Year < @EndYear OR (Tran_Year = @EndYear AND Tran_Month <= @EndMonth))
    ORDER BY Tran_Year, Tran_Month;`)
    const formatData = (data) => {
      return data.reduce((result, row) => {
        const { Tran_Year, Tran_Month, Modl_Grp, ...values } = row;
        // Find if Modl_Grp already exists
        let existingGroup = result.find((group) => group.Modl_Grp === Modl_Grp);
        if (!existingGroup) {
          existingGroup = {
            Modl_Grp,
            Months: [],
          };
          result.push(existingGroup);
        }
        // Add month data
        existingGroup.Months.push({
          Month: `${Tran_Year}-${String(Tran_Month).padStart(2, "0")}`,
          ...values,
        });
        return result;
      }, []);
    };

    const formattedData = formatData(data[0]);
    res.send({ formattedData: formattedData, data: data[0] });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};



exports.workshop_profit_report = async function (req, res) {
  // const sequelize = await dbname(req.headers.compcode);
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const location = data.location;
    const query = `select 
ROW_NUMBER() OVER (ORDER BY Bill_No) AS [srl no],
Bill_Date as [Bill Date],Bill_No as [Bill No],
vin as [Service Type],Ledger_Name as [Party Name],
(select top 1 godw_name from Godown_Mst where Godw_Code=Loc_Code)as Branch,
round(Net_Part_Amount,2) as [Net Amount of Part],
round(Margin_Parts,2)  as [Margin on Parts],
round(Oil_Amount,2) as [Oil Sale basic Amount],
round(Margin_oil,2) as [Margin on Oil],
round(Labour_Amount,2) as [Net Labour],
   round( (Margin_Parts + Margin_oil + Labour_Amount),2) AS [Total Margin PV] ,
	round(Bill_Cost,2) as [Total Bill Cost],
	round(Bill_Amt,2) as [Bill Amt],
	CASE 
        WHEN Bill_Cost > 0 THEN 
            round(((Margin_Parts + Margin_oil + Labour_Amount) * 100.0) / Bill_Cost,2)
        ELSE 
            0 
    END AS [% Margin]
	from  (SELECT 
        Bill_No,Bill_Date,vin,Ledger_Name,
		SUM(CASE WHEN LEFT(HSN, 4) <> '2710' and Sale_Type = 'goods'  THEN Taxable ELSE 0 END) AS [Net_Part_Amount],
		SUM(CASE WHEN LEFT(HSN, 4) <> '2710' and Sale_Type = 'goods'  THEN Taxable ELSE 0 END) * 
			(COALESCE(
				(SELECT TOP 1 amount 
				 FROM Dashboard_Master 
				 WHERE branch = d.loc_code AND name = 'WorkShop_Parts'), 
				0
			) / 100) AS [Margin_Parts],
			SUM(CASE WHEN LEFT(HSN, 4) ='2710' and Sale_Type = 'goods'  THEN Taxable ELSE 0 END) AS [Oil_Amount],
			SUM(CASE WHEN LEFT(HSN, 4) ='2710' and Sale_Type = 'goods'  THEN Taxable ELSE 0 END) * 
			(COALESCE(
				(SELECT TOP 1 amount 
				 FROM Dashboard_Master 
				 WHERE branch = d.loc_code AND name = 'WorkShop_Oil'), 
				0
			) / 100) AS [Margin_oil],
			SUM(CASE WHEN  Sale_Type = 'service'  THEN Taxable ELSE 0 END) AS [Labour_Amount],
			sum(Taxable)as Bill_Cost,
			Inv_Amt as Bill_Amt,
			Loc_Code
        FROM dms_row_data AS d
        WHERE tran_type = 7 And vin not in ('BANDP')
		and bill_date between '${dateFrom}' and '${dateto}'  and Export_Type<5
		and Loc_Code in (${location})
        AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 
		and d2.Loc_Code in (${location})
		)
		group by Bill_No,Bill_Date,VIN,Ledger_Name,Loc_Code,Inv_Amt
		)as ab `

    let txnDetails;
    let reportName;

    txnDetails = await sequelize.query(query);
    reportName = "Workshop bill Wise Profit";

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


const formatData = (data) => {
  const formattedData = [];
  const channels = [...new Set(data.map(item => item.Channel))];

  channels.forEach(channel => {
    const channelData = data.filter(item => item.Channel === channel);
    const currentRow = { Channel: channel, Year: 'CY', Total: 0 };
    const lastRow = { Channel: channel, Year: 'LY', Total: 0 };
    const growthRow = { Channel: channel, Year: '% Growth', Total: '' };

    let totalGrowth = 0;
    let growthCount = 0;

    channelData.forEach(item => {
      currentRow[item.loc_code] = item.chart_data_current_year || 0;
      lastRow[item.loc_code] = item.chart_data_prev_year || 0;
      growthRow[item.loc_code] = item.growth ? `${item.growth.toFixed(2)}%` : '';

      // Accumulate totals
      currentRow.Total += item.chart_data_current_year || 0;
      lastRow.Total += item.chart_data_prev_year || 0;

      if (item.growth) {
        totalGrowth += item.growth;
        growthCount += 1;
      }
    });

    if (growthCount > 0) {
      growthRow.Total = `${(totalGrowth / growthCount).toFixed(2)}%`;
    }

    // Reorder keys to ensure correct order
    const reorderKeys = (row) => {
      const { Channel, Year, Total, ...locCodes } = row;
      return { Channel, Year, ...locCodes, Total };
    };

    // Add rows to the formatted data
    formattedData.push(
      reorderKeys(currentRow),
      reorderKeys(lastRow),
      reorderKeys(growthRow),
      {}
    );
  });

  return formattedData;
};


exports.Quantative_Dashboard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branchesArray = req.body.branch;
    const Br_Segment = req.body.Br_Segment;
    const Br_Location = req.body.Br_Location;
    let dates = {};
    dates.start = req.body.DATE_FROM;
    dates.end = req.body.DATE_TO;
    const prevYearDates = getPreviousYearDates(dates.start, dates.end);
    const query1 = ` SELECT
 CASE 
        WHEN combined.Br_Segment = 0 THEN 'Service' 
        WHEN combined.Br_Segment = 10001 THEN 'BodyShop' 
        WHEN combined.Br_Segment = 10007 THEN 'TrueValue'
        ELSE REPLACE(
            (SELECT TOP 1 Misc_name 
             FROM Misc_Mst 
             WHERE misc_type = 302 
             AND Misc_Code = combined.Br_Segment), 
            'WS', 'SR')
    END AS Channel,
    (select top 1 Misc_name from Misc_Mst where misc_type=303 and Misc_Code=combined.loc_code)as loc_code,
    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
    SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
	CAST(
    ROUND(
        CASE 
            WHEN SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) = 0 THEN NULL
            ELSE 
                (SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) - 
                 SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END)) * 100.0 /
                SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END)
        END, 2
    ) AS DECIMAL(10, 2)
) AS growth
FROM (
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
0 AS CurrentYear,
        g.Br_Location as loc_code,
		g.Br_Segment
 FROM SE01DB23.dbo.dms_row_data AS d
 LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE tran_type = 1 and
 bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}' and d.Export_Type in (1,2) 
  and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
 AND NOT EXISTS (
     SELECT 1
     FROM SE01DB23.dbo.dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 10 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by g.Br_Location,g.Br_Segment
    UNION ALL
    -- Subquery for current year (2024-2025)
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
1 AS CurrentYear,
        g.Br_Location as loc_code,
		g.Br_Segment
 FROM dms_row_data AS d
 LEFT JOIN 
 godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
 WHERE tran_type =1  and bill_date  between '${dates.start}' and '${dates.end}'
 and d.Export_Type in (1,2)  and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
 AND NOT EXISTS (
     SELECT 1
     FROM dms_row_data AS d2
     WHERE d2.bill_no = d.bill_no
     AND d2.tran_type = 10 and d2.Export_Type in (1,2)
     and d2.loc_code in (select godw_code from godown_mst where 
        Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
        )
     ) group by g.Br_Location,g.Br_Segment
) AS combined
GROUP BY loc_code,Br_Segment
    `
    const query2 = ` SELECT
    CASE 
       WHEN combined.Br_Segment = 0 THEN 'Service' 
       WHEN combined.Br_Segment = 10001 THEN 'BodyShop' 
       WHEN combined.Br_Segment = 10007 THEN 'TrueValue'
       ELSE (SELECT TOP 1 Misc_name 
             FROM Misc_Mst 
             WHERE misc_type = 302 
             AND Misc_Code = combined.Br_Segment) 
   END AS Channel,
       (select top 1 Misc_name from Misc_Mst where misc_type=303 and Misc_Code=combined.loc_code)as loc_code,
       SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) AS chart_data_prev_year,
       SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) AS chart_data_current_year,
     CAST(
       ROUND(
           CASE 
               WHEN SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END) = 0 THEN NULL
               ELSE 
                   (SUM(CASE WHEN CurrentYear = 1 THEN chart_data ELSE 0 END) - 
                    SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END)) * 100.0 /
                   SUM(CASE WHEN CurrentYear = 0 THEN chart_data ELSE 0 END)
           END, 2
       ) AS DECIMAL(10, 2)
   ) AS growth
   FROM (
   --truevalue
   SELECT COUNT(DISTINCT bill_no) AS chart_data,
   0 AS CurrentYear,
           g.Br_Location as loc_code,
       10007 as Br_Segment
    FROM SE01DB23.dbo.dms_row_data AS d
    LEFT JOIN 
       godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE tran_type in (select misc_code from misc_mst where misc_type=56 and misc_dtl1 in (select book_code from book_mst where book_type=8 and inv_book=3))  and
    bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}' and d.Export_Type in (1,2)  and 
    g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM SE01DB23.dbo.dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type in (select misc_code from misc_mst where misc_type=56 and misc_dtl1 in (select book_code from book_mst where book_type=6 and inv_book=3))  and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
           Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
           )
        ) group by g.Br_Location,g.Br_Segment
       UNION ALL
       -- Subquery for current year (2024-2025)
       SELECT COUNT(DISTINCT bill_no) AS chart_data,
   1 AS CurrentYear,
           g.Br_Location as loc_code,
       10007 as Br_Segment
    FROM dms_row_data AS d
    LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE tran_type in (select misc_code from misc_mst where misc_type=56 and misc_dtl1 in (select book_code from book_mst where book_type=8 and inv_book=3))
     and bill_date  between '${dates.start}' and '${dates.end}'
    and d.Export_Type in (1,2)  and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type in (select misc_code from misc_mst where misc_type=56 and misc_dtl1 in (select book_code from book_mst where book_type=6 and inv_book=3)) and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
           Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
           )
        ) group by g.Br_Location,g.Br_Segment
      union all
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
   0 AS CurrentYear,
           g.Br_Location as loc_code,
       0 as Br_Segment
    FROM SE01DB23.dbo.dms_row_data AS d
    LEFT JOIN 
       godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE tran_type = 7 and vin not in ('BANDP') and
    bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}' and d.Export_Type in (1,2)  and 
    g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM SE01DB23.dbo.dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
           Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
           )
        ) group by g.Br_Location,g.Br_Segment
       UNION ALL
       -- Subquery for current year (2024-2025)
       SELECT COUNT(DISTINCT bill_no) AS chart_data,
   1 AS CurrentYear,
           g.Br_Location as loc_code,
       0 as Br_Segment
    FROM dms_row_data AS d
    LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE tran_type =7   and vin not in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'
    and d.Export_Type in (1,2)  and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
           Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
           )
        ) group by g.Br_Location,g.Br_Segment
        --Bodyshop
   UNION ALL
    SELECT COUNT(DISTINCT bill_no) AS chart_data,
   0 AS CurrentYear,
           g.Br_Location as loc_code,
       10001 as Br_Segment
    FROM SE01DB23.dbo.dms_row_data AS d
    LEFT JOIN 
       godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE tran_type = 7 and vin  in ('BANDP') and
    bill_date  between '${prevYearDates.start}' and '${prevYearDates.end}' and d.Export_Type in (1,2)  and 
    g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM SE01DB23.dbo.dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
           Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
           )
        ) group by g.Br_Location,g.Br_Segment
       UNION ALL
       -- Subquery for current year (2024-2025)
       SELECT COUNT(DISTINCT bill_no) AS chart_data,
   1 AS CurrentYear,
           g.Br_Location as loc_code,
       10001 as Br_Segment
    FROM dms_row_data AS d
    LEFT JOIN 
    godown_mst AS g ON g.godw_code = d.loc_code AND g.export_type < 3
    WHERE tran_type =7   and vin  in ('BANDP') and bill_date  between '${dates.start}' and '${dates.end}'
    and d.Export_Type in (1,2)  and g.Br_Segment in (${Br_Segment}) and  g.Br_Location in (${Br_Location}) and g.Godw_Code in (${branchesArray})
    AND NOT EXISTS (
        SELECT 1
        FROM dms_row_data AS d2
        WHERE d2.bill_no = d.bill_no
        AND d2.tran_type = 6 and d2.Export_Type in (1,2)
        and d2.loc_code in (select godw_code from godown_mst where 
           Br_Segment in (${Br_Segment}) and  Br_Location in (${Br_Location}) and Godw_Code in (${branchesArray})
           )
        ) group by g.Br_Location,g.Br_Segment
   ) AS combined
   GROUP BY loc_code,Br_Segment
       `
    const data1 = await sequelize.query(query1)
    const data2 = await sequelize.query(query2)
    const formatted1 = formatData(data1[0]);
    const formatted2 = formatData(data2[0]);
    res.send({
      data1: [...formatted1, {}, ...formatted2]
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  } finally {
    await sequelize.close();
  }
};