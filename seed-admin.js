const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, required: false },
  role: { type: String, default: 'admin' }
});

const Admin = mongoose.model('Admin', AdminSchema, 'admins');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'nrm_rice_mill' });
    console.log('Connected to DB');

    const emails = ['varshinisanjeev23@gmail.com', 'varshinithiyagarajan552@gmail.com'];

    for (const email of emails) {
      const exists = await Admin.findOne({ email });
      if (!exists) {
        // For Google login, password isn't used but we'll set a random hash just in case
        const hash = await bcrypt.hash('NRM_Admin_2024!', 10);
        await Admin.create({
          name: 'Admin',
          email,
          password: hash,
          role: 'admin'
        });
        console.log(`Admin ${email} created successfully`);
      } else {
        console.log(`Admin ${email} already exists`);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

seedAdmin();
