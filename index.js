const cors = require("cors");
const express = require("express");
const http = require("http"); // For socket.io
const { Server } = require("socket.io"); // socket.io
require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const getCoordinates = require("./geocode");

const app = express();
const port = process.env.PORT || 5000;

// Payment Gateway
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// email alert
const sendAlertEmail = require("./utils/email"); // import your email.js

// API key
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io with CORS config
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
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
    // await client.db("admin").command({ ping: 1 });
    // console.log(" Connected to MongoDB");

    const alertPanelCollection = client.db("disasterManagementWebsite").collection("alertData");
    const userCollection = client.db("disasterManagementWebsite").collection("users");
    const profileCollection = client.db("disasterManagementWebsite").collection("profiles");
    const resourcesCollection = client.db("disasterManagementWebsite").collection("resources");
    const safetyContentsCollection = client.db("disasterManagementWebsite").collection("safetyContents");
    const blogPostsCollection = client.db("disasterManagementWebsite").collection("blogPosts");
    const missionsCollection = client.db("disasterManagementWebsite").collection("missions");
    const paymentsCollection = client.db("disasterManagementWebsite").collection("payments");
    const donationCollection = client.db("disasterManagementWebsite").collection("donations");
    const helpsCollection = client.db("disasterManagementWebsite").collection("requestHelps");

async function getRecipientsEmails() {
  try {
    const users = await userCollection.find().toArray();
    // Only take emails of users who want to receive alerts
    const emails = users
      .filter(u => u.email) // make sure email exists
      .map(u => u.email);
    return emails;
  } catch (error) {
    console.error("Error fetching recipient emails:", error);
    return []; // return empty array if error occurs
  }
}

    // Socket.io connection
    io.on("connection", (socket) => {
  console.log(" New client connected:", socket.id);

  socket.on("newAlert", (alert) => {
    console.log(" Broadcasting new alert:", alert);
    socket.broadcast.emit("newAlert", alert); // send to all except sender
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected", socket.id);
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



  //  get blog posts
    app.get("/blogPosts", async(req,res) =>{
      const data = await blogPostsCollection.find().toArray();
      res.send(data);
    })

   app.get("/blogPosts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID format" });
    }

    const blog = await blogPostsCollection.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return res.status(404).send({ error: "Blog post not found" });
    }

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).send({ error: "Server error" });
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

// Donation's API
    app.get("/alertPanel/donations", async (req, res) => {
  try {
    // const email = req.query.email;

    // let query = {};
    // if (email) {
    //   query = { "submittedBy.email": email };
    // }

    const result = await alertPanelCollection.find({donationNeeded : true}).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching alert data:", error);
    res.status(500).send({ message: "Failed to fetch alert data" });
  }
});

app.get("/alertPanel/donations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await alertPanelCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    console.error("Error fetching donation details:", error);
    res.status(500).send({ message: "Failed to fetch donation details" });
  }
});

// get only donation info or payment info
app.get("/paymentsInfo", async(req,res) =>{
  const data = await donationCollection.find().toArray();
  res.send(data);
})

