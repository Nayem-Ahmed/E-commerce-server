const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.
const stripe = require("stripe")(process.env.stripe_sk);

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
        const addWishlistCollection = client.db('E-commerce').collection('wishlist')


        // Get allproducts
        app.get('/allproducts', async (req, res) => {
            const filter = req.query;
            const query = {};
            const option = {
                sort: {
                    new_price: filter.sort === 'priceLowToHigh' ? 1 : -1
                }
            }
            const result = await allproductsCollection.find(query, option).toArray()
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
        // Get cart params
        app.get('/addcart/:email', async (req, res) => {
            const email = req.params.email;
            const fiterrr = { email: email }
            const result = await addTocartCollection.find(fiterrr).toArray();
            res.send(result)
        })
        // single BOOKING delete
        app.delete('/addcart/:id', async (req, res) => {
            const id = req.params.id
            const finddelete = await addTocartCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(finddelete)
        })
        // wishlist post
        app.post('/wishlist', async (req, res) => {
            const addwishlist = req.body;
            const result = await addWishlistCollection.insertOne(addwishlist);
            res.send(result);
        })
        // Get wishlist params
        app.get('/wishlist/:email', async (req, res) => {
            const email = req.params.email;
            const fiter = { email: email }
            const result = await addWishlistCollection.find(fiter).toArray();
            res.send(result)
        })
        // ------------------payment--------------------
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;

            // Create a PaymentIntent with the order amount and currency
            const amount = parseInt(price * 100);
            console.log(amount,price);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
              });

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