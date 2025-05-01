
const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    stateCode: {
        type: String,
        required: true,
        unique: true,
    },
    funfacts: {
        type: [String],
        default: [],
    },
});

const State = mongoose.model('State', stateSchema);

module.exports = mongoose.model('State', stateSchema);
