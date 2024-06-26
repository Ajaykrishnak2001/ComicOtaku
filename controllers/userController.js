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
                req.session.destroy(); 
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
                    
                    req.session.user = userData;
                    req.session.userId = userData._id;
                    req.session.email = email;
                    req.session.user = true;
                    req.session.save();
                    
                    res.redirect('/');
                } else if (userData.is_verified === 1 && userData.is_active === "0") {
                    res.render('login', { message: "User is blocked" }); 
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



const PAGE_SIZE = 9;

const loadAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;

        // Fetch products with pagination
        const products = await Product.find().populate('category').skip(skip).limit(PAGE_SIZE);

        // Fetch all categories
        const categories = await Category.find();

        // Calculate total number of pages
        const totalCount = await Product.countDocuments();
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        // Render the products page with the paginated products and categories
        res.render('products', { products, categories, currentPage: page, totalPages });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const loadHome = async (req, res) => {
    try {
       
        const products = await Product.find().sort({ createdAt: -1 }).limit(8).populate('category');
       
        if (!products) {
            throw new Error('Failed to fetch products');
        }
        res.render('home', { products });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const userLogout = async(req,res)=>{
  try{

      req.session.user="";
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
        const sortBy = req.query.sortBy || 'default';
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;

        let products;

        if (sortBy === 'name-asc') {
            products = await Product.find().sort({ pname: 1 }).skip(skip).limit(PAGE_SIZE);
        } else if (sortBy === 'name-desc') {
            products = await Product.find().sort({ pname: -1 }).skip(skip).limit(PAGE_SIZE);
        } else if (sortBy === 'price-low-to-high') {
            products = await Product.find().sort({ offerPrice: 1, price: 1 }).skip(skip).limit(PAGE_SIZE);
        } else if (sortBy === 'price-high-to-low') {
            products = await Product.find().sort({ offerPrice: -1, price: -1 }).skip(skip).limit(PAGE_SIZE);
        } else if (sortBy === 'popularity') {
            products = await Product.find().sort({ popularity: -1 }).skip(skip).limit(PAGE_SIZE);
        } else {
            products = await Product.find().skip(skip).limit(PAGE_SIZE);
        }

        // Calculate total number of pages
        const totalCount = await Product.countDocuments();
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        // Render the products page with the paginated products
        res.render('products', { products, currentPage: page, totalPages });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



const calculatePopularity = async (req, res) => {
    try {
      let products = await Product.find();
  
      
      products = products.map(product => ({
        ...product.toObject(),
        popularity: product.views + product.purchases,
      }));
  
      
      products.sort((a, b) => b.popularity - a.popularity);
        console.log(products);
      
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  

  const ChangeStatus = async (req, res) => {
    const orderDetails = req.params.orderId;
    const { action, reason } = req.body; 
    try {
        console.log('Received request to change status for order:', orderDetails);
        console.log('Action:', action);
        console.log('Reason:', reason);

        const order = await Order.findOne({ _id: orderDetails }).populate('items.product');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if ((action === 'Canceled' || action === 'Returned') && !reason) {
            return res.status(400).json({ error: 'Reason is required for canceling or returning the order' });
        }
        order.status = action;
        order.reasonForCancel = action === 'Canceled' ? reason : ''; 
        order.reasonForReturn = action === 'Returned' ? reason : ''; 

        // Update product quantities if the order is canceled or returned
        if (action === 'Canceled' || action === 'Returned') {
            for (const item of order.items) {
                const product = await Product.findById(item.product._id);
                if (product) {
                    const sizeToUpdate = product.sizes.find((size) => size.size === item.size);
                    if (sizeToUpdate) {
                        sizeToUpdate.quantity += item.quantity;
                        await product.save();
                    }
                }
            }
        }

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
        
        const products = await Product.find().populate('category');

        
        const categories = await Category.find();

       
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
            req.session.email = email; 
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
        res.render('forgotpage'); 
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

   
    const otp = req.session.otp;
    console.log(otp);
    console.log(userotp);
    
    if (userotp === otp) {
        
        res.json({ success: true }); 
    } else {
        
        res.status(400).json({ message: 'Invalid OTP' });
    }
};


const forresendOTP=async (req, res) => {
    try {
        // Get the user's email from the session
        const email = req.session.email;
        if (!email) {
            return res.status(400).json({ message: 'Email not found in session' });
        }

        // Generate a new OTP
        const otp = generateOTP();

        // Send the new OTP to the user's email
        await transporter.sendMail({
            from: config.emailUser,
            to: email,
            subject: 'New OTP for Password Reset',
            text: `Your new OTP is: ${otp}`
        });

        // Update the session with the new OTP
        req.session.otp = otp;

        console.log(`New OTP for ${email}: ${otp}`);
        res.sendStatus(200); // Send success response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to resend OTP' });
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
        const email = req.session.email; 
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


const googleSignUp = async (req, res) => {
    try {
        const email = req.user._json.email;
        console.log(req.user._json.email);
        let userData = await User.findOne({ email: email });
        
        console.log(userData, "usedata");
        if (!userData) {
            let couponId;
            function UniqueId() {
                const generateCustomCode = length => Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
                const generateCustomCodes = (length, count) => Array.from({ length: count }, () => generateCustomCode(length));

                const length = 8;
                const count = 1;

                const customCodes = generateCustomCodes(length, count);
                const customCode = customCodes[0];
                couponId = customCode;

            };
            UniqueId();
            const user = new User({
                name: req.user.name,
                phone: "1234566543",
                email: req.user.email,
                is_admin: 0,
                is_verified: 1,
                referralCode: couponId
            });
            userData = await user.save();
        }

        req.session.user = userData;
        req.session.userId = userData._id;
        req.session.email = email;
        req.session.user = true;
        req.session.save();
        console.log(req.session.user);

        res.redirect('/');
    } catch (error) {
        console.log(error.message);
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
    changePassword ,
    googleSignUp,
    forresendOTP
    
};
