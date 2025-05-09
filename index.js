const cors = require("cors");
const express = require("express");
require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwvml.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// console.log(uri);
// Create MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Check connection with MongoDB
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    // MongoDB Collection Reference
    const alertPanelCollection = client
      .db("disasterManagementWebsite")
      .collection("alertData");

    // GET all alert data
    app.get("/alertPanel", async (req, res) => {
      try {
        const cursor = alertPanelCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching alert data:", error);
        res.status(500).send({ message: "Failed to fetch alert data" });
      }
    });

    app.get("/alertPanel/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const alert = await alertPanelCollection.findOne({ _id: new ObjectId(id) });
    
        if (!alert) {
          return res.status(404).send({ message: "Alert not found" });
        }
    
        res.send(alert);
      } catch (error) {
        console.error("Error fetching alert by ID:", error);
        res.status(500).send({ message: "Failed to fetch alert" });
      }
    });

    // GET latest 6 disaster alerts
    app.get("/latestAlerts", async (req, res) => {
      try {
        const cursor = alertPanelCollection.find().sort({ timestamp: -1 }).limit(6);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching latest alerts:", error);
        res.status(500).send({ message: "Failed to fetch latest alerts" });
      }
    });

    // GET a single alert by ID

    app.get("/latestAlerts/:id", async (req, res) => {
        try {
          const id = req.params.id;
          const alert = await alertPanelCollection.findOne({ _id: new ObjectId(id) });
      
          if (!alert) {
            return res.status(404).send({ message: "Alert not found" });
          }
      
          res.send(alert);
        } catch (error) {
          console.error("Error fetching alert by ID:", error);
          res.status(500).send({ message: "Failed to fetch alert" });
        }
      });
    
      

    // POST new alert data
    app.post("/alertPanel", async (req, res) => {
      try {
        const newAlert = req.body;
        const result = await alertPanelCollection.insertOne(newAlert);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error adding new alert:", error);
        res.status(500).send({ message: "Failed to add new alert" });
      }
    });

  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Stop the server if MongoDB connection fails
  }
}
run().catch(console.dir);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

app.get("/", (req, res) => {
  res.send("Disaster management website server is running");
});
