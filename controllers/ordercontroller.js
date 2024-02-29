"use strict";

const cart = require("../models/cartModel");
const Address = require("../models/addressModel");

const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category =require("../models/categoryModel");

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


    

  module.exports ={
    checkoutpage
  }