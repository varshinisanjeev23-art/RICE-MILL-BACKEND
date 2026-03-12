const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

exports.transactionsPdf = async (req, res) => {
  try {
    const { range = 'daily' } = req.query; // 'daily' or 'monthly'

    const now = new Date();
    let fromDate;
    if (range === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const items = await Payment.find({ createdAt: { $gte: fromDate } }).populate('user');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${range}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).text('NRM Rice Mill Transactions Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Range: ${range}`);
    doc.text(`Generated: ${now.toISOString()}`);
    doc.moveDown();

    doc.fontSize(12).text('Order ID           Customer           Process   Amount   Status');
    doc.moveDown(0.5);

    for (const p of items) {
      // Derive process via booking if exists
      let process = '-';
      const booking = await Booking.findOne({ payment: p._id });
      if (booking) process = booking.processType;

      doc.text(
        `${p.razorpayOrderId || '-'}    ${p.user?.name || '-'}    ${process}    ₹${p.amount}    ${p.status}`
      );
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
