const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');



exports.saveTask1 = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "Incoming data");

    try {
        if (data.Tran_id) {
            await sequelize.query(
                `UPDATE Daily_Task SET 
                    Emp_Name = :Emp_Name, 
                    MorningTask = :MorningTask, 
                    Status1 = :Status1, 
                    Remark1 = :Remark1,
                    Create_by = :Emp_Code,
                    Loc_Code = :Loc_Code,
                    Emp_date = :Emp_date,
                    Emp_Code = :Emp_Code
                WHERE Tran_id = :Tran_id`,
                {
                    replacements: {
                        Emp_Name: data.Emp_Name || null,
                        MorningTask: data.MorningTask || null,
                        Status1: data.Status1 || null,
                        Remark1: data.Remark1 || null,
                        AfternooTask: data.AfternooTask || null,
                        Status2: data.Status2 || null,
                        Remark2: data.Remark2 || null,
                        Create_by: data.Create_by || null,
                        Loc_Code: data.Loc_Code || null,
                        Emp_date: data.Emp_date || null,
                        Emp_Code: data.Emp_Code || null,
                        Tran_id: data.Tran_id
                    },
                    transaction: t
                }
            );
        } else {
            await sequelize.query(
                `INSERT INTO Daily_Task (
                    Emp_Name, MorningTask, Status1, Remark1, Emp_Code,
                     Create_by, Loc_Code, Emp_date
                ) VALUES (
                    :Emp_Name, :MorningTask, :Status1, :Remark1, :Emp_Code,
                     :Emp_Code, :Loc_Code, :Emp_date
                )`,
                {
                    replacements: {
                        Emp_Name: data.Emp_Name || null,
                        MorningTask: data.MorningTask || null,
                        Status1: data.Status1 || null,
                        Remark1: data.Remark1 || null,
                        AfternooTask: data.AfternooTask || null,
                        Status2: data.Status2 || null,
                        Remark2: data.Remark2 || null,
                        Create_by: data.Create_by || null,
                        Loc_Code: data.Loc_Code || null,
                        Emp_date: data.Emp_date || null,
                        Emp_Code: data.Emp_Code || null,
                    },
                    transaction: t
                }
            );
        }

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Data inserted successfully",
            Result: null
        });
    } catch (error) {
        console.error("Error in saveTask1:", error);
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
exports.saveTask2 = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "Incoming data");

    try {
        if (data.Tran_id) {
            await sequelize.query(
                `UPDATE Daily_Task SET 
                    Emp_Name = :Emp_Name, 
                   
                    AfternooTask = :AfternooTask, 
                    Status2 = :Status2, 
                    Remark2 = :Remark2, 
                    Create_by = :Emp_Code,
                    Loc_Code = :Loc_Code,
                    Emp_date = :Emp_date,
                    Emp_Code = :Emp_Code
                WHERE Tran_id = :Tran_id`,
                {
                    replacements: {
                        Emp_Name: data.Emp_Name || null,
                        MorningTask: data.MorningTask || null,
                        Status1: data.Status1 || null,
                        Remark1: data.Remark1 || null,
                        AfternooTask: data.AfternooTask || null,
                        Status2: data.Status2 || null,
                        Remark2: data.Remark2 || null,
                        Create_by: data.Create_by || null,
                        Loc_Code: data.Loc_Code || null,
                        Emp_date: data.Emp_date || null,
                        Emp_Code: data.Emp_Code || null,
                        Tran_id: data.Tran_id
                    },
                    transaction: t
                }
            );
        } else {
            await sequelize.query(
                `INSERT INTO Daily_Task (
                    Emp_Name,  Emp_Code,
                    AfternooTask, Status2, Remark2, Create_by, Loc_Code, Emp_date
                ) VALUES (
                    :Emp_Name , :Emp_Code, 
                    :AfternooTask, :Status2, :Remark2, :Emp_Code, :Loc_Code, :Emp_date
                )`,
                {
                    replacements: {
                        Emp_Name: data.Emp_Name || null,
                        MorningTask: data.MorningTask || null,
                        Status1: data.Status1 || null,
                        Remark1: data.Remark1 || null,
                        AfternooTask: data.AfternooTask || null,
                        Status2: data.Status2 || null,
                        Remark2: data.Remark2 || null,
                        Create_by: data.Create_by || null,
                        Loc_Code: data.Loc_Code || null,
                        Emp_date: data.Emp_date || null,
                        Emp_Code: data.Emp_Code || null
                    },
                    transaction: t
                }

            );
        }

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Data processed successfully",
            Result: null
        });

    } catch (error) {
        console.error("Error in saveTask2:", error);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while processing data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.managerView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const { dateFrom, dateTo } = req.body;
    try {
        const [taskData] = await sequelize.query(
            `SELECT Tran_id, Emp_Name, Emp_Code, Emp_date, MorningTask, Status1, Remark1,
                    AfternooTask, Status2, Remark2, Create_by
             FROM Daily_Task
             WHERE Emp_date BETWEEN :dateFrom AND :dateTo`,
            {
                replacements: {
                    dateFrom: dateFrom || '1970-01-01',
                    dateTo: dateTo || new Date().toISOString().slice(0, 10),
                }
            }
        );

        res.status(200).send({
            Status: true,
            Message: "Data fetched successfully",
            Result: taskData
        });

    } catch (error) {
        console.error("Error fetching manager view data:", error);
        res.status(500).send({
            Status: false,
            Message: "Error occurred while fetching data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.gatEmpData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Emp_code = req.body.Emp_code;
    console.log(Emp_code, "Emp_code");

    try {
        const results = await sequelize.query(
            `SELECT 
                em.EmpCode AS Emp_Code,
                CONCAT(em.EmpFirstName, ' ', em.EmpLastName) AS Emp_Name
            FROM 
                EMPLOYEEMASTER em
            WHERE 
                em.EmpCode = :Emp_code`,
            {
                replacements: { Emp_code },
                type: sequelize.QueryTypes.SELECT
            }
        );


        if (results.length === 0) {
            return res.status(404).send({
                Status: "false",
                Message: "Employee not found",
            });
        }

        console.log(results[0], "Employee Data");

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
exports.getLastRecordByDate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const { Emp_Code } = req.body;
    if (!Emp_Code) {
        return res.status(400).send({
            Status: false,
            Message: "Invalid Request: Missing  Emp_Code",
        });
    }
    try {
        const [lastRecord] = await sequelize.query(
            `SELECT TOP 1 Tran_id, Emp_Name, MorningTask, Status1, Remark1, Emp_Code, 
                    AfternooTask, Status2, Remark2, Create_by, Create_at,FINAL_STATUS
             FROM Daily_Task
             WHERE CAST(Create_at AS date) = CAST(GETDATE() AS date) AND emp_code = :Emp_Code
             ORDER BY Tran_id DESC`,
            {
                replacements: { Emp_Code },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Send response
        // if (lastRecord) {
        res.status(200).send({
            Status: true,
            Message: "Last record for the date fetched successfully",
            Result: lastRecord,
        });
        // } else {
        //     res.status(404).send({
        //         Status: false,
        //         Message: "No data found for the specified date",
        //         Result: null,
        //     });
        // }

    } catch (error) {
        console.error("Error fetching last record by date:", error);
        res.status(500).send({
            Status: false,
            Message: "Error occurred while fetching data",
            Result: null,
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.dailytaskbutton = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "Incoming data");

    try {


        if (data.Tran_id) {
            await sequelize.query(
                `UPDATE Daily_Task SET 
                    FINAL_STATUS = 1
                   
                WHERE Tran_id = :Tran_id`,
                {
                    replacements: {
                        Emp_Name: data.Emp_Name || null,
                        MorningTask: data.MorningTask || null,
                        Status1: data.Status1 || null,
                        Remark1: data.Remark1 || null,
                        AfternooTask: data.AfternooTask || null,
                        Status2: data.Status2 || null,
                        Remark2: data.Remark2 || null,
                        Create_by: data.Create_by || null,
                        Loc_Code: data.Loc_Code || null,
                        Emp_date: data.Emp_date || null,
                        Emp_Code: data.Emp_Code || null,
                        FINAL_STATUS: data.FINAL_STATUS || null,
                        Tran_id: data.Tran_id
                    },
                    transaction: t
                }
            );
        }

        else {
            await sequelize.query(
                `UPDATE Daily_Task SET 
                FINAL_STATUS = 0
               
            WHERE Tran_id = :Tran_id`,
                {
                    replacements: {
                        Emp_Name: data.Emp_Name || null,
                        MorningTask: data.MorningTask || null,
                        Status1: data.Status1 || null,
                        FINAL_STATUS: data.FINAL_STATUS || null,
                        Remark1: data.Remark1 || null,
                        AfternooTask: data.AfternooTask || null,
                        Status2: data.Status2 || null,
                        Remark2: data.Remark2 || null,
                        Create_by: data.Create_by || null,
                        Loc_Code: data.Loc_Code || null,
                        Emp_date: data.Emp_date || null,
                        Emp_Code: data.Emp_Code || null,
                    },
                    transaction: t
                }
            );
        }

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "TODAY TASK CLOSED",

            Result: null
        });

    } catch (error) {
        console.error("Error in TASK CLOSED:", error);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting DAILYTASK",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.updateRemarks = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const { Tran_id, Remark1, Remark2 } = req.body;
    console.log( req.body,"hgh");
    

    try {
        if (!Tran_id) {
            return res.status(400).send({
                Status: false,
                Message: "Tran_id is required to update remarks.",
                Result: null
            });
        }

         
        await sequelize.query(
            `UPDATE Daily_Task SET 
                Remark1 = :Remark1,
                Remark2 = :Remark2
             WHERE Tran_id = :Tran_id`,
            {
                replacements: {
                    Remark1: Remark1 || null,   
                    Remark2: Remark2 || null,   
                    Tran_id: Tran_id            
                },
                transaction: t
            }
        );

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Remarks updated successfully",
            Result: null
        });
    } catch (error) {
        console.error("Error updating remarks:", error);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while updating remarks",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};



























