const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: { type: String },
  role: { type: String, default: 'admin' }
}, { collection: 'admins' });

const Admin = mongoose.model('Admin_Final', AdminSchema);

async function finalSeed() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'nrm_rice_mill';
    
    console.log(`Connecting to: ${uri.split('@')[1]} (DB: ${dbName})`);
    await mongoose.connect(uri, { dbName });
    console.log('Connected');
    
    const emails = ['varshinisanjeev23@gmail.com', 'varshinithiyagarajan552@gmail.com'];
    
    for (const email of emails) {
      await Admin.findOneAndUpdate(
        { email: email.toLowerCase() },
        { name: 'Admin', email: email.toLowerCase(), role: 'admin' },
        { upsert: true, new: true }
      );
      console.log(`Ensured admin exists: ${email}`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

finalSeed();
