const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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


const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: "Unauthorized access" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "mysecretkey", (err, decoded) => {
    if (err) return res.status(403).send({ message: "Forbidden access" });
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();

    const db = client.db("simpole");
    const userCollection = db.collection("UserModel");
    const tutorsCollection = db.collection("tutors");
    const bookingsCollection = db.collection("bookings");

   
    //a Local Register/Login
   
    app.post("/register-local", async (req, res) => {
      const { email, password, name } = req.body;
      const existing = await userCollection.findOne({ email });
      if (existing) return res.status(400).send({ message: "User already exists" });

      const result = await userCollection.insertOne({ email, password, name });
      const token = jwt.sign({ email }, process.env.JWT_SECRET || "mysecretkey", { expiresIn: "7d" });

      res.send({ token, user: { email, name } });
    });

    app.post("/login-local", async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      if (!user || user.password !== password)
        return res.status(401).send({ message: "Invalid credentials" });

      const token = jwt.sign({ email }, process.env.JWT_SECRET || "mysecretkey", { expiresIn: "7d" });
      res.send({ token, user: { email, name: user.name } });
    });

   

app.patch("/users/update-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).send({ message: "Email or newPassword missing" });

    const result = await client.db("simpole").collection("UserModel").updateOne(
      { email },
      { $set: { password: newPassword } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: "User not found or password unchanged" });
    }

    res.send({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to update password" });
  }
});

    
    //b Tutors Routes
    
    app.get("/tutors", async (req, res) => {
      const { search, startDate, endDate, limit } = req.query;
      const query = {};
      if (search) query.tutorName = { $regex: search, $options: "i" };
      if (startDate && endDate) query.sessionStartDate = { $gte: startDate, $lte: endDate };
      let cursor = tutorsCollection.find(query).sort({ createdAt: -1 });
      if (limit) cursor = cursor.limit(Number(limit));
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/tutors/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid tutor ID" });

        const tutor = await tutorsCollection.findOne({ _id: new ObjectId(id) });
        if (!tutor) return res.status(404).send({ message: "Tutor not found" });

        res.send(tutor);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load tutor details" });
      }
    });

   
    //c Add Tutor222222222
   
    app.post("/tutors", async (req, res) => {
      try {
        const tutor = req.body;
        tutor.createdAt = new Date();
        const result = await tutorsCollection.insertOne(tutor);
        res.send({ insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add tutor" });
      }
    });

   
    //d My Tutors
    
    app.get("/my-tutors", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: "Email query missing" });

        const result = await tutorsCollection.find({ creatorEmail: email }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load your tutors" });
      }
    });

   
 
   

    app.get("/my-bookings", async (req, res) => {
      try {
        const email = req.query.email;
        const bookings = await bookingsCollection.find({ studentEmail: email }).toArray();
        res.send(bookings);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load bookings" });
      }
    });

    app.patch("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "cancelled" } }
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to cancel booking" });
      }
    });

    app.delete("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

        const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ message: "Booking not found" });

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to delete booking" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected successfully!");
  } finally {
   
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("MediQueue server is running");
});

app.listen(port, () => {
  console.log(`MediQueue server running on port ${port}`);
});



