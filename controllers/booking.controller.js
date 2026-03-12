const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

exports.create = async (req, res) => {
  try {
    const { riceType, costPerKg, quantityKg, notes, totalAmount, productId, productImage } = req.body;

    // RULE: 1kg Sample Logic
    // If the requested item is 1kg (quantityKg=1), check for first-order restriction
    if (quantityKg === 1) {
      // 1. Must be first order (completed orders check)
      const previousOrder = await Booking.findOne({ user: req.user.id, status: 'completed' });
      if (previousOrder) {
        return res.status(403).json({ message: '1kg sample is only available for your first order. Please choose bulk quantities (10kg+).' });
      }

      // 2. Quantity cap: Cannot exceed 1 count for a 1kg sample
      // Since booking.controller treats quantityKg as the total weight, we assume it's precisely 1.
    }
    // Bulk weights (>1kg) have no count restriction and are allowed in every order.

    const booking = await Booking.create({
      user: req.user.id,
      riceType,
      costPerKg,
      quantityKg,
      notes,
      totalAmount,
      status: 'pending',
      product: productId,
      productImage
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.myBookings = async (req, res) => {
  try {
    const items = await Booking.find({ user: req.user.id })
      .populate('payment')
      .populate('product')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await Booking.find(filter).populate('user').populate('payment').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateFields = { status };
    if (status === 'processing') updateFields.processedAt = Date.now();
    if (status === 'shipped') updateFields.shippedAt = Date.now();
    if (status === 'out_for_delivery') updateFields.outForDeliveryAt = Date.now();
    if (status === 'delivered') updateFields.deliveredAt = Date.now();
    if (status === 'cancelled') updateFields.cancelledAt = Date.now();

    const b = await Booking.findByIdAndUpdate(id, updateFields, { new: true });
    res.json(b);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderCount = async (req, res) => {
  try {
    const count = await Booking.countDocuments({ user: req.user.id, status: 'delivered' });
    res.json({ totalOrders: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
