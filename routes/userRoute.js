const express = require("express");
const bodyParser = require("body-parser");
const userRoute = express();
const session= require("express-session")

const setnocache=require("../middleware/setNoCache")
const auth = require("../middleware/userAuth");

// Body parser middleware
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

// View engine setup (assuming you are using EJS)
userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/User");

async function requireLogin(req, res, next) {
   
      if (!req.session.user) {
        return res.redirect('/login');
      }
      next();
  }
  
  async function isLoggedIn(req, res, next) {
      if (req.session.user) {
        return res.redirect('/');
      }
      next();
  }

// Import the userController
const userController = require("../controllers/userController");
const userprofileController = require("../controllers/userprofileController");
const cartController = require("../controllers/cartController");
const ordercontroller=require("../controllers/ordercontroller")
const walletcontroller=require("../controllers/WalletController");
const couponController=require("../controllers/couponController");
const wishlistcontroller=require("../controllers/wishlistController");

userRoute.get('/',requireLogin,setnocache.user,userController.loadHome)

// Login routes

userRoute.get("/register",isLoggedIn,setnocache.user,userController.loadregistration);
userRoute.get('/otp',isLoggedIn,setnocache.user,userController.loadOtp);
userRoute.post('/resend-otp',isLoggedIn,setnocache.user,userController.resendOTP);
userRoute.post('/otp',isLoggedIn,setnocache.user,userController.insertUser);
userRoute.post('/verify-otp',isLoggedIn,setnocache.user,userController.getOtp);
userRoute.post('/home',isLoggedIn,setnocache.user,userController.verifyLogin);


userRoute.get('/profile',requireLogin,setnocache.user,userprofileController.loadprofile)


 userRoute.get('/logout',setnocache.user,userController.userLogout);



 userRoute.get("/addAddress",requireLogin,setnocache.user,userprofileController.load_addAddress);
 userRoute.post("/addAddress",requireLogin,setnocache.user,userprofileController.addAddress)
 userRoute.get("/addressEdit",requireLogin,setnocache.user,userprofileController.load_editAddress)
 userRoute.post("/addressEdit",requireLogin,setnocache.user,userprofileController.editAddress)
 userRoute.delete("/addresses/delete/:id",requireLogin,setnocache.user,userprofileController.deleteAddress);

userRoute.get("/editProfile",requireLogin,setnocache.user,userprofileController.load_editProfile)
userRoute.post("/editProfile",requireLogin,setnocache.user,userprofileController.editProfile)

userRoute.post("/resetPassword",requireLogin,setnocache.user,userprofileController.changePassword)



// userRoute.post('/createOrder',ordercontroller.createOrder);


userRoute.get("/cart",requireLogin,setnocache.user,cartController.cartpage)
userRoute.get("/add-cart/:productId",requireLogin,setnocache.user,cartController.addTocart)
userRoute.patch('/update-quantity/:productId',requireLogin,setnocache.user,cartController.changeQuantity);
userRoute.delete('/cart/:productId',cartController.removeFromCart);


userRoute.get('/checkOut',requireLogin,setnocache.user,ordercontroller.checkoutpage)

userRoute.get('/orderSucess',requireLogin,setnocache.user,ordercontroller.load_orderSuccess)

 userRoute.post('/placeOrder', requireLogin, setnocache.user, ordercontroller.placeOrder);
// Define the route for creating an order
userRoute.post('/createOrder', ordercontroller.createOrder);





//  Product routes
userRoute.get("/products",requireLogin,requireLogin,setnocache.user, userController.loadAllProducts);

userRoute.get("/viewOrder",requireLogin,setnocache.user, userprofileController.viewOrder);

userRoute.get("/products/:productId",requireLogin,setnocache.user, userController.loadProduct);
userRoute.get("/api/products",requireLogin,setnocache.user,userController.sortProducts)
userRoute.get('/api/products/popularity',requireLogin,setnocache.user,userController.calculatePopularity)

userRoute.put("/changeStatus/:orderId",requireLogin,setnocache.user, userController.ChangeStatus);

userRoute.get('/login',isLoggedIn,setnocache.user,userController.loadlogin);

userRoute.post('/generateRazorpayOrder',walletcontroller.addWallet);
userRoute.post('/verifyRazorpayPayment',walletcontroller.verfiypayment);

// userRoute.post("/walletMoney",walletcontroller.addWallet);

// userRoute.post('/verifywalletPayment',walletcontroller.walletMoney);

userRoute.post('/refund',walletcontroller.refund);

userRoute.post('/updateCartTotalPrice',cartController.updateCartTotalPrice)

userRoute.get('/getCartMaximumDiscount',cartController.discountamount)



userRoute.get('/wishlist',wishlistcontroller.loadwishlist);
userRoute.post('/wishlist/add',wishlistcontroller.addwishlist);
userRoute.delete('/wishlist/remove/:productId',wishlistcontroller.removewishlist);



userRoute.get('/landingpage',setnocache.user, userController.loadlandingpageproducts) ;


userRoute.get('/products',userController.categegoryfilter);

module.exports = userRoute;
