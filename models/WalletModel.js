const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    walletbalance:{
        type: Number,
        required:true,
        default: 0
    },
    transationHistory:[{
        date: {
            type: Date,  // Change the type to Date
            required: true,
        },
        paymentType: {
            type: String,
            required: true
        },
        transationMode: {
            type: String,
            required: true
        },
        transationamount: {
            type: Number,
            required: true
        }
    }],
    totalRefund: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('Wallet', walletSchema);