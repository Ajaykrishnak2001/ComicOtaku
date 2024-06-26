const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart =require("../models/cartModel");
const Category =require("../models/categoryModel");
const Coupon = require("../models/couponModel");

const cartpage = async (req, res) => {
    try {
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({ email: email });
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            throw new Error('Cart not found');
        }
        const cartItems = await Cart.findOne({ userId: req.session.userId }).populate('items.product');
        let coupons = await Coupon.find();

        
        const totalPrice = calculateTotalPrice(cartItems.items);
        coupons = coupons.filter(coupon => totalPrice >= coupon.minimumAmount && totalPrice <= coupon.maximumAmount);

        res.render('cart', { categories, userData, cartItems, coupons, item: cartItems.items, totalPrice, cart });
    } catch (error) {
        console.log(error.message);
    }
}


function calculateTotalPrice(items) {
    return items.reduce((total, item) => {
        const price = item.product.offerPrice || item.product.price;
        return total + (price * item.quantity);
    }, 0);
}


const addTocart = async (req, res) => {
    const productId = req.params.productId;
    const size = req.query.size;
    console.log("the size:" + size);

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartProduct = {
            product: productId,
            size: size,
            quantity: 1,
            subTotal: product.offerPrice ? product.offerPrice : product.price
        };

        let userCart = await Cart.findOne({ userId: req.session.userId });
        console.log("iubuibiubiuhbhb"+userCart);
        if (!userCart) {
            userCart = new Cart({ userId: req.session.userId, items: [], total: 0 });
        }

        const existingProductIndex = userCart.items.findIndex(p => p.product.toString() === productId && p.size === size);
        if (existingProductIndex !== -1) {
            userCart.items[existingProductIndex].quantity++;
            userCart.items[existingProductIndex].subTotal += product.offerPrice ? product.offerPrice : product.price;
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

        const productIndex = cartItem.items.findIndex(item => item.product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }
        const productInCart = cartItem.items[productIndex];
        const product = await Product.findById(productId);

        const selectedSize = productInCart.size;
        const sizeObj = product.sizes.find(size => size.size === selectedSize);

        if (action === 'increment' && sizeObj.quantity <= productInCart.quantity) {
            return res.status(400).json({ error: 'Maximum quantity reached for the selected size' });
        }

        if (action === 'decrement' && productInCart.quantity <= 1) {
            return res.status(400).json({ error: 'Minimum quantity reached' });
        }

        if (action === 'increment') {
            if (productInCart.quantity + 1 <= sizeObj.quantity) {
                cartItem.items[productIndex].quantity++;
            }
        } else if (action === 'decrement') {
            cartItem.items[productIndex].quantity--;
        }

        const newSubtotal = cartItem.items[productIndex].quantity * (product.offerPrice || product.price);
        cartItem.items[productIndex].subTotal = newSubtotal;

        const newTotal = cartItem.items.reduce((acc, item) => acc + item.subTotal, 0);
        cartItem.total = newTotal;
        console.log(newTotal );
        await cartItem.save();

        res.status(200).json({ items: cartItem.items, total: cartItem.total });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const removeFromCart = async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.userId;

    try {
        let userCart = await Cart.findOne({ userId });

        if (!userCart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = userCart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex !== -1) {
            userCart.items.splice(itemIndex, 1);
            userCart.total = userCart.items.reduce((acc, item) => acc + item.subTotal, 0);
            await userCart.save();
            return res.status(200).json({ success: true, message: 'Item removed from cart' });
        }

        return res.status(404).json({ error: 'Item not found in cart' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const updateCartTotalPrice = async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming you have the user's ID in the session
        const { totalPrice, maximumDiscount } = req.body;

        // Find the user's cart and update the total price and maximum discount
        const cart = await Cart.findOneAndUpdate({ userId }, { total: totalPrice, maximumDiscount }, { new: true });

        res.json({ message: 'Cart total price and maximum discount updated successfully', cart });
    } catch (error) {
        console.error('Error updating cart total price and maximum discount:', error);
        res.status(500).json({ message: 'Failed to update cart total price and maximum discount' });
    }
};


const discountamount=async (req, res) => {
    try {
        const userId = req.session.userId; 
        const cart = await Cart.findOne({ userId });
        res.json({ cart });
    } catch (error) {
        console.error('Error getting cart maximum discount:', error);
        res.status(500).json({ message: 'Failed to get cart maximum discount' });
    }
};


// const maximumdiscount= async (req, res) => {
//     try {
//         const orderId = req.body.orderId;
//         const couponId = req.body.couponId;
//         const maximumDiscount = req.body.maximumDiscount;

//         // Find the order by orderId
//         const order = await Order.findById(orderId);

//         // Update the couponapplied field
//         order.couponapplied = maximumDiscount;

//         // Save the updated order
//         await order.save();

//         res.status(200).json({ message: 'Coupon applied successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };


module.exports={
    cartpage,
    addTocart,
    changeQuantity,
    removeFromCart,
    updateCartTotalPrice,
    discountamount,
  

}