import { mongooseConnect } from "@/lib/mongoose";
import { Category } from "@/models/Category";
import { authOptions, isAdminRequest } from './auth/[...nextauth]';
import Redis from 'ioredis';

// Initialize Redis client
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
        const categoryDoc = await Category.create({
            name, parent: parentCategory, properties,
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
        if (req.query?.id) {
            await Category.deleteOne({ _id: req.query.id });

            await redis.del(categoryCacheKey(req.query.id)); 
            await redis.del(allCategoriesCacheKey); 

            res.json(true);
        }
    }
}
