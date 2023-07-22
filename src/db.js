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
    dbPool: pool
}