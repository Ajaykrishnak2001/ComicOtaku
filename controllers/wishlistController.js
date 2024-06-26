
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart =require("../models/cartModel");
const Category =require("../models/categoryModel");
const Coupon = require("../models/couponModel");
const Wishlist=require("../models/wishlistModel");


const loadwishlist = async (req, res) => {
    try {
        const userId = req.session.userId; 
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        res.render('wishlist', { wishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const addwishlist = async (req, res) => {
    const productId = req.body.productId;
    const userId = req.session.userId;

    try {
        
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
           
            wishlist = new Wishlist({ user: userId, products: [] });
        }

       
        if (!wishlist.products.some(product => product.product.toString() === productId)) {
            
            wishlist.products.push({ product: productId });
            await wishlist.save();

            res.status(200).json({ message: 'Product added to wishlist successfully' });
        } else {
            res.status(400).json({ error: 'Product already exists in the wishlist' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const removewishlist = async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.userId; 

    try {
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        wishlist.products.pull({ product: productId });
        await wishlist.save();

        res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.error(error);
        
    }
};




module.exports={
    addwishlist,
    loadwishlist,
    removewishlist
}