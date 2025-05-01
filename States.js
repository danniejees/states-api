const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    stateCode: {
        type: String,
        required: true,
        unique: true,
        index: true  
    },
    funfacts: {
        type: [String],
        default: []  
    }
});

const States = mongoose.model('States', stateSchema, 'states'); 

module.exports = States;
