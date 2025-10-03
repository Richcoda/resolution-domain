import { SophosURLProtector } from '../lib/sophos-protector.js';

const getSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;
  
  console.log('🔑 Environment Check:');
  console.log('   - SECRET_KEY available:', !!secretKey);
  console.log('   - SECRET_KEY length:', secretKey ? secretKey.length : 0);
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  
  if (!secretKey) {
    throw new Error('SECRET_KEY environment variable is not configured in Vercel');
  }
  
  return secretKey;
};

// Simple test endpoint
const handleTestRequest = (req, res) => {
  console.log('🧪 Test endpoint called');
  return res.status(200).json({
    status: 'OK',
    message: 'Resolution API is working!',
    timestamp: new Date().toISOString(),
    environment: {
      hasSecretKey: !!process.env.SECRET_KEY,
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform
    }
  });
};

// Health check endpoint
const handleHealthCheck = (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'url-resolver',
    timestamp: new Date().toISOString()
  });
};

export default async function handler(req, res) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.log(`\n=== NEW REQUEST ${requestId} ===`);
  console.log('📨 URL:', req.url);
  console.log('🔧 Method:', req.method);
  console.log('🌐 Host:', req.headers?.host);
  console.log('📧 User Agent:', req.headers?.['user-agent']);

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Handle different endpoints
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  // Test endpoint
  if (url.pathname === '/test' || url.searchParams.get('test') === 'true') {
    return handleTestRequest(req, res);
  }
  
  // Health check
  if (url.pathname === '/health') {
    return handleHealthCheck(req, res);
  }

  // Only GET method allowed for resolution
  if (req.method !== 'GET') {
    console.log(`❌ Invalid method: ${req.method}`);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      allowed: ['GET'],
      id: requestId
    });
  }

  try {
    const { d, u, p, i, t, h, s } = req.query;

    console.log('📋 Query parameters:');
    console.log('   - d (domain):', d || 'MISSING');
    console.log('   - u (URL):', u ? `${u.substring(0, 30)}...` : 'MISSING');
    console.log('   - p (password):', p ? '***' + p.slice(-3) : 'MISSING');
    console.log('   - i (ID):', i ? `${i.substring(0, 15)}...` : 'MISSING');
    console.log('   - t (timestamp):', t || 'MISSING');
    console.log('   - h (hash):', h ? `${h.substring(0, 15)}...` : 'MISSING');
    console.log('   - s (signature):', s ? `${s.substring(0, 15)}...` : 'MISSING');

    // If no parameters, show usage
    if (!d && !u && !p && !i && !t && !h && !s) {
      console.log('ℹ️  No parameters provided - showing usage');
      return res.status(200).json({
        service: 'URL Resolution Service',
        status: 'ready',
        usage: {
          method: 'GET',
          parameters: ['d', 'u', 'p', 'i', 't', 'h', 's'],
          test: '/test',
          health: '/health'
        },
        id: requestId
      });
    }

    // Validate required parameters
    const missing = [];
    if (!d) missing.push('d');
    if (!u) missing.push('u');
    if (!p) missing.push('p');
    if (!i) missing.push('i');
    if (!t) missing.push('t');
    if (!h) missing.push('h');
    if (!s) missing.push('s');

    if (missing.length > 0) {
      console.error(`❌ Missing parameters: ${missing.join(', ')}`);
      return res.status(400).json({
        error: 'Missing required parameters',
        code: 'MISSING_PARAMETERS',
        missing,
        id: requestId
      });
    }

    console.log('🛡️ Initializing URL protector...');
    const protector = new SophosURLProtector(getSecretKey());
    
    console.log('🔍 Resolving protected URL...');
    const result = await protector.resolveProtectedURL({ d, u, p, i, t, h, s });

    if (!result || !result.originalURL) {
      throw new Error('Resolution failed - no URL returned');
    }

    console.log(`✅ Resolution successful for request ${requestId}`);
    console.log('   Redirecting to:', result.originalURL);

    // Perform redirect
    return res.redirect(302, result.originalURL);

  } catch (error) {
    console.error(`❌ Request ${requestId} failed:`, error.message);
    
    return res.status(400).json({
      error: error.message,
      code: 'RESOLUTION_FAILED',
      id: requestId,
      timestamp: new Date().toISOString(),
      help: 'Check that all parameters are correct and the URL has not expired'
    });
  } finally {
    console.log(`=== END REQUEST ${requestId} ===\n`);
  }
}