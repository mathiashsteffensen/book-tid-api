
// Importing Mongoose for interfacing with the MongoDB shell
import mongoose from 'mongoose';

// Connecting to MongoDB database
const connectionString = process.env.NODE_ENV === "test" ? process.env.TEST_MONGO_URI_CONNECTION_STRING : process.env.MONGO_URI_CONNECTION_STRING

if (!connectionString) throw new Error("Please provide a mongodb connectiion string, see README.md for more information about env variables")

mongoose.connect(connectionString , {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true})

const db = mongoose.connection;

module.exports = db
export default db