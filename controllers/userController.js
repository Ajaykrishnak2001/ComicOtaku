const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require('../models/categoryModel');
const Order=require("../models/orderModel");
const Wallet=require("../models/WalletModel");

const nodemailer = require("nodemailer");
const session = require('express-session');
const bcrypt = require("bcrypt"); 
const randomstring=require("randomstring")
const config=require("../config/config")


const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    requireTLS:true,
    auth:{
        user:config.emailUser,
        pass:config.emailPassword
    }
})



const securePassword = async(password)=>{
    try{

       const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    }catch(error){
        console.log(error.message);
    }

}
  
 const loadregistration = async (req, res) => {
  try {
    const userData = await User.find();
    const referralArray = userData.map(user => user.referralCode);
    res.render("register", { referralArray });
    console.log(referralArray);
    } catch (error) {
    console.log(error.message);
   }
};





 

  
  const loadlogin = async(req,res)=>{
    try{
        res.render('login');

    }catch(error){
        console.log(error.message);
    }
}
  

  
//   //------------------//
  


  



//++++++++ */ otpGenerate */ +++++++++//

const generateOTP = () => {
    const p = randomstring.generate({
        length: 6,
        charset: 'numeric'
    })
    return p;
};

//+++++++++++++++++++++++++++++//







//++++++++ */ insertUser */ +++++++++//

const insertUser = async (req, res) => {
    try {
            const otp = generateOTP();
            console.log(otp);
            // let mno = parseInt(req.body.mno)
            const { name, phone, email, password } = req.body;
            const data = {
                name,
                phone,
                email,
                password,
                otp,
                // otpCreatedAt: Date.now()
            };
            if (req.body.referralID) {
                req.session.referralID = req.body.referralID;
            }
            req.session.Data = data;
            req.session.save();
            console.log(otp, 'this is otp');


            const mailOptions = {
                from: config.emailUser,
                to: email,
                subject: 'Your OTP for Verification',
                text: `your otp ${otp}`
            };
            if (mailOptions) {
                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log("mail send successful");
                    }
                });
            }
            res.redirect('/otp');
    } catch (error) {
        console.log(error);
    }
};


