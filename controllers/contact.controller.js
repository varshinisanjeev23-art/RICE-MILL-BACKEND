const ContactMessage = require('../models/ContactMessage');

exports.create = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const payload = {
      name,
      email: email || req.user?.email,
      phone,
      message,
      user: req.user?.id
    };
    const item = await ContactMessage.create(payload);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const items = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reply = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const item = await ContactMessage.findByIdAndUpdate(id, { replied: true, reply }, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { replied, reply } = req.body;
    const payload = {};
    if (typeof replied === 'boolean') payload.replied = replied;
    if (reply !== undefined) payload.reply = reply;
    const item = await ContactMessage.findByIdAndUpdate(id, payload, { new: true });
    if (!item) return res.status(404).json({ message: 'Message not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await ContactMessage.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.myMessages = async (req, res) => {
  try {
    const filter = { $or: [{ user: req.user.id }, { email: req.user.email }] };
    const items = await ContactMessage.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
