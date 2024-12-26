const SequelizeAuto = require('sequelize-auto');
const path = require('path');

async function generateModels(compCode) {
    try {
        const dbConfig = {
            username: "xyz",
            password: "123",
            host: "74484848484",
            port: 4650,
            database: "fcjnfd",
            dialect: "mssql",
          };
        const auto = new SequelizeAuto(dbConfig.database, dbConfig.username, dbConfig.password, {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
            directory: path.join(__dirname, 'models'), // Output directory for generated models
            additional: {
                timestamps: false // Disable timestamps for generated models
            },
            caseFile: 'p', // Use 'pascal' case for model filenames
            caseModel: 'p', // Use 'pascal' case for model names
        });
        await auto.run();

        console.log('Models generated successfully.');
    } catch (error) {
        console.error('Error generating models:', error);
    }
}

generateModels('demo'); // Replace 'demo' with the desired compCode
