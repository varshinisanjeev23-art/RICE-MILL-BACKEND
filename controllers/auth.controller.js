const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Admin = require('../models/Admin');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role || 'user', name: user.name },
    process.env.JWT_SECRET || 'dev_jwt_secret',
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, company, role: 'user' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Google OAuth 2.0 ---
function getServerBaseUrl(req) {
  const envUrl = process.env.SERVER_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function isAllowedRedirect(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    const allowed = (process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean);
    return allowed.some(a => url.startsWith(a));
  } catch (e) {
    return false;
  }
}

exports.googleStart = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: 'Google OAuth not configured' });
    }
    const clientCallback = req.query.redirect;
    const base = getServerBaseUrl(req);
    const redirectUri = `${base}/api/auth/google/callback`;
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const statePayload = Buffer.from(JSON.stringify({ cb: clientCallback || '' })).toString('base64url');
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'email', 'profile'],
      state: statePayload
    });
    return res.redirect(url);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const base = getServerBaseUrl(req);
    const redirectUri = `${base}/api/auth/google/callback`;
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const { tokens } = await oauth2Client.getToken({ code, redirect_uri: redirectUri });
    const idToken = tokens.id_token;
    if (!idToken) return res.status(400).send('Missing id_token');

    const ticket = await oauth2Client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || payload.given_name || 'Google User';

    if (!email) return res.status(400).send('Google account has no email');

    let user = await User.findOne({ email });
    if (!user) {
      const randomPass = await bcrypt.hash(Math.random().toString(36).slice(2), 10);
      user = await User.create({ name, email, password: randomPass, role: 'user' });
    }

    const appToken = signToken(user);

    let clientCallback = '';
    if (state) {
      try {
        const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        if (parsed && parsed.cb && typeof parsed.cb === 'string' && isAllowedRedirect(parsed.cb)) {
          clientCallback = parsed.cb;
        }
      } catch {}
    }
    if (!clientCallback) {
      const fallback = (process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean)[0] || 'http://localhost:5173';
      clientCallback = `${fallback}/auth/google/callback`;
    }

    const url = new URL(clientCallback);
    url.searchParams.set('token', appToken);
    url.searchParams.set('name', user.name || '');
    url.searchParams.set('email', user.email || '');
    return res.redirect(url.toString());
  } catch (err) {
    return res.status(500).send('OAuth error: ' + err.message);
  }
};

exports.googleVerify = async (req, res) => {
  try {
    const { idToken } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ message: 'Google Client ID not configured' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if not exists
      const randomPass = await bcrypt.hash(Math.random().toString(36).slice(2), 10);
      user = await User.create({ 
        name, 
        email, 
        password: randomPass, 
        role: 'user',
        profilePicture: picture,
        googleId
      });
    } else {
      // Update google profile info if already exists
      user.googleId = googleId;
      if (picture && !user.profilePicture) user.profilePicture = picture;
      await user.save();
    }

    const token = signToken(user);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profilePicture: user.profilePicture 
      } 
    });
  } catch (err) {
    console.error('Google verification error:', err);
    res.status(500).json({ message: 'Identity verification failed: ' + err.message });
  }
};

exports.adminGoogleVerify = async (req, res) => {
  try {
    const { idToken } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ message: 'Google Client ID not configured' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });

    const payload = ticket.getPayload();
    const { email } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(403).json({ message: 'Access denied. You are not an authorized admin.' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin', name: admin.name }, 
      process.env.JWT_SECRET || 'dev_jwt_secret', 
      { expiresIn: '7d' }
    );
    
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (err) {
    console.error('Admin Google verification error:', err);
    res.status(500).json({ message: 'Identity verification failed: ' + err.message });
  }
};


