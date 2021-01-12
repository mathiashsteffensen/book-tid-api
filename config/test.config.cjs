require('dotenv').config()
const server = require('../server')
const db = require('../db/db')

exports.mochaGlobalSetup = function() {
    this.server = server.listen(8378);
    this.db = db;
};

exports.mochaGlobalTeardown = async function() {
    this.server.close();
    await this.db.dropDatabase().then(() => console.log('Testing complete!'));
    this.db.close();
  };