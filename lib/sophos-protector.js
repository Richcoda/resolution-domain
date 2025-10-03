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
      
      // Store the ORIGINAL encoded values for hash verification
      const encodedData = u;
      const encodedToken = t;
      
      // Decode parameters for other processing
      const urlId = base64url.decode(i);
      const encryptedData = base64url.decode(u);
      const securityToken = base64url.decode(t);

      console.log('📋 Decoded parameters:');
      console.log('   - urlId:', urlId);

      console.log('🔑 Verifying security signature...');
      
      if (!this.verifySophosSignature(s, u, t)) {
        throw new Error('Invalid security signature');
      }

      console.log('🔐 Verifying request hash...');
      if (!this.validateRequest(encodedData, encodedToken, h)) {
        console.error('❌ Hash verification failed');
        throw new Error('Invalid verification hash');
      }

      console.log('✅ Hash verification successful');
      console.log('🔓 Decrypting URL data directly...');
      
      const decryptedData = this.decryptData(encryptedData);
      console.log('✅ Direct decryption successful');
      
      if (!decryptedData || typeof decryptedData !== 'object') {
        throw new Error('Invalid decrypted data structure');
      }

      if (!decryptedData.originalURL) {
        throw new Error('Original URL not found in decrypted data');
      }

      console.log('📋 Decrypted URL data:', {
        id: decryptedData.id,
        originalURL: decryptedData.originalURL,
        timestamp: new Date(decryptedData.timestamp).toISOString(),
        expiresAt: new Date(decryptedData.expiresAt).toISOString(),
        clickCount: decryptedData.clickCount,
        maxClicks: decryptedData.maxClicks,
        isActive: decryptedData.isActive
      });

      // Validate URL data
      const now = Date.now();
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
        throw new Error(`Security threat detected: ${securityCheck.threats.join(', ')}`);
      }

      console.log('✅ URL resolution completed successfully on RESOLUTION domain');

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
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey);
      return encrypted.toString();
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Decryption resulted in empty data - invalid key or corrupted data');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  generateSecurityToken(urlId, timestamp) {
    try {
      const tokenData = {
        id: urlId,
        timestamp,
        salt: CryptoJS.lib.WordArray.random(16).toString()
      };
      
      const tokenString = JSON.stringify(tokenData);
      return CryptoJS.AES.encrypt(tokenString, this.secretKey + timestamp).toString();
    } catch (error) {
      console.error('❌ Security token generation failed:', error);
      throw new Error(`Security token generation failed: ${error.message}`);
    }
  }

  generateVerificationHash(encryptedData, securityToken) {
    try {
      const dataToHash = encryptedData + securityToken + this.secretKey;
      return CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('❌ Verification hash generation failed:', error);
      throw new Error(`Verification hash generation failed: ${error.message}`);
    }
  }

  validateRequest(encryptedData, securityToken, verificationHash) {
    try {
      const expectedHash = this.generateVerificationHash(encryptedData, securityToken);
      return expectedHash === verificationHash;
    } catch (error) {
      console.error('❌ Request validation failed:', error);
      return false;
    }
  }

  generateSophosSignature(encryptedData, securityToken) {
    try {
      const signaturePayload = {
        version: "SOPHOTOCENCRYPTION",
        timestamp: Date.now(),
        data: encryptedData,
        token: securityToken,
        salt: CryptoJS.lib.WordArray.random(16).toString()
      };
      
      const signatureString = JSON.stringify(signaturePayload);
      const signatureKey = this.secretKey + 'signature';
      const encryptedSignature = CryptoJS.AES.encrypt(signatureString, signatureKey).toString();
      
      return base64url.encode(encryptedSignature);
    } catch (error) {
      console.error('❌ Sophos signature generation failed:', error);
      throw new Error(`Sophos signature generation failed: ${error.message}`);
    }
  }
  
  verifySophosSignature(signature, encryptedData, securityToken) {
    try {
      if (!signature) {
        console.error('❌ No signature provided');
        return false;
      }
  
      const decodedSig = base64url.decode(signature);
      const signatureKey = this.secretKey + 'signature';
      const decryptedSig = CryptoJS.AES.decrypt(decodedSig, signatureKey).toString(CryptoJS.enc.Utf8);
      
      if (!decryptedSig) {
        console.error('❌ Signature decryption failed - returned empty');
        return false;
      }
      
      const sigData = JSON.parse(decryptedSig);
      
      if (sigData.version !== "SOPHOTOCENCRYPTION") {
        console.error('❌ Signature version mismatch:', sigData.version);
        return false;
      }
  
      const timeDiff = Date.now() - sigData.timestamp;
      const maxAge = 10 * 60 * 1000;
      
      if (timeDiff > maxAge) {
        console.error('❌ Signature expired, time difference (ms):', timeDiff);
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('❌ Sophos signature verification failed:', error.message);
      return false;
    }
  }

  async performSecurityChecks(url) {
    try {
      const threats = [];
      
      if (this.isSuspiciousURL(url)) {
        threats.push('Suspicious URL pattern detected');
      }
      
      return {
        isSafe: threats.length === 0,
        threats
      };
    } catch (error) {
      console.error('❌ Security check failed:', error);
      return { isSafe: true, threats: [] };
    }
  }

  isSuspiciousURL(url) {
    try {
      const suspiciousPatterns = [
        /\.(exe|bat|cmd|msi|dmg|jar)$/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i
      ];
      
      return suspiciousPatterns.some(pattern => pattern.test(url));
    } catch (error) {
      console.error('❌ URL suspicion check failed:', error);
      return false;
    }
  }
}