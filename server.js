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

app.post('/secret', async (req, res) => {
    console.log('🔵 POST /secret - Request received'); // Este DEBE aparecer
    console.log('Body:', req.body);
    
    let client;
    
    try {
        console.log('🔵 Attempting to connect to MongoDB...');
        console.log('URI exists:', !!URI);
        console.log('DB_NAME:', DB_NAME);
        
        client = await MongoClient.connect(URI, {
            serverSelectionTimeoutMS: 10000, // 10 segundos timeout
        });
        
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection('names');
        
        const entry = {
            name: req.body.name.toLowerCase(),
            card: req.body.number + '_of_' + req.body.suit,
            createdAt: new Date()
        };
        
        console.log('🔵 Inserting entry:', entry);
        
        const result = await collection.insertOne(entry);
        
        console.log('✅ Inserted successfully:', result.insertedId);
        
        res.status(200).send('Inserted into database');
        
    } catch(error) {
        console.error('❌ Error in POST /secret:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        res.status(500).send('Database error: ' + error.message);
    } finally {
        if (client) {
            await client.close();
            console.log('🔵 Connection closed');
        }
    }
});

app.get('/:param', async (req, res) => {
    const name = req.params.param.toLowerCase()
    console.log('🔍 GET /:param - Looking for:', name);

    let client;
    
    try {
        client = await MongoClient.connect(URI, {
            serverSelectionTimeoutMS: 5000,
        });
        
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection('names');

        if (name === 'deleteall') {
            await collection.deleteMany({});
            console.log('🗑️ Database reset');
            res.send('database reset');
        } else {
            console.log('🔍 Searching for name:', name);
            
            const result = await collection.find({name: name}).toArray();
            
            console.log('📊 Query result:', result.length, 'documents found');
            console.log('📄 Documents:', JSON.stringify(result, null, 2));
            
            if (result.length) {
                const latestEntry = result[result.length - 1];
                const card = latestEntry.card + '.png';
                const cardPath = path.join(__dirname, 'cards', card);
                
                console.log('🎴 Sending card:', card);
                console.log('📁 Full path:', cardPath);
                
                // Verificar si el archivo existe
                const fs = require('fs');
                if (fs.existsSync(cardPath)) {
                    res.sendFile(cardPath);
                } else {
                    console.error('❌ Card file not found:', cardPath);
                    res.status(404).send(`Card file not found: ${card}`);
                }
            } else {
                console.log('❌ No card found for name:', name);
                res.status(404).send(`No card found for name: ${name}`);
            }
        }
    } catch(error) {
        console.error('❌ GET Error:', error.message);
        console.error('Full error:', error);
        res.status(500).send('Server error: ' + error.message);
    } finally {
        if (client) {
            await client.close();
            console.log('🔵 Connection closed');
        }
    }
});


app.listen(PORT, '0.0.0.0', ()=>{
    console.log('Server running on port ' + PORT);
    console.log('MongoDB URI configured:', URI ? 'Yes' : 'No');
    console.log('DB Name:', DB_NAME);
})