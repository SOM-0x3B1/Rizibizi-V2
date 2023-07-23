const mariadb = require('mariadb');
const { dbPasswd } = process.env;

const pool = mariadb.createPool({
    host: 'localhost',
    database: 'rizibizi2',
    user: 'rizibizi2',
    password: dbPasswd,
    connectionLimit: 10
});

module.exports = {
    dbPool: pool,
    async valueExists(conn, table, ...pairs) {
        let query = `SELECT COUNT(*) AS count FROM ${table} WHERE `;
        const values = [];
        for (let i = 0; i < pairs.length; i += 2) {
            if (i != 0)
                query += ' AND '
            const column = pairs[i];
            const value = pairs[i + 1];
            query += `${column}=?`;
            values.push(value);
        }
        const res = await conn.query(query, values);
        return res[0].count > 0;
    }
}