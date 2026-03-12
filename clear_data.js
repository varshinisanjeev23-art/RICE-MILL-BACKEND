require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Review = require('./models/Review');
const ContactMessage = require('./models/ContactMessage');
const User = require('./models/User');


(async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'nrm_rice_mill';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName });
    console.log('Connected to database:', dbName);

    console.log('Deleting bookings...');
    const bookingResult = await Booking.deleteMany({});
    console.log(`Deleted ${bookingResult.deletedCount} bookings.`);

    console.log('Deleting payments...');
    const paymentResult = await Payment.deleteMany({});
    console.log(`Deleted ${paymentResult.deletedCount} payments.`);

    console.log('Deleting reviews...');
    const reviewResult = await Review.deleteMany({});
    console.log(`Deleted ${reviewResult.deletedCount} reviews.`);

    console.log('Deleting contact messages...');
    const contactResult = await ContactMessage.deleteMany({});
    console.log(`Deleted ${contactResult.deletedCount} messages.`);

    console.log('Deleting users...');
    const userResult = await User.deleteMany({});
    console.log(`Deleted ${userResult.deletedCount} users.`);


    console.log('Data cleared successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Error clearing data:', e);
    process.exit(1);
  }
})();
