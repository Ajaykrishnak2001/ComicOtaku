const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");


const loadoffers = async (req, res) => {
    try {
      const products = await Product.find(); // Fetch all products
      res.render('offers', { products }); // Pass the products array to the 'offers' view
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }



  const offerprice = async (req, res) => {
    try {
      const { productId, offerPrice } = req.body;
      console.log('Product ID:', productId);
      console.log('Offer Price:', offerPrice);
  
      const product = await Product.findByIdAndUpdate(productId, { offerPrice: offerPrice }, { new: true });
      console.log('Updated Product:', product);
  
      res.status(200).json({ success: true, message: 'Offer price updated successfully', product: product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  
  const editOfferPrice = async (req, res) => {
    try {
        const { productId, newOfferPrice } = req.body;
        const product = await Product.findByIdAndUpdate(productId, { offerPrice: newOfferPrice }, { new: true });
        res.status(200).json({ success: true, message: 'Offer price updated successfully', product: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
  

  module.exports = {
    loadoffers,
    offerprice,
    editOfferPrice
}