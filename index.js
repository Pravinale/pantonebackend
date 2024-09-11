const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes'); 
const categoryRoutes = require('./routes/categoryRoutes'); 
const orderRoutes = require('./routes/orderRoutes')
const esewaRoutes = require('./routes/esewaRoutes')
const trendingRoutes = require('./routes/trendingRoutes')

const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000 
const BASE_URL = process.env.REACT_APP_BASE_URL;
const MONGO_DB = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGO_DB)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));



// Start Server
// app.listen(5000, () => {
//     console.log(`Server is running on port ${BASE_URL}`);
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${BASE_URL}`);
});


app.use('/uploads', express.static('uploads'));

app.use(cors());
// Middleware
app.use(express.json());
// Use routes
app.use('/api', productRoutes);
// Use user routes
app.use('/api/users', userRoutes); 
// Use the category routes
app.use('/api', categoryRoutes);
//Use for Orders
app.use('/api', orderRoutes);

//Use for initialize esewa
app.use('/api', esewaRoutes);

//use for trending products
app.use('/api', trendingRoutes);