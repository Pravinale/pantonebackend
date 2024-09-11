const mongoose = require('mongoose');


const TrendingSchema = new mongoose.Schema({
  image: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
});

const TrendingModel = mongoose.model('Trending', TrendingSchema);

module.exports = TrendingModel;
