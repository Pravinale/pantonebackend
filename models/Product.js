// const mongoose = require('mongoose');

// const sizeSchema = new mongoose.Schema({
//   size: { type: String, required: false },
//   stock: { type: Number, required: false, default: 0 },
// });

// const colorSchema = new mongoose.Schema({
//   color: { type: String, required: false },
//   image: { type: String, required: false }, // Keep image field for colors
//   sizes: [sizeSchema],
// });

// const ProductSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   category: { type: String, required: true },
//   subcategory: { type: String, required: false },
//   description: { type: String, required: true },
//   price: { type: Number, required: true },
//   colors: [colorSchema],
// });

// const ProductModel = mongoose.model('Product', ProductSchema);

// module.exports = ProductModel;



const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: false },
  stock: { type: Number, required: false, default: 0 },
});

const colorSchema = new mongoose.Schema({
  color: { type: String, required: false },
  images: [{ type: String, required: false }], // Changed 'image' to 'images' to support multiple images
  sizes: [sizeSchema],
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: false },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  colors: [colorSchema],
});

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;

