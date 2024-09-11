const express = require('express');
const router = express.Router();
const Orders = require('../models/Orders');
const { getEsewaPaymentHash, verifyEsewaPayment } = require("../esewa");
const ProductModel = require('../models/Product')


router.post("/initialize-esewa", async (req, res) => {
    try {
      const { orderId, totalPrice } = req.body;
      console.log('Order Data:', { orderId, totalPrice });
      // Validate item exists and the price matches
      const itemData = await Orders.findOne({
        _id: orderId,
        price: totalPrice,
      });
      console.log(itemData)
  
      if (!itemData) {
        return res.status(400).send({
          success: false,
          message: "Item not found or price mismatch.",
        });
      }

      // Initiate payment with eSewa
      const paymentInitiate = await getEsewaPaymentHash({
        amount: totalPrice,
        transaction_uuid: itemData._id,
      });
  
      // Respond with payment details
      res.json({
        success: true,
        payment: paymentInitiate,
        purchasedItemData: {
            _id: itemData._id,
            paymentMethod: "esewa",
            price: itemData.price,
            status: itemData.status, // Include the status here
            purchaseDate: itemData.purchaseDate // 
        },
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }    
  });

router.get("/complete-payment", async (req, res) => {
  const { data } = req.query;

  try {
    // Verify the payment information from eSewa
    const paymentInfo = await verifyEsewaPayment(data);

    // Retrieve the order using the transaction ID
    const purchasedItemData = await Orders.findById(paymentInfo.response.transaction_uuid);

    if (!purchasedItemData) {
      return res.status(500).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Update payment status to "completed"
    await Orders.findByIdAndUpdate(paymentInfo.response.transaction_uuid, {
      $set: { status: "completed" },
    });

    // Update the stock of ordered products
    const orderProducts = purchasedItemData.products;

    for (const product of orderProducts) {
      const { productId, quantity, size, color } = product; // Include color

      // Find the product and update the stock of the corresponding size within the color
      await ProductModel.updateOne(
        { 
          _id: productId,
          'colors.color': color, // Match the color
          'colors.sizes.size': size // Match the size in the colors array
        },
        {
          $inc: {
            'colors.$[color].sizes.$[size].stock': -quantity // Update the specific size's stock
          }
        },
        {
          arrayFilters: [
            { 'color.color': color }, // Filter for the specific color
            { 'size.size': size } // Filter for the specific size
          ]
        }
      );
    }

    // Redirect to the thank-you page
    res.redirect(`${process.env.FRONTEND_URL}/thankyou`);
    
  } catch (error) {
    console.error("Error completing eSewa payment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
      error: error.message,
    });
  }
});








  module.exports = router;