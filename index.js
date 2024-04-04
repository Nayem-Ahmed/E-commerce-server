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
        const paymenthistoryCollection = client.db('E-commerce').collection('paymentHistory')


        // Get allproducts
        app.get('/allproducts', async (req, res) => {
            const filter = req.query;
            const query = {};
            console.log(filter);
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
        app.patch('/increment_quantity/:id', async (req, res) => {
            const id = req.params.id;
            const result = await addTocartCollection.findOneAndUpdate({ _id: new ObjectId(id) }, { $inc: { quantity: 1 } });
            res.send(result);

        })
        // Route for decrementing quantity
        app.patch('/decrement_quantity/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await addTocartCollection.findOneAndUpdate(
                    { _id: new ObjectId(id), quantity: { $gt: 0 } }, // Ensure quantity is greater than 0 before decrementing
                    { $inc: { quantity: -1 } }
                );
                if (!result.value) {
                    return res.status(404).send('Item not found or quantity already zero');
                }
                res.send(result.value);
            } catch (error) {
                console.error('Error decrementing quantity:', error);
                res.status(500).send('Internal server error');
            }
        });
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
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })
        // // save payment history
        // app.post('/payment_history', async (req, res) => {
        //     const history = req.body;
        //     const result = await paymenthistoryCollection.insertOne(history);
        //     res.send(result);
        // })

        // Save payment history and delete cart items
        app.post('/payment_history', async (req, res) => {
            const history = req.body;
            try {
                // Insert payment history
                const paymentResult = await paymenthistoryCollection.insertOne(history);

                // Delete cart items associated with the user's email
                const deleteResult = await addTocartCollection.deleteMany({ email: history.email });
                res.send({ paymentResult, deleteResult });
            } catch (error) {
                console.error('Error saving payment history:', error);
                res.status(500).send('Error saving payment history');
            }
        });
        // get payment history
        app.get('/payment_history/:email', async (req, res) => {
            const email = req.params.email;
            const fiter = { email: email }
            const result = await paymenthistoryCollection.find(fiter).toArray();
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