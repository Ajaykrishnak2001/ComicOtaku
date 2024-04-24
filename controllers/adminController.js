const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");

const multer = require("multer");
const upload = multer({ dest: "productAssets/" });



const bcrypt = require("bcrypt");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    
    console.error("Error hashing password:", error);
    
    throw error;
  }
};


const adminlogout=async(req,res)=>{
  try{

      req.session.admin="";
      res.redirect('/admin/login');

  }catch(error){
      console.log(error.message);
  }
}


const loadAdminLog = async (req, res) => {
  try {
  
    const errorMessage = req.query.error || req.session.errorMessage;
    req.session.errorMessage = null;

    res.render("login", { errorMessage });
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin user by email
    const adminData = await User.findOne({ email: email });

    if (adminData && adminData.is_admin === 1) {
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch) {
        // Initialize session data
        req.session.admin = adminData;
        req.session.adminId = adminData._id; 
        req.session.email = email;
        req.session.admin = true;
        req.session.save();

       
        res.redirect("/admin/products");
      } else {
        
        res.render("login", { errorMessage: "Invalid password" });
      }
    } else {
      
      res.render("login", { errorMessage: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error.message);
    
  }
};



const PAGE_SIZE = 9;

const loadProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const allProducts = await Product.find().skip(skip).limit(PAGE_SIZE);
    const totalCount = await Product.countDocuments();
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    res.render("products", { allProducts, currentPage: page, totalPages });
  } catch (error) {
    error.message;
  }
};


const loadUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render("users", { users });
  } catch (error) {
    console.log(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    res.render("addUser", {
      errorMessage: null,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    const categories = await getCategories();
    res.render("addProduct", { categories });
  } catch (error) {
    console.log(error.message);
  }
};

const viewCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("category", { categories });
  } catch (error) {
    console.log(error.message);
  }
};

const add_User = async (req, res) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.mobile }],
    });

    if (existingUser) {
      return res.render("addUser", {
        errorMessage: "Email or mobile number already exists.",
      });
    }

    const spassword = await securePassword(req.body.password);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.mobile,
      password: spassword,
      is_admin: 0,
      is_verified: req.body.verified,
      address: req.body.address,
      is_active: req.body.status,
    });
    const savedUser = await newUser.save();
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

const editUser = async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).send("User ID is missing in the request.");
    }

    const userDetails = await User.findById(id);

    if (!userDetails) {
      return res.status(404).send("User not found.");
    }

    res.render("editUser", { userDetails, errorMessage: null });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const edit_User = async (req, res) => {
  try {
    
    const id = req.query.id;

    
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).send("User not found.");
    }

   
    if (
      (req.body.email &&
        req.body.email !== existingUser.email &&
        (await User.findOne({ email: req.body.email }))) ||
      (req.body.mobile &&
        req.body.mobile !== existingUser.phone &&
        (await User.findOne({ phone: req.body.mobile })))
    ) {
      return res.render("editUser", {
        userDetails: existingUser,
        errorMessage: "Email or mobile number already exists.",
      });
    }

    
    const updatedUser = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.mobile,
      password: req.body.password,
      address: req.body.address,
      is_verified: req.body.verified,
      is_active: req.body.status,
    });

  
    res.redirect(`/admin/users`);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const delete_User = async (req, res) => {
  try {
    const id = req.query.id;

    
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).send("User not found");
    }

    
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const add_Product = async (req, res) => {
  try {
    console.log("Request body:", req.body); 

    const images = req.files.map((file) => file.filename);
    const sizeNames = ["XS", "S", "M", "L", "XL", "XXL"];
    const sizes = sizeNames.map((size) => ({
      size: size,
      quantity: parseInt(req.body.sizes?.[size]) || 0,
    }));

    console.log("Sizes:", sizes); 

    
    let category = await Category.findOne({ cName: req.body.productCategory });

    
    if (!category) {
      category = await Category.create({
        cName: req.body.productCategory,
        description: "Default description", 
      });
    }

    // Store images in the session
    req.session.images = images;

    const newProduct = new Product({
      pname: req.body.ProductName,
      price: req.body.ProductPrice,
      description: req.body.ProductDetails,
      sizes: sizes,
      category: category._id, 
      is_listed: req.body.listed,
      brand: req.body.ProductBrand,
      images: req.session.images,
    });

    console.log("New Product:", newProduct); 

    await newProduct.save();
    console.log("Product saved successfully:", newProduct);

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send("Internal Server Error");
  }
};




