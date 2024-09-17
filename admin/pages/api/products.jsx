import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { authOptions, isAdminRequest } from './auth/[...nextauth]';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

export default async function handle(req, res) {
    const { method } = req;
    await mongooseConnect();
    await isAdminRequest(req, res);

    const productCacheKey = (id) => `product_${id}`;

    if (method === 'GET') {
        if (req.query?.id) {
            const cacheKey = productCacheKey(req.query.id);

            const cachedProduct = await redis.get(cacheKey);
            if (cachedProduct) {
                console.log('Returning cached product');
                return res.json(JSON.parse(cachedProduct));
            }

            const product = await Product.findOne({ _id: req.query.id }).lean();
            if (product) {
                await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);
            }
            return res.json(product);
        } else {
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const skip = (page - 1) * limit;
            const allProductsCacheKey = `products_page_${page}`;

            const cachedProducts = await redis.get(allProductsCacheKey);
            if (cachedProducts) {
                console.log('Returning cached product list');
                return res.json(JSON.parse(cachedProducts));
            }

            const products = await Product.find()
                .skip(skip)
                .limit(limit)
                .lean();

            await redis.set(allProductsCacheKey, JSON.stringify(products), 'EX', 3600);
            return res.json(products);
        }
    }

    if (method === 'POST') {
        const { title, description, price, images, category, properties } = req.body;
        const productDoc = await Product.create({
            title, description, price, images, category, properties,
        });

        const keys = await redis.keys('products_page_*');
        if (keys.length) await redis.del(keys);

        res.json(productDoc);
    }

    if (method === 'PUT') {
        const { title, description, price, images, category, properties, _id } = req.body;
        await Product.updateOne({ _id }, { title, description, price, images, category, properties });

        await redis.del(productCacheKey(_id));  
        const keys = await redis.keys('products_page_*');
        if (keys.length) await redis.del(keys);

        res.json(true);
    }

    if (method === 'DELETE') {
        if (req.query?.id) {
            await Product.deleteOne({ _id: req.query.id });

            await redis.del(productCacheKey(req.query.id));  
            const keys = await redis.keys('products_page_*');
            if (keys.length) await redis.del(keys);

            res.json(true);
        }
    }
}
