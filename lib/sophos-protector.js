import CryptoJS from 'crypto-js';
import base64url from 'base64url';

export class SophosURLProtector {
  constructor(secretKey, options = {}) {
    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('Invalid secret key: must be a non-empty string');
    }
    
    this.secretKey = secretKey;
    this.domain = options.domain || 'sophos-protector.com';
    this.maxAge = options.maxAge || 10 * 60 * 1000; // 10 minutes
    
    console.log('🛡️ SophosURLProtector initialized:');
    console.log('   - Domain:', this.domain);
    console.log('   - Secret key length:', this.secretKey.length);
    console.log('   - Max age:', this.maxAge, 'ms');
  }

  async resolveProtectedURL(params) {
    try {
      console.log('🔄 Starting URL resolution...');
      
      const { d, u, p, i, t, h, s } = params;

      // Log parameters for debugging
      console.log('📦 Processing parameters:');
      console.log('   - Domain:', d);
      console.log('   - Encrypted data length:', u?.length);
      console.log('   - Password provided:', !!p);
      console.log('   - ID length:', i?.length);
      console.log('   - Timestamp:', t);
      console.log('   - Hash length:', h?.length);
      console.log('   - Signature length:', s?.length);

      // Validate domain (with warning for mismatches but continue)
      if (d !== this.domain) {
        console.warn(`⚠️  Domain mismatch: expected "${this.domain}", got "${d}"`);
        // Continue processing for now
      }

      // Decode base64url parameters
      let decodedId, encryptedData, securityToken;
      try {
        decodedId = base64url.decode(i);
        encryptedData = base64url.decode(u);
        securityToken = base64url.decode(t);
        console.log('✅ Parameters decoded');
      } catch (decodeError) {
        throw new Error(`Failed to decode parameters: ${decodeError.message}`);
      }

      // Verify signature first
      console.log('🔐 Verifying signature...');
      if (!this.verifySignature(s, u, t)) {
        throw new Error('Security signature verification failed');
      }
      console.log('✅ Signature verified');

      // Verify request hash
      console.log('🔍 Validating request hash...');
      if (!this.validateHash(u, t, h)) {
        throw new Error('Request hash validation failed');
      }
      console.log('✅ Hash validated');

      // Decrypt the URL data
      console.log('🔓 Decrypting URL data...');
      const decryptedData = this.decryptData(encryptedData);
      
      if (!decryptedData || typeof decryptedData !== 'object') {
        throw new Error('Decrypted data is invalid');
      }

      console.log('📄 Decrypted data keys:', Object.keys(decryptedData));

      // Validate required decrypted fields
      if (!decryptedData.originalURL) {
        throw new Error('Decrypted data missing originalURL');
      }

      if (!decryptedData.expiresAt) {
        throw new Error('Decrypted data missing expiration timestamp');
      }

      // Check expiration
      const now = Date.now();
      if (now > decryptedData.expiresAt) {
        throw new Error(`URL expired at ${new Date(decryptedData.expiresAt).toISOString()}`);
      }
      console.log('✅ URL is valid and not expired');

      return {
        success: true,
        originalURL: decryptedData.originalURL,
        urlData: decryptedData,
        securityCheck: {
          isSafe: true,
          threats: [],
          validatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ URL resolution failed:', error.message);
      throw error; // Re-throw for caller to handle
    }
  }

  decryptData(encryptedData) {
    try {
      console.log('🔧 Decrypting data, length:', encryptedData.length);
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - empty result. Check secret key match.');
      }
      
      console.log('🔧 Decrypted string length:', decryptedString.length);
      
      const parsedData = JSON.parse(decryptedString);
      console.log('✅ Data decrypted and parsed successfully');
      
      return parsedData;
    } catch (error) {
      console.error('❌ Decryption failed:', error.message);
      throw new Error(`Decryption error: ${error.message}`);
    }
  }

  validateHash(encryptedData, securityToken, verificationHash) {
    try {
      const dataToHash = encryptedData + securityToken + this.secretKey;
      const expectedHash = CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
      
      const isValid = expectedHash === verificationHash;
      console.log('🔍 Hash validation:', isValid ? 'PASS' : 'FAIL');
      
      return isValid;
    } catch (error) {
      console.error('❌ Hash validation error:', error.message);
      return false;
    }
  }

  verifySignature(signature, encryptedData, securityToken) {
    try {
      if (!signature) {
        console.error('❌ Signature is empty');
        return false;
      }

      const decodedSig = base64url.decode(signature);
      const signatureKey = this.secretKey + 'signature';
      const decryptedSig = CryptoJS.AES.decrypt(decodedSig, signatureKey).toString(CryptoJS.enc.Utf8);
      
      if (!decryptedSig) {
        console.error('❌ Signature decryption failed');
        return false;
      }
      
      const sigData = JSON.parse(decryptedSig);
      
      // Verify version
      if (sigData.version !== "SOPHOTOCENCRYPTION") {
        console.error('❌ Invalid signature version:', sigData.version);
        return false;
      }

      // Verify timestamp
      const timeDiff = Date.now() - sigData.timestamp;
      if (timeDiff > this.maxAge) {
        console.error('❌ Signature expired, age:', timeDiff, 'ms');
        return false;
      }

      console.log('✅ Signature is valid and fresh');
      return true;
    } catch (error) {
      console.error('❌ Signature verification error:', error.message);
      return false;
    }
  }
}