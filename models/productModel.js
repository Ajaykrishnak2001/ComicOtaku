const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  pname: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  offerPrice:{
    type:Number,
    required:true
  },
  description: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category', // This should match the model name for your category schema
  },
  brand: {
    type: String,
    required: true,
  },
  sizes: [
    {
      size: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  purchases: {
    type: Number,
    default: 0,
  },
  popularity: {
    type: Number,
    default: 0,
  },
  is_listed: {
    type: Number,
    default: 1,
  },
  
}, { strictPopulate: false });

module.exports = mongoose.model('Product', productSchema);
