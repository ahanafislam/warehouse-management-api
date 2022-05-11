const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//  middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
      return res.status(401).send({ message: 'Unauthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(403).send({ message: 'Forbidden Access' });
      }
      req.decoded = decoded;
      next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a00ff.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const inventoryItemsCollection = client.db("ashbab").collection("inventoryItems");

    // Getnarate Auth token
    app.post('/get_auth_token', async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '1d'
      });
      res.send({accessToken});
    });

    // inventory items API
    app.get('/inventory', async (req, res) => {
        const query = {};
        const cursor = inventoryItemsCollection.find(query);
        const inventoryItems = await cursor.toArray();
        res.send(inventoryItems);
    });

    // GET User's item by auth token
    app.get('/my_item', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = {author_email: email};
        const cursor = inventoryItemsCollection.find(query);
        const inventoryItems = await cursor.toArray();
        res.send(inventoryItems);
      }
      else {
        res.status(403).send({message: "Forbidden Access"});
      }
    });

    app.get('/inventory/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const inventoryItems = await inventoryItemsCollection.findOne(query);
      res.send(inventoryItems);
    });

    // Add inventory item
    app.post('/inventory', async (req, res) => {
      const newItem = req.body;
      const result = await inventoryItemsCollection.insertOne(newItem);
      res.send(result);
    });

    // Update inventory stock
    app.put('/inventory/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      let updateQuantity;

      if(data.newQuantity) {
        updateQuantity = data.newQuantity;
      }
      else {
        updateQuantity = data.updateStock;
      }

      const updateStock = {
        $set: {
          quantity: updateQuantity
        }
      }

      const result = await inventoryItemsCollection.updateOne(filter, updateStock, options);
      res.send(result);
    });

    // Delete Inventory Item API
    app.delete('/inventory/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await inventoryItemsCollection.deleteOne(query);
        res.send(result);
    });
  }
  finally {

  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Ashbab api is running.')
  })
  
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})
