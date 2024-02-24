const express = require("express");
const bodyParser = require("body-parser");
const userRoute = express();
const session= require("express-session")
const auth = require("../middleware/auth");

// Body parser middleware
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

// View engine setup (assuming you are using EJS)
userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/User");

// Import the userController
const userController = require("../controllers/userController");
const userprofileController = require("../controllers/userprofileController");


userRoute.get('/home',userController.loadHome)

// Login routes
userRoute.get('/',userController.loadlogin);
userRoute.get("/register", userController.loadregistration);
userRoute.get('/otp',userController.loadOtp);
userRoute.post('/resend-otp', userController.resendOTP);
userRoute.post('/otp',userController.insertUser);
userRoute.post('/verify-otp',userController.getOtp);
userRoute.post('/home',userController.verifyLogin);


userRoute.get('/profile',userprofileController.loadprofile)


 userRoute.get('/login',userController.userLogout);



 userRoute.get("/addAddress",userprofileController.load_addAddress);
 userRoute.post("/addAddress",userprofileController.addAddress)









//  Product routes
userRoute.get("/products", userController.loadAllProducts);

userRoute.get("/products/:productId", userController.loadProduct);

module.exports = userRoute;
