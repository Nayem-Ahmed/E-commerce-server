const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.8wqrrau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        const allproductsCollection = client.db('E-commerce').collection('allproducts')
        const addTocartCollection = client.db('E-commerce').collection('addCart')
        const wishlistCollection = client.db('E-commerce').collection('wishlist')


        // Get allproducts
        app.get('/allproducts', async (req, res) => {
            const result = await allproductsCollection.find().toArray()
            res.send(result)
        })
        // Get single products
        app.get('/allproducts/:id', async (req, res) => {
            const id = req.params.id
            const result = await allproductsCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        //  add cart post
        app.post('/addcart', async (req, res) => {
            const addcart = req.body;
            const result = await addTocartCollection.insertOne(addcart);
            res.send(result);
        })
        // Get BOOKING params
        app.get('/addcart/:email', async (req, res) => {
            const email = req.params.email;
            const fiterrr = { email: email }
            const result = await addTocartCollection.find(fiterrr).toArray();
            res.send(result)
        })

        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})