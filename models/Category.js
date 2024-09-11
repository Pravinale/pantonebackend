// const mongoose = require('mongoose');

// const CategorySchema = new mongoose.Schema({
//     name: { type: String, required: true, unique: true }
// });

// const CategoryModel = mongoose.model('Category', CategorySchema);

// module.exports = CategoryModel;


const mongoose = require('mongoose');

// Define the Subcategory schema
const SubcategorySchema = new mongoose.Schema({
    name: { type: String, required: true }
});

// Define the Category schema including subcategories
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    subcategories: [SubcategorySchema] // Array of subcategory objects
});

const CategoryModel = mongoose.model('Category', CategorySchema);

module.exports = CategoryModel;
