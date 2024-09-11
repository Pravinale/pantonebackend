const express = require('express');
const router = express.Router();
const Category = require('../models/Category'); // Adjust path as needed
const ProductModel = require('../models/Product');

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new category
router.post('/categories', async (req, res) => {
    const category = new Category({
        name: req.body.name,
        subcategories: req.body.subcategories // Accept subcategories in the request body
    });

    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a category
router.put('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            category.name = req.body.name;
            category.subcategories = req.body.subcategories; // Update subcategories
            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a category
router.delete('/categories/:id', async (req, res) => {
    try {
        const result = await Category.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Category deleted' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a subcategory to a category
router.post('/categories/:id/subcategories', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            category.subcategories.push({ name: req.body.name });
            const updatedCategory = await category.save();
            res.status(201).json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a subcategory
router.put('/categories/:categoryId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const category = await Category.findById(req.params.categoryId);
        if (category) {
            const subcategory = category.subcategories.id(req.params.subcategoryId);
            if (subcategory) {
                subcategory.name = req.body.name;
                const updatedCategory = await category.save();
                res.json(updatedCategory);
            } else {
                res.status(404).json({ message: 'Subcategory not found' });
            }
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a subcategory
router.delete('/categories/:categoryId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.params;

        // Find the category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Remove the subcategory by its ID
        const subcategoryIndex = category.subcategories.findIndex(sub => sub._id.toString() === subcategoryId);
        if (subcategoryIndex === -1) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        category.subcategories.splice(subcategoryIndex, 1); // Remove the subcategory from the array

        // Save the updated category
        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (err) {
        console.error('Error deleting subcategory:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get products by category
router.get('/products/category/:categoryId', async (req, res) => {
    try {
        const products = await ProductModel.find({ category: req.params.categoryId });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
