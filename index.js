const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 5000

// meddleWare
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())

const secret = process.env.TOKEN_SECRET

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xmlybhe.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();

        const verifyToken = (req, res, next) => {
            const {token} = req.cookies
            if(!token) {
                return res.status(401).send({message:'Forbidden Access'})
            }
            jwt.verify(token,secret, (err,decoded) =>{
                if(err) {
                    return res.status(403).send({message:'Forbidden Access'})
                }
                req.user = decoded
                next()
            })
        }

        const foodCollection = client.db('foodDB').collection('foods')

        app.get('/api/v1/foods', verifyToken, async (req, res) => {
            const tokenEmail = req.user
            console.log(tokenEmail);
            const cursor = foodCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/api/v1/foods/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query)
            res.send(result)
        })

        app.post('/api/v1/foods', async (req, res) => {
            const food = req.body
            const result = await foodCollection.insertOne(food)
            res.send(result)
        })

        app.post('/api/v1/user/access-token', async (req, res) => {
            const userEmail = req.body.email
            console.log(userEmail);
            const token = jwt.sign(userEmail, secret)
            // console.log(token);
            res.cookie('token',token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            }).send({ success: true })
        })

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
    res.send('Community Food Sharing Server')
})

app.listen(port, () => {
    console.log(`Community Food Sharing Server Running on port ${port}`)
})