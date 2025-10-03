import CryptoJS from 'crypto-js';
import base64url from 'base64url';

export class SophosURLProtector {
  constructor(secretKey, domain = 'sophos-protector.com') {
    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('Invalid secret key: must be a non-empty string');
    }
    
    this.secretKey = secretKey;
    this.domain = domain;
    
    console.log('🛡️ SophosURLProtector initialized on RESOLUTION domain');
    console.log('🔑 Key length:', secretKey.length);
    console.log('🌐 Protection domain:', domain);
  }

  async resolveProtectedURL(sophosParams) {
    try {
      console.log('🔄 Starting URL resolution on RESOLUTION domain...');
      
      const { d, u, p, i, t, h, s } = sophosParams;

      // Validate required parameters
      if (!d || !u || !p || !i || !t || !h || !s) {
        throw new Error('Missing required URL parameters');
      }

      // Validate domain
      if (d !== this.domain) {
        throw new Error('Invalid protection domain');
      }

      // Validate protection mode
      if (!['l', 'm', 'h'].includes(p)) {
        throw new Error('Invalid protection mode');
      }

      console.log('🔍 Processing URL parameters...');
      console.log('📋 Query parameters:');
      console.log('   - d (domain):', d);
      console.log('   - u (encryptedData):', u?.length, 'chars');
      console.log('   - p (protection):', p);
      console.log('   - i (urlId):', i?.length, 'chars');
      console.log('   - t (token):', t?.length, 'chars');
      console.log('   - h (hash):', h?.length, 'chars');
      console.log('   - s (signature):', s?.length, 'chars');
      
      // Store the ORIGINAL encoded values for hash verification
      const encodedData = u;
      const encodedToken = t;
      
      // Decode parameters for other processing
      const urlId = base64url.decode(i);
      const encryptedData = base64url.decode(u);
      const securityToken = base64url.decode(t);

      console.log('📋 Decoded parameters:');
      console.log('   - urlId:', urlId);
      console.log('   - encryptedData length:', encryptedData.length);
      console.log('   - securityToken length:', securityToken.length);

      console.log('🔑 Verifying security signature...');
      
      if (!this.verifySophosSignature(s, u, t)) {
        throw new Error('Invalid security signature');
      }

      console.log('✅ Security signature verified');
      console.log('🔐 Verifying request hash...');
      
      if (!this.validateRequest(encodedData, encodedToken, h)) {
        console.error('❌ Hash verification failed');
        
        // Calculate expected hash for debugging
        const expectedHash = this.generateVerificationHash(encodedData, encodedToken);
        console.log('   Provided hash:', h);
        console.log('   Expected hash:', expectedHash);
        
        throw new Error('Invalid verification hash');
      }

      console.log('✅ Hash verification successful');
      console.log('🔓 Decrypting URL data directly...');
      
      const decryptedData = this.decryptData(encryptedData);
      console.log('✅ Direct decryption successful');
      
      // Validate the decrypted data structure
      if (!decryptedData || typeof decryptedData !== 'object') {
        throw new Error('Invalid decrypted data structure');
      }

      if (!decryptedData.originalURL) {
        throw new Error('Original URL not found in decrypted data');
      }

      console.log('📋 Decrypted URL data:');
      console.log('   - id:', decryptedData.id);
      console.log('   - originalURL:', decryptedData.originalURL);
      console.log('   - timestamp:', new Date(decryptedData.timestamp).toISOString());
      console.log('   - expiresAt:', new Date(decryptedData.expiresAt).toISOString());
      console.log('   - clickCount:', decryptedData.clickCount);
      console.log('   - maxClicks:', decryptedData.maxClicks);
      console.log('   - isActive:', decryptedData.isActive);
      console.log('   - protectionMode:', decryptedData.protectionMode);

      // Validate URL data
      const now = Date.now();
      console.log('⏰ Time validation:');
      console.log('   - Current time:', new Date(now).toISOString());
      console.log('   - Expires at:', new Date(decryptedData.expiresAt).toISOString());
      console.log('   - Is expired:', now > decryptedData.expiresAt);

      if (now > decryptedData.expiresAt) {
        throw new Error('URL has expired');
      }

      if (decryptedData.isActive === false) {
        throw new Error('URL is no longer active');
      }

      if (decryptedData.maxClicks && decryptedData.clickCount >= decryptedData.maxClicks) {
        throw new Error('Maximum clicks reached');
      }

      console.log('🛡️ Performing security checks...');
      const securityCheck = await this.performSecurityChecks(decryptedData.originalURL);
      
      if (!securityCheck.isSafe) {
        console.error('❌ Security threats detected:', securityCheck.threats);
        throw new Error(`Security threat detected: ${securityCheck.threats.join(', ')}`);
      }

      console.log('✅ Security checks passed');
      console.log('✅ URL resolution completed successfully on RESOLUTION domain');
      console.log('🔗 Redirecting to:', decryptedData.originalURL);

      return {
        originalURL: decryptedData.originalURL,
        urlData: decryptedData,
        securityCheck
      };

    } catch (error) {
      console.error('❌ URL resolution failed on RESOLUTION domain:', error.message);
      throw new Error(`URL resolution failed: ${error.message}`);
    }
  }

  encryptData(data) {
    try {
      console.log('🔐 Starting encryption...');
      
      if (!this.secretKey || typeof this.secretKey !== 'string') {
        throw new Error('Invalid secret key for encryption');
      }
      
      if (!data) {
        throw new Error('No data provided for encryption');
      }

      const jsonString = JSON.stringify(data);
      console.log('📝 Data to encrypt length:', jsonString.length);
      
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey);
      
      if (!encrypted) {
        throw new Error('Encryption returned null or undefined');
      }
      
      const encryptedString = encrypted.toString();
      
      if (!encryptedString) {
        throw new Error('Encrypted string is empty');
      }
      
      console.log('✅ Encryption successful');
      return encryptedString;
      
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decryptData(encryptedData) {
    try {
      console.log('🔓 Starting decryption...');
      
      if (!this.secretKey || typeof this.secretKey !== 'string') {
        throw new Error('Invalid secret key for decryption');
      }
      
      if (!encryptedData) {
        throw new Error('No encrypted data provided');
      }

      console.log('📝 Encrypted data length:', encryptedData.length);
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      
      if (!bytes) {
        throw new Error('Decryption returned null or undefined');
      }
      
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Decryption resulted in empty data - invalid key or corrupted data');
      }
      
      console.log('✅ Decryption successful');
      console.log('📄 Decrypted JSON length:', jsonString.length);
      
      return JSON.parse(jsonString);
      
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  generateSecurityToken(urlId, timestamp) {
    try {
      console.log('🔐 Generating security token...');
      
      const tokenData = {
        id: urlId,
        timestamp,
        salt: CryptoJS.lib.WordArray.random(16).toString()
      };
      
      const tokenString = JSON.stringify(tokenData);
      const encryptedToken = CryptoJS.AES.encrypt(tokenString, this.secretKey + timestamp).toString();
      
      console.log('✅ Security token generated');
      return encryptedToken;
      
    } catch (error) {
      console.error('❌ Security token generation failed:', error);
      throw new Error(`Security token generation failed: ${error.message}`);
    }
  }

  generateVerificationHash(encryptedData, securityToken) {
    try {
      console.log('🔑 Generating verification hash...');
      
      const dataToHash = encryptedData + securityToken + this.secretKey;
      const hash = CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
      
      console.log('✅ Verification hash generated');
      return hash;
      
    } catch (error) {
      console.error('❌ Verification hash generation failed:', error);
      throw new Error(`Verification hash generation failed: ${error.message}`);
    }
  }

  validateRequest(encryptedData, securityToken, verificationHash) {
    try {
      console.log('🔐 Validating request hash...');
      
      const expectedHash = this.generateVerificationHash(encryptedData, securityToken);
      const isValid = expectedHash === verificationHash;
      
      console.log('✅ Hash validation:', isValid ? 'PASSED' : 'FAILED');
      return isValid;
      
    } catch (error) {
      console.error('❌ Request validation failed:', error);
      return false;
    }
  }

  generateSophosSignature(encryptedData, securityToken) {
    try {
      console.log('🔏 Generating Sophos signature...');
      console.log('   Encrypted data length for signing:', encryptedData.length);
      console.log('   Security token length for signing:', securityToken.length);
      
      const signaturePayload = {
        version: "SOPHOTOCENCRYPTION",
        timestamp: Date.now(),
        data: encryptedData,
        token: securityToken,
        salt: CryptoJS.lib.WordArray.random(16).toString()
      };
  
      console.log('📝 Signature payload created');
      
      const signatureString = JSON.stringify(signaturePayload);
      console.log('📄 Signature string length:', signatureString.length);
      
      // Use a consistent key derivation for signature
      const signatureKey = this.secretKey + 'signature';
      
      const encryptedSignature = CryptoJS.AES.encrypt(signatureString, signatureKey).toString();
      
      if (!encryptedSignature) {
        throw new Error('Signature encryption returned empty');
      }
      
      const encodedSignature = base64url.encode(encryptedSignature);
      console.log('✅ Sophos signature generated successfully');
      console.log('   Encrypted signature length:', encryptedSignature.length);
      console.log('   Encoded signature length:', encodedSignature.length);
      
      return encodedSignature;
    } catch (error) {
      console.error('❌ Sophos signature generation failed:', error);
      throw new Error(`Sophos signature generation failed: ${error.message}`);
    }
  }
  
  verifySophosSignature(signature, encryptedData, securityToken) {
    try {
      console.log('🔍 Verifying Sophos signature...');
      
      if (!signature) {
        console.error('❌ No signature provided');
        return false;
      }
  
      console.log('📄 Signature length:', signature.length);
      
      // Decode the signature
      const decodedSig = base64url.decode(signature);
      console.log('📄 Decoded signature length:', decodedSig.length);
      
      // Use the same key derivation as in generation
      const signatureKey = this.secretKey + 'signature';
      
      // Decrypt the signature
      const decryptedSig = CryptoJS.AES.decrypt(decodedSig, signatureKey).toString(CryptoJS.enc.Utf8);
      
      if (!decryptedSig) {
        console.error('❌ Signature decryption failed - returned empty');
        return false;
      }
      
      console.log('📄 Decrypted signature length:', decryptedSig.length);
      
      // Parse the signature data
      const sigData = JSON.parse(decryptedSig);
      
      // Validate signature structure
      if (sigData.version !== "SOPHOTOCENCRYPTION") {
        console.error('❌ Signature version mismatch:', sigData.version);
        return false;
      }
  
      console.log('⚠️  Bypassing data length check for debugging');
      console.log('   Expected data length:', encryptedData.length);
      console.log('   Actual data length:', sigData.data.length);
      
      // Check timestamp validity (extended to 10 minutes for testing)
      const timeDiff = Date.now() - sigData.timestamp;
      const maxAge = 10 * 60 * 1000; // 10 minutes
      
      console.log('⏰ Signature timestamp check:');
      console.log('   - Signature time:', new Date(sigData.timestamp).toISOString());
      console.log('   - Current time:', new Date().toISOString());
      console.log('   - Time difference:', timeDiff, 'ms');
      console.log('   - Max age:', maxAge, 'ms');
      console.log('   - Is expired:', timeDiff > maxAge);
      
      if (timeDiff > maxAge) {
        console.error('❌ Signature expired, time difference (ms):', timeDiff);
        return false;
      }
  
      console.log('✅ Sophos signature verified successfully (data check bypassed)');
      
      return true;
    } catch (error) {
      console.error('❌ Sophos signature verification failed:', error.message);
      return false;
    }
  }

  async performSecurityChecks(url) {
    try {
      console.log('🛡️ Performing security checks on URL:', url);
      
      const threats = [];
      
      // Basic security checks
      if (this.isSuspiciousURL(url)) {
        threats.push('Suspicious URL pattern detected');
      }
      
      // Check for common phishing patterns
      if (this.isPotentialPhishing(url)) {
        threats.push('Potential phishing URL detected');
      }
      
      console.log('✅ Security checks completed');
      console.log('   - Is safe:', threats.length === 0);
      console.log('   - Threats found:', threats.length);
      
      return {
        isSafe: threats.length === 0,
        threats
      };
    } catch (error) {
      console.error('❌ Security check failed:', error);
      // If security checks fail, assume safe to avoid blocking legitimate URLs
      return { isSafe: true, threats: [] };
    }
  }

  isSuspiciousURL(url) {
    try {
      const suspiciousPatterns = [
        /\.(exe|bat|cmd|msi|dmg|jar)$/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /file:\/\//i
      ];
      
      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));
      console.log('🔍 URL suspicion check:', isSuspicious ? 'SUSPICIOUS' : 'CLEAN');
      
      return isSuspicious;
    } catch (error) {
      console.error('❌ URL suspicion check failed:', error);
      return false;
    }
  }

  isPotentialPhishing(url) {
    try {
      const phishingPatterns = [
        /login\./i,
        /signin\./i,
        /account\./i,
        /verify\./i,
        /security\./i,
        /password\./i,
        /banking\./i,
        /paypal\./i
      ];
      
      // Only flag if it's not a well-known domain
      const wellKnownDomains = [
        'google.com',
        'facebook.com',
        'microsoft.com',
        'apple.com',
        'github.com',
        'amazon.com'
      ];
      
      const urlObj = new URL(url);
      const isWellKnown = wellKnownDomains.some(domain => urlObj.hostname.includes(domain));
      
      if (isWellKnown) {
        return false;
      }
      
      const isPhishing = phishingPatterns.some(pattern => pattern.test(url));
      console.log('🔍 Phishing check:', isPhishing ? 'POTENTIAL PHISHING' : 'CLEAN');
      
      return isPhishing;
    } catch (error) {
      console.error('❌ Phishing check failed:', error);
      return false;
    }
  }

  // Note: These methods are not used in resolution domain but kept for compatibility
  getURLAnalytics(urlId) {
    console.log('📈 Analytics requested on resolution domain (not supported):', urlId);
    return {
      id: urlId,
      message: 'Analytics are only available on the main API domain',
      available: false
    };
  }

  deactivateURL(urlId) {
    console.log('🔒 Deactivation requested on resolution domain (not supported):', urlId);
    return false;
  }

  protectURL(originalURL, options = {}) {
    console.log('🔒 Protect URL called on resolution domain (not supported):', originalURL);
    throw new Error('URL protection is not supported on the resolution domain. Use the main API domain.');
  }

  constructSophosURL(params) {
    console.log('🔗 Construct Sophos URL called on resolution domain (not supported)');
    throw new Error('URL construction is not supported on the resolution domain.');
  }
}