const cors = require("cors");
const express = require("express");
const http = require("http"); // For socket.io
const { Server } = require("socket.io"); // socket.io
require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const getCoordinates = require("./geocode");

const app = express();
const port = process.env.PORT || 5000;

// API key
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io with CORS config
const io = new Server(server, {
  cors: {
    origin: "*", // Change to specific origin in production
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwvml.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB");

    const alertPanelCollection = client.db("disasterManagementWebsite").collection("alertData");
    const userCollection = client.db("disasterManagementWebsite").collection("users");
    const profileCollection = client.db("disasterManagementWebsite").collection("profiles");
    const resourcesCollection = client.db("disasterManagementWebsite").collection("resources");
    const safetyContentsCollection = client.db("disasterManagementWebsite").collection("safetyContents");


    // Socket.io connection
    io.on("connection", (socket) => {
  console.log(" New client connected:", socket.id);

  socket.on("newAlert", (alert) => {
    console.log(" Broadcasting new alert:", alert);
    socket.broadcast.emit("newAlert", alert); // send to all except sender
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});


    // User registration
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.send(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({ message: 'Failed to fetch users' });
      }
    });
    app.get('/resources', async (req, res) => {
      try {
        const resources = await resourcesCollection.find().toArray();
        res.send(resources);
      } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).send({ message: 'Failed to fetch resources' });
      }
    });

    app.get('/blogPosts', async (req, res) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?sources=techcrunch&pageSize=6&apiKey=${NEWS_API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

    // Update user role by ID
app.patch('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  try {
    const filter = { _id: new ObjectId(userId) };
    const updateDoc = {
      $set: {
        role: role,
      },
    };

    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).send({ message: 'Failed to update role' });
  }
});

app.patch("/resources/:id", async (req, res) => {
  const { id } = req.params;
  const { status, location } = req.body;
  const updated = await resourcesCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, location } },
    { returnDocument: "after" }
  );
  res.send(updated.value);
});

// edit alert data
app.put("/alertPanel/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  delete updatedData._id;

  const result = await alertPanelCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.send(result);
});


app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const query = { _id: new ObjectId(userId) };
    const result = await userCollection.deleteOne(query);

    if (result.deletedCount === 1) {
      res.send({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).send({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send({ success: false, message: 'Failed to delete user' });
  }
});

app.delete("/alertPanel/:id", async (req, res) => {
  const { id } = req.params;
  const result = await alertPanelCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});



    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    app.get('/safetyContents', async(req,res) =>{
      const data = await safetyContentsCollection.find().toArray();
      res.send(data);
    })

    // Get all alerts
    // app.get("/alertPanel", async (req, res) => {
    //   try {
    //     const result = await alertPanelCollection.find().toArray();
    //     res.send(result);
    //   } catch (error) {
    //     console.error("Error fetching alert data:", error);
    //     res.status(500).send({ message: "Failed to fetch alert data" });
    //   }
    // });

    app.get("/alertPanel", async (req, res) => {
  try {
    const email = req.query.email;

    let query = {};
    if (email) {
      query = { "submittedBy.email": email };
    }

    const result = await alertPanelCollection.find(query).toArray();
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
        if (!alert) return res.status(404).send({ message: "Alert not found" });
        res.send(alert);
      } catch (error) {
        console.error("Error fetching alert by ID:", error);
        res.status(500).send({ message: "Failed to fetch alert" });
      }
    });

    // Latest 6 alerts
    app.get("/latestAlerts", async (req, res) => {
      try {
        const result = await alertPanelCollection.find().sort({ timestamp: -1 }).limit(6).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching latest alerts:", error);
        res.status(500).send({ message: "Failed to fetch latest alerts" });
      }
    });

    app.get("/latestAlerts/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const alert = await alertPanelCollection.findOne({ _id: new ObjectId(id) });
        if (!alert) return res.status(404).send({ message: "Alert not found" });
        res.send(alert);
      } catch (error) {
        console.error("Error fetching alert by ID:", error);
        res.status(500).send({ message: "Failed to fetch alert" });
      }
    });



app.post("/alertPanel", async (req, res) => {
  try {
    const newAlert = req.body;

    // Automatically fetch coordinates based on location field
    const coordinates = await getCoordinates(newAlert.location);
    newAlert.coordinates = coordinates;

    const result = await alertPanelCollection.insertOne(newAlert);

    const insertedAlert = await alertPanelCollection.findOne({ _id: result.insertedId });

    // Emit to all clients
    io.emit("newAlert", insertedAlert);

    res.send(insertedAlert);
  } catch (error) {
    console.error("Failed to insert alert:", error);
    res.status(500).send({ message: "Failed to add alert" });
  }
});



    // Rescuer profile APIs
    app.get('/rescuerProfile', async (req, res) => {
      try {
        const users = await profileCollection.find().toArray();
        res.send(users);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).send({ message: 'Failed to fetch profiles' });
      }
    });

    app.get('/rescuerProfile/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const profile = await profileCollection.findOne({ email });
        if (profile) {
          res.status(200).json(profile);
        } else {
          res.status(404).json({ message: 'No profile found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.post('/rescuerProfile', async (req, res) => {
      const { email } = req.body;
      try {
        const existingProfile = await profileCollection.findOne({ email });
        if (existingProfile) {
          return res.status(409).json({ error: 'Profile already exists' });
        }

        const result = await profileCollection.insertOne(req.body);
        res.status(201).json({ message: 'Profile saved', id: result.insertedId });
      } catch (error) {
        console.error("Error saving profile:", error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
run().catch(console.dir);

// Base route
app.get("/", (req, res) => {
  res.send("Disaster management website server is running");
});

// Start server with socket.io
server.listen(port, () => {
  console.log(` Server is running on port: ${port}`);
});
