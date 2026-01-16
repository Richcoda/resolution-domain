import { SophosURLProtector } from '../lib/sophos-protector.js';

console.log('🚀 API endpoint loaded successfully!');

// Generate random math captcha
const generateMathCaptcha = () => {
  const operators = ['+', '-', '×'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1, num2, answer;
  
  switch(operator) {
    case '+':
      num1 = Math.floor(Math.random() * 10) + 5;
      num2 = Math.floor(Math.random() * 10) + 5;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 15) + 10;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 - num2;
      break;
    case '×':
      num1 = Math.floor(Math.random() * 6) + 2;
      num2 = Math.floor(Math.random() * 6) + 2;
      answer = num1 * num2;
      break;
  }
  
  return {
    question: `${num1} ${operator} ${num2} = ?`,
    answer: answer.toString(),
    display: `${num1} ${operator} ${num2}`
  };
};

// Generate word verification captcha
const generateWordCaptcha = () => {
  const words = [
    { word: 'secure', answer: 'secure' },
    { word: 'verify', answer: 'verify' },
    { word: 'access', answer: 'access' },
    { word: 'safety', answer: 'safety' },
    { word: 'shield', answer: 'shield' },
    { word: 'guard', answer: 'guard' }
  ];
  
  const selected = words[Math.floor(Math.random() * words.length)];
  return {
    question: `Type the word: <strong>${selected.word}</strong>`,
    answer: selected.answer,
    display: selected.word
  };
};

// Generate number sequence captcha
const generateSequenceCaptcha = () => {
  const start = Math.floor(Math.random() * 5) + 1;
  const sequence = `${start}, ${start + 2}, ${start + 4}, ?`;
  const answer = start + 6;
  
  return {
    question: `Complete the sequence: ${sequence}`,
    answer: answer.toString(),
    display: sequence
  };
};

// Generate multiple captchas
const generateCaptchas = (count = 3) => {
  const captchaTypes = [generateMathCaptcha, generateWordCaptcha, generateSequenceCaptcha];
  const captchas = [];
  
  for (let i = 0; i < count; i++) {
    const typeIndex = Math.floor(Math.random() * captchaTypes.length);
    captchas.push(captchaTypes[typeIndex]());
  }
  
  return captchas;
};

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
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23667eea'/><text x='50' y='70' font-family='Arial' font-size='60' text-anchor='middle' fill='white'>🛡️</text></svg>">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23667eea'/><text x='50' y='70' font-family='Arial' font-size='60' text-anchor='middle' fill='white'>🛡️</text></svg>">
    <meta name="theme-color" content="#667eea">
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

