import CryptoJS from 'crypto-js';
import base64url from 'base64url';

console.log('🛡️ SophosProtector loaded successfully');

export class SophosURLProtector {
  constructor(secretKey) {
    if (!secretKey) throw new Error('Secret key required');
    this.secretKey = secretKey;
    console.log('✅ Protector initialized');
  }

  async resolveProtectedURL({ d, u, p, i, t, h, s }) {
    console.log('🔄 Starting URL resolution...');
    
    try {
      // Basic parameter check
      if (!d || !u || !i || !t || !h || !s) {
        throw new Error('Missing required security parameters');
      }

      // Decode the parameters
      const encryptedData = base64url.decode(u);
      const securityToken = base64url.decode(t);
      
      console.log('📦 Parameters decoded');

      // Verify signature
      if (!this.verifySignature(s)) {
        throw new Error('Security signature invalid');
      }

      // Verify hash
      if (!this.validateHash(u, t, h)) {
        throw new Error('Security hash invalid');
      }

      // Decrypt the URL data
      const decryptedData = this.decryptData(encryptedData);
      
      if (!decryptedData?.originalURL) {
        throw new Error('Invalid decrypted data - no URL found');
      }

      // Check expiration
      if (Date.now() > decryptedData.expiresAt) {
        throw new Error('URL has expired');
      }

      console.log('🎯 Resolution successful');
      return {
        success: true,
        originalURL: decryptedData.originalURL
      };

    } catch (error) {
      console.error('🔴 Resolution failed:', error.message);
      throw error;
    }
  }

  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - check secret key');
      }
      
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error(`Decryption error: ${error.message}`);
    }
  }

  validateHash(encryptedData, securityToken, verificationHash) {
    try {
      const dataToHash = encryptedData + securityToken + this.secretKey;
      const expectedHash = CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
      return expectedHash === verificationHash;
    } catch (error) {
      return false;
    }
  }

  verifySignature(signature) {
    try {
      if (!signature) return false;
      
      const decodedSig = base64url.decode(signature);
      const signatureKey = this.secretKey + 'signature';
      const decryptedSig = CryptoJS.AES.decrypt(decodedSig, signatureKey).toString(CryptoJS.enc.Utf8);
      
      if (!decryptedSig) return false;
      
      const sigData = JSON.parse(decryptedSig);
      
      // Check version and timestamp
      if (sigData.version !== "SOPHOTOCENCRYPTION") return false;
      if (Date.now() - sigData.timestamp > 720 * 60 * 60 * 1000) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  }
}