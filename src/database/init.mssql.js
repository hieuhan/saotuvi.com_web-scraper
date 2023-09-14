const sql = require('mssql');
const config = require('../config');

const poolPromise = new sql.ConnectionPool({
    user: config.DATABASE_USER,  
    password: config.DATABASE_PASSWORD,  
    server: config.DATABASE_HOST,  
    database: config.DATABASE_NAME,
    pool: {
        max: config.POOL_MAX,
        min: config.POOL_MIN,
        idleTimeoutMillis: config.POOL_IDLE_TIMEOUT
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
})
  .connect()
  .then(pool => {
    console.log('Đã kết nối với SQLServer...');
    return pool;
  })
  .catch(error => console.log(`Kết nối cơ sở dữ liệu không thành công: ${error}`));

module.exports = {
  config, sql, poolPromise
};