import { SophosURLProtector } from '../lib/sophos-protector.js';

console.log('🚀 API endpoint loaded successfully!');

// Landing page handler
const handleLandingPage = (res) => {
  console.log('🏠 Landing page accessed');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure URL Resolution Service</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #333;
        }
        .container { max-width: 800px; width: 100%; }
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 50px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .logo { font-size: 3rem; margin-bottom: 20px; }
        h1 { color: #2d3748; font-size: 2.5rem; margin-bottom: 15px; font-weight: 700; }
        .subtitle { color: #4a5568; font-size: 1.3rem; margin-bottom: 30px; line-height: 1.5; }
        .status {
            display: inline-block;
            background: #48bb78;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 30px;
            font-size: 0.9rem;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 25px;
            margin: 40px 0;
        }
        .feature {
            padding: 25px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 15px;
            border: 1px solid rgba(102, 126, 234, 0.2);
        }
        .feature-icon { font-size: 2rem; margin-bottom: 15px; }
        .feature h3 { color: #2d3748; margin-bottom: 10px; font-size: 1.1rem; }
        .feature p { color: #4a5568; font-size: 0.9rem; line-height: 1.4; }
        .info {
            background: #f7fafc;
            padding: 25px;
            border-radius: 15px;
            margin-top: 30px;
            border-left: 4px solid #667eea;
        }
        .info h3 { color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; }
        .info p { color: #4a5568; line-height: 1.5; margin-bottom: 10px; }
        .timestamp {
            margin-top: 25px;
            color: #718096;
            font-size: 0.8rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }
        @media (max-width: 768px) {
            .card { padding: 30px 20px; }
            h1 { font-size: 2rem; }
            .subtitle { font-size: 1.1rem; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">🛡️</div>
            <h1>Secure URL Resolution Service</h1>
            <div class="subtitle">Advanced protection for your links with encryption, expiration, and threat detection</div>
            <div class="status">✅ System Operational</div>
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🔒</div>
                    <h3>Military-Grade Encryption</h3>
                    <p>All URLs are encrypted using AES-256 encryption for maximum security</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">⏰</div>
                    <h3>Time-Limited Access</h3>
                    <p>Automatic expiration ensures links are only valid for specified time periods</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🛡️</div>
                    <h3>Threat Protection</h3>
                    <p>Advanced security checks prevent malicious redirects and phishing attempts</p>
                </div>
            </div>
            <div class="info">
                <h3>About This Service</h3>
                <p>This resolution service securely processes protected URLs and redirects users to their intended destination after comprehensive security validation.</p>
                <p>Each request is verified for integrity, expiration, and authenticity before any redirection occurs.</p>
            </div>
            <div class="timestamp">Service Status: Operational • Last Updated: ${new Date().toLocaleString()}</div>
        </div>
    </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
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

  // Show landing page for root and test endpoints
  if (req.url === '/' || req.url === '/test' || Object.keys(req.query).length === 0) {
    return handleLandingPage(res);
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