// Captcha verification page
const handleCaptchaVerification = (res, originalURL) => {
  console.log('🔐 Showing captcha verification for URL:', originalURL);
  
  // Generate 3 captchas
  const captchas = generateCaptchas(3);
  
  // Create a simple hash for validation (in production, use more secure method)
  const validationData = captchas.map(c => c.answer).join('|');
  const timestamp = Date.now();
  const validationToken = Buffer.from(`${validationData}|${timestamp}|${originalURL}`).toString('base64');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Human Verification Required</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23667eea'/><text x='50' y='70' font-family='Arial' font-size='60' text-anchor='middle' fill='white'>🛡️</text></svg>">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23667eea'/><text x='50' y='70' font-family='Arial' font-size='60' text-anchor='middle' fill='white'>🛡️</text></svg>">
    <meta name="theme-color" content="#667eea">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px 20px;
            color: white;
        }
        
        .verification-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
            width: 100%;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        
        .header h1 {
            font-size: 1.8rem;
            color: #2d3748;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #4a5568;
            line-height: 1.5;
        }
        
        .captcha-section {
            margin-bottom: 25px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
        }
        
        .captcha-title {
            font-size: 1rem;
            color: #2d3748;
            margin-bottom: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .captcha-title::before {
            content: '${captchas.length === 3 ? '🔢' : '🔒'}';
            font-size: 1.2rem;
        }
        
        .captcha-question {
            font-size: 1.1rem;
            color: #2d3748;
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border: 1px solid #cbd5e0;
            font-weight: 500;
            text-align: center;
        }
        
        .captcha-input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #cbd5e0;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        
        .captcha-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .captcha-input.valid {
            border-color: #48bb78;
            background-color: #f0fff4;
        }
        
        .captcha-input.invalid {
            border-color: #f56565;
            background-color: #fff5f5;
        }
        
        .security-info {
            background: #edf2f7;
            padding: 15px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
            font-size: 0.9rem;
            color: #4a5568;
        }
        
        .verify-button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        
        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .verify-button:disabled {
            background: #a0aec0;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-message {
            color: #f56565;
            font-size: 0.9rem;
            margin-top: 5px;
            display: none;
        }
        
        .success-message {
            color: #48bb78;
            font-size: 0.9rem;
            margin-top: 5px;
            display: none;
        }
        
        .timer {
            text-align: center;
            margin: 15px 0;
            font-size: 0.9rem;
            color: #4a5568;
        }
        
        .attempts {
            font-size: 0.8rem;
            color: #718096;
            text-align: center;
            margin-top: 15px;
        }
        
        @media (max-width: 480px) {
            .verification-container {
                padding: 25px 20px;
            }
            
            .captcha-section {
                padding: 15px;
            }
            
            .captcha-question {
                font-size: 1rem;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="verification-container">
        <div class="header">
            <div class="header-icon">🛡️</div>
            <h1>Human Verification Required</h1>
            <p>Complete these simple challenges to prove you're human and access the secure link.</p>
        </div>
        
        ${captchas.map((captcha, index) => `
        <div class="captcha-section">
            <div class="captcha-title">Challenge ${index + 1} of ${captchas.length}</div>
            <div class="captcha-question">${captcha.question}</div>
            <input type="text" 
                   class="captcha-input" 
                   id="captcha${index}" 
                   placeholder="Enter your answer here"
                   data-answer="${captcha.answer}"
                   data-original="${captcha.display}">
            <div class="error-message" id="error${index}">Incorrect answer. Please try again.</div>
            <div class="success-message" id="success${index}">✓ Correct!</div>
        </div>
        `).join('')}
        
        <div class="security-info">
            🔒 This verification helps prevent automated access and ensures secure redirection.
        </div>
        
        <div class="timer">
            ⏱️ Complete all challenges within 3 minutes
        </div>
        
        <button class="verify-button" id="verifyBtn" disabled>
            Verify & Continue
        </button>
        
        <div class="loading" id="loading">
            <div class="loading-spinner"></div>
            <p>Verifying answers and preparing redirect...</p>
        </div>
        
        <div class="attempts" id="attemptCounter">
            Attempts remaining: 3
        </div>
    </div>

    <script>
        const captchaInputs = ${JSON.stringify(captchas.map((c, i) => ({ id: `captcha${i}`, answer: c.answer })))};
        const validationToken = "${validationToken}";
        let attempts = 3;
        let startTime = Date.now();
        const timeLimit = 3 * 60 * 1000; // 3 minutes
        
        function updateButtonState() {
            const allAnswered = captchaInputs.every((_, index) => {
                const input = document.getElementById('captcha' + index);
                return input && input.value.trim() !== '';
            });
            
            const verifyBtn = document.getElementById('verifyBtn');
            verifyBtn.disabled = !allAnswered;
        }
        
        function validateCaptcha(input, index) {
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = captchaInputs[index].answer.toLowerCase();
            const errorEl = document.getElementById('error' + index);
            const successEl = document.getElementById('success' + index);
            
            // Remove previous classes
            input.classList.remove('valid', 'invalid');
            errorEl.style.display = 'none';
            successEl.style.display = 'none';
            
            if (userAnswer === correctAnswer) {
                input.classList.add('valid');
                successEl.style.display = 'block';
                return true;
            } else if (userAnswer !== '') {
                input.classList.add('invalid');
                errorEl.style.display = 'block';
                return false;
            }
            
            return null;
        }
        
        // Add event listeners to all captcha inputs
        captchaInputs.forEach((_, index) => {
            const input = document.getElementById('captcha' + index);
            if (input) {
                input.addEventListener('input', () => {
                    validateCaptcha(input, index);
                    updateButtonState();
                });
                
                // Auto-check on blur
                input.addEventListener('blur', () => {
                    validateCaptcha(input, index);
                });
            }
        });
        
        // Verify button handler
        document.getElementById('verifyBtn').addEventListener('click', async () => {
            // Check time limit
            const timeElapsed = Date.now() - startTime;
            if (timeElapsed > timeLimit) {
                alert('Verification time expired. Please refresh the page and try again.');
                return;
            }
            
            // Validate all captchas
            const allCorrect = captchaInputs.every((_, index) => {
                const input = document.getElementById('captcha' + index);
                return validateCaptcha(input, index) === true;
            });
            
            if (!allCorrect) {
                attempts--;
                document.getElementById('attemptCounter').textContent = 'Attempts remaining: ' + attempts;
                
                if (attempts <= 0) {
                    alert('Too many failed attempts. Please refresh the page to try again.');
                    document.getElementById('verifyBtn').disabled = true;
                } else {
                    alert('Some answers are incorrect. Please check and try again.');
                }
                return;
            }
            
            // All correct - show loading and redirect
            document.getElementById('verifyBtn').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
            
            // Create form data
            const formData = new FormData();
            formData.append('token', validationToken);
            captchaInputs.forEach((_, index) => {
                const input = document.getElementById('captcha' + index);
                formData.append('answer' + index, input.value);
            });
            
            try {
                // Send verification to server
                const response = await fetch('/api/resolve/verify', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Redirect to the original URL
                    setTimeout(() => {
                        window.location.href = result.originalURL;
                    }, 1000);
                } else {
                    alert('Verification failed: ' + result.error);
                    document.getElementById('verifyBtn').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                }
            } catch (error) {
                alert('Network error. Please try again.');
                document.getElementById('verifyBtn').style.display = 'block';
                document.getElementById('loading').style.display = 'none';
            }
        });
        
        // Enable form submission with Enter key
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const verifyBtn = document.getElementById('verifyBtn');
                if (!verifyBtn.disabled) {
                    verifyBtn.click();
                }
            }
        });
        
        // Auto-focus first input
        document.getElementById('captcha0')?.focus();
        
        // Start timer
        setInterval(() => {
            const timeLeft = Math.max(0, timeLimit - (Date.now() - startTime));
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            document.querySelector('.timer').innerHTML = 
                '⏱️ Time remaining: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            
            if (timeLeft <= 0) {
                document.getElementById('verifyBtn').disabled = true;
                document.querySelector('.timer').innerHTML = '⏱️ Time expired! Please refresh.';
            }
        }, 1000);
    </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};

