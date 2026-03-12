const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const AdminSchema = new mongoose.Schema({
  email: String,
  role: String
}, { collection: 'admins' });

const Admin = mongoose.model('Admin_Check', AdminSchema);

async function checkAdmins() {
  try {
    const dbName = 'nrm_rice_mill';
    await mongoose.connect(process.env.MONGODB_URI, { dbName });
    console.log(`Connected to DB: ${dbName}`);
    
    const count = await Admin.countDocuments({});
    console.log(`Total admins in ${dbName}:`, count);
    
    const admins = await Admin.find({});
    admins.forEach(a => console.log('Found Admin:', a.email));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkAdmins();
