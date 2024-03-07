"use strict";

const cart = require("../models/cartModel");
const Address = require("../models/addressModel");

const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category =require("../models/categoryModel");
const orders = require("../models/orderModel");


function generateOrderNumber() {
    let now = Date.now().toString(); // Get current Unix time in milliseconds
    now += now + Math.floor(Math.random() * 10); // Add a random digit as padding
    return [now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join('-'); // Format the order number (4-6-4)
  }



const checkoutpage = async (req, res) => {
    try {
        console.log("abccc");
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({ email: email });
        console.log(email);

        // Check if userData is null
        if (!userData) {
            return res.status(404).send('User not found');
        }

        const userAddress = await Address.find({ user: userData._id });
        console.log(userAddress);

        const cartItems = await cart.findOne({ user: req.session.userData }).populate('items.product');
        res.render('checkout', { categories, userData, userAddress, cartItems });
        console.log("xyz");

    } catch (error) {
        console.log(error.message);
    }
}

const load_orderSuccess = async (req, res) => {
    try {
      res.render("orderSucess");
    } catch (error) {
      console.log(error.message)
    }
  };


//   const placeorder = async (req, res) => {
//     try {
//         // Extract necessary data from request body or session
//         const { userId, orderNumber, payment, items, totalAmount, shippingAddress } = req.body;

//         // Call createOrder function to store the order in the database
//         const order = await orders.create({ userId, orderNumber, payment, items, totalAmount, shippingAddress });

//         // Send a response indicating success
//         res.status(200).json({ message: 'Order placed successfully', order: order });
//     } catch (error) {
//         // Handle any errors
//         console.error('Error placing order:', error.message);
//         res.status(500).json({ message: 'Failed to place order', error: error.message });
//     }
// };


//place order
const placeorder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cartId, addressId, paymentOption } = req.body;

        if (!userId || !cartId || !addressId || !paymentOption) {
            return res.status(400).json({ message: 'Missing required data' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userCart = await cart.findById(cartId).populate('items.$.product');
        console.log(userCart); // Add this line to log the value of userCart

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const orderNumber = generateOrderNumber();
        const orderProducts = userCart.items.map(cartItem => ({
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: cartItem.subTotal,
        }));
        const userAddress = await Address.findById(addressId);
        console.log(addressId);
        if (!userAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const order = {
            userId: userId,
            orderNumber: orderNumber,
            items: orderProducts,
            totalAmount: userCart.total,
            shippingAddress: {
                address: userAddress.address,
                pinCode: userAddress.pinCode,
                state: userAddress.state,
                locality: userAddress.locality,
                landmark: userAddress.landmark,
                mobile: user.phone,
                alternatePhone: userAddress.alternatePhone,
                district: userAddress.district,
            },
            payment: paymentOption,
        };
        console.log(order);
        const createdOrder = await orders.create(order);

        // Update product quantities and delete cart
        // for (const orderedProduct of createdOrder.items) {
        //     const product = await Product.findById(orderedProduct.product);
        //     await product.save();
        // }
        // await cart.findByIdAndDelete(cartId);

        res.status(200).json({ message: 'Order placed successfully', order: createdOrder });
    } catch (error) {
        console.error('Error placing order:', error.message);
        res.status(500).json({ message: 'Failed to place order', error: error.message });
    }
};










  
    

  module.exports ={
    checkoutpage,
    load_orderSuccess,
    placeorder
  }