// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const ProductModel = require('../models/Product');
// const fs = require('fs');

// const router = express.Router();

// // Set up multer for image upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ storage: storage });


// // // Create a new product
// router.post('/products', upload.fields([
//   { name: 'image' },
//   { name: 'colorImages', maxCount: 10 }, // Adjust the count as needed
// ]), async (req, res) => {
//   const { name, description, price, category, subcategory, colors } = req.body; // Add subcategoryId here
//   const imagePath = req.files['image'] ? req.files['image'][0].path : '';

//   // Process color images
//   const colorImages = req.files['colorImages'] || [];
//   const colorImagesPaths = colorImages.map(file => file.path);

//   // Parse and combine color data
//   const parsedColors = JSON.parse(colors).map((color, index) => ({
//     ...color,
//     image: colorImagesPaths[index] || '', // Assign color image path
//   }));

//   const newProduct = new ProductModel({
//     name,
//     image: imagePath,
//     description,
//     price,
//     category,
//     subcategory,
//     colors: parsedColors,
//   });

//   try {
//     const savedProduct = await newProduct.save();
//     res.status(201).json(savedProduct);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });








const express = require('express');
const multer = require('multer');
const path = require('path');
const ProductModel = require('../models/Product');
const fs = require('fs');

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



// Create a new product

router.post('/products', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Error uploading files' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, description, price, category, subcategory, colors } = req.body;

    // Parse colors data
    const parsedColors = JSON.parse(colors).map((color, index) => {
      const imagesForColor = [];
      ['image1', 'image2', 'image3'].forEach(imageKey => {
        const imageFile = req.files.find(file => file.fieldname === `colorImages-${index}-${imageKey}`);
        if (imageFile) {
          imagesForColor.push(imageFile.path);
        }
      });

      return {
        ...color,
        images: imagesForColor,
      };
    });

    const newProduct = new ProductModel({
      name,
      description,
      price,
      category,
      subcategory,
      colors: parsedColors,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await ProductModel.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search products by name
router.get('/products/search', async (req, res) => {
  const query = req.query.query;
  
  try {
    // Perform a text search on the product name and description fields
    const products = await ProductModel.find({
      $text: { $search: query }
    });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get a product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch products by subcategory name
router.get('/products/subcategory/:subcategoryName', async (req, res) => {
  const { subcategoryName } = req.params;
  try {
    const products = await ProductModel.find({ subcategory: subcategoryName });
    if (products.length > 0) {
      res.json(products);
    } else {
      res.status(404).json({ message: 'No products found for this subcategory' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a product by ID
router.put('/products/:id', upload.fields([
  { name: 'image' },
  { name: 'colorImages', maxCount: 10 } // Adjust the count as needed
]), async (req, res) => {
  const { name, description, price, category, subcategory, colors } = req.body;
  
  // Get existing product data
  const existingProduct = await ProductModel.findById(req.params.id);
  if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

  // Handle image
  const imagePath = req.files['image'] ? req.files['image'][0].path : existingProduct.image;

  // Process color images
  const colorImages = req.files['colorImages'] || [];
  const colorImagesPaths = colorImages.map(file => file.path);

  // Parse and combine color data
  const parsedColors = JSON.parse(colors).map((color, index) => ({
    ...color,
    image: color.image || (colorImagesPaths[index] || existingProduct.colors[index]?.image) // Preserve existing color image if new image is not provided
  }));

  try {
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        image: imagePath,
        description,
        price,
        category,
        subcategory,
        colors: parsedColors,
      },
      { new: true }
    );

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get stock information for a specific product, color, and size
router.get('/products/:id/stock/:color/:size', async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const colorGroup = product.colors.find(cg => cg.color === req.params.color);
    if (!colorGroup) return res.status(404).json({ message: 'Color not found' });

    const sizeGroup = colorGroup.sizes.find(sg => sg.size === req.params.size);
    if (!sizeGroup) return res.status(404).json({ message: 'Size not found' });

    res.status(200).json({ stock: sizeGroup.stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update stock for products with cash in hand payment 
router.post('/products/update-stock', async (req, res) => {
  try {
    const { products } = req.body; // Array of products with ID, color, size, and quantity

    await Promise.all(products.map(async (product) => {
      const { productId, color, size, quantity } = product;
      // Assuming you have a method to find the product and update its stock
      await ProductModel.findOneAndUpdate(
        { _id: productId, 'colors.color': color, 'colors.sizes.size': size },
        { $inc: { 'colors.$[color].sizes.$[size].stock': -quantity } },
        {
          arrayFilters: [
            { 'color.color': color },
            { 'size.size': size }
          ],
          new: true
        }
      );
    }));

    res.status(200).json({ message: 'Stock updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// // Delete a product by ID
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Delete the main product image if it exists
    if (product.image) {
      const mainImagePath = path.join(__dirname, '..', 'uploads', path.basename(product.image));
      await deleteFile(mainImagePath);
    }

    // Delete color images if they exist
    for (const color of product.colors) {
      if (color.images && color.images.length > 0) {
        for (const image of color.images) {
          const colorImagePath = path.join(__dirname, '..', 'uploads', path.basename(image));
          await deleteFile(colorImagePath);
        }
      }
    }

    await ProductModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});







module.exports = router;
