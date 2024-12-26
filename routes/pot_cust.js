const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');
const { SendWhatsAppMessgae } = require("./user");




exports.savepotcust = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "datadtaa");
    try {
        const [maxCodeResult] = await sequelize.query(
            'SELECT COALESCE(MAX(TRAN_ID), 0) AS max_tran_id FROM POT_CUST',
            { transaction: t }
        );
        const nexttran_id = maxCodeResult[0].max_tran_id + 1;

        await sequelize.query(
            `INSERT INTO POT_CUST (TRAN_ID, VEHREGNO, CHASS_NO, MOD_GRP,MOD_NAME, CUST_NAME, MOBILE, EMAIL,PART_DESC, PART_NO, EXP_DELV_DATE, adv_name, PRIORITY, CUST_ADV_PYMT,  DMS_PART_NO, DMS_PART_DATE,Server_ID,Export_Type, Created_by, Id, LOC_CODE)
            VALUES (:tran_id, :vehregno, :chass_no, :mod_grp,:mod_name, :cust_name, :mobile, :email,:part_desc, :part_no, :exp_delv_date, :adv_name, :priority, :cust_adv_pymt,:dms_part_no, :dms_part_date,:Server_ID,:Export_Type ,:created_by, :id, :loc_code)`,
            {
                replacements: {
                    tran_id: nexttran_id,
                    vehregno: data.VEHREGNO || null,
                    chass_no: data.CHASS_NO || null,
                    mod_grp: data.MOD_GRP || null,
                    mod_name: data.MOD_NAME || null,
                    cust_name: data.CUST_NAME || null,
                    mobile: data.MOBILE || null,
                    email: data.EMAIL || null,
                    part_desc: data.PART_DESC || null,
                    adv_name: data.adv_name || null,
                    priority: data.PRIORITY || null,
                    cust_adv_pymt: data.CUST_ADV_PYMT || null,
                    exp_delv_date: data.EXP_DELV_DATE || null,
                    part_no: data.PART_NO || null,
                    dms_part_no: data.DMS_PART_NO || null,
                    dms_part_date: data.DMS_PART_DATE || null,
                    Server_ID: 1,
                    Export_Type: 1,
                    created_by: data.Created_by,
                    id: data.Id,
                    loc_code: data.LOC_CODE
                },
                transaction: t
            }
        );


        if (data.POT_CUST_DTL) {
            for (let i = 0; i < data.POT_CUST_DTL.length; i++) {
                const data1 = data.POT_CUST_DTL[i];

                const SNo = i + 1; // Setting SNo based on loop index
                console.log(data1, "indexxxxxxxxxxxx");

                const inserta_POT_CUST_DTL = `
                    INSERT INTO POT_CUST_DTL (
                      Tran_Id, SNo,Req_Time, Adv_Part_Req,Qty_Order,Order_Req_Date,export_type, LOC_CODE, Created_by,Tran_type
                    ) VALUES (
                      :Tran_Id, :SNo,:Req_Time, :Adv_Part_Req,:Qty_Order,:Order_Req_Date,:export_type, :LOC_CODE, :Created_by ,:Tran_type
                    )`;

                const enqDtlValues = {
                    Tran_Id: nexttran_id,
                    SNo: SNo || null, // Using the loop index for SNo
                    Req_Time: data1.Req_Time || null,
                    Adv_Part_Req: data1.Adv_Part_Req || null,
                    Qty_Order: data1.Qty_Order || null,
                    Order_Req_Date: data1.Order_Req_Date || null,
                    export_type: data1.export_type ? data1.export_type : 1,
                    LOC_CODE: data.LOC_CODE || null,
                    Created_by: data.Created_by || null,
                    Tran_type: 1,
                };
                await sequelize.query(inserta_POT_CUST_DTL, {
                    replacements: enqDtlValues,
                    transaction: t
                });
            }
        }



        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null
        });
    } catch (e) {
        console.error(e);
        // Rollback the transaction on error
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 23:59:59.999`;
};


exports.getsavedata = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const DateFrom = formatDate(req.body.dateFrom)
    const DateTo = formatDate(req.body.dateTo)
    const user = req.body.user
    console.log(req.body, "req.bodyreq.bodyreq.body")
    try {
        let results
        if (user == 99999999) {
            results = await sequelize.query(
                `SELECT 
                POT_CUST.*, 
                (SELECT Top 1 Misc_Name 
                 FROM Misc_Mst 
                 WHERE Misc_mst.Misc_type = 14 
                   AND Misc_mst.Misc_Code = POT_CUST.MOD_GRP 
                ) AS model_label,
                (SELECT Top 1 Modl_Name 
                 FROM Modl_mst 
                 WHERE 
                 Modl_mst.Item_Code = POT_CUST.MOD_NAME 
                ) AS variant_label 
            FROM POT_CUST 
            WHERE Export_Type <> 33 
            AND loc_Code in (${req.body.loc_code})
            AND created_at BETWEEN '${DateFrom}' AND '${DateTo}'`
            );
        } else {
            results = await sequelize.query(
                `SELECT 
                POT_CUST.*, 
                (SELECT Top 1 Misc_Name 
                 FROM Misc_Mst 
                 WHERE Misc_mst.Misc_type = 14 
                   AND Misc_mst.Misc_Code = POT_CUST.MOD_GRP 
                ) AS model_label,
                (SELECT Top 1 Modl_Name 
                 FROM Modl_mst 
                 WHERE 
                 Modl_mst.Item_Code = POT_CUST.MOD_NAME 
                ) AS variant_label 
            FROM POT_CUST 
            WHERE Export_Type <> 33 
            AND loc_Code in (${req.body.loc_code})
            AND Id = ${user}
            AND created_at BETWEEN '${DateFrom}' AND '${DateTo}'`
            );
        }
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};


exports.updatepotcust = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
        const data1 = req.body.filteredData;
    console.log(data1, "datadtaa");
    try {
        // const [maxCodeResult] = await sequelize.query(
        //     'SELECT COALESCE(MAX(TRAN_ID), 0) AS max_tran_id FROM POT_CUST',
        //     { transaction: t }
        // );
        // const nexttran_id = maxCodeResult[0].max_tran_id + 1;
        const updateoptcust = `
          UPDATE POT_CUST SET
          Export_Type = :Export_Type
          WHERE TRAN_ID = :tran_id
      `;
        const potcustvalues = {
            tran_id: data.TRAN_ID,
            Export_Type: 33
        };
        await sequelize.query(updateoptcust, {
            replacements: potcustvalues,
            transaction: t
        });

        await sequelize.query(
            `INSERT INTO POT_CUST (TRAN_ID, VEHREGNO, CHASS_NO, MOD_GRP,MOD_NAME, CUST_NAME, MOBILE, EMAIL,PART_DESC, PART_NO, EXP_DELV_DATE, adv_name, PRIORITY, CUST_ADV_PYMT,  DMS_PART_NO, DMS_PART_DATE,Server_ID,Export_Type, Created_by, Id, LOC_CODE)
            VALUES (:tran_id, :vehregno, :chass_no, :mod_grp,:mod_name, :cust_name, :mobile, :email,:part_desc, :part_no, :exp_delv_date, :adv_name, :priority, :cust_adv_pymt,:dms_part_no, :dms_part_date,:Server_ID,:Export_Type ,:created_by, :id, :loc_code  )`,
            {
                replacements: {
                    tran_id: data.TRAN_ID,
                    vehregno: data.VEHREGNO || null,
                    chass_no: data.CHASS_NO || null,
                    mod_grp: data.MOD_GRP || null,
                    mod_name: data.MOD_NAME || null,
                    cust_name: data.CUST_NAME || null,
                    mobile: data.MOBILE || null,
                    email: data.EMAIL || null,
                    part_desc: data.PART_DESC || null,
                    adv_name: data.adv_name || null,
                    priority: data.PRIORITY || null,
                    cust_adv_pymt: data.CUST_ADV_PYMT || null,
                    exp_delv_date: data.EXP_DELV_DATE || null,
                    part_no: data.PART_NO || null,
                    dms_part_no: data.DMS_PART_NO || null,
                    dms_part_date: data.DMS_PART_DATE || null,
                    Server_ID: 1,
                    Export_Type: data.export_type ? data.export_type : 1,
                    created_by: data.Created_by,
                    id: data.Id,
                    loc_code: data.LOC_CODE,
                },
                transaction: t
            }
        );

        // await sequelize.query(
        //     `update POT_CUST_DTL set export_type=33 where TRAN_ID=${data.TRAN_ID}`
        // )


        console.log(data1, "datadata")
 if (data1 && Array.isArray(data1)) {
    for (let i = 0; i < data1.length; i++) {
        const item = data1[i]; // Access the current item in the array
        const SNo = i + 1; // Set SNo based on the loop index

        console.log(item, "item");

        // SQL Query for insertion
        const inserta_POT_CUST_DTL = `
        INSERT INTO POT_CUST_DTL (
            Tran_Id, SNo, Req_Time, Adv_Part_Req, Part_No, Part_Desc, Qty_Order, Qty_Issue, Order_Status, 
            Dms_Order_No, Order_Date, Order_Req_Date, Order_Issue_Date, export_type, LOC_CODE, Created_by, 
            Tran_type, spm, Mrp, Spm_Order_Qty
        ) VALUES (
            :Tran_Id, :SNo, :Req_Time, :Adv_Part_Req, :Part_No, :Part_Desc, :Qty_Order, :Qty_Issue, :Order_Status, 
            :Dms_Order_No, :Order_Date, :Order_Req_Date, :Order_Issue_Date, :export_type, :LOC_CODE, :Created_by, 
            :Tran_type, :spm, :Mrp, :Spm_Order_Qty
        )`;

        // Values for the query
        const enqDtlValues = {
            Tran_Id: data.TRAN_ID,
            SNo: SNo || null, // Use loop index for SNo
            Req_Time: item.Req_Time || null,
            Adv_Part_Req: item.Adv_Part_Req || null,
            Part_No: item.Part_No || null,
            Part_Desc: item.Part_Desc || null,
            Qty_Order: item.Qty_Order || null,
            Qty_Issue: item.Qty_Issue || null,
            Order_Status: item.Order_Status || null,
            Dms_Order_No: item.Dms_Order_No || null,
            Order_Date: item.Order_Date || null,
            Order_Req_Date: item.Order_Req_Date || null,
            Order_Issue_Date: item.Order_Issue_Date || null,
            export_type: item.export_type ? item.export_type : 1,
            LOC_CODE: data.LOC_CODE || null,
            Created_by: data.Created_by || null,
            Tran_type: item?.tran_type ? item?.tran_type : 1,
            spm: item?.spm ? item?.spm : "",
            Mrp: item?.Mrp || null,
            Spm_Order_Qty: item.Spm_Order_Qty || null
        };

        // Execute the query
        await sequelize.query(inserta_POT_CUST_DTL, {
            replacements: enqDtlValues,
            transaction: t // Assuming `t` is a Sequelize transaction object
        });
    }
}

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null
        });
    } catch (e) {
        console.error(e);
        // Rollback the transaction on error
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};




exports.updatespm = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    const username = req.body.user;
    console.log(data, "datadtaa");
    // return;
    try {
        await sequelize.query(
            `update POT_CUST_DTL set export_type=33 where  TRAN_ID=${data.TRAN_ID} `, {
            transaction: t
        }
        )
        if (data.COPYDTL) {
            // for (let i = 0; i < data.POT_CUST_DTL.length; i++) {
            //     const data1 = data.POT_CUST_DTL[i];
            //     const SNo = i + 1; // Setting SNo based on loop index
            //     console.log(data1, "TRAN_IDTRAN_IDTRAN_IDTRAN_IDTRAN_IDTRAN_ID");

            //     const inserta_POT_CUST_DTL = `
            //     INSERT INTO POT_CUST_DTL (
            //       Tran_Id, SNo,Req_Time,Mrp,Adv_Part_Req,Part_No,Part_Desc,Qty_Order,Qty_Issue,Order_Status,Dms_Order_No,Order_Date,Order_Req_Date,Order_Issue_Date,export_type, LOC_CODE, Created_by,Issue_Time
            //     ) VALUES (
            //       :Tran_Id, :SNo,:Req_Time,:Mrp, :Adv_Part_Req, :Part_No, :Part_Desc, :Qty_Order, :Qty_Issue, :Order_Status, :Dms_Order_No, :Order_Date, :Order_Req_Date, :Order_Issue_Date,:export_type, :LOC_CODE, :Created_by , :Issue_Time
            //     )`;
            //     const enqDtlValues = {
            //         Tran_Id: data.TRAN_ID,
            //         SNo: data1.SNo || null,
            //         Req_Time: data1.Req_Time || null,
            //         Mrp: data1.Mrp || null,
            //         Adv_Part_Req: data1.Adv_Part_Req || null,
            //         Part_No: data1.Part_No || null,
            //         Part_Desc: data1.Part_Desc || null,
            //         Qty_Order: data1.Qty_Order || null,
            //         Qty_Issue: data1.Qty_Issue || null,
            //         Order_Status: data1.Order_Status || null,
            //         Dms_Order_No: data1.Dms_Order_No || null,
            //         Order_Date: data1.Order_Date || null,
            //         Order_Req_Date: data1.Order_Req_Date || null,
            //         Order_Issue_Date: data1.Order_Issue_Date || null,
            //         export_type:data1.export_type?data1.export_type:1,
            //         LOC_CODE: data.LOC_CODE || null,
            //         Created_by: data.Created_by || null,
            //         Issue_Time: data1.Issue_Time || null,
            //     };
            //     await sequelize.query(inserta_POT_CUST_DTL, {
            //         replacements: enqDtlValues,
            //         transaction: t
            //     });
            // }
            console.log(data.COPYDTL);
            for (let i = 0; i < data.COPYDTL.length; i++) {
                const data1 = data.COPYDTL[i];
                const SNo = i + 1; // Setting SNo based on loop index
                console.log(data1, "TRAN_IDTRAN_IDTRAN_IDTRAN_IDTRAN_IDTRAN_ID");

                // Insert original entry
                const inserta_POT_CUST_DTL = `
                INSERT INTO POT_CUST_DTL (
                  Tran_Id, SNo, Req_Time, Mrp, Adv_Part_Req, Part_No, Part_Desc, Qty_Order, Qty_Issue, Order_Status, Dms_Order_No, Order_Date, Order_Req_Date, Order_Issue_Date, export_type, LOC_CODE, Created_by, Issue_Time,Tran_type,spm , Spm_Order_Qty   
                ) VALUES (
                  :Tran_Id, :SNo, :Req_Time, :Mrp, :Adv_Part_Req, :Part_No, :Part_Desc, :Qty_Order, :Qty_Issue, :Order_Status, :Dms_Order_No, :Order_Date, :Order_Req_Date, :Order_Issue_Date, :export_type, :LOC_CODE, :Created_by, :Issue_Time,:Tran_type,:spm,:Spm_Order_Qty
                )`;

                const enqDtlValues = {
                    Tran_Id: data.TRAN_ID,
                    SNo: SNo || null,
                    Req_Time: data1.Req_Time || null,
                    Mrp: data1.Mrp || null,
                    Adv_Part_Req: data1.Adv_Part_Req || null,
                    Part_No: data1.Part_No || null,
                    Part_Desc: data1.Part_Desc || null,
                    Qty_Order: data1.Qty_Order || null,
                    Qty_Issue: data1.Qty_Issue || null,
                    Order_Status: data1.Order_Status || null,
                    Dms_Order_No: data1.Dms_Order_No || null,
                    Order_Date: data1.Order_Date || null,
                    Order_Req_Date: data1.Order_Req_Date || null,
                    Order_Issue_Date: data1.Order_Issue_Date || null,
                    export_type: data1.export_type == 6 ? 2 : data1.export_type, // Default export_type as 1
                    LOC_CODE: data.LOC_CODE || null,
                    Created_by: data.Created_by || null,
                    Issue_Time: data1.Issue_Time || null,
                    Tran_type: data1.tran_type ? data1.tran_type : 1,
                    spm: data1.export_type == 6 ? username : data1?.spm ? data1?.spm : "",
                    Spm_Order_Qty:data1.Spm_Order_Qty?data1.Spm_Order_Qty:null

                };

                await sequelize.query(inserta_POT_CUST_DTL, {
                    replacements: enqDtlValues,
                    transaction: t
                });

                // Check if Qty_Issue < Qty_Order, if true, insert another entry with export_type = 1 and reduced Qty_Order
                if (parseFloat(data1.Qty_Issue) < parseFloat(data1.Qty_Order) && data1.export_type == 6  ) {
                    const remainingQtyOrder = parseFloat(data1.Qty_Order) - parseFloat(data1.Qty_Issue);

                    const inserta_POT_CUST_DTL_1 = `
                    INSERT INTO POT_CUST_DTL (
                      Tran_Id, SNo, Req_Time, Mrp, Adv_Part_Req, Part_No, Part_Desc, Qty_Order, Qty_Issue, Order_Status, Dms_Order_No, Order_Date, Order_Req_Date, Order_Issue_Date, export_type, LOC_CODE, Created_by, Issue_Time,Tran_type,spm
                    ) VALUES (
                      :Tran_Id, :SNo, :Req_Time, :Mrp, :Adv_Part_Req, :Part_No, :Part_Desc, :Qty_Order, :Qty_Issue, :Order_Status, :Dms_Order_No, :Order_Date, :Order_Req_Date, :Order_Issue_Date, :export_type, :LOC_CODE, :Created_by, :Issue_Time, :Tran_type,:spm
                    )`;

                    const enqDtlValues_1 = {
                        Tran_Id: data.TRAN_ID,
                        SNo: data1.SNo || null, // You may choose to set this differently, depending on your logic
                        Req_Time: data1.Req_Time || null,
                        Mrp: null,
                        Adv_Part_Req: data1.Adv_Part_Req || null,
                        Part_No: null,
                        Part_Desc: null,
                        Qty_Order: remainingQtyOrder.toString(), // Reduced Qty_Order
                        Qty_Issue: null, // Issue is not yet made for this new entry
                        Order_Status: null, // You can set this based on your requirement
                        Dms_Order_No: null, // You can set this based on your requirement
                        Order_Date: null, // You can set this based on your requirement
                        Order_Req_Date: data1.Order_Req_Date || null,
                        Order_Issue_Date: null, // No issue date yet
                        export_type: 1, // Set export_type to 1 for the new entry
                        LOC_CODE: data.LOC_CODE || null,
                        Created_by: data.Created_by || null,
                        Issue_Time: null, // No issue time yet
                        Tran_type: 2,
                        spm: null,
                        Spm_Order_Qty:null
                    };

                    await sequelize.query(inserta_POT_CUST_DTL_1, {
                        replacements: enqDtlValues_1,
                        transaction: t
                    });
                }
            }

        }
        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null
        });
    } catch (e) {
        console.error(e);
        // Rollback the transaction on error
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};





