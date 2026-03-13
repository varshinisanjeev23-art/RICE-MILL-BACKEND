const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: { type: String },
  role: { type: String, default: 'admin' }
}, { collection: 'admins' });

const Admin = mongoose.model('Admin_Omni', AdminSchema);

const clusters = [
  'mongodb+srv://sujithcs:SUJITHCS09@cluster0.rskwzyd.mongodb.net/',
  'mongodb+srv://varshinit:varshini@cluster0.hz7zb08.mongodb.net/'
];

const emails = ['varshinisanjeev23@gmail.com', 'varshinithiyagarajan552@gmail.com'];

async function omniSeed() {
  for (const uri of clusters) {
    try {
      console.log(`Connecting to uri starting with: ${uri.substring(0, 30)}...`);
      // Try with both common db names just in case
      for (const dbName of ['nrm_rice_mill', 'test']) {
        await mongoose.connect(uri, { dbName });
        console.log(`Connected to DB: ${dbName}`);
        
        for (const email of emails) {
          await Admin.findOneAndUpdate(
            { email: email.toLowerCase() },
            { name: 'Admin', email: email.toLowerCase(), role: 'admin' },
            { upsert: true, new: true }
          );
          console.log(`  - Ensured ${email} exists in ${dbName}`);
        }
        await mongoose.disconnect();
      }
    } catch (err) {
      console.error(`Failed for cluster ${uri}:`, err.message);
    }
  }
}

omniSeed();
