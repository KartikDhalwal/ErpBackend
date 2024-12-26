const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const { _DesgHr, DesgHrSchema } = require("../models/DesgHr");
const Joi = require("joi");



exports.insertData = async function (req, res) {
    const BodyData = req.body;
    const { error, value: desgData } = DesgHrSchema.validate(
        BodyData,
        {
            abortEarly: false,
            stripUnknown: true,
        }
    );
    const Created_by = desgData.Created_by;
    if (error) {
        const errorMessage = error.details.map((err) => err.message).join(", ");
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const DesgHr = _DesgHr(sequelize, DataTypes);
        try {
            const DesgHr_ = await DesgHr.create(
                { ...desgData, Created_by: Created_by },
                { transaction: t }
            );
            await t.commit();
            res.status(200).send({ success: true, Message: "Data saved" });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                message: "An error occurred while creating Employee jasj.",
                error,
            });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log("Connection has been closed.");
        }
    }
};

exports.findAllLevels = async function (req, res) {
    const sequelize = await dbname("DEMO");
    const DataTypes = sequelize.Sequelize.DataTypes;
    async function recursiveFind(parent) {
        try {
            const DesgHr = _DesgHr(sequelize, DataTypes);
            const DesgHrData = await DesgHr.findAll({
                attributes: ["Child"],
                where: { Parent: parent },
            });
            let children = [];
            for (let i = 0; i < DesgHrData.length; i++) {
                const child = DesgHrData[i].Child;
                const grandchildren = await recursiveFind(child);
                children.push({ Parent: child, Children: grandchildren });
            }
            return children;
        } catch (err) {
            console.log(err);
            return [];
        }
    }
    try {
        const levels = await recursiveFind(req.body.Parent);
        await sequelize.close();
        res.status(200).send( levels );
    } catch (err) {
        await sequelize.close();
        console.log(err);
        res.status(500).send({ success: false, error: "Internal server error" });
    }
};