exports.getPOT_CUST_DTL = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const TRAN_ID = req.body.TRAN_ID
    const user = req.body.user
    console.log(TRAN_ID, "TRAN_ID")
    try {
        const results1 = await sequelize.query(
            `SELECT TRAN_ID,
            export_type,
             Adv_Part_Req,
             tran_type,
             Spm_Order_Qty,
             spm,
            UID,
        Part_No,
        Part_Desc,
        Qty_Order,
        Qty_Issue,
        Order_Status,
        Dms_Order_No,
        FORMAT(CAST(Req_Time AS DATETIME), 'HH:mm') AS Req_Time,
       FORMAT(CAST(Issue_Time AS DATETIME), 'HH:mm') AS Issue_Time,
        Mrp,
        FORMAT(Order_Date, 'yyyy-MM-dd') as Order_Date,
         FORMAT(Order_Req_Date, 'yyyy-MM-dd') as Order_Req_Date,
          FORMAT(Order_Issue_Date, 'yyyy-MM-dd') as Order_Issue_Date,SNo
            FROM POT_CUST_DTL 
            WHERE export_type<>33   and TRAN_ID=${TRAN_ID}
            order by UID`
        );

        const results2 = await sequelize.query(
            `SELECT TRAN_ID,
            export_type,
             Adv_Part_Req,
             tran_type,
             spm,
             UID,
        Part_No,
        Part_Desc,
        Qty_Order,
        Qty_Issue,
        Order_Status,
        Dms_Order_No,
        FORMAT(CAST(Req_Time AS DATETIME), 'HH:mm') AS Req_Time,
        FORMAT(CAST(Issue_Time AS DATETIME), 'HH:mm') AS Issue_Time,
        Mrp,
        FORMAT(Order_Date, 'yyyy-MM-dd') as Order_Date,
         FORMAT(Order_Req_Date, 'yyyy-MM-dd') as Order_Req_Date,
          FORMAT(Order_Issue_Date, 'yyyy-MM-dd') as Order_Issue_Date,SNo
            FROM POT_CUST_DTL 
            WHERE export_type<>33 and tran_type = 1  and TRAN_ID=${TRAN_ID}
             order by UID
            `
        );


        const totalissue = await sequelize.query(
            `SELECT 
    Adv_Part_Req,
    SUM(CAST(Qty_issue AS INT)) AS total_issue_qty
FROM 
    pot_cust_dtl
   
       WHERE export_type<>33   and TRAN_ID=${TRAN_ID}
     GROUP BY 
    Adv_Part_Req`
        );




        console.log(results1[0], results2[0], "formattedResults")
        res.send({
            Status: "true",
            Message: "Success",
            Result1: results1[0],
            Result2: results2[0],
            totalissue: totalissue[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};




exports.inventoryitem = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);

    try {
        const results = await sequelize.query(
            `select top 5000   MRP_PRICE, COALESCE(CAST(ITEM_CODE AS VARCHAR),  CAST(UTD AS VARCHAR)  ) +' | ' + ITEM_NAME  AS label, CAST(UTD AS VARCHAR) as value from InventoryItems`
        );
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};


exports.deleterow = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode); // Get the sequelize instance
    const t = await sequelize.transaction(); // Start a transaction
    const UID = req.body.UID;
    console.log(UID, "datadtaa");

    try {
        const updateoptcust = `
            UPDATE POT_CUST_DTL SET
            Export_Type = 5
            WHERE UID = ${UID}
        `;

        // Execute the query within the transaction
        await sequelize.query(updateoptcust, { transaction: t });

        // Commit the transaction after successful query execution
        await t.commit();

        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null
        });
    } catch (e) {
        // Rollback in case of error
        await t.rollback();

        res.status(500).send({
            Status: false,
            Message: "Error occurred while updating data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close(); // Close the connection
        }
    }
};


































