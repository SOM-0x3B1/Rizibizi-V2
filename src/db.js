const mariadb = require('mariadb');
const { dbPasswd } = process.env;

const pool = mariadb.createPool({
     host: 'localhost', 
     database: 'rizibizi2',
     user:'rizibizi2', 
     password: dbPasswd,
     connectionLimit: 10
});

module.exports = {
    dbPool: pool,
    async valueExists(conn, column, value){ // column is always hardcoded
        const res = await conn.query(`SELECT COUNT(*) AS count FROM playlist WHERE ${column}=?`, [value]);
        return res[0].count > 0;
    }
}