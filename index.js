const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB URI
const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://anirbishal08_db_user:0Ukt3OKmHDFmVfZD@cluster0.urz6tke.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).send({ message: "Unauthorized access" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "mysecretkey", (err, decoded) => {
    if (err) return res.status(403).send({ message: "Forbidden access" });
    req.decoded = decoded;
    next();
  });
};

// Async function to connect to MongoDB
async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully!");

    const db = client.db("simpole"); // database name
    const userCollection = db.collection("UserModel");
    const tutorsCollection = db.collection("tutors");
    const bookingsCollection = db.collection("bookings");

    // Example route: get all users
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Example protected route
    app.get("/bookings", verifyToken, async (req, res) => {
      const bookings = await bookingsCollection.find().toArray();
      res.send(bookings);
    });

  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("MediQueue server is running");
});

app.listen(port, () => {
  console.log(`MediQueue server running on port ${port}`);
});