const express = require('express')
const app = express()
const port = 5000
const { MongoClient } = require('mongodb')
const cors = require('cors')
const path = require('path')

// serve static files
app.use(express.static(path.join(__dirname, 'public')))

app.use(cors())

app.use(express.json())

const url = 'mongodb://localhost:27017'
const client = new MongoClient(url)

const dbName = 'Hostel'
let db

const connectDB = async () => {
    try {
        await client.connect()
        db = client.db(dbName)
        console.log("Database Connected Successfully...")
    } catch (error) {
        console.log(`Something went wrong : ${error}`)
    }
}
connectDB()

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/show-data', async (req, res) => {
    const collection = db.collection('rooms')
    const allData = await collection.find().toArray()
    res.json(allData)
})

app.get('/booked', async (req, res) => {
    const collection = db.collection('rooms')
    const booked = await collection.find({ allocated: true }).toArray()
    res.json(booked)
})

app.get('/available', async (req, res) => {
    const collection = db.collection('rooms')
    const available = await collection.find({ allocated: false }).toArray()
    res.json(available)
})

app.post('/book-room', async (req, res) => {
    try {
        const collection = db.collection('rooms')

        const { roomNo, name, fee } = req.body

        const result = await collection.updateOne(
            { roomNo: Number(roomNo), allocated: false },
            {
                $set: {
                    name: name,
                    fee: fee,
                    allocated: true
                }
            }
        )

        if (result.matchedCount === 0) {
            const room = await collection.findOne({ roomNo: Number(roomNo) })

            if (!room) {
                return res.send("Room not found")
            } else {
                return res.send("Room already booked")
            }
        }

        res.send("Room booked successfully")

    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.post('/unbook-room', async (req, res) => {
    try {
        const collection = db.collection('rooms')
        const { roomNo } = req.body

        const result = await collection.updateOne(
            { roomNo: Number(roomNo), allocated: true },
            {
                $set: {
                    name: "",
                    fee: "",
                    allocated: false
                }
            }
        )

        if (result.matchedCount === 0) {
            return res.send("Room already empty or not found")
        }

        res.send("Room unbooked successfully")

    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.listen(port, () => {
    console.log(`Click => http://localhost:${port}`)
})