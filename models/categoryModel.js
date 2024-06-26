const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  cName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
},{ strictPopulate:false });

module.exports = mongoose.model("Category", categorySchema);
