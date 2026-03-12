const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const instance = null; // Unused, replaced by per-request instance

exports.createOrder = async (req, res) => {
  try {
    const { amount, bookingId } = req.body; // amount in INR

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const key_id = (process.env.RAZORPAY_KEY_ID || '').trim();
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    console.log('Razorpay Key ID:', key_id ? key_id.substring(0, 12) + '...' : 'MISSING');
    console.log('Razorpay Key Secret:', key_secret ? 'SET (' + key_secret.length + ' chars)' : 'MISSING');

    if (!key_id || !key_id.startsWith('rzp_')) {
      return res.status(500).json({ message: 'Razorpay Key ID is not configured. Please add RAZORPAY_KEY_ID to your .env file.' });
    }

    if (!key_secret) {
      return res.status(500).json({ message: 'Razorpay Key Secret is not configured. Please add RAZORPAY_KEY_SECRET to your .env file.' });
    }

    const rzpInstance = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(Number(amount) * 100), // to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };

    console.log('Creating Razorpay order with options:', options);
    
    let order;
    try {
      order = await rzpInstance.orders.create(options);
      console.log('Razorpay order created successfully:', order.id);
    } catch (razorError) {
      console.error('Razorpay API Error Details:', JSON.stringify(razorError, null, 2));
      console.error('Razorpay Error statusCode:', razorError.statusCode);
      console.error('Razorpay Error message:', razorError.error?.description || razorError.message);
      return res.status(razorError.statusCode || 500).json({ 
        message: `Razorpay Error: ${razorError.error?.description || razorError.message || 'Unknown error'}. Please verify your Razorpay API keys.`
      });
    }

    const payment = await Payment.create({
      user: req.user.id,
      booking: bookingId,
      amount: Number(amount),
      currency: 'INR',
      status: 'created',
      razorpayOrderId: order.id
    });

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { payment: payment._id });
    }

    console.log('Payment record created:', payment._id);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: key_id,
      paymentId: payment._id
    });
  } catch (err) {
    console.error('Error in createOrder:', err);
    res.status(500).json({ message: err.message || 'Failed to create Razorpay order' });
  }
};

exports.verify = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, bookingId } = req.body;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!secret) {
      return res.status(500).json({ message: 'Payment secret not configured' });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    console.log('Signature verification:', {
      provided: razorpay_signature,
      generated: generated_signature,
      match: generated_signature === razorpay_signature
    });

    const status = generated_signature === razorpay_signature ? 'success' : 'failed';

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status
      },
      { new: true }
    );

    if (bookingId && payment._id) {
      const updateData = { payment: payment._id, status: status === 'success' ? 'processing' : 'cancelled' };
      if (status === 'success') updateData.processedAt = Date.now();
      await Booking.findByIdAndUpdate(bookingId, updateData);
      console.log('Booking updated with payment and status');
    }

    res.json({ status, payment });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: err.message || 'Failed to verify payment' });
  }
};

exports.all = async (req, res) => {
  try {
    const showDeleted = String(req.query.deleted) === 'true';
    const items = await Payment.find({ deleted: showDeleted }).populate('user').populate('booking').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Payment.findById(id);
    if (!item) return res.status(404).json({ message: 'Payment not found' });
    if (item.booking) {
      await Booking.findByIdAndUpdate(item.booking, { $unset: { payment: '' } });
    }
    item.deleted = true;
    item.deletedAt = new Date();
    await item.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    const items = await Payment.find({ _id: { $in: ids } });
    const bookingIds = items.map(i => i.booking).filter(Boolean);
    if (bookingIds.length) {
      await Booking.updateMany({ _id: { $in: bookingIds } }, { $unset: { payment: '' } });
    }
    await Payment.updateMany({ _id: { $in: ids } }, { $set: { deleted: true, deletedAt: new Date() } });
    res.json({ success: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.restoreOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Payment.findById(id);
    if (!item) return res.status(404).json({ message: 'Payment not found' });
    item.deleted = false;
    item.deletedAt = null;
    await item.save();
    if (item.booking) {
      await Booking.findByIdAndUpdate(item.booking, { payment: item._id });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.restoreMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    await Payment.updateMany({ _id: { $in: ids } }, { $set: { deleted: false, deletedAt: null } });
    const items = await Payment.find({ _id: { $in: ids } });
    const bookings = items.map(i => i.booking).filter(Boolean);
    if (bookings.length) {
      // restore links where possible
      await Booking.updateMany({ _id: { $in: bookings } }, [{ $set: { payment: { $cond: [{ $ne: ['$payment', null] }, '$payment', '$_id'] } } }]);
    }
    res.json({ success: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.purgeOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Payment.findById(id);
    if (!item) return res.status(404).json({ message: 'Payment not found' });
    if (item.booking) {
      await Booking.findByIdAndUpdate(item.booking, { $unset: { payment: '' } });
    }
    await Payment.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.purgeMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }
    const items = await Payment.find({ _id: { $in: ids } });
    const bookingIds = items.map(i => i.booking).filter(Boolean);
    if (bookingIds.length) {
      await Booking.updateMany({ _id: { $in: bookingIds } }, { $unset: { payment: '' } });
    }
    await Payment.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
