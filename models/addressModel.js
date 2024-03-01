const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const addressSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  pinCode: {
    type: Number,
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  landmark: {
    type: [String],
  },
  alternatePhone: {
    type: Number,
  },
  addressType: {
    type: String,
    required: true,
    enum: ["home", "work"],
  },
  default: {
    type: Boolean,
    default: false,
  }
},{ strictPopulate:false });

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;