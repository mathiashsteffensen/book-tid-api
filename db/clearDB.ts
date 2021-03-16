require('dotenv').config()
import db from "./db"

async function main()
{
    await db.dropDatabase()
    console.log('DB Dropped');
}

main()
