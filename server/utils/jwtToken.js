import jwt from 'jsonwebtoken'; // Added import for jwt

// Create, send token and save in cookie
const sendToken = (user, statusCode, res) => {
  // Create Jwt token
  const token = user.getJwtToken();

  // Options for cookie
  // For cross-domain (Vercel frontend + Render backend), must use secure: true, sameSite: 'none'
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction, // HTTPS required for sameSite: 'none'
    sameSite: isProduction ? 'none' : 'lax',
    path: '/', // Ensure cookie is available site-wide
  };
  
  console.log(`🔐 Setting cookie with options:`, { secure: options.secure, sameSite: options.sameSite, isProduction });

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user,
  });
};

// Generate a short-lived token for email verification
const getVerificationToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, verified: true }, process.env.JWT_SECRET, {
    expiresIn: '10m', // Token valid for 10 minutes
  });
};

export { sendToken, getVerificationToken }; // Export both