const resendOTP = async (req, res) => {
    try {
        const newOTP = generateOTP(); 
        req.session.Data.otp = newOTP;
        req.session.save();
        console.log(newOTP)

        const mailOptions = {
            from: config.emailUser,
            to: req.session.Data.email,
            subject: 'Your New OTP for Verification', 
            text: `Your new OTP is: ${newOTP}`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.log(err.message);
                res.status(500).json({ message: 'Failed to resend OTP' });
            } else {
                console.log("New OTP sent successfully");
                console.log(newOTP);
                res.redirect("/otp");
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



//++++++++ */ loadOtp */ +++++++++//

const loadOtp = async (req, res) => {
    try {
        res.render('OTPpage', { incorrectOtp: false });
    } catch (error) {
        console.log(error.message);
    }
};






//++++++++ */ getOtp */ +++++++++//

const getOtp = async (req, res) => {
    try {
        const userOtp = req.body.otp;
        const genOtp = await req.session.Data.otp;
        const otpCreatedAt = req.session.Data.otpCreatedAt;
        const otpExpirationTime = 60 * 1000;
        const currentTime = Date.now();
        console.log(genOtp);
        console.log(userOtp);
        if (currentTime - otpCreatedAt > otpExpirationTime) {

            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        else if (genOtp === userOtp) {
            const hashedPassword = await securePassword(req.session.Data.password);
            let couponId;
            function UniqueId() {
                const generateCustomCode = length => Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
                const generateCustomCodes = (length, count) => Array.from({ length: count }, () => generateCustomCode(length));

                const length = 8;
                const count = 1;

                const customCodes = generateCustomCodes(length, count);
                const customCode = customCodes[0];
                couponId = customCode;
                console.log(couponId)

            };
            UniqueId();
            const user = new User({
                name: req.session.Data.name,
                phone: req.session.Data.phone,
                email: req.session.Data.email,
                password: hashedPassword,
                is_admin: 0,
                is_verified: 1,
                is_active: 1,
                referralCode: couponId
            });

            const userData = await user.save();

            if (req.session.referralID) {
                const referror = await User.findOne({ referralCode: req.session.referralID });
                const referrorWallet = await Wallet.findOne({ user: referror._id });
                const newWallet = new Wallet({
                    user: userData._id,
                    walletbalance: 100,
                    transationHistory: [{
                        createdAt: Date.now(),
                        paymentType: "Referral",
                        transationMode: "Credit",
                        transationamount: 100
                    }],
                    totalRefund: 0
                });
                await newWallet.save();

                let balance = referrorWallet ? referrorWallet.walletbalance : 0;
                balance = balance + 100;

                if (referrorWallet) {
                    referrorWallet.walletbalance = balance;
                    referrorWallet.transationHistory.push({
                        createdAt: Date.now(),
                        paymentType: "Referral",
                        transationMode: "Credit",
                        transationamount: 100
                    });
                    await referrorWallet.save();
                } else {
                    const walletNew = new Wallet({
                        user: referror._id,
                        walletbalance: balance,
                        transationHistory: [{
                            createdAt: Date.now(),
                            paymentType: "Referral",
                            transationMode: "Credit",
                            transationamount: 100
                        }],
                        totalRefund: 0
                    });
                    await walletNew.save();
                }
            }


            if (userData) {
                req.session.destroy(); // Clean up session
                return res.render('login', { message: "Registered Successfully" });
            }
        } else {
            res.render('OTPpage', { incorrectOtp: true });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};




const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render('login');
                } else if (userData.is_verified === 1 && userData.is_active === "1") {
                    // Save user session here
                    req.session.user = userData;
                    req.session.userId = userData._id;
                    req.session.email = email;
                    req.session.user = true;
                    req.session.save();
                    console.log(req.session.user);
                    res.render('home');
                } else if (userData.is_verified === 1 && userData.is_active === "0") {
                    res.render('login', { message: "User is blocked" }); // Display alert message
                }
            } else {
                res.render('login', { message: "Email and password is incorrect" });
            }
        } else {
            res.render('login', { message: "Email and password is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
}









const loadHome = async(req,res)=>{
  try{

      res.render('home');
  }catch(error){
      console.log(error.message);
  }
}

const userLogout = async(req,res)=>{
  try{

      req.session.destroy();
      res.redirect('/login');

  }catch(error){
      console.log(error.message);
  }
}


const loadCategory = async (req, res) => {
try {
    const products = await Product.find();
    res.render("products", { products });
    } catch (error) {
        error.message;
    }
};

const loadAllProducts = async (req, res) => {
    try {
        // Fetch all products from the database and populate the category field
        const products = await Product.find().populate('category');

        // Fetch all categories from the database
        const categories = await Category.find();

        // Pass the products data and categories to the view
        res.render('products', { products, categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const loadProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId).populate('category');

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("ViewProducts", { product });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const sortProducts = async (req, res) => {
    try {
        let products;

        if (req.query.sortBy === 'name-asc') {
            products = await Product.find().sort({ pname: 1 });
        } else if (req.query.sortBy === 'name-desc') {
            products = await Product.find().sort({ pname: -1 });
        } else if (req.query.sortBy === 'price-low-to-high') {
            products = await Product.find().sort({ offerPrice: 1, price: 1 });
        } else if (req.query.sortBy === 'price-high-to-low') {
            products = await Product.find().sort({ offerPrice: -1, price: -1 });
        } else if (req.query.sortBy === 'popularity') {
            products = await Product.find().sort({ popularity: -1 });
        } else {
            products = await Product.find();
        }

        // Respond with the sorted products data
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



const calculatePopularity = async (req, res) => {
    try {
      let products = await Product.find();
  
      // Calculate popularity for each product based on views and purchases
      products = products.map(product => ({
        ...product.toObject(),
        popularity: product.views + product.purchases,
      }));
  
      // Sort products by popularity
      products.sort((a, b) => b.popularity - a.popularity);
        console.log(products);
      // Respond with the sorted products data
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  

  const ChangeStatus = async (req, res) => {
    const orderDetails = req.params.orderId;
    const { action, reason } = req.body; // Extract the reason from the request body
    try {
        console.log('Received request to change status for order:', orderDetails);
        console.log('Action:', action);
        console.log('Reason:', reason);

        const order = await Order.findOne({ _id: orderDetails });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if ((action === 'Canceled' || action === 'Returned') && !reason) {
            return res.status(400).json({ error: 'Reason is required for canceling or returning the order' });
        }
        order.status = action;
        order.reasonForCancel = action === 'Canceled' ? reason : ''; // Save reason for canceling the order
        order.reasonForReturn = action === 'Returned' ? reason : ''; // Save reason for returning the order
        await order.save();

        // Check if the payment method is Razorpay and the status is Return or Canceled
        if (order.paymentMethod === 'Razorpay' && (action === 'Canceled' || action === 'Returned')) {
            req.body.order = {
                amount: order.totalAmount,
            };
            await walletMoney(req, res);
        }

        const newStatus = order.status;
        console.log('Order status changed successfully. New status:', newStatus);
        return res.status(200).json({ newStatus });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const loadlandingpage=async(req,res)=>{
    try{
        res.render('landingpage');
    }catch(error){
        console.log(error.message);
    }
}

 

const loadlandingpageproducts = async (req, res) => {
    try {
        // Fetch all products from the database and populate the category field
        const products = await Product.find().populate('category');

        // Fetch all categories from the database
        const categories = await Category.find();

        // Pass the products data and categories to the view
        res.render('landingpage', { products, categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const categegoryfilter= async (req, res) => {
    try {
      let filter = {};
      if (req.query.category) {
        filter.category = req.query.category;
      }
  
      const products = await Product.find(filter);
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  };



  const verifyEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user) {
            req.session.email = email; // Store email in session
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const loadForgotOtpPage = async (req, res) => {
    try {
        res.render('forgotpage'); // Render the forgotpage.ejs
    } catch (error) {
        console.log(error.message);
    }
};

const forgotOtp = async (req, res) => {
    const { email } = req.body;

    // Generate OTP
    const otp = generateOTP();

    try {
        // Send email
        await transporter.sendMail({
            from: config.emailUser,
            to: email,
            subject: 'OTP for Password Reset',
            text: `Your OTP is: ${otp}`
        });
        req.session.otp = otp;

        console.log(`OTP for ${email}: ${otp}`);
        res.redirect('/forgotpage'); // Redirect to the OTP verification page
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

const otpForgotPage = async (req, res) => {
    const { userotp } = req.body;

    // Retrieve the OTP from the session
    const otp = req.session.otp;
    console.log(otp);
    console.log(userotp);
    // Compare the OTP with the one entered by the user
    if (userotp === otp) {
        // If OTP is correct, redirect to the password changing page
        res.json({ success: true }); // Send success response
    } else {
        // If OTP is incorrect, show an error message
        res.status(400).json({ message: 'Invalid OTP' });
    }
};


const  renderForgotPasswordPage= async (req, res) => {
    try {
        res.render('forgotpassword');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        console.log("New Password:", newPassword);
        const email = req.session.email; // Retrieve email from session
        console.log(email);
        if (!email) {
            return res.status(400).json({ status: "Email not found in session" });
        }
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(400).json({ status: "User not found" });
        }
        const hashPassword = await securePassword(newPassword);
        if (!hashPassword) {
            return res.status(500).json({ status: "Error hashing password" });
        }
        userData.password = hashPassword;
        await userData.save();
        req.session.userId = null;
        req.session.user = false;
        return res.json({ status: "password reset success" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "Internal server error" });
    }
};





module.exports = {
    loadlogin,
    insertUser,
    loadHome,
    userLogout,
    verifyLogin,
    loadCategory,
    loadProduct,
    insertUser,
    loadOtp,
    getOtp,
    resendOTP,
    loadregistration,
    loadAllProducts,
    sortProducts,
    calculatePopularity,
    ChangeStatus,
    loadlandingpage,
    loadlandingpageproducts,
    categegoryfilter,
    verifyEmail,
    loadForgotOtpPage,
    forgotOtp,
    otpForgotPage,
    renderForgotPasswordPage,
    changePassword 
    
};
