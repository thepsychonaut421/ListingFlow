// src/lib/ebay/auth.ts
'use server';

import { Buffer } from 'buffer';

type Token = {
  accessToken: string;
  expiresAt: number;
};

// Simple in-memory cache for the access token
let cachedToken: Token | null = null;

const getApiEndpoint = () => {
    return process.env.EBAY_ENV === 'SANDBOX' 
        ? 'https://api.sandbox.ebay.com' 
        : 'https://api.ebay.com';
};

/**
 * Retrieves a valid eBay access token, using a cached token if available
 * or fetching a new one using the refresh token if expired.
 * @returns {Promise<string>} A valid eBay access token.
 */
export async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.accessToken;
    }

    console.log('Access token expired or not found, refreshing...');

    const {
        EBAY_CLIENT_ID,
        EBAY_CLIENT_SECRET,
        EBAY_REFRESH_TOKEN
    } = process.env;

    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET || !EBAY_REFRESH_TOKEN) {
        throw new Error('Missing required eBay environment variables for authentication.');
    }

    const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: EBAY_REFRESH_TOKEN,
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account',
    });

    const response = await fetch(`${getApiEndpoint()}/identity/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
        },
        body: body.toString(),
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Failed to refresh eBay access token:', errorBody);
        if (response.status === 401) {
             throw new Error('eBay refresh token is invalid or expired. Please re-authenticate.');
        }
        throw new Error(`Failed to refresh eBay token: ${errorBody.error_description || response.statusText}`);
    }

    const data = await response.json();
    const expiresIn = (data.expires_in || 3600) * 1000; // Convert to milliseconds

    cachedToken = {
        accessToken: data.access_token,
        // Set expiry to 5 minutes before the actual expiration to be safe
        expiresAt: Date.now() + expiresIn - (5 * 60 * 1000), 
    };

    return cachedToken.accessToken;
}