const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    
    const result = await Product.deleteOne({ _id: productId });

    if (result) {
      res.redirect("/admin/products");
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById(id);

    if (!product) {
      
      return res.status(404).send("Product not found");
    }

    const categories = await getCategories();
    const selectedCategory = product.category; 
    req.session.images=product.images

    res.render("editProduct", { product, categories, selectedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getCategories = async () => {
  try {
    const categories = await Category.find({}, "cName"); 
    return categories;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const edit_product = async (req, res) => {
  try {
    const id = req.query.id;

    const sizeNames = ["XS", "S", "M", "L", "XL", "XXL"];
    const sizes = sizeNames.map((size) => ({
      size: size,
      quantity: parseInt(req.body[`sizes${size}`]) || 0,
    }));

    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Remove images marked for removal
    // Remove images marked for removal
if (req.body.removeImage) {
  if (!Array.isArray(req.body.removeImage)) {
    req.body.removeImage = [req.body.removeImage]; // Convert to array if it's a single value
  }
  req.body.removeImage.forEach((imageName) => {
    product.images = product.images.filter((image) => image !== imageName);
  });
}

    // Add new images
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        product.images.push(file.filename);
      });
    }

    // Update product fields
    product.pname = req.body.ProductName;
    product.price = req.body.ProductPrice;
    product.description = req.body.ProductDetails;
    product.sizes = sizes;
    product.category = req.body.productCategory;
    product.brand = req.body.ProductBrand;

    await product.save();

    const selectedCategory = req.body.productCategory;
    res.redirect(`/admin/products?selectedCategory=${selectedCategory}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




const removeImage=(req,res)=>{
  const {filename}=req.body
  console.log(filename)
  console.log(req.session.images); 

  if (Array.isArray(req.session.images)) {
    const index = req.session.images.indexOf(filename);
    if (index !== -1) {
      req.session.images.splice(index, 1); 
    }
  }
  console.log(req.session.images); 
  res.send("Success")

}


const editcategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    res.render("editCategory", { category });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const edit_Category = async (req, res) => {
  try {
    const id = req.query.id;
    const body = req.body;

    // Check if the new category name already exists
    const existingCategory = await Category.findOne({
      cName: body.categoryName,
      _id: { $ne: id } // Exclude the current category from the check
    });

    if (existingCategory) {
      // Category name already exists, send an alert message
      return res.status(400).send(`
        <script>
          alert("Category name already exists");
          window.location.href = "/admin/category/edit-category?id=${id}";
        </script>
      `);
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, {
      cName: body.categoryName,
      description: body.description,
    });

    if (!updatedCategory) {
      return res.status(404).send(`
        <script>
          alert("Category not found");
          window.location.href = "/admin/category";
        </script>
      `);
    }

    res.redirect("/admin/category");
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      <script>
        alert("Internal Server Error");
        window.location.href = "/admin/category";
      </script>
    `);
  }
};



const createCategory = async (req, res) => {
  try {
    const existingCategory = await Category.findOne({
      cName: req.body.categoryName,
    });

    if (existingCategory) {
      const categories = await Category.find();
      res.render("category", {
        categories,
        errorMessage: "Category already exists",
      });
      return;
    }

    const newCategory = new Category({
      cName: req.body.categoryName,
      description: req.body.description,
    });

    const savedCategory = await newCategory.save();

    res.redirect("/admin/category");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    console.log(categoryId)
    if (!categoryId) {
      return res.status(400).send("Invalid category ID");
    }
    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    console.log(deletedCategory);

    // Send a response indicating success
    // res.redirect("/admin/category");
    
    // Redirect to the category list page
    res.redirect("/admin/category");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// const loadorders = async (req, res) => {
//   try {
//     // Assuming AllOrders is an array of orders
//     const AllOrders = await Order.find(); // Assuming Order is your Mongoose model for orders
//     const user = req.user; // Assuming req.user contains the user object
//     res.render('orders', { AllOrders, user }); // Pass AllOrders and user as variables to the template
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send('Internal Server Error');
//   }
// };

const loadorders = async (req, res) => {
  try {
    const AllOrders = await Order.find().sort({ orderDate: -1 }).populate('userId').exec();
    const user = req.user;
    console.log('User ID:', user ? user._id : 'User not logged in'); // Log the user ID if user is logged in, otherwise log a message
    res.render('orders', { AllOrders, user });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const detailedOrder = async (req, res) => {
  try {
    const orderNumber = req.query.orderNumber;
    const orderDetails = await Order.findOne({ orderNumber: orderNumber })
      .populate({
        path: 'items.product',
        model: 'Product',
        select: 'pname price views purchases popularity images category brand sizes'
      })
      .populate({
        path: 'userId', // Assuming `userId` is the name of the field storing the user's ID
        model: 'User',
        select: 'name email phone',
      });

    if (!orderDetails) {
      return res.status(404).send('Order not found');
    }

    // Calculate the total amount for the order
    let totalAmount = 0;
    orderDetails.items.forEach(item => {
      totalAmount += item.quantity * item.price; // Using `item.price` instead of `item.product.price` if `price` is stored in the `items` array
    });

    // Accessing the `userId` from the populated `user` field
    const userId = orderDetails.userId._id; 
    console.log('User ID:', userId);

    res.render('detailedOrder', { orderDetails, order: orderDetails, totalAmount: totalAmount, userId: userId }); // Pass orderDetails and totalAmount to the template
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};








const ChangeStatus = async (req, res) => {
  const orderDetails = req.params.orderId;
  const { action } = req.body;
  try {
    const order = await Order.findOne({ _id:orderDetails});
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.status = action;
    await order.save();
    const newStatus = order.status;
    return res.status(200).json({ newStatus});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const filterSalesReport = async (req, res) => {
  try {
      const { interval, startDate, endDate } = req.query;

      // console.log('req-body', req.query);

      const currentDate = new Date();
      let startDateQuery = new Date();
      let endDateQuery = new Date();

      if (interval === 'custom' || (startDate && endDate)) {
          startDateQuery = new Date(startDate);
          endDateQuery = new Date(endDate);
      } else {
          switch (interval) {
              case 'daily':
                  startDateQuery.setHours(0, 0, 0, 0);
                  endDateQuery.setDate(endDateQuery.getDate() + 1); // Set to beginning of the next day
                  break;
              case 'weekly':
                  startDateQuery.setDate(startDateQuery.getDate() - 7); // Set to 7 days ago
                  startDateQuery.setHours(0, 0, 0, 0);
                  endDateQuery.setHours(23, 59, 59, 999); // Set to end of the day
                  break;
              case 'monthly':
                  startDateQuery = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  startDateQuery.setHours(0, 0, 0, 0);
                  endDateQuery.setHours(23, 59, 59, 999);
                  break;
              case 'yearly':
                  startDateQuery = new Date(currentDate.getFullYear(), 0, 1);
                  startDateQuery.setHours(0, 0, 0, 0);
                  endDateQuery.setHours(23, 59, 59, 999);
                  break;
              default:
                  console.log('your at the default case');
                  break;
                  // return res.status(400).json({ success: false, message: 'Invalid interval specified' });
          }
      }

      // console.log('startDateQuery:', startDateQuery);
      // console.log('endDateQuery:', endDateQuery);

      // querying based on orderDate:
      const filteredOrders = await Order.find({ orderDate: { $gte: startDateQuery, $lte: endDateQuery } }).populate('items.productId user').sort({orderDate:-1});
      console.log('filteredOrders', filteredOrders)

      res.json(filteredOrders);
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false })
  }
}

const filterTotalRevenue = async (req, res) => {
  try {
    const { interval, startDate: customStartDate, endDate: customEndDate } = req.query;
    let startDate;
    let endDate;

    switch (interval) {
      case 'daily':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        startDate = new Date();
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setMonth(0);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error('Invalid interval');
    }

    const pipeline = [
      {
        $match: {
          orderDate: {
            $gte: startDate,
            $lte: endDate,
          },
          orderStatus: 'Delivered',
        },
      },
      {
        $group: {
          _id: null,
          totalSalesRevenue: { $sum: '$billTotal' },
        },
      },
    ];

    const result = await Order.aggregate(pipeline);
    const totalSalesRevenue = result.length > 0 ? result[0].totalSalesRevenue : 0;
    res.json(totalSalesRevenue);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const loadsalesreport=async(req,res)=>{
  try{
    res.render("salesReport")
  }catch(error){
    console.log(error.message);
  }
}

const loaddashboard = async (req, res) => {
  try {
    const categories = await Category.find();
    const products = await Product.find({ is_listed: 1 })
      .sort({ popularity: -1 }) // Sort by popularity in ascending order
      .limit(5) // Limit the results to 5 products
      .exec();

    res.render('dashboard', { products, categories });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}


const dailyChart = async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Construct the date range query
  const orders = await Order.aggregate([
      {
          $match: {
            orderDate: { $gte: thirtyDaysAgo } // Orders within the last 30 days
          }
          
      },
      {
          $group: {
              _id: { $dateToString: { format: "%d-%m-%Y", date: "$orderDate" } },
              totalAmount: { $sum: "$totalAmount" } // Sum of total amount for each day
          }
      },
      {
          $sort: { "_id": 1 } // Sort by date in ascending order
      }
  ]);
  console.log(orders)

  // Convert string dates back to actual dates for proper sorting
  const sortedOrders = orders.map(order => ({
      ...order,
      _id: new Date(order._id.split('-').reverse().join('-') + 'T00:00:00') // Convert string date to actual date with 00:00:00 time
  })).sort((a, b) => a._id - b._id);

  // Extracting x-axis (dates) and y-axis (total values)s data
  const val = sortedOrders.map(order => order.totalAmount);
  const xaxis = sortedOrders.map(order => order._id.toLocaleDateString('en-GB')); // Format date as dd-mm-yyyy

  return res.status(200).json({ val, xaxis });
};



const monthlyChart = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Construct the date range query
  const orders = await Order.aggregate([
      {
          $match: {
            orderDate: { $gte: twelveMonthsAgo } // Orders within the last 12 months
          }
      },
      {
          $group: {
              _id: { $dateToString: { format: "%m-%Y", date: "$orderDate" } },
              totalAmount: { $sum: "$totalAmount" } // Sum of total amount for each month
          }
      },
      {
          $sort: { "_id": 1 } // Sort by date in ascending order
      }
  ]);

  // Convert string months back to actual dates for proper sorting
  const sortedOrders = orders.map(order => ({
      ...order,
      _id: new Date(order._id.split('-').reverse().join('-') + '-01T00:00:00') // Convert string month to actual date with first day of the month and 00:00:00 time
  })).sort((a, b) => a._id - b._id);

  // Extracting x-axis (months) and y-axis (total values) data
  const val = sortedOrders.map(order => order.totalAmount);
  const xaxis = sortedOrders.map(order => order._id.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })); // Format month as "January 2023"

  return res.status(200).json({ val, xaxis });
};





module.exports = {
  loadAdminLog,
  adminLogin,
  loadProducts,
  loadUsers,
  editUser,
  addUser,
  addProduct,
  editProduct,
  viewCategory,
  add_User,
  edit_User,
  delete_User,
  add_Product,
  deleteProduct,
  edit_product,
  createCategory,
  deleteCategory,
  editcategory,
  edit_Category,
  loadorders,
  detailedOrder,
  ChangeStatus,
  filterSalesReport,
  filterTotalRevenue,
  loadsalesreport,
  adminlogout,
  removeImage,
  loaddashboard,
  dailyChart,
  monthlyChart


    
};