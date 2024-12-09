const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); 
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000; 

// middleware 
app.use(cors({ 
    origin: [
        'http://localhost:5173',
        'https://online-job-bd.netlify.app'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const logged = async (req, res, next) => {
    console.log('callde:', req.host, req.originalUrl);
    next()
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    // console.log('value of token in middleware', token);
    if (!token) {
        return res.status(401).send({ messag: 'No Authrize' });
    }
    jwt.verify(token, process.env.Access_Secret_Token, (err, decoded) => {
        // error
        if (err) {
            return res.status(401).send({ messag: 'No Access Authrize' });
        }
        // if token is valid then it would be decoded 
        // console.log('value in the token', decoded);
        req.user = decoded;
        next()
    })
}


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_PASS}@cluster0.3x1kphs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();

        // online job bd database connection 
        const jobCallection = client.db('online_job_DB').collection('online_jobs');
        const applyJob = client.db('online_job_DB').collection('apply_jobs');

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.Access_Secret_Token, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            })
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        app.get('/apply', logged, async (req, res) => {
            const cursor = applyJob.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/applys', async (req, res) => {
            console.log(req.query.email);
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await applyJob.find(query).toArray();
            res.send(result);
        })

        app.post('/apply', async (req, res) => {
            const applyData = req.body;
            console.log(applyData);
            const result = await applyJob.insertOne(applyData);
            res.send(result);
        })


        // online job bd data get 
        app.get('/job', logged,  async (req, res) => {
            const cursor = jobCallection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // online job bd query 
        app.get('/jobs', async (req, res) => {
            console.log(req.query.userEmail);

            let query = {}
            if (req.query?.userEmail) {
                query = { userEmail: req.query.userEmail }
            }
            const result = await jobCallection.find(query).toArray();
            res.send(result);

        })

        // online job bd  data post 
        app.post('/job', async (req, res) => {

            const jobData = req.body;
            console.log(jobData);
            const result = await jobCallection.insertOne(jobData);
            res.send(result);
        })

        // online job bd update 
        app.put('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const update = req.body;
            const jobs = {
                $set: {
                    Job_Title: update.Job_Title,
                    Job_Banner_Url: update.Job_Banner_Url,
                    userName: update.userName,
                    userEmail: update.userEmail,
                    Job_Category: update.Job_Category,
                    Minmum: update.Minmum,
                    Mixmum: update.Mixmum,
                    Job_Description: update.Job_Description,
                    Post_Date: update.Post_Date,
                    Deadline_date: update.Deadline_date,
                    Job_Applicants_Number: update.Job_Applicants_Number,
                }
            }
            const result = await jobCallection.updateOne(filter, jobs, options);
            res.send(result);
        })

        // online job bd delete 
        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobCallection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Online Job Bd Run On Project')
})

app.listen(port, () => {
    console.log(`Online Job Bd On Project Port ${port}`)
})