// Captcha verification endpoint
const handleCaptchaVerificationCheck = async (req, res) => {
  console.log('🔍 Processing captcha verification');
  
  try {
    const body = await parseFormData(req);
    const token = body.token;
    const answers = [];
    
    // Extract answers from form data
    Object.keys(body).forEach(key => {
      if (key.startsWith('answer')) {
        answers.push(body[key].trim().toLowerCase());
      }
    });
    
    // Decode and validate token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('|');
    
    if (parts.length < 3) {
      throw new Error('Invalid verification token');
    }
    
    const expectedAnswers = parts[0].split('|').map(a => a.toLowerCase());
    const timestamp = parseInt(parts[1]);
    const originalURL = parts[2];
    
    // Check time limit (3 minutes)
    if (Date.now() - timestamp > 3 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: 'Verification expired. Please try again.'
      });
    }
    
    // Verify answers
    if (answers.length !== expectedAnswers.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid number of answers'
      });
    }
    
    const allCorrect = answers.every((answer, index) => 
      answer === expectedAnswers[index]
    );
    
    if (!allCorrect) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect verification answers'
      });
    }
    
    console.log('✅ Captcha verification successful');
    
    return res.status(200).json({
      success: true,
      originalURL: originalURL
    });
    
  } catch (error) {
    console.error('❌ Captcha verification failed:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Verification failed'
    });
  }
};

// Helper function to parse form data
const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const parsed = {};
      new URLSearchParams(body).forEach((value, key) => {
        parsed[key] = value;
      });
      resolve(parsed);
    });
    req.on('error', reject);
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

  // Handle POST requests for captcha verification
  if (req.method === 'POST' && req.url.includes('/verify')) {
    return await handleCaptchaVerificationCheck(req, res);
  }

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
    
    console.log('✅ Security validation passed, showing captcha verification');
    
    // Show captcha verification instead of immediate redirect
    return handleCaptchaVerification(res, result.originalURL);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
}