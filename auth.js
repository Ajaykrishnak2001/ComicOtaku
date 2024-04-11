const passport = require('passport');
// const { loginload } = require('../controller/userController');
// require('dotenv').config()
const config=require("./config/config");
//Google signup
var GoogleStrategy=require('passport-google-oauth').OAuth2Strategy
passport.use(new GoogleStrategy({
    clientID: config.GoogleAuthId,
    clientSecret: config.GoogleAuthSecret,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Verify the user's identity
    return done(null, profile);
  }
));

// var GoogleStrategy = require('passport-google-oauth2').Strategy;
// passport.use(new GoogleStrategy({
//     clientID: config.GoogleAuthId,
//     clientSecret: config.GoogleAuthSecret,
//     callbackURL: "http://localhost:3000/auth/google/callback",
//     passReqToCallback: true
// },
//     function (request, accessToken, refreshToken, profile, done) {
//        return done(null, profile);
//     }
// )
// );




passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user);
})