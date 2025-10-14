import 'react-native-get-random-values';

// Simple JWT implementation for React Native
// Note: This is a basic implementation for client-side use only
// For production, JWT signing should be done server-side

interface JWTPayload {
  [key: string]: any;
  exp?: number;
  iat?: number;
}

class ReactNativeJWT {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // Create a simple JWT token (without signature verification for client-side use)
  sign(payload: JWTPayload, options?: { expiresIn?: string }): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const finalPayload = {
      ...payload,
      iat: now,
      exp: options?.expiresIn ? now + this.parseExpiresIn(options.expiresIn) : now + (24 * 60 * 60) // 24 hours default
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(finalPayload));
    
    // For client-side, we'll create a simple signature using a basic hash
    // Note: This is not cryptographically secure - use only for client-side tokens
    const signature = this.createSimpleSignature(`${encodedHeader}.${encodedPayload}`, this.secret);
    const encodedSignature = this.base64UrlEncode(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  // Decode JWT token (client-side verification)
  verify(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }

      return payload;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  // Decode without verification (useful for reading payload)
  decode(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      return JSON.parse(this.base64UrlDecode(parts[1]));
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  }

  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    // Add padding if needed
    const padding = 4 - (str.length % 4);
    if (padding !== 4) {
      str += '='.repeat(padding);
    }
    
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    return atob(str);
  }

  private parseExpiresIn(expiresIn: string): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60; // Default 24 hours
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 24 * 60 * 60;
    }
  }

  // Simple signature creation without external crypto libraries
  // Note: This is not cryptographically secure - for development/testing only
  private createSimpleSignature(data: string, secret: string): string {
    // Simple hash function for basic signing
    let hash = 0;
    const input = data + secret;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to base64-like string
    return Math.abs(hash).toString(36) + Date.now().toString(36);
  }
}

import { config } from './config';

// Export a singleton instance
const JWT_SECRET = config.jwtSecret;
export const jwt = new ReactNativeJWT(JWT_SECRET);

// Export methods for compatibility
export default {
  sign: (payload: JWTPayload, secret: string, options?: { expiresIn?: string }) => {
    const jwtInstance = new ReactNativeJWT(secret);
    return jwtInstance.sign(payload, options);
  },
  verify: (token: string, secret: string) => {
    const jwtInstance = new ReactNativeJWT(secret);
    return jwtInstance.verify(token);
  },
  decode: (token: string) => {
    const jwtInstance = new ReactNativeJWT(JWT_SECRET);
    return jwtInstance.decode(token);
  }
};