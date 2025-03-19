const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017"; // Adjust for remote MongoDB
const client = new MongoClient(uri);

const dbName = "socialMediaApp";
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

function getCollection(name) {
  return db.collection(name);
}

module.exports = { connectToDatabase, getCollection };
