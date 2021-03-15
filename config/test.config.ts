import * as dotenv from 'dotenv'
dotenv.config()
import server from '../server';
import db from '../db/db';

export async function mochaGlobalSetup() {
    this.server = server.listen(8378, () => console.log("Test server running"));
    this.db = db;
}

export async function mochaGlobalTeardown() {
    this.server.close();
    await this.db.dropDatabase().then(() => console.log('Testing complete!'));
    this.db.close();
  }