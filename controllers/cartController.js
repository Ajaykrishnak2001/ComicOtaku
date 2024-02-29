const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart =require("../models/cartModel");
const Category =require("../models/categoryModel");


const cartpage = async(req,res)=>{
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({email:email});
        const cartItems = await Cart.findOne({ user: req.session.userData}).populate('items.product');



        res.render('cart',{categories,userData,cartItems});
    }catch(error){
        console.log(error.message);
    }
}

const addTocart = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartProduct = {
            product: productId,
            quantity: 1, // Set default quantity to 1
            subTotal: product.price // Calculate subtotal based on product price
        };

        // Find the user's cart or create a new one if it doesn't exist
        let userCart = await Cart.findOne({ userId: req.session.userId });
        if (!userCart) {
            userCart = new Cart({ userId: req.session.userId, items: [], total: 0 });
        }

        // Check if the product already exists in the cart
        const existingProductIndex = userCart.items.findIndex(p => p.product.toString() === productId);
        if (existingProductIndex !== -1) {
            // If the product exists, update its quantity and subtotal
            userCart.items[existingProductIndex].quantity++;
            userCart.items[existingProductIndex].subTotal += product.price;
        } else {
            // If the product is not in the cart, add it
            userCart.items.push(cartProduct);
        }

        // Calculate the total based on the subtotal of all products in the cart
        const total = userCart.items.reduce((acc, item) => acc + item.subTotal, 0);
        userCart.total = total;

        // Save the updated cart
        await userCart.save();

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const changeQuantity = async (req, res) => {
    const productId = req.params.productId;
    const action = req.body.action; // 'increment' or 'decrement'

    try {
        // Find the cart item by product ID
        const cartItem = await Cart.findOne({ 'items.product': productId });
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Find the index of the product in the items array
        const productIndex = cartItem.items.findIndex(item => item.product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }

        // Update the quantity based on the action
        if (action === 'increment') {
            cartItem.items[productIndex].quantity++;
        } else if (action === 'decrement') {
            if (cartItem.items[productIndex].quantity > 1) {
                cartItem.items[productIndex].quantity--;
            }
        }

        // Calculate the new subtotal for the product
        const product = await Product.findById(productId);
        const newSubtotal = cartItem.items[productIndex].quantity * product.price;

        // Update the subtotal for the product
        cartItem.items[productIndex].subTotal = newSubtotal;

        // Calculate the total for all products in the cart
        const newTotal = cartItem.items.reduce((acc, item) => acc + item.subTotal, 0);

        // Update the total in the cart
        cartItem.total = newTotal;

        // Save the updated cart item
        await cartItem.save();
        console.log(cartItem);

        // Send the updated cart item and total in the response
        res.status(200).json({ items: cartItem.items, total: cartItem.total });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};








module.exports={
    cartpage,
    addTocart,
    changeQuantity

}