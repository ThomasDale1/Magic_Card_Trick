const express = require('express')
const app = express()

const path = require('path')
const bodyParser = require('body-parser')
const mongodb = require('mongodb')

const MongoClient = mongodb.MongoClient
const URI = process.env.MONGODB_URI || 'mongodb://localhost/database'
const PORT = process.env.PORT || 5000
const DB_NAME = process.env.DB_NAME

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/secret', (req, res) => {
    res.sendFile(path.join(__dirname, 'secret.html'))
})

app.post('/secret', (req, res) => {
    MongoClient.connect(URI, (error, client) => {
        if(error){
            console.log(error)
        }else{
            console.log('POST request:', req.body)
            console.log(client)
            const db = client.db(DB_NAME)
            const collection = db.collection('names')
            const entry = {
                name: req.body.name.toLowerCase(),
                card: req.body.number + '_of_' + req.body.suit
            }
            collection.insertOne(entry, (error, result) => {
                if(error){
                    console.log(error)
                }else{
                    res.status(200).send('Inserted into database')
                }
            })
            client.close()
        }
    })
})

app.get('/:param', (req, res) => {
    const name = req.params.param.toLocaleLowerCase()

    MongoClient.connect(URI, (error, client) => {
        if(error){
            console.log(error)
        }else{
            const db = client.db(DB_NAME)
            const collection = db.collection('names')

            if (name === 'deleteall'){
                collection.deleteMany({})
                res.send('database reset')
            }else{
                collection.find({name: name}).toArray((error, result) => {
                    if(error){
                        console.log(error);
                    }else if(result.length){
                        const card = result[result.length-1].card + '.png'
                        res.sendFile(path.join(__dirname + '/cards/' + card))
                    } else {
                        res.sendStatus(404)
                    }
                    client.close()
                })
            }
        }
    })
})

app.listen(PORT, '0.0.0.0', ()=>{
    console.log('Server running on port ' + PORT);
    console.log('MongoDB URI configured:', URI ? 'Yes' : 'No');
    console.log('DB Name:', DB_NAME);
})