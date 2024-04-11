const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/ComicOtaku");
const bodyParser = require('body-parser');
const passport = require('passport');

const express = require("express");
const app=express();
require('./auth');

// Ensure session middleware is set up before any routes are defined
const session = require("express-session");
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


app.use(passport.initialize());
app.use(passport.session());

function isLoggedin(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/googleSignUp',
        failureRedirect: '/auth/google/failure'
    })
);

app.get('/auth/google/failure', isLoggedin, (req, res) => {
    console.log(session.user);
    res.redirect('/login');
})
// app.get('/auth/google',console.log("nnnn"),
//   passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect to the dashboard or homepage
//     res.redirect('/');
//   });


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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


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
    console.log("server is Running.....http://localhost:3000/landingpage");
});

module.exports=app