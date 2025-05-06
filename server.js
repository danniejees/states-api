const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const States = require('./States'); 
const statesData = require('./statesData.json');
const path = require('path'); 

dotenv.config();

const app = express(); 
const cors = require('cors');
app.use(cors());  

app.use(express.json());
app.use(express.static(path.join(__dirname)));  

mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    dbName: 'statesDB',
    serverSelectionTimeoutMS: 5000  
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);  
});

const validateState = (req, res, next) => {
    const state = req.params.state ? req.params.state.toUpperCase() : null;
    console.log('Received state:', state);  

    const validStateCodes = statesData.map(state => state.code.toUpperCase());

    if (!validStateCodes.includes(state)) {
        return res.status(400).json({ error: 'Invalid state abbreviation parameter' });
    }

    req.state = state;  
    next();
};



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  
});

app.get('/states/', async (req, res) => {
    const contig = req.query.contig;
    let filteredStates = statesData;

    if (contig === 'true') {
        filteredStates = statesData.filter(state => !['AK', 'HI'].includes(state.code));
    } else if (contig === 'false') {
        filteredStates = statesData.filter(state => ['AK', 'HI'].includes(state.code));
    }

    const funFactsFromDB = await States.find({});

    const mergedStates = filteredStates.map(state => {
        const dbMatch = funFactsFromDB.find(entry => entry.stateCode === state.code);
        if (dbMatch && dbMatch.funfacts.length > 0) {
            return { ...state, funfacts: dbMatch.funfacts };
        }
        return state;
    });

    res.json(mergedStates);
});


app.get('/states/:state', validateState, async (req, res) => {
    const state = req.state;
    let stateData = statesData.find((s) => s.code.toUpperCase() === state);

    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }

    const funfacts = await States.findOne({ stateCode: state });
    if (funfacts && funfacts.funfacts.length > 0) {
        stateData.funfacts = funfacts.funfacts;  
    } else {
        stateData.funfacts = [];  
    }
     if (state === 'NH') {
        delete stateData.funfacts;  
    }
     if (state === 'RI') {
        delete stateData.funfacts;  
    }

    res.json(stateData);
});





app.get('/states/:state/funfact', validateState, async (req, res) => {
    const state = req.state; 
    const funfacts = await States.findOne({ stateCode: state });

    if (!funfacts || funfacts.funfacts.length === 0) {
        return res.status(404).json({ error: `No Fun Facts found for ${state}` });
    }

    const randomFact = funfacts.funfacts[Math.floor(Math.random() * funfacts.funfacts.length)];
    res.json({ funfact: randomFact });
});

app.post('/states/:state/funfact', validateState, async (req, res) => {
    const state = req.state;
    const { funfacts } = req.body;

    const excludedStates = ['NH', 'RI', 'GA', 'AZ', 'MT'];
    if (excludedStates.includes(state)) {
        return res.status(400).json({ error: `Fun facts cannot be added for ${state}` });
    }

    if (!funfacts || !Array.isArray(funfacts)) {
        return res.status(400).json({ error: 'State fun facts value must be an array' });
    }

    const stateData = await States.findOneAndUpdate(
        { stateCode: state },
        { $addToSet: { funfacts: { $each: funfacts } } },
        { new: true, upsert: true }
    );

    res.json(stateData);
});


app.patch('/states/:state/funfact', validateState, async (req, res) => {
    const state = req.state; 
    const { index, funfact } = req.body;

    if (typeof index !== 'number' || !funfact) {
        return res.status(400).json({ error: 'State fun fact index value required and valid funfact' });
    }

    const stateData = await States.findOne({ stateCode: state });
    if (!stateData || !stateData.funfacts[index - 1]) {
        return res.status(404).json({ error: 'No Fun Fact found at that index for ' + state });
    }

    stateData.funfacts[index - 1] = funfact;
    await stateData.save();

    res.json(stateData);
});

app.delete('/states/:state/funfact', validateState, async (req, res) => {
    const state = req.state; 
    const { index } = req.body;

    if (typeof index !== 'number') {
        return res.status(400).json({ error: 'State fun fact index value required' });
    }

    const stateData = await States.findOne({ stateCode: state });
    if (!stateData || !stateData.funfacts[index - 1]) {
        return res.status(404).json({ error: 'No Fun Fact found at that index for ' + state });
    }

    stateData.funfacts.splice(index - 1, 1);
    await stateData.save();

    res.json(stateData);
});

app.get('/states/:state/capital', validateState, async (req, res) => {
    const state = req.state; 
    const stateData = statesData.find((s) => s.code.toUpperCase() === state);

    if (!stateData) {
        return res.status(404).json({ error: 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        capital: stateData.capital
    });
});

app.get('/states/:state/nickname', validateState, async (req, res) => {
    const state = req.state; 
    const stateData = statesData.find((s) => s.code.toUpperCase() === state);

    if (!stateData) {
        return res.status(404).json({ error: 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        nickname: stateData.nickname
    });
});

app.get('/states/:state/population', validateState, async (req, res) => {
    const state = req.state; 
    const stateData = statesData.find((s) => s.code.toUpperCase() === state);

    if (!stateData) {
        return res.status(404).json({ error: 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        population: stateData.population.toLocaleString()
    });
});

app.get('/states/:state/admission', validateState, async (req, res) => {
    const state = req.state; 
    const stateData = statesData.find((s) => s.code.toUpperCase() === state);

    if (!stateData) {
        return res.status(404).json({ error: 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: stateData.state,
        admitted: stateData.admitted
    });
});

app.use((req, res) => {
    res.status(404).type('html').send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>404 Not Found</title>
        </head>
        <body>
            <h1>404 Not Found</h1>
        </body>
        </html>
    `);
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
