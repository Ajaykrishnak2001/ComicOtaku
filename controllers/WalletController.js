"use strict";

const User = require("../models/userModel"); // Import the User model here

const Wallet = require("../models/WalletModel");
const Razorpay = require("razorpay");
const config = require("../config/config");

const randomstring=require("randomstring")

const razorpayInstance = new Razorpay({
  key_id: config.RAZORPAY_ID_KEY,
  key_secret: config.RAZORPAY_SECRET_KEY,
});

const addWallet = async (req, res) => {
  try {
    const amount = req.body.amount;

    const generateOrderId = () => {
      const p = randomstring.generate({
        length: 4,
        charset: "numeric",
      });
      return p;
    };

    let orderId = generateOrderId();

    // Create a Razorpay order
    var options = {
      amount: amount,
      currency: "INR",
      receipt: orderId,
    };
    razorpayInstance.orders.create(options, function (err, order) {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        res.status(500).json({ error: "Error creating Razorpay order" });
      } else {
        console.log("New Order", order);
        res.json({ success: true, razorpay: order });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const walletMoney = async (req, res) => {
    try {
      // console.log("walletmoney");
      const email = req.session.email;
      const userData = await User.findOne({ email: email });
  
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const wallet = await Wallet.findOne({ user: userData._id });
  
      let balance = wallet ? wallet.walletbalance : 0; // If wallet exists, get balance; otherwise, set to 0
      balance = balance + req.body.order.amount;
  
      if (wallet) {
        wallet.walletbalance = balance;
        wallet.transationHistory.push({
          date: new Date().toISOString(),
          paymentType: "Razorpay",
          transationMode: "Credit",
          transationamount: req.body.order.amount,
        });
        await wallet.save();
      } else {
        const newWallet = new Wallet({
          user: userData._id,
          walletbalance: balance,
          transationHistory: [
            {
              date: new Date().toISOString(),
              paymentType: "Razorpay",
              transationMode: "Credit",
              transationamount: req.body.order.amount,
            },
          ],
          totalRefund: 0,
        });
        await newWallet.save();
      }
  
      res.json({ razorpay_success: true });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

module.exports = {
  addWallet,
  walletMoney,
};
