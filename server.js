
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const States = require('./States');
const statesData = require('./statesData.json');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err));


app.get('/states/', async (req, res) => {
    const contig = req.query.contig;
    let filteredStates = statesData;

    if (contig === 'true') {
        filteredStates = statesData.filter(state => !['AK', 'HI'].includes(state.stateCode));
    } else if (contig === 'false') {
        filteredStates = statesData.filter(state => ['AK', 'HI'].includes(state.stateCode));
    }

    res.json(filteredStates);
});

app.get('/states/:state', async (req, res) => {
    const state = req.params.state.toUpperCase();
    const stateData = statesData.find((s) => s.stateCode === state);
    
    if (!stateData) {
        return res.status(404).json({ error: 'State not found' });
    }

    const funfacts = await States.findOne({ stateCode: state });

    if (funfacts) {
        stateData.funfacts = funfacts.funfacts;
    }

    res.json(stateData);
});

app.get('/states/:state/funfact', async (req, res) => {
    const state = req.params.state.toUpperCase();
    const funfacts = await States.findOne({ stateCode: state });

    if (!funfacts || funfacts.funfacts.length === 0) {
        return res.status(404).json({ error: 'No fun facts available for this state' });
    }

    const randomFact = funfacts.funfacts[Math.floor(Math.random() * funfacts.funfacts.length)];
    res.json({ funfact: randomFact });
});

app.post('/states/:state/funfact', async (req, res) => {
    const state = req.params.state.toUpperCase();
    const { funfacts } = req.body;

    if (!funfacts || !Array.isArray(funfacts)) {
        return res.status(400).json({ error: 'Fun facts must be an array' });
    }

    const stateData = await States.findOneAndUpdate(
        { stateCode: state },
        { $addToSet: { funfacts: { $each: funfacts } } },
        { new: true, upsert: true }
    );

    res.json(stateData);
});

app.patch('/states/:state/funfact', async (req, res) => {
    const state = req.params.state.toUpperCase();
    const { index, funfact } = req.body;

    if (typeof index !== 'number' || !funfact) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const stateData = await States.findOne({ stateCode: state });
    if (!stateData || !stateData.funfacts[index - 1]) {
        return res.status(404).json({ error: 'Fun fact not found' });
    }

    stateData.funfacts[index - 1] = funfact;
    await stateData.save();

    res.json(stateData);
});

app.delete('/states/:state/funfact', async (req, res) => {
    const state = req.params.state.toUpperCase();
    const { index } = req.body;

    if (typeof index !== 'number') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const stateData = await States.findOne({ stateCode: state });
    if (!stateData || !stateData.funfacts[index - 1]) {
        return res.status(404).json({ error: 'Fun fact not found' });
    }

    stateData.funfacts.splice(index - 1, 1);
    await stateData.save();

    res.json(stateData);
});

app.all('*', (req, res) => {
    if (req.accepts('json')) {
        return res.status(404).json({ error: '404 Not Found' });
    }
    res.status(404).send('<h1>404 Not Found</h1>');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
