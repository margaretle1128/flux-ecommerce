const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ProductSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    properties: { type: Object },
}, {
    timestamps: true,
});

export const Product = mongoose.models?.Product || model('Product', ProductSchema);