exports.getsendwishemp = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const date = new Date(req.body.date);
    const Month = date.getMonth() + 1;
    const Day = date.getDate();
    const occasion = req.body.occasion;
    try {
        let query = `SELECT 
    em.empcode, 
    CONCAT(em.empfirstname, ' ', em.emplastname) AS empname,
    FORMAT(em.dob, 'dd/MM/yyyy') AS dob,
    FORMAT(em.dom, 'dd/MM/yyyy') AS dom,
    TRIM(em.mobileno) AS mobileno,
    em.location,
    (SELECT Godw_Name AS label
     FROM Godown_Mst
     WHERE Export_Type < 3
       AND Godw_Code = em.location) AS branch,
    (SELECT TOP 1 misc_name
     FROM misc_mst
     WHERE misc_code = em.division 
       AND misc_type = 68) AS labeldivision,
    FORMAT(em.currentjoindate, 'dd/MM/yyyy') AS currentjoindate,
    em.corporatemailid,
    em.employeedesignation,
    em.division
FROM 
    Employeemaster em
                     WHERE lastwor_date is null and `;

        if (occasion === '1') {
            query += `MONTH(dob) = :Month AND DAY(dob) = :Day AND dob IS NOT NULL`;
        } else if (occasion === '2') {
            query += `MONTH(currentjoindate) = :Month AND DAY(currentjoindate) = :Day AND currentjoindate IS NOT NULL`;
        } else if (occasion === '3') {
            query += `MONTH(dom) = :Month AND DAY(dom) = :Day AND dom IS NOT NULL`;
        } else {

            query += `((MONTH(dob) = :Month AND DAY(dob) = :Day ) OR 
                        (MONTH(dom) = :Month AND DAY(dom) = :Day ) OR 
                        (MONTH(currentjoindate) = :Month AND DAY(currentjoindate) = :Day  )
                      ) 
                         `;
        }

        const results = await sequelize.query(query, {
            replacements: {
                Month,
                Day
            },
            type: sequelize.QueryTypes.SELECT
        });

        res.send({
            Status: "true",
            Message: "Success",
            Result: results
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};
exports.sendwishonwhatsapp = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const tran_ids_str = req.body.empcodes; // Expecting a comma-separated string
    const tran_ids = tran_ids_str.split(',').map(id => id.trim()); // Split and trim each ID
    const occasion = req.body.occasion;
    const backgroundTasks = [];
    console.log(tran_ids, "tran_idstran_idstran_ids")
    try {

        const candidatesResult = await sequelize.query(`
        SELECT MOBILENO,CONCAT(empfirstname, ' ', emplastname) AS empname,DOB,DOM,CURRENTJOINDATE
        FROM employeemaster
        WHERE empcode IN (${tran_ids.map(id => `'${id}'`).join(',')})
      `);

        const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
        const companyName = companyResult[0][0]?.comp_name;
        const mob = '9887242595';

        if (occasion == "1") {
            for (const candidate of candidatesResult[0]) {
                SendWhatsAppMessgae(req.headers.compcode, candidate.MOBILENO, "dob_msg", [
                    { type: "text", text: candidate.empname },
                    { type: "text", text: `${companyName}` },
                ]);
            }
        }


        if (occasion == "2") {
            for (const candidate of candidatesResult[0]) {
                SendWhatsAppMessgae(req.headers.compcode, candidate.MOBILENO, "dom_msg", [
                    { type: "text", text: candidate.empname },
                    { type: "text", text: `${companyName}` },
                ]);
            }
        }



        if (occasion == "3") {
            for (const candidate of candidatesResult[0]) {
                SendWhatsAppMessgae(req.headers.compcode, candidate.MOBILENO, "mdom_msg", [
                    { type: "text", text: candidate.empname },
                    { type: "text", text: `${companyName}` },
                ]);
            }
        }
        res.status(200).send({
            Status: true,
            Message: "Messages sent successfully",
            Results: "ok"
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({
            Status: false,
            Message: "Error occurred while fetching data or sending messages",
            Results: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};