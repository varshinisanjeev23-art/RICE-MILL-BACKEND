const JobApplication = require('../models/JobApplication');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Configure email transporter (using environment variables)
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.apply = async (req, res) => {
  try {
    const { name, email, phone, position, message } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const application = await JobApplication.create({
      name,
      email,
      phone,
      position,
      resumePath: `/uploads/resumes/${req.file.filename}`,
      message
    });

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'careers@nrm.com';
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: adminEmail,
      subject: `New Job Application: ${position} - ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Position: ${position}
        Message: ${message || 'No message provided'}
        
        Resume attached: ${req.file.filename}
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ]
    };

    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending application email:', error);
        } else {
          console.log('Application email sent:', info.response);
        }
      });
    } else {
      console.warn('Email credentials not configured. Application saved to DB, but no email sent.');
    }

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully!',
      application 
    });
  } catch (err) {
    console.error('Job application error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
