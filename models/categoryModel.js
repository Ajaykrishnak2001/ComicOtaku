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
});

module.exports = mongoose.model("category", categorySchema);