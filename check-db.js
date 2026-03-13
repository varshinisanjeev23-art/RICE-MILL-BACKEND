const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Product = require('./models/Product');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'nrm_rice_mill' });
        console.log('Connected to DB');
        const count = await Product.countDocuments();
        console.log('Product count:', count);
        if (count > 0) {
            const products = await Product.find().limit(5);
            console.log('Sample products:', products.map(p => p.name));
        } else {
            console.log('NO PRODUCTS FOUND IN DATABASE');
        }
        process.exit(0);
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
}

checkDB();