// Save donor info before payment
app.post("/alertPanel/save-donation", async (req, res) => {
  try {
    const { donor, disaster, amount, date } = req.body;

   if (!donor?.name || !donor?.email || !disaster?._id || !amount) {
  return res.status(400).send({ message: "Incomplete donation info" });
}

    const donationDoc = {
      donor,
      disaster,
      amount,
      date: new Date(date),
      status: "pending", // pending until payment succeeds
    };

    const result = await donationCollection.insertOne(donationDoc);
    res.send({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error saving donation info:", error);
    res.status(500).send({ message: "Failed to save donation info" });
  }
});

// Update donation after payment success
app.post("/alertPanel/donation-success/:donationId", async (req, res) => {
  try {
    const { donationId } = req.params;
    const { paymentId } = req.body;

    // 1. Update the donor record status to 'completed'
    await donationCollection.updateOne(
      { _id: new ObjectId(donationId) },
      { $set: { status: "completed", paymentId } }
    );

    // 2. Fetch the donation document
    const donationDoc = await donationCollection.findOne({ _id: new ObjectId(donationId) });
    if (donationDoc) {
      // Ensure amount is numeric
      const donationAmount = Number(donationDoc.amount) || 0;

      await alertPanelCollection.updateOne(
        { _id: new ObjectId(donationDoc.disaster._id) },
        {
          $inc: { donationReceived: donationAmount },
          $push: {
            donors: {
              name: donationDoc.donor.name,
              email: donationDoc.donor.email,
              amount: donationAmount,
              date: donationDoc.date,
            },
          },
        }
      );
    }

    res.send({ success: true });
  } catch (error) {
    console.error("Error processing donation success:", error);
    res.status(500).send({ message: "Failed to process donation success" });
  }
});

// request helps APIS


app.get("/requestHelps", async (req, res) => {
  try {
    const { contact } = req.query; // e.g. ?contact=bristy@error.com
    let query = {};

    // Only show requests for the logged-in user's email if provided
    if (contact) {
      query = { contact: contact };
    }

    const results = await helpsCollection.find(query).toArray();
    res.send(results);
  } catch (error) {
    console.error("Error fetching help requests:", error);
    res.status(500).send({ message: "Failed to fetch help requests" });
  }
});


app.post("/requestHelps", async (req, res) => {
  try {
    const data = req.body;
    const result = await helpsCollection.insertOne({
      ...data,
      date: new Date(),
      status: "Pending"
    });
    res.send({ success: true, result });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});


app.get("/requestHelps/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const alert = await helpsCollection.findOne({ _id: new ObjectId(id) });
        if (!alert) return res.status(404).send({ message: "Help requests not found" });
        res.send(alert);
      } catch (error) {
        console.error("Error fetching alert by ID:", error);
        res.status(500).send({ message: "Failed to fetch help requests" });
      }
    });


    app.patch("/requestHelps/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const result = await helpsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: "Request not found or already updated" });
    }

    res.send({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to update status" });
  }
});

app.put("/requestHelps/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const result = await helpsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.send(result);
});

app.delete("/requestHelps/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await helpsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Help request not found" });
    }

    res.send({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting help request:", error);
    res.status(500).send({ message: "Failed to delete help request" });
  }
});


    // Backend: get active emergency alerts
app.get("/alertPanel/emergency", async (req, res) => {
  try {
    const alerts = await alertPanelCollection
      .find({ status: { $in: ["Active", "Acknowledged"] }, severity: { $in: ["High", "Critical"] } })
      .sort({ timestamp: -1 })
      .toArray();
    res.send(alerts);
  } catch (err) {
    console.error("Failed to fetch emergency alerts", err);
    res.status(500).send({ message: "Error fetching alerts" });
  }
});

// PATCH alert status by ID
app.patch("/alertPanel/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await alertPanelCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Acknowledged" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: "Alert not found or already acknowledged" });
    }

    const updatedAlert = await alertPanelCollection.findOne({ _id: new ObjectId(id) });
    res.send(updatedAlert);
  } catch (error) {
    console.error("Failed to acknowledge alert:", error);
    res.status(500).send({ message: "Error updating alert" });
  }
});


app.get("/alertPanel/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid alert ID" });
    }

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





// app.post("/alertPanel", async (req, res) => {
//   try {
//     const newAlert = req.body;

//     // Automatically fetch coordinates based on location field
//     const coordinates = await getCoordinates(newAlert.location);
//     newAlert.coordinates = coordinates;

//     const result = await alertPanelCollection.insertOne(newAlert);

//     const insertedAlert = await alertPanelCollection.findOne({ _id: result.insertedId });

//     // Emit to all clients
//     io.emit("newAlert", insertedAlert);

//     res.send(insertedAlert);
//   } catch (error) {
//     console.error("Failed to insert alert:", error);
//     res.status(500).send({ message: "Failed to add alert" });
//   }
// });

 // optional helper

