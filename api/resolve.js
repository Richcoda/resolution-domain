import { SophosURLProtector } from '../lib/sophos-protector.js';

const getSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;
  
  console.log('🔑 Resolution Domain - SECRET_KEY validation:');
  console.log('   - Available:', !!secretKey);
  console.log('   - Length:', secretKey ? secretKey.length : 0);
  console.log('   - First 5 chars:', secretKey ? secretKey.substring(0, 5) + '...' : 'none');
  
  if (!secretKey) {
    throw new Error('SECRET_KEY environment variable is not configured');
  }
  
  return secretKey;
};

export default async function handler(req, res) {
  // Add request ID for tracking
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  console.log(`\n=== RESOLUTION DOMAIN - REQUEST ${requestId} ===`);
  console.log('📨 Request URL:', req.url);
  console.log('🔧 Request Method:', req.method);
  console.log('🌐 Host:', req.headers?.host);
  console.log('📧 User Agent:', req.headers?.['user-agent']);

  // Set proper headers for API response
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    console.log(`❌ Invalid method for resolve request ${requestId}:`, req.method);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      id: requestId
    });
  }

  try {
    console.log(`📨 Processing resolve request ${requestId}`);
    
    const { d, u, p, i, t, h, s } = req.query;

    console.log('📋 Query parameters received:');
    console.log('   d (domain):', d);
    console.log('   u (protected URL length):', u?.length);
    console.log('   p (password):', p ? '***' + p.slice(-3) : 'none');
    console.log('   i (link ID length):', i?.length);
    console.log('   t (timestamp):', t);
    console.log('   h (hash length):', h?.length);
    console.log('   s (signature length):', s?.length);

    // Validate required parameters with better error messages
    const missing = [];
    if (!d) missing.push('d (domain)');
    if (!u) missing.push('u (protected URL)');
    if (!p) missing.push('p (password)');
    if (!i) missing.push('i (link ID)');
    if (!t) missing.push('t (timestamp)');
    if (!h) missing.push('h (hash)');
    if (!s) missing.push('s (signature)');

    if (missing.length > 0) {
      console.error(`❌ Missing parameters in request ${requestId}:`, missing);
      
      return res.status(400).json({
        error: 'Missing required parameters',
        code: 'MISSING_PARAMETERS',
        missing,
        id: requestId
      });
    }

    console.log('🛡️ Initializing URL protector for resolution...');
    
    try {
      const protector = new SophosURLProtector(getSecretKey());
      console.log('✅ URL protector initialized successfully');
      
      console.log('🔍 Resolving protected URL...');
      const result = await protector.resolveProtectedURL({
        d, u, p, i, t, h, s
      });

      if (!result || !result.originalURL) {
        throw new Error('Resolution returned invalid result - no originalURL found');
      }

      console.log(`✅ Resolve request ${requestId} completed successfully`);
      console.log('   Redirecting to:', result.originalURL);
      console.log('   Result details:', {
        success: result.success,
        originalURL: result.originalURL,
        message: result.message
      });

      // Add security headers for redirect
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Perform the redirect
      return res.redirect(302, result.originalURL);

    } catch (protectionError) {
      console.error(`❌ URL Protection error in request ${requestId}:`, {
        message: protectionError.message,
        stack: protectionError.stack,
        name: protectionError.name
      });
      
      throw new Error(`Security validation failed: ${protectionError.message}`);
    }

  } catch (error) {
    console.error(`❌ Resolve request ${requestId} failed:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return JSON error for API consistency
    return res.status(400).json({
      error: error.message,
      code: 'RESOLUTION_FAILED',
      id: requestId,
      timestamp: new Date().toISOString()
    });
  } finally {
    console.log(`=== END RESOLUTION REQUEST ${requestId} ===\n`);
  }
}