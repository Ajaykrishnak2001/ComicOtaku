const Coupon = require("../models/couponModel");

const addcoupon =  async (req, res) => {
    try {
        const { couponId, description, maximumDiscount, minimumAmount, maximumAmount, maximumUser, expireDate } = req.body;

        const newCoupon = new Coupon({
            couponId,
            description,
            maximumDiscount,
            minimumAmount,
            maximumAmount,
            maximumUser,
            expireDate
        });

        await newCoupon.save();

        res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
    } catch (error) {
        console.error('Failed to create coupon:', error);
        res.status(500).json({ message: 'Failed to create coupon', error: error.message });
    }
};

const loadcoupon=async(req,res)=>{
    try{
      res.render("coupon")
    }catch(error){
      console.log(error.message)
    }
  }


module.exports ={
    addcoupon,
    loadcoupon
} 