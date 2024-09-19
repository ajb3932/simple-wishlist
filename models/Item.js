const mongoose = require('mongoose'); // Ensure mongoose is imported

const itemSchema = new mongoose.Schema({
    name: String,
    price: Number,
    url: String,
    imageUrl: String,
    purchased: { type: Boolean, default: false }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
