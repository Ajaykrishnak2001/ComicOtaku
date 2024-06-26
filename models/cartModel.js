const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          require: true,
        },
        size:{
          type:String,
          required:true
        },

        subTotal: {
          type: Number,
          require: true,
        },
        quantity: {
          type: Number,
          require: true,
          default:1
        },
      },
    ],
    total: {
      type: Number,
      require: true,
    },
    maximumDiscount:{
      type:Number,
      require:true
    }
  },
  { timestamps: true, versionKey: false,strictPopulate:false }
);

module.exports = mongoose.model("cart", cartSchema);