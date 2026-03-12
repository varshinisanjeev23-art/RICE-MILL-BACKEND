require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Admin = require('./models/Admin');
const User = require('./models/User');

(async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'nrm_rice_mill' });

    const products = [
      { name: 'Ponni Rice Processing', description: 'Premium Ponni rice cleaning and processing - South India\'s most popular variety', ratePerKg: 8 },
      { name: 'Sona Masuri Processing', description: 'Aromatic Sona Masuri rice husking and polishing - Karnataka\'s favorite', ratePerKg: 7 },
      { name: 'IR-20 Rice Processing', description: 'High-yielding IR-20 rice quality control - Popular in Tamil Nadu', ratePerKg: 9 },
      { name: 'IR-36 Rice Processing', description: 'Premium IR-36 rice grading and packaging - Widely cultivated variety', ratePerKg: 6 },
      { name: 'BPT (Andhra Ponni) Processing', description: 'BPT (Andhra Ponni) rice workflow management - Andhra Pradesh specialty', ratePerKg: 10 },
      { name: 'ADT-36 Rice Processing', description: 'ADT-36 agricultural variety rice processing - Tamil Nadu bred', ratePerKg: 11 },
      { name: 'ADT-37 Rice Processing', description: 'ADT-37 agricultural variety rice processing - High-yielding Tamil Nadu variety', ratePerKg: 11 },
      { name: 'ADT-43 Rice Processing', description: 'ADT-43 agricultural variety rice processing - Premium Tamil Nadu variety', ratePerKg: 12 },
      { name: 'Jeeraga Samba (Jeera Samba) Processing', description: 'Jeeraga Samba (Jeera Samba) rice polishing - Aromatic variety', ratePerKg: 8 },
      { name: 'Idly Rice Processing', description: 'Idly rice grading - Perfect for South Indian breakfast', ratePerKg: 12 },
      { name: 'Raw Rice (Pachai Arisi) Processing', description: 'Raw rice (Pachai Arisi) processing - Unprocessed rice variety', ratePerKg: 5 },
      { name: 'Boiled Rice (Puzhungal Arisi) Processing', description: 'Boiled rice (Puzhungal Arisi) processing - Pre-cooked rice variety', ratePerKg: 13 },
      { name: 'Parboiled Rice Processing', description: 'Parboiled rice processing - Partially boiled rice variety', ratePerKg: 9 }
    ];

    await Product.deleteMany({});
    await Product.insertMany(products);

    const adminEmail = 'varshinithiyagarajan552@gmail.com';
    const adminPass = await bcrypt.hash('Varshu26#', 10);
    const adminExists = await Admin.findOne({ email: adminEmail });
    if (!adminExists) {
      await Admin.create({ name: 'Admin', email: adminEmail, password: adminPass, role: 'admin' });
    } else {
      adminExists.password = adminPass;
      await adminExists.save();
    }

    // Ensure a demo user exists for quick testing
    const demoEmail = 'demo@nrmricemill.com';
    const demoExists = await User.findOne({ email: demoEmail });
    if (!demoExists) {
      const demoPass = await bcrypt.hash('Demo@123', 10);
      await User.create({ name: 'Demo User', email: demoEmail, password: demoPass, company: 'Demo Co', role: 'user' });
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
