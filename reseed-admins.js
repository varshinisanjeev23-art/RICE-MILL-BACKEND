const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String },
  role: { type: String, default: 'admin' }
}, { collection: 'admins' });

const Admin = mongoose.model('Admin_ReSeed', AdminSchema);

async function reSeed() {
  try {
    const dbName = 'nrm_rice_mill';
    await mongoose.connect(process.env.MONGODB_URI, { dbName });
    console.log(`Connected to DB: ${dbName}`);
    
    // Clear existing
    const delResult = await Admin.deleteMany({});
    console.log(`Deleted ${delResult.deletedCount} admins`);
    
    const emails = ['varshinisanjeev23@gmail.com', 'varshinithiyagarajan552@gmail.com'];
    const hash = await bcrypt.hash('NRM_Admin_2024!', 10);
    
    for (const email of emails) {
      await Admin.create({
        name: 'Admin',
        email: email.toLowerCase().trim(),
        password: hash,
        role: 'admin'
      });
      console.log(`Created: ${email}`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

reSeed();
