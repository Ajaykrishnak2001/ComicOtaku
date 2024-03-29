const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
name: {
    type: String,
    required: true, 
},

email: {
    type: String,
    required: true,
},

phone: {
    type: String, 
    required: true, 
},

password: { 
    type: String, 
    required: true, 
},

image: {
     type: String 
},

is_admin: {
    type: Number,
    required: 1,
},
    
is_verified: {
    type: Number, 
    default: 0, 
},
otp:{
    type:Number,
    required:false
},
referralCode: {
    type: String,
    required:true
},
    
is_active: { type: String, 
    default: 1,
     required:true
    }
 },{ strictPopulate:false });
    
   
module.exports = mongoose.model('User', userSchema)