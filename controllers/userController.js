const User = require("../models/userModel");
const Product = require("../models/productModel");
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
        res.render("OTPpage");
    } catch (error) {
        console.log(error.message);
    }
};






//++++++++ */ getOtp */ +++++++++//

const getOtp=async(req,res)=>{
    try {
        const userOtp = req.body.otp
        const genOtp = await req.session.Data.otp;
        console.log("n",genOtp);
        if(genOtp===userOtp){
            const hashedPassword = await securePassword(req.session.Data.password)
            const user=new User({
                name:req.session.Data.name,
                phone:req.session.Data.phone,
                email:req.session.Data.email,
                password:hashedPassword,
                is_admin:0,
                is_verified:1,
                is_active:1
            })
            const userData=await user.save()
            
            if(userData){
                res.render('login',{message:"Registered Successfully"});
            }
            }else{
            res.render('otp',{message:"OTP is incorrect!"});            
            }      
        
    } catch (error) {
        console.log(error.message)
    }
}



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
      res.redirect('/');

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
        // Fetch all products from the database
        const products = await Product.find();

        // Pass the products data to the view
        res.render('products', { products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const loadProduct = async (req, res) => {
    try {
 const productId = req.params.productId;
 const product =  await Product.findById(productId);

 if(!product) {
    return res.status(484).send("Product not found");
}

res.render("ViewProducts", { product });
} catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
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
    
    
};
