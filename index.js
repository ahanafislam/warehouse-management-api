const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//  middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a00ff.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const inventoryItemsCollection = client.db("ashbab").collection("inventoryItems");

    // inventory items API
    app.get('/inventory', async (req, res) => {
        const query = {};
        const cursor = inventoryItemsCollection.find(query);
        const inventoryItems = await cursor.toArray();
        res.send(inventoryItems);
    });
  }
  finally {

  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello')
  })
  
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})
