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

const loadcoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find(); // Fetch all coupons from the database

        res.render("coupons", { coupons }); // Render the coupon page with the coupons data
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Failed to load coupons', error: error.message });
    }
};


const loadaddcoupon=async(req,res)=>{
    try{
        res.render("createCoupon")
    }catch(error)
{
    console.log(error.message);
}};


const deletecoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Failed to delete coupon:', error);
        res.status(500).json({ message: 'Failed to delete coupon', error: error.message });
    }
};


module.exports = {
    addcoupon,
    loadcoupon,
    loadaddcoupon,
    deletecoupon
};
