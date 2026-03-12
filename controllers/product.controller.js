const Product = require('../models/Product');

exports.list = async (req, res) => {
  try {
    const { processType } = req.query;
    const filter = processType ? { processType } : {};
    const items = await Product.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, ratePerKg, originalPrice, rating, reviewsCount, category, status, stockStatus, quantityOptions } = req.body;

    // Build images array from uploaded files
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => `/uploads/${f.filename}`);
    }
    const imageUrl = images[0] || req.body.imageUrl || '';

    // Parse quantityOptions (sent as JSON string or comma-separated)
    let parsedQty = [10, 25, 100];
    if (quantityOptions) {
      try {
        parsedQty = typeof quantityOptions === 'string'
          ? JSON.parse(quantityOptions)
          : quantityOptions;
      } catch {
        parsedQty = quantityOptions.toString().split(',').map(Number).filter(Boolean);
      }
    }

    const p = await Product.create({
      name,
      description,
      ratePerKg,
      originalPrice,
      rating,
      reviewsCount,
      category,
      status,
      stockStatus,
      imageUrl,
      images,
      quantityOptions: parsedQty
    });
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, ratePerKg, originalPrice, rating, reviewsCount, category, status, stockStatus, quantityOptions } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (ratePerKg !== undefined) updateData.ratePerKg = Number(ratePerKg);
    if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
    if (rating !== undefined) updateData.rating = Number(rating);
    if (reviewsCount !== undefined) updateData.reviewsCount = Number(reviewsCount);
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (stockStatus) updateData.stockStatus = stockStatus;

    // Handle quantity options
    if (quantityOptions) {
      try {
        updateData.quantityOptions = typeof quantityOptions === 'string'
          ? JSON.parse(quantityOptions)
          : quantityOptions;
      } catch {
        updateData.quantityOptions = quantityOptions.toString().split(',').map(Number).filter(Boolean);
      }
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      updateData.images = newImages;
      updateData.imageUrl = newImages[0];
    }

    const p = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json(p);
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
