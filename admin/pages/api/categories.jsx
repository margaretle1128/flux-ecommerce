import { mongooseConnect } from "@/lib/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product"; 
import { authOptions, isAdminRequest } from './auth/[...nextauth]';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handle(req, res) {
    const { method } = req;
    await mongooseConnect();
    await isAdminRequest(req, res);

    const categoryCacheKey = (id) => `category_${id}`;
    const allCategoriesCacheKey = 'categories_all';

    if (method === 'GET') {
        if (req.query?.id) {
            const cacheKey = categoryCacheKey(req.query.id);

            const cachedCategory = await redis.get(cacheKey);
            if (cachedCategory) {
                console.log('Returning cached category');
                return res.json(JSON.parse(cachedCategory));
            }

            const category = await Category.findOne({ _id: req.query.id }).lean();
            if (category) {
                await redis.set(cacheKey, JSON.stringify(category), 'EX', 3600);
            }
            return res.json(category);
        } else {
            const cachedCategories = await redis.get(allCategoriesCacheKey);
            if (cachedCategories) {
                console.log('Returning cached categories list');
                return res.json(JSON.parse(cachedCategories));
            }

            const categories = await Category.find().lean();

            await redis.set(allCategoriesCacheKey, JSON.stringify(categories), 'EX', 3600);
            return res.json(categories);
        }
    }

    if (method === 'POST') {
        const { name, parentCategory, properties } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Category name is required" });
        }
    
        const categoryDoc = await Category.create({
            name, 
            parent: parentCategory && parentCategory.trim() !== "" ? parentCategory : null,  // Fix for empty parent category
            properties,
        });

        await redis.del(allCategoriesCacheKey);
        res.json(categoryDoc);
    }

    if (method === 'PUT') {
        const { name, parentCategory, properties, _id } = req.body;
        await Category.updateOne({ _id }, { name, parent: parentCategory, properties });

        await redis.del(categoryCacheKey(_id)); 
        await redis.del(allCategoriesCacheKey); 

        res.json(true);
    }

    if (method === 'DELETE') {
        const { _id } = req.query;  
    
        if (!_id) {
            return res.status(400).json({ error: "Category ID is required" });
        }
    
        try {
            // Check if the category exists
            const category = await Category.findOne({ _id });
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
    
            // Set the category to null for all products associated with the deleted category
            await Product.updateMany({ category: _id }, { $set: { category: null } });
    
            // Now delete the category itself
            const result = await Category.deleteOne({ _id });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Category not found" });
            }
    
            // Clear cache for categories
            await redis.del(allCategoriesCacheKey); 
            await redis.del(categoryCacheKey(_id)); 
    
            return res.json({ message: "Category deleted successfully, and associated products' categories set to null" });
        } catch (error) {
            console.error("Error deleting category:", error);
            return res.status(500).json({ error: "An error occurred while deleting the category" });
        }
    }
}
