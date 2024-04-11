const express = require("express");

const bodyParser = require("body-parser");

const multer = require("multer");
const path = require("path");

const adminRoute = express();
const setnocache=require("../middleware/setNoCache")

const session= require("express-session")


adminRoute.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

async function requireLogin(req, res, next) {
   req.session.admin="66068f12364ef68d832a06f2"
   
  if (!req.session.admin) {
    console.log(req.session.admin);
    return res.redirect('/admin/login');
  }
  next();
}

async function isLoggedIn(req, res, next) {
  console.log(req.session);
  if (req.session.admin) {
    console.log(req.session.admin);
    return res.redirect('/admin/dashboard');
  }
  next();
}


const adminController = require("../controllers/adminController");
const couponController = require("../controllers/couponController");
const ordercontroller = require("../controllers/ordercontroller");
const offercontroller = require("../controllers/offercontroller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/productAssets/') // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Generate unique filenames
  }
})
const upload = multer({ storage: storage });




adminRoute.get("/logout",setnocache.admin,adminController.adminlogout);

adminRoute.get("/login",isLoggedIn,setnocache.admin,adminController.loadAdminLog);
adminRoute.post("/login",isLoggedIn,setnocache.admin, setnocache.admin, adminController.adminLogin);

adminRoute.get("/dashboard",adminController.loaddashboard);

adminRoute.get("/products",requireLogin, setnocache.admin, adminController.loadProducts);
adminRoute.get("/users",requireLogin,setnocache.admin, adminController.loadUsers);
adminRoute.get("/users/edit",requireLogin,setnocache.admin, adminController.editUser);
adminRoute.get("/users/add-user",requireLogin, setnocache.admin, adminController.addUser);
adminRoute.post("/users/add-user",requireLogin,setnocache.admin, adminController.add_User);
adminRoute.get("/products/add-product",requireLogin, setnocache.admin, adminController.addProduct);

adminRoute.get("/products/edit-product",requireLogin, setnocache.admin, adminController.editProduct);
adminRoute.post(
  "/products/edit-product",
  requireLogin,
  upload.array("newImages", 4), // Specify the field name for uploading images and the maximum number of files
  adminController.edit_product
);

adminRoute.get("/category",requireLogin, setnocache.admin, adminController.viewCategory);
adminRoute.get("/users/delete",requireLogin, setnocache.admin, adminController.delete_User);
  
adminRoute.post("/users/edit",requireLogin, setnocache.admin, adminController.edit_User);

adminRoute.get("/delete-product/:productId",requireLogin, setnocache.admin, adminController.deleteProduct);

adminRoute.post('/remove-image',adminController.removeImage)



adminRoute.get("/category/edit-category",requireLogin, setnocache.admin, adminController.editcategory);

adminRoute.post("/category/edit-category",upload.array('images', 5),requireLogin, setnocache.admin, adminController.edit_Category);

adminRoute.post("/category/delete",requireLogin, setnocache.admin, adminController.deleteCategory);






adminRoute.get("/orders",requireLogin,setnocache.admin,adminController.loadorders)


adminRoute.get("/detailedOrder",requireLogin, setnocache.admin, adminController.detailedOrder);

adminRoute.put("/changeStatus/:orderId",requireLogin, setnocache.admin, adminController.ChangeStatus);

adminRoute.get("/coupon",requireLogin,setnocache.admin,couponController.loadcoupon)

 adminRoute.get('/createcoupon',requireLogin,setnocache.admin,couponController.loadaddcoupon);
// Assuming you have an Express app instance called 'app'
adminRoute.post('/addcoupon',requireLogin,setnocache.admin,couponController.addcoupon);
// Assuming you have an Express app instance called 'app'
adminRoute.delete('/deletecoupon/:id',requireLogin,setnocache.admin, couponController.deletecoupon);

// In your routes file
adminRoute.get("/coupons/edit/:id", requireLogin, couponController.editCouponPage);
// In your routes file
adminRoute.post("/coupons/edit/:id", requireLogin, couponController.updateCoupon);

// Define a route for loading coupons




adminRoute.get('/salesReport',requireLogin,setnocache.admin,ordercontroller.loadsalesReport);

adminRoute.get('/revenue',requireLogin,setnocache.admin,ordercontroller.calculateRevenue);
adminRoute.get('/admin/salesReport',requireLogin,setnocache.admin,ordercontroller.calculateDeliveredOrders);

adminRoute.get('/filter/sales',requireLogin,setnocache.admin,adminController.filterSalesReport);
adminRoute.get('/filter/revenue',requireLogin,setnocache.admin,adminController.filterTotalRevenue);

adminRoute.get('/offers',requireLogin,setnocache.admin,offercontroller.loadoffers);

adminRoute.post('/updateOfferPrice',requireLogin,setnocache.admin, offercontroller.offerprice);
adminRoute.post('/editOfferPrice',requireLogin,setnocache.admin, offercontroller.editOfferPrice);
adminRoute.post('/applyDiscount/:categoryId',requireLogin,setnocache.admin,offercontroller.categoryoffer);

adminRoute.get("/salesReport",requireLogin,setnocache.admin,adminController.loadsalesreport);


adminRoute.post('/dailychart',adminController.dailyChart);
adminRoute.post('/monthlychart',adminController.monthlyChart);

adminRoute.post(
  "/add-product",
  upload.array("ProductImage", 5),
  adminController.add_Product
);

adminRoute.post("/category",requireLogin,setnocache.admin, adminController.createCategory);

module.exports = adminRoute;