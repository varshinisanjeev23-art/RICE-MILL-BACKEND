require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

(async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'nrm_rice_mill' });
    const users = await User.find({});
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
