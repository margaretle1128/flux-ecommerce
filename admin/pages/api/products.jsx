import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { authOptions, isAdminRequest } from './auth/[...nextauth]';
import Redis from 'ioredis';
import client from '../../elasticsearch'; 

const redis = new Redis(process.env.REDIS_URL);

export default async function handle(req, res) {
    const { method } = req;
    await mongooseConnect();
    await isAdminRequest(req, res);

    const productCacheKey = (id) => `product_${id}`;

    const indexExists = await client.indices.exists({ index: 'products' });
    if (!indexExists) {
        await client.indices.create({
            index: 'products',
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        description: { type: 'text' },
                        price: { type: 'float' },
                        category: { type: 'keyword' },
                    }
                }
            }
        });
    }

    if (method === 'GET') {
        if (req.query?.id) {
            const cacheKey = productCacheKey(req.query.id);

            const cachedProduct = await redis.get(cacheKey);
            if (cachedProduct) {
                console.log('Returning cached product');
                return res.json(JSON.parse(cachedProduct));
            }

            const { body } = await client.get({
                index: 'products',
                id: req.query.id,
            }).catch(() => ({ body: null }));

            if (body) {
                console.log('Returning product from Elasticsearch');
                await redis.set(cacheKey, JSON.stringify(body._source), 'EX', 3600);
                return res.json(body._source);
            }

            const product = await Product.findOne({ _id: req.query.id }).lean();
            if (product) {
                await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);
                await client.index({
                    index: 'products',
                    id: product._id.toString(), // Pass _id here, not in document
                    document: {
                        title: product.title,
                        description: product.description,
                        price: product.price,
                        images: product.images,
                        category: product.category,
                        properties: product.properties,
                    },
                });
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

            const { body } = await client.search({
                index: 'products',
                from: skip,
                size: limit,
                query: { match_all: {} }
            });

            if (body?.hits?.hits?.length) {
                const products = body.hits.hits.map(hit => hit._source);
                await redis.set(allProductsCacheKey, JSON.stringify(products), 'EX', 3600);
                return res.json(products);
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

        // Set category to null if not provided
        const productDoc = await Product.create({
            title,
            description,
            price,
            images,
            category: category && category.trim() !== "" ? category : null, // Handle missing category
            properties,
        });

        await client.index({
            index: 'products',
            id: productDoc._id.toString(), // Pass _id here
            document: {
                title: productDoc.title,
                description: productDoc.description,
                price: productDoc.price,
                images: productDoc.images,
                category: productDoc.category,
                properties: productDoc.properties
            },
        });

        const keys = await redis.keys('products_page_*');
        if (keys.length) await redis.del(keys);

        res.json(productDoc); 
    }

    if (method === 'PUT') {
        const { title, description, price, images, category, properties, _id } = req.body;

        await Product.updateOne({ _id }, {
            title,
            description,
            price,
            images,
            category: category && category.trim() !== "" ? category : null,
            properties
        });

        await client.update({
            index: 'products',
            id: _id,  
            doc: {
                title,
                description,
                price,
                images,
                category: category || null,
                properties
            },
        });

        await redis.del(productCacheKey(_id));
        const keys = await redis.keys('products_page_*');
        if (keys.length) await redis.del(keys);

        res.json(true);
    }

    if (method === 'DELETE') {
        if (req.query?.id) {
            await Product.deleteOne({ _id: req.query.id });

            await client.delete({
                index: 'products',
                id: req.query.id,
            });

            await redis.del(productCacheKey(req.query.id));
            const keys = await redis.keys('products_page_*');
            if (keys.length) await redis.del(keys);

            res.json(true);
        }
    }
}
