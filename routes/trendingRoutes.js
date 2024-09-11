const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TrendingModel = require('../models/Trending');

const router = express.Router();

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Route to create a trending product
router.post('/trending', upload.single('image'), async (req, res) => {
  try {
    const { name, category, description, price } = req.body;
    const image = req.file ? req.file.filename : '';

    const newTrendingProduct = new TrendingModel({
      name,
      category,
      description,
      price,
      image
    });

    await newTrendingProduct.save();
    res.status(201).json(newTrendingProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all trending products
router.get('/trending', async (req, res) => {
  try {
    const trendingProducts = await TrendingModel.find();
    res.status(200).json(trendingProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to update a trending product
router.put('/trending/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, price } = req.body;
    const image = req.file ? req.file.filename : '';

    const product = await TrendingModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (image && product.image) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', product.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Delete old image file
      }
    }

    product.name = name;
    product.category = category;
    product.description = description;
    product.price = price;
    if (image) {
      product.image = image;
    }

    await product.save();

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
});

// Update a product's image
router.put('/products/:id/image', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;
    const image = req.file ? req.file.filename : '';

    // Find the product and update its image
    const product = await TrendingModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If there's an old image, delete it
    const oldImagePath = path.join(__dirname, '..', 'uploads', product.image);
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath); // Delete old image file
    }

    // Update the product's image path
    product.image = image;
    await product.save();

    res.json(product); // Return the updated product
  } catch (error) {
    res.status(500).json({ message: 'Error updating image', error });
  }
});

// Route to delete a trending product
router.delete('/trending/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product and delete its image from the server
    const product = await TrendingModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imagePath = path.join(__dirname, '..', 'uploads', product.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // Delete image from the server
    }

    // Delete the product from the database
    await TrendingModel.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
});


module.exports = router;


