const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require('../models/categoryModel');
const Order=require("../models/orderModel");

const nodemailer = require("nodemailer");

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
    res.render("register");
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
                otp
            };
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

        if (genOtp === userOtp) {
            const hashedPassword = await securePassword(req.session.Data.password);
            const user = new User({
                name: req.session.Data.name,
                phone: req.session.Data.phone,
                email: req.session.Data.email,
                password: hashedPassword,
                is_admin: 0,
                is_verified: 1,
                is_active: 1
            });

            const userData = await user.save();

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
            products = await Product.find().sort({ price: 1 });
        } else if (req.query.sortBy === 'price-high-to-low') {
            products = await Product.find().sort({ price: -1 });
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
    ChangeStatus
    
    
};
