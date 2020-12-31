require('dotenv').config()
const db = require('./db')

async function main()
{
    await db.dropDatabase()
    console.log('DB Dropped');
}

main()
