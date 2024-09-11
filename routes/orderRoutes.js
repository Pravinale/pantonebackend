const express = require('express');
const router = express.Router();
const Order = require('../models/Orders');


// New order added
router.post('/orders', async (req, res) => {
    const { orderId, userId, username, phoneNumber, email, address, products, price, paymentMethod } = req.body;
    console.log('Order Data Received:', { orderId, userId, username, phoneNumber, email, address, products, price, paymentMethod }); // Log the data

    // Validate paymentMethod
    const validPaymentMethods = ["esewa", "khalti", "Cash in hand"];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
        console.error('Invalid payment method:', paymentMethod);
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Validate products
    if (!Array.isArray(products) || products.some(product => !product.productId || !product.color || !product.size || !product.quantity)) {
        return res.status(400).json({ message: 'Invalid product data' });
    }

    try {
        const newOrder = new Order({
            orderId,
            userId,
            username,
            phoneNumber,
            email,
            address,
            products,
            price,
            paymentMethod,
            status: "pending",
            purchaseDate: new Date(),
            deliveryStatus: "in progress",
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Failed to place order', error: err.message });
    }
});

// To cancel order
router.delete('/orders/:orderid', async (req, res) => {
    const { orderid } = req.params;

    try {
        const order = await Order.findOne({ _id: orderid }); // Assuming orderId is your custom orderId
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        await Order.deleteOne({ _id: orderid });
        res.status(200).json({ message: 'Order deleted and stock restored successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Failed to delete order and restore stock', error: error.message });
    }
});

// Fetch all orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
    }
});

// Fetch orders by delivery status
// router.get('/orders/delivery/:status', async (req, res) => {
//     const { status } = req.params;

//     try {
//         const orders = await Order.find({ deliveryStatus: status });
//         res.status(200).json(orders);
//     } catch (err) {
//         console.error('Error fetching orders by delivery status:', err);
//         res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
//     }
// });

// Fetch in-progress orders with specific filtering
router.get('/orders/delivery/in-progress', async (req, res) => {
    try {
        const orders = await Order.find({
            deliveryStatus: 'in progress',
            $or: [
                { paymentMethod: 'Cash in hand' },
                { paymentMethod: { $ne: 'Cash in hand' }, status: 'completed' }
            ]
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching in-progress orders with specific filtering:', error);
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
});

// Update order by ID
router.put('/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status, deliveryStatus } = req.body;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status) {
            order.status = status;
        }
        if (deliveryStatus) {
            order.deliveryStatus = deliveryStatus;
        }

        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
});


// Fetch delivered orders
router.get('/orders/delivered', async (req, res) => {
    try {
        const deliveredOrders = await Order.find({
            status: 'completed',
            deliveryStatus: 'completed'
        });
        res.json(deliveredOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fetch all orders for a specific user
router.get('/orders/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const orders = await Order.find({ userId }).populate('products.productId');
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
    }
});





module.exports = router;