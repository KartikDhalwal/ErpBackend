const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Load the database configurations from config.json
const configPath = path.join(__dirname, "../config/config.json");

exports.dbname = async function (compCode) {
  try {
    year = compCode?.split("-")[1];
    compCode = compCode?.split("-")[0];
    const databaseConfigs = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log(compCode);
    if (!databaseConfigs[compCode.toUpperCase()]) {
      try {
        const dbConfigFromDatabase = await fetchDbConfigFromDatabase(
          compCode.toUpperCase()
        );
        if (dbConfigFromDatabase) {
          const dbConfig = dbConfigFromDatabase;
          const databasename = `${dbConfig.database?.slice(0, 6)}${year}`;
          console.log(databasename.includes("01DB"), 1, databasename);
          // if(databasename.includes('01DB') && (databasename!='D001DB21' || databasename != 'C001DB23')){
          //   return;
          // };
          const sequelize = new Sequelize(
            databasename,
            dbConfig.username,
            dbConfig.password,
            {
              host: dbConfig.host,
              port: dbConfig.port,
              dialect: dbConfig.dialect,
		 dialectOptions: {
              options: {
                connectTimeout: 60 * 60 * 1000,
                requestTimeout: 60 * 60 * 1000  
              }
            }
            }
          );
          return sequelize;
        } else {
          return;
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      const dbConfig = databaseConfigs[compCode.toUpperCase()];
      if (year) {
        const databasename = `${dbConfig.database?.slice(0, 6)}${year}`;
        console.log(databasename.includes("01DB"), 2, databasename);
        // if (
        //   databasename.includes("01DB") &&
        //   databasename != "C001DB23" &&
        //   databasename != "D001DB21"
        // ) {
        //   return;
        // }
        const sequelize = new Sequelize(
          databasename,
          dbConfig.username,
          dbConfig.password,
          {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
	 dialectOptions: {
              options: {
                connectTimeout: 60 * 60 * 1000,
                requestTimeout: 60 * 60 * 1000  
              }
            }
          }
        );
        return sequelize;
      } else {
        console.log(dbConfig.database?.includes("01DB"), 3, dbConfig.database);
        // if (
        //   dbConfig.database.includes("01DB") &&
        //   dbConfig.database != "D001DB21" &&
        //   dbConfig.database != "C001DB23"
        // ) {
        //   return;
        // }
        const sequelize = new Sequelize(
          dbConfig.database,
          dbConfig.username,
          dbConfig.password,
          {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
 dialectOptions: {
              options: {
                connectTimeout: 60 * 60 * 1000,
                requestTimeout: 60 * 60 * 1000  
              }
            }
          }
        );
        return sequelize;
      }
    }
  } catch (e) {
    console.log(e);
    console.log("Comp_Code mandatory");
  }
};

const config = {
  username: "developer1",
  password: "developer@#5010",
  host: "103.74.65.249",
  port: 4650,
  database: "DBCON",
  dialect: "mssql",
};

async function fetchDbConfigFromDatabase(compCode) {
  try {
    const sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
      }
    );
    const data = await sequelize.query(
      `select * from db_con where export_type < 3`
    );
    const formattedServers = {};

    data[0]?.forEach((server) => {
      const formattedServer = {
        username: server.username,
        password: server.password,
        database: `${server.db_name}${server.year}`,
        host: server.server_ip,
        port: server.port_no,
        dialect: "mssql",
      };
      formattedServers[server.dlr_id.toUpperCase()] = formattedServer;
    });
    fs.writeFileSync(
      configPath,
      JSON.stringify(formattedServers, null, 2),
      "utf8"
    );
    return formattedServers[compCode];
  } catch (e) {
    console.log(e);
  }
}
