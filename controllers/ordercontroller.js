"use strict";

const cart = require("../models/cartModel");
const Address = require("../models/addressModel");

const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category =require("../models/categoryModel");
const Order = require("../models/orderModel");


const Razorpay = require('razorpay');
const config = require("../config/config");


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


const razorpayInstance = new Razorpay({
    key_id: config.RAZORPAY_ID_KEY,
    key_secret: config.RAZORPAY_SECRET_KEY
});

//place order
const createOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cartId, addressId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch user's address details
        const userAddress = await Address.findById(addressId);
        if (!userAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Fetch user's cart items
        const userCart = await cart.findById(cartId).populate('items.product');
        if (!userCart) {
            console.error('Cart not found for cartId:', cartId);
            return res.status(404).json({ message: 'Cart not found' });
        }

        const amount = req.body.amount * 100; // Convert amount to smallest currency unit
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: req.body.receipt // Use a unique identifier for the receipt
        };

        razorpayInstance.orders.create(options, async (err, order) => {
            if (!err) {
                // Save the order details to your database
                const newOrder = new Order({
                    userId: req.session.userId,
                    orderNumber: generateOrderNumber(),
                    items: userCart.items.map(cartItem => ({
                        product: cartItem.product,
                        quantity: cartItem.quantity,
                        price: cartItem.subTotal,
                    })),
                    totalAmount: req.body.amount,
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
                    payment: 'Razorpay' // Assuming you're always using Razorpay for this example
                });

                await newOrder.save();

                // Empty the user's cart
                userCart.items = [];
                userCart.total = 0;
                await userCart.save();

                res.status(200).send({
                    success: true,
                    msg: 'Order Created',
                    order_id: order.id,
                    amount: options.amount,
                    key_id: config.RAZORPAY_ID_KEY,
                    product_name: req.body.name,
                    description: req.body.description,
                    contact: "8567345612",
                    name: "Sandeep Sharma",
                    email: "sandep@gmail.com"
                });
            } else {
                console.error(err);
                res.status(400).send({ success: false, msg: 'Something went wrong!' });
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
};








const placeOrder = async (req, res) => {
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

        const userCart = await cart.findById(cartId).populate('items.product');
        if (!userCart) {
            console.error('Cart not found for cartId:', cartId);
            return res.status(404).json({ message: 'Cart not found' });
        }
        

        const orderNumber = generateOrderNumber();
        const orderProducts = userCart.items.map(cartItem => ({
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: cartItem.subTotal,
        }));
        const userAddress = await Address.findById(addressId);
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

        const createdOrder = await Order.create(order); // Use Order.create instead of order.create


        // Update product quantities and delete cart
        for (const orderedProduct of createdOrder.items) {
            const product = await Product.findById(orderedProduct.product);
            product.quantity -= orderedProduct.quantity;
            await product.save();
        }
        await cart.findByIdAndDelete(cartId);

        res.status(200).json({ message: 'Order placed successfully', order: createdOrder });
    } catch (error) {
        console.error('Error placing order:', error.message);
        res.status(500).json({ message: 'Failed to place order', error: error.message });
    }
};














// const createOrder = async (req, res) => {
//     try {
//         const amount = req.body.amount * 100; // Convert amount to smallest currency unit
//         const options = {
//             amount: amount,
//             currency: 'INR',
//             receipt: req.body.receipt // Use a unique identifier for the receipt
//         };

//         razorpayInstance.orders.create(options, (err, order) => {
//             if (!err) {
//                 res.status(200).send({
//                     success: true,
//                     msg: 'Order Created',
//                     order_id: order.id,
//                     amount: options.amount,
//                     key_id: config.RAZORPAY_ID_KEY,
//                     product_name: req.body.name,
//                     description: req.body.description,
//                     contact: "8567345612",
//                     name: "Sandeep Sharma",
//                     email: "sandep@gmail.com"
//                 });
//             } else {
//                 console.error(err);
//                 res.status(400).send({ success: false, msg: 'Something went wrong!' });
//             }
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send({ success: false, msg: 'Internal Server Error' });
//     }
// };




//////////////////////////admin///////////////////////

const loadDashboard = async (req, res) => {
    try {
        console.log("hiiiiiiiiii");
        const AllOrders=await Order.find().sort({ orderDate: -1 }).exec();
        const totalRevenue = await calculateRevenue();
        const totalOrders = AllOrders.length;
        res.render('dashboard', { AllOrders,totalRevenue,totalOrders});
        // Pass orders as an object
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};



const calculateRevenue = async () => {
    try {
        const revenue = await Order.aggregate([
            { $match: { status: "Delivered" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        // If there are no orders with status "Delivered", set revenue to 0
        const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

        return totalRevenue;
    } catch (err) {
        console.error(err);
        return 0;
    }
};




  
    

  module.exports ={
    checkoutpage,
    load_orderSuccess,
    placeOrder,
    createOrder,
    loadDashboard,
    calculateRevenue

  }