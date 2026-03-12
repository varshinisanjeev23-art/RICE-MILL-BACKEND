require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

(async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'nrm_rice_mill' });
    const admins = await Admin.find({});
    console.log('Total admins:', admins.length);
    admins.forEach(a => console.log(`- ${a.name} (${a.email})`));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