// POST /alertPanel
app.post("/alertPanel", async (req, res) => {
  try {
    const newAlert = req.body;

    // Get coordinates
    const coordinates = await getCoordinates(newAlert.location);
    newAlert.coordinates = coordinates;

    // Save alert to DB
    const result = await alertPanelCollection.insertOne(newAlert);
    const insertedAlert = await alertPanelCollection.findOne({ _id: result.insertedId });

    // Realtime broadcast
    io.emit("newAlert", insertedAlert);

    // ◼ EMAIL TRIGGER ONLY WHEN STATUS === ACTIVE
    if (insertedAlert.status === "Active") {
      const users = await userCollection
        .find({}, { projection: { email: 1, _id: 0 } })
        .toArray();

      const recipients = users.map(u => u.email);

      if (recipients.length > 0) {
        console.log("📨 Sending alert email to", recipients.length, "users...");
        await sendAlertEmail(insertedAlert, recipients);
        console.log("✅ Email sent for ACTIVE alert");
      } else {
        console.log("⚠ No user emails found — alert stored but no notifications sent");
      }
    } else {
      console.log("ℹ Alert created but email not sent — status:", insertedAlert.status);
    }

    res.send(insertedAlert);

  } catch (error) {
    console.error("🚨 Failed to insert alert:", error);
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

    // Assign mission routes
  
    app.get("/missions", async (req, res) => {
  const { assignedTo } = req.query; // email from frontend
  try {
    const data = await missionsCollection.find({ assignedTo }).toArray();
    res.send(data);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


    app.get("/missions/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const mission = await missionsCollection.findOne({ _id: new ObjectId(id) });
        if (!mission) return res.status(404).send({ message: "Mission not found" });
        res.send(mission);
      } catch (error) {
        console.error("Error fetching mission by ID:", error);
        res.status(500).send({ message: "Failed to fetch mission" });
      }
    });

app.post("/missions", async (req, res) => {
  const {
    title,
    description,
    severity,
    notes,
    assignedTo,
    location, // This is the address string
  } = req.body;

  // Basic validation
  if (!title || !assignedTo || !location) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const { lat, lng } = await getCoordinates(location);

    const mission = {
      title,
      description: description || "",
      severity: severity || "Low",
      notes: notes || "",
      assignedTo,
      location: {
        address: location,
        lat,
        lng,
      },
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await missionsCollection.insertOne(mission);

    res.status(201).json({
      message: "Mission assigned successfully.",
      missionId: result.insertedId,
    });
  } catch (error) {
    console.error("Mission creation failed:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.patch("/missions/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; // e.g. "In-Progress", "Completed", "Cancelled"

    if (!status) {
      return res.status(400).send({ message: "Status field is required." });
    }

    const result = await missionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    res.send({ message: "Mission status updated successfully.", result });
  } catch (error) {
    console.error("Error updating mission status:", error);
    res.status(500).send({ message: "Failed to update mission status." });
  }
});

app.patch("/missions/:id/resources", async (req, res) => {
  try {
    const id = req.params.id;
    const { details } = req.body;

    if (!details) {
      return res.status(400).json({ message: "Resource request details are required." });
    }

    const result = await missionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          resourceRequest: {
            requested: true,
            details,
            requestedAt: new Date()
          }
        }
      }
    );

    res.send({ message: "Resource request submitted.", result });
  } catch (error) {
    console.error("Error requesting resources:", error);
    res.status(500).send({ message: "Failed to submit resource request." });
  }
});

app.patch("/missions/:id/postMission", async (req, res) => {
  try {
    const id = req.params.id;
    const { summary, photos } = req.body;

    if (!summary) {
      return res.status(400).json({ message: "Post mission summary is required." });
    }

    const result = await missionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          postMission: {
            summary,
            photos: photos || [], // optional array
            submittedAt: new Date()
          },
          status: "Completed"
        }
      }
    );

    res.send({ message: "Post mission details updated.", result });
  } catch (error) {
    console.error("Error uploading post mission:", error);
    res.status(500).send({ message: "Failed to upload post mission data." });
  }
});


// payment integration
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body; // in cents (USD) or smallest unit of currency

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd", // use your currency
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// app.post("/save-payment", async (req, res) => {
//   try {
//     const paymentData = req.body;
//     const result = await paymentsCollection.insertOne(paymentData);
//     res.send({ success: true, id: result.insertedId });
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// });

// app.get("/paymentsInfo", async(req,res) =>{
//   const data = await paymentsCollection.find().toArray();
//   res.send(data);
// })




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