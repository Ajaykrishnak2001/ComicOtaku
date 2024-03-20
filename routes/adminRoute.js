const express = require("express");

const bodyParser = require("body-parser");

const multer = require("multer");
const path = require("path");

const adminRoute = express();

adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

const adminController = require("../controllers/adminController");
const couponController = require("../controllers/couponController");







adminRoute.get("/login", adminController.loadAdminLog);
adminRoute.post("/login", adminController.adminLogin);
adminRoute.get("/dashboard", adminController.loadDashboard);
adminRoute.get("/products", adminController.loadProducts);
adminRoute.get("/users", adminController.loadUsers);
adminRoute.get("/users/edit", adminController.editUser);
adminRoute.get("/users/add-user", adminController.addUser);
adminRoute.post("/users/add-user", adminController.add_User);
adminRoute.get("/products/add-product", adminController.addProduct);

adminRoute.get("/products/edit-product", adminController.editProduct);
adminRoute.post("/products/edit-product",adminController.edit_product);

adminRoute.get("/category", adminController.viewCategory);
adminRoute.get("/users/delete", adminController.delete_User);
  
adminRoute.post("/users/edit", adminController.edit_User);

adminRoute.get("/delete-product/:productId", adminController.deleteProduct);



adminRoute.get("/category/edit-category", adminController.editcategory);

adminRoute.post("/category/edit-category", adminController.edit_Category);

adminRoute.post("/category/delete", adminController.deleteCategory);






adminRoute.get("/orders",adminController.loadorders)


adminRoute.get("/detailedOrder", adminController.detailedOrder);

adminRoute.put("/changeStatus/:orderId", adminController.ChangeStatus);

adminRoute.get("/coupon",couponController.loadcoupon)


// Assuming you have an Express app instance called 'app'
adminRoute.post('/addCoupon',couponController.addcoupon);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/productAssets/"); 
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ); // Specify the filename
  },
});

const upload = multer({ storage: storage });




adminRoute.post(
  "/add-product",
  upload.array("ProductImage", 5),
  adminController.add_Product
);

adminRoute.post("/category", adminController.createCategory);

module.exports = adminRoute;