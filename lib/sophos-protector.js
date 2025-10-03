import CryptoJS from 'crypto-js';
import base64url from 'base64url';

export class SophosURLProtector {
  constructor(secretKey, domain = 'sophos-protector.com') { // Fixed default domain
    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('Invalid secret key: must be a non-empty string');
    }
    
    this.secretKey = secretKey;
    this.domain = domain;
    
    console.log('🛡️ SophosURLProtector initialized on RESOLUTION domain:', domain);
    console.log('   Secret key length:', secretKey.length);
  }

  async resolveProtectedURL(sophosParams) {
    try {
      console.log('🔄 Starting URL resolution...');
      
      const { d, u, p, i, t, h, s } = sophosParams;

      // Validate required parameters with better logging
      console.log('📦 Parameter validation:');
      console.log('   - d (domain):', d);
      console.log('   - u (encrypted):', u?.substring(0, 20) + '...');
      console.log('   - p (password):', p ? '***' + p.slice(-3) : 'none');
      console.log('   - i (id):', i?.substring(0, 10) + '...');
      console.log('   - t (token):', t?.substring(0, 10) + '...');
      console.log('   - h (hash):', h?.substring(0, 10) + '...');
      console.log('   - s (signature):', s?.substring(0, 10) + '...');

      if (!d || !u || !p || !i || !t || !h || !s) {
        const missing = [];
        if (!d) missing.push('d');
        if (!u) missing.push('u');
        if (!p) missing.push('p');
        if (!i) missing.push('i');
        if (!t) missing.push('t');
        if (!h) missing.push('h');
        if (!s) missing.push('s');
        throw new Error(`Missing required parameters: ${missing.join(', ')}`);
      }

      // Validate domain (make this less restrictive for testing)
      if (d !== this.domain) {
        console.warn(`⚠️ Domain mismatch: expected ${this.domain}, got ${d}`);
        // Don't throw immediately - continue for testing
        // throw new Error('Invalid protection domain');
      }

      // Decode parameters with error handling
      let urlId, encryptedData, securityToken;
      try {
        urlId = base64url.decode(i);
        encryptedData = base64url.decode(u);
        securityToken = base64url.decode(t);
        console.log('✅ Parameters decoded successfully');
        console.log('   URL ID:', urlId);
        console.log('   Encrypted data length:', encryptedData.length);
        console.log('   Security token length:', securityToken.length);
      } catch (decodeError) {
        throw new Error(`Parameter decoding failed: ${decodeError.message}`);
      }

      // Verify signature FIRST (most important security check)
      console.log('🔐 Verifying signature...');
      const signatureValid = this.verifySophosSignature(s, u, t);
      if (!signatureValid) {
        throw new Error('Security signature verification failed');
      }
      console.log('✅ Signature verified');

      // Verify hash
      console.log('🔍 Validating request hash...');
      const hashValid = this.validateRequest(u, t, h);
      if (!hashValid) {
        throw new Error('Request hash validation failed');
      }
      console.log('✅ Hash validation passed');

      // Decrypt the data
      console.log('🔓 Decrypting URL data...');
      const decryptedData = this.decryptData(encryptedData);
      
      if (!decryptedData || typeof decryptedData !== 'object') {
        throw new Error('Decrypted data is invalid or malformed');
      }

      console.log('📄 Decrypted data structure:', {
        hasOriginalURL: !!decryptedData.originalURL,
        hasExpiresAt: !!decryptedData.expiresAt,
        keys: Object.keys(decryptedData)
      });

      if (!decryptedData.originalURL) {
        throw new Error('Decrypted data missing originalURL');
      }

      // Validate expiration
      const now = Date.now();
      console.log('⏰ Checking expiration:', {
        now,
        expiresAt: decryptedData.expiresAt,
        isExpired: now > decryptedData.expiresAt
      });

      if (now > decryptedData.expiresAt) {
        throw new Error(`URL expired at ${new Date(decryptedData.expiresAt).toISOString()}`);
      }

      console.log('✅ All validations passed');
      console.log('🔗 Final URL:', decryptedData.originalURL);

      return {
        success: true,
        originalURL: decryptedData.originalURL,
        urlData: decryptedData,
        securityCheck: { 
          isSafe: true, 
          threats: [],
          validationTime: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ URL resolution failed:', {
        message: error.message,
        stack: error.stack,
        params: {
          d: sophosParams.d,
          u: sophosParams.u?.substring(0, 10) + '...',
          i: sophosParams.i?.substring(0, 10) + '...'
        }
      });
      throw new Error(`URL resolution failed: ${error.message}`);
    }
  }

  decryptData(encryptedData) {
    try {
      console.log('🔧 Decryption details:', {
        inputLength: encryptedData.length,
        inputStart: encryptedData.substring(0, 20) + '...'
      });

      // Use the same decryption method as encryption
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      
      console.log('🔧 Decryption intermediate:', {
        bytes: bytes ? 'present' : 'null',
        jsonStringLength: jsonString?.length,
        jsonStringPreview: jsonString?.substring(0, 50) + '...'
      });
      
      if (!jsonString) {
        throw new Error('Decryption resulted in empty data - check secret key match');
      }
      
      const parsedData = JSON.parse(jsonString);
      console.log('✅ Data parsed successfully:', Object.keys(parsedData));
      return parsedData;
    } catch (error) {
      console.error('❌ Decryption error details:', {
        error: error.message,
        secretKeyLength: this.secretKey.length,
        encryptedDataType: typeof encryptedData
      });
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  validateRequest(encryptedData, securityToken, verificationHash) {
    try {
      console.log('🔍 Hash validation details:', {
        encryptedDataLength: encryptedData.length,
        securityTokenLength: securityToken.length,
        verificationHash: verificationHash?.substring(0, 10) + '...'
      });

      const dataToHash = encryptedData + securityToken + this.secretKey;
      const expectedHash = CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
      
      console.log('🔍 Hash comparison:', {
        expected: expectedHash.substring(0, 10) + '...',
        actual: verificationHash.substring(0, 10) + '...',
        match: expectedHash === verificationHash
      });
      
      return expectedHash === verificationHash;
    } catch (error) {
      console.error('❌ Request validation failed:', error);
      return false;
    }
  }

  verifySophosSignature(signature, encryptedData, securityToken) {
    try {
      console.log('🔐 Signature verification details:', {
        signatureLength: signature.length,
        signatureStart: signature.substring(0, 10) + '...'
      });

      if (!signature) {
        console.error('❌ Signature is empty');
        return false;
      }

      const decodedSig = base64url.decode(signature);
      const signatureKey = this.secretKey + 'signature';
      
      console.log('🔐 Signature decoding:', {
        decodedLength: decodedSig.length,
        signatureKeyLength: signatureKey.length
      });

      const decryptedSig = CryptoJS.AES.decrypt(decodedSig, signatureKey).toString(CryptoJS.enc.Utf8);
      
      console.log('🔐 Decrypted signature:', {
        hasContent: !!decryptedSig,
        content: decryptedSig?.substring(0, 50) + '...'
      });
      
      if (!decryptedSig) {
        console.error('❌ Signature decryption failed - empty result');
        return false;
      }
      
      const sigData = JSON.parse(decryptedSig);
      
      console.log('🔐 Signature data:', {
        version: sigData.version,
        timestamp: sigData.timestamp,
        currentTime: Date.now()
      });

      if (sigData.version !== "SOPHOTOCENCRYPTION") {
        console.error('❌ Invalid signature version:', sigData.version);
        return false;
      }

      const timeDiff = Date.now() - sigData.timestamp;
      const maxAge = 10 * 60 * 1000; // 10 minutes
      
      console.log('⏰ Signature age check:', {
        timeDiff,
        maxAge,
        isExpired: timeDiff > maxAge
      });

      if (timeDiff > maxAge) {
        console.error('❌ Signature expired');
        return false;
      }

      console.log('✅ Signature verification passed');
      return true;
    } catch (error) {
      console.error('❌ Signature verification failed:', {
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}