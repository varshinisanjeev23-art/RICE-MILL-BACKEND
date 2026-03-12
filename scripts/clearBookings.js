const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://varshinit:varshini@cluster0.hz7zb08.mongodb.net/nrm_rice_mill';

async function clearBookings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const bookingResult = await mongoose.connection.db.collection('bookings').deleteMany({});
    console.log(`🗑️  Deleted ${bookingResult.deletedCount} booking(s)`);

    const reviewResult = await mongoose.connection.db.collection('reviews').deleteMany({});
    console.log(`🗑️  Deleted ${reviewResult.deletedCount} review(s)`);

    console.log('✅ Done! All bookings and reviews cleared.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearBookings();
