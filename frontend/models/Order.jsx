const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const OrderSchema = new Schema({
    line_items:Object,
    name:String,
    email:String,
    city:String,
    postalCode:String,
    streetAddress:String,
    country:String,
    paid:Boolean,
}, {
    timestamps: true,
});

export const Order = mongoose.models?.Order || model('Order', OrderSchema);