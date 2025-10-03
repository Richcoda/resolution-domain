import { SophosURLProtector } from '../lib/sophos-protector.js';

console.log('🚀 API endpoint loaded successfully!');

// Simple test to verify the function is working
const handleTest = (res) => {
  console.log('✅ Test endpoint called');
  return res.status(200).json({
    status: 'SUCCESS',
    message: 'API is working! 🎉',
    timestamp: new Date().toISOString(),
    structure: 'Your API structure is correct'
  });
};

const getSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;
  console.log('🔑 Secret Key Check:', {
    exists: !!secretKey,
    length: secretKey ? secretKey.length : 0
  });
  
  if (!secretKey) {
    throw new Error('SECRET_KEY is not set in Vercel environment variables');
  }
  return secretKey;
};

export default async function handler(req, res) {
  console.log('📨 Request received:', {
    url: req.url,
    method: req.method,
    query: req.query
  });

  // Immediate test endpoint
  if (req.url.includes('/test') || Object.keys(req.query).length === 0) {
    return handleTest(res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET method allowed' });
  }

  try {
    const { d, u, p, i, t, h, s } = req.query;
    
    console.log('🔍 Processing parameters:', { d, u: u?.substring(0, 10), i: i?.substring(0, 10) });

    // Quick validation
    if (!d || !u) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['d', 'u', 'p', 'i', 't', 'h', 's'],
        received: Object.keys(req.query)
      });
    }

    const protector = new SophosURLProtector(getSecretKey());
    const result = await protector.resolveProtectedURL({ d, u, p, i, t, h, s });
    
    console.log('✅ Redirecting to:', result.originalURL);
    return res.redirect(302, result.originalURL);

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
}