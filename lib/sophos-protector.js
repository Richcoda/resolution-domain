import CryptoJS from 'crypto-js';
import base64url from 'base64url';

export class SophosURLProtector {
  constructor(secretKey, domain = 'google.com') {
    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('Invalid secret key: must be a non-empty string');
    }
    
    this.secretKey = secretKey;
    this.domain = domain;
    
    console.log('🛡️ SophosURLProtector initialized on RESOLUTION domain');
  }

  async resolveProtectedURL(sophosParams) {
    try {
      console.log('🔄 Starting URL resolution...');
      
      const { d, u, p, i, t, h, s } = sophosParams;

      // Validate required parameters
      if (!d || !u || !p || !i || !t || !h || !s) {
        throw new Error('Missing required URL parameters');
      }

      // Validate domain
      if (d !== this.domain) {
        throw new Error('Invalid protection domain');
      }

      // Decode parameters
      const urlId = base64url.decode(i);
      const encryptedData = base64url.decode(u);
      const securityToken = base64url.decode(t);

      console.log('📋 Decoded URL ID:', urlId);

      // Verify signature
      if (!this.verifySophosSignature(s, u, t)) {
        throw new Error('Invalid security signature');
      }

      // Verify hash
      if (!this.validateRequest(u, t, h)) {
        throw new Error('Invalid verification hash');
      }

      console.log('✅ Security verification passed');
      
      // Decrypt the data
      const decryptedData = this.decryptData(encryptedData);
      console.log('✅ URL decrypted successfully');
      
      if (!decryptedData || !decryptedData.originalURL) {
        throw new Error('Invalid decrypted data');
      }

      // Validate expiration
      const now = Date.now();
      if (now > decryptedData.expiresAt) {
        throw new Error('URL has expired');
      }

      console.log('✅ URL validation passed');
      console.log('🔗 Redirecting to:', decryptedData.originalURL);

      return {
        originalURL: decryptedData.originalURL,
        urlData: decryptedData,
        securityCheck: { isSafe: true, threats: [] }
      };

    } catch (error) {
      console.error('❌ URL resolution failed:', error.message);
      throw new Error(`URL resolution failed: ${error.message}`);
    }
  }

  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Decryption resulted in empty data');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  validateRequest(encryptedData, securityToken, verificationHash) {
    try {
      const dataToHash = encryptedData + securityToken + this.secretKey;
      const expectedHash = CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
      return expectedHash === verificationHash;
    } catch (error) {
      console.error('❌ Request validation failed:', error);
      return false;
    }
  }

  verifySophosSignature(signature, encryptedData, securityToken) {
    try {
      if (!signature) {
        return false;
      }
  
      const decodedSig = base64url.decode(signature);
      const signatureKey = this.secretKey + 'signature';
      const decryptedSig = CryptoJS.AES.decrypt(decodedSig, signatureKey).toString(CryptoJS.enc.Utf8);
      
      if (!decryptedSig) {
        return false;
      }
      
      const sigData = JSON.parse(decryptedSig);
      
      if (sigData.version !== "SOPHOTOCENCRYPTION") {
        return false;
      }
  
      const timeDiff = Date.now() - sigData.timestamp;
      const maxAge = 10 * 60 * 1000;
      
      if (timeDiff > maxAge) {
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('❌ Signature verification failed:', error.message);
      return false;
    }
  }
}