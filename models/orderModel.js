const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  }, 
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
     
      isCancelled:{
        type: Boolean,
        default: false
      }
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "Confirmed", "shipped", "Delivered","Canceled","Returned"],
    default: "pending",
  },
  shippingAddress: {
    type: {
      address: {
        type: String,
        required: true
      },
      pinCode: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      locality: {
        type: String
      },
      landmark: {
        type: [String],
      },
      addressType: {
        type: String
      },
      mobile: {
        type: Number
      },
      alternatePhone: {
        type: Number
      },
      district:{
        type:String
      }
    },
    required: true
  },
  payment:{
    type:String,
    required:true
  },
  reasonForCancel:{
    type:String
  }
},{ strictPopulate:false });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
