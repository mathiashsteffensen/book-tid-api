
// Importing Mongoose for interfacing with the MongoDB shell
const mongoose = require('mongoose');

// Connecting to MongoDB database
mongoose.connect(process.env.NODE_ENV === "test" ? process.env.TEST_MONGO_URI_CONNECTION_STRING : process.env.MONGO_URI_CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true})

const db = mongoose.connection;

module.exports = db
