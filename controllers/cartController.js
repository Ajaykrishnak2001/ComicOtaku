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
    const size = req.query.size;
    console.log("the size:"+size);

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartProduct = {
            product: productId,
            size: size,
            quantity: 1,
            subTotal: product.price
        };

        let userCart = await Cart.findOne({ userId: req.session.userId });
        if (!userCart) {
            userCart = new Cart({ userId: req.session.userId, items: [], total: 0 });
        }

        const existingProductIndex = userCart.items.findIndex(p => p.product.toString() === productId && p.size === size);
        if (existingProductIndex !== -1) {
            userCart.items[existingProductIndex].quantity++;
            userCart.items[existingProductIndex].subTotal += product.price;
        } else {
            userCart.items.push(cartProduct);
        }

        const total = userCart.items.reduce((acc, item) => acc + item.subTotal, 0);
        userCart.total = total;

        await userCart.save();

        console.log(`Selected size: ${size}`);

        res.status(200).json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


    const changeQuantity = async (req, res) => {
        const productId = req.params.productId;
        const action = req.body.action;

        try {
            const cartItem = await Cart.findOne({ 'items.product': productId });
            if (!cartItem) {
                return res.status(404).json({ error: 'Cart item not found' });
            }
        console.log("hihi");
            const productIndex = cartItem.items.findIndex(item => item.product.toString() === productId);
            if (productIndex === -1) {
                return res.status(404).json({ error: 'Product not found in cart' });
            }
            const productInCart = cartItem.items[productIndex];
            const product =await Product.findById(productId);
            console.log("procuct"+product);

            const selectedSize = productInCart.size;

            console.log("selectedSize:"+selectedSize);
            const sizeObj = product.sizes.find(size => size.size === selectedSize);

            if (action === 'increment' && sizeObj.quantity <= productInCart.quantity) {
                return res.status(400).json({ error: 'Maximum quantity reached for the selected size' });
            }

            if (action === 'decrement' && productInCart.quantity <= 1) {
                return res.status(400).json({ error: 'Minimum quantity reached' });
            }

            if (action === 'increment') {
                cartItem.items[productIndex].quantity++;
            } else if (action === 'decrement') {
                cartItem.items[productIndex].quantity--;
            }

            
            const newSubtotal = cartItem.items[productIndex].quantity * product.price;

            
            cartItem.items[productIndex].subTotal = newSubtotal;

        
            const newTotal = cartItem.items.reduce((acc, item) => acc + item.subTotal, 0);

           
            cartItem.total = newTotal;

            
            await cartItem.save();

            
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