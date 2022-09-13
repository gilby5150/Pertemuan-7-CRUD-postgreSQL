const Pool = require('pg').Pool

const pool = new Pool({
    user:"postgres",
    password:"aink5150",
    database:"postgres",
    host:"localhost",
    port:5432
})
module.exports=pool
