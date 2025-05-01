
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

module.exports = mongoose.model('State', stateSchema);
