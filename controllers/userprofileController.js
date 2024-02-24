
const address = require("../models/addressModel");
const user = require("../models/userModel");


const loadprofile = async (req, res) => {
    try {
      console.log(
        req.session.userId,
        "from the session in loginTTTTTTTTTTTTTTTTT"
      );
  
      const userData = await user.findById(req.session.userId);
      const userAddress = await address.find({ user: req.session.userId });
      res.render("profile", { user: userData, userAddress: userAddress });
    } catch (error) {
      console.log(error.message);
    }
  };

const load_addAddress = async (req, res) => {
    try {
      res.render("addAddress");
    } catch (error) {
      console.log(error.message);
    }
  };

  const addAddress = async (req, res) => {
    try {
      console.log(req.body);
      const {
        name,
        pinCode,
        locality,
        addressArea,
        district,
        state,
        landmark,
        mobile,
        locationType,
      } = req.body;
  
      console.log(req.session.userId, "it form session id");
      // Check if the mobile number already exists in the database
      const existingUser = await user.findOne({ mobile: mobile });
      console.log(existingUser, "existing user.................");
      if (existingUser) {
        return res.render("addAddress", {
          message: "Please enter another mobile number",
        });
      } else {
        let newAddress;
        if(locationType=="home"){
          newAddress = new address({
            user: req.session.userId,
            name: name,
            pinCode: pinCode,
            locality: locality,
            address: addressArea,
            district: district,
            state: state,
            landmark: landmark,
            alternatePhone: mobile,
            addressType: locationType,
            alternativePhone: mobile,
            default:true
          })
        }else{
             newAddress = new address({
              user: req.session.userId,
              name: name,
              pinCode: pinCode,
              locality: locality,
              address: addressArea,
              district: district,
              state: state,
              landmark: landmark,
              alternatePhone: mobile,
              addressType: locationType,
              alternativePhone: mobile,
            })
        }
        
        if (newAddress) {
          console.log(newAddress, "hhhhhhhhhhhhhhhhhhhhhhhhhhhh");
          const savedAddress = await newAddress.save();
          console.log("Address added successfully");
          return res.redirect("/profile");
        }
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  module.exports = {
    load_addAddress,
    addAddress,
    loadprofile

   
  };