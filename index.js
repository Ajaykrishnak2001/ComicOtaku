const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/ComicOtaku");
const bodyParser = require('body-parser');

const express = require("express");
const app=express();
// Ensure session middleware is set up before any routes are defined
const session = require("express-session");
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Your other routes and middleware

const methodOverride = require('method-override');

// Add method-override middleware
app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: false }));

// Parse JSON bodies (for API requests)
app.use(bodyParser.json());


const path = require("path");

 const userRoute = require("./routes/userRoute"); 
 app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute"); 
app.use("/admin", adminRoute);

app.use("/static", express.static(path.join(__dirname, "public"))); 
app.use("/products", express.static(path.join(__dirname, "public"))); 
app.use("/admin/static", express.static(path.join(__dirname, "public")));
app.use("/admin/users", express.static(path.join(__dirname, "public"))); 
app.use("/admin/products", express.static(path.join(__dirname, "public"))); 
app.use("/admin", express.static(path.join(__dirname, "public")));

app.use(express.static(path.join(__dirname, "public")));

app.use("/static", express.static(path.join(__dirname, "lib"))); 
app.use("/static/products", express.static(path.join(__dirname, "lib")));

app.use(express.static("public"));
app.use(express.static("views"));
app.use(express.static("lib"));

app.listen(3000,function(){
    console.log("server is Running.....http://localhost:3000/");
});

