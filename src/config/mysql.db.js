const { CONFIG } = require("./index")

const mySqlPromise = require("mysql2/promise");

const querySeparator = CONFIG.DATABASE_URL?.includes("?") ? "&" : "?";
const sslOption = CONFIG.DATABASE_SSL
  ? 'ssl={"rejectUnauthorized":false}&'
  : '';
const connectionUrl = `${CONFIG.DATABASE_URL}${querySeparator}${sslOption}multipleStatements=true&dateStrings=true&waitForConnections=true&connectionLimit=99&enableKeepAlive=true&keepAliveInitialDelay=10000`;

const pool = mySqlPromise.createPool(connectionUrl);

console.log(`DB Pool Created.`);

exports.getMySqlPromiseConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error("Pool Connection Error: =======>");
    console.error(error);
    throw error;
  }
};
