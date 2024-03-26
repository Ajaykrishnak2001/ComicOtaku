const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");

const loadoffers = async (req, res) => {
  try {
      const products = await Product.find(); // Fetch all products
      const categories = await Category.find(); // Fetch all categories
      res.render('offers', { products, categories }); // Pass the products and categories arrays to the 'offers' view
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
  

const categoryoffer=async (req, res) => {
  const categoryId = req.params.categoryId;
  const discountPercentage = req.body.discountPercentage;
  try {
      const products = await Product.find({ category: categoryId });
      console.log(products);
      products.forEach(async (product) => {
          const newPrice = product.price - (product.price * (discountPercentage / 100));
          product.offerPrice = newPrice;
          await product.save();
      });
      res.sendStatus(200);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
};


  module.exports = {
    loadoffers,
    offerprice,
    editOfferPrice,
    categoryoffer
}