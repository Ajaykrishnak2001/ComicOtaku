const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart =require("../models/cartModel");



const cartpage = async(req,res)=>{
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({email:email});
        const cartItems = await Cart.findOne({ user: userData._id }).populate('products.product');
        res.render('cart',{categories,userData,cartItems});
    }catch(error){
        console.log(err.message);
    }
}
const addTocart = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId);

        const cartProduct = {
            productId: productId,
            quantity: 1, // Set default quantity to 1
            subTotal: product.price // Calculate subtotal based on product price
        };

        // Find the user's cart or create a new one if it doesn't exist
        let userCart = await Cart.findOne({ userId: req.session.userId });
        if (!userCart) {
            userCart = new Cart({ userId: req.session.userId, items: [], total: 0 });
        }

        // Check if the product already exists in the cart
        const existingProductIndex = userCart.items.findIndex(p => p.productId === productId);
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


module.exports={
    cartpage,
    addTocart 

}