const User = require('../models/User');

exports.list = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? { $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { company: { $regex: q, $options: 'i' } }
        ] }
      : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).select('name email company role createdAt');
    res.json(users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      company: u.company || '',
      role: u.role,
      createdAt: u.createdAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, role } = req.body;
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (email !== undefined) payload.email = email;
    if (company !== undefined) payload.company = company;
    if (role !== undefined) payload.role = role;
    const user = await User.findByIdAndUpdate(id, payload, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, company: user.company || '', role: user.role, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
