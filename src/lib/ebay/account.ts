// src/lib/ebay/account.ts
'use server';

import type { Product } from '@/lib/types';

export const getApiEndpoint = () => {
    return process.env.EBAY_ENV === 'SANDBOX' 
        ? 'https://api.sandbox.ebay.com' 
        : 'https://api.ebay.com';
};

export const getMarketplaceId = () => {
    return process.env.EBAY_MARKETPLACE_ID || 'EBAY_DE';
}

/**
 * Ensures a merchant location is set up and returns its key.
 * If no location exists, it creates a default one.
 * @param {string} accessToken - A valid eBay access token.
 * @returns {Promise<string>} The merchant location key.
 */
export async function ensureMerchantLocation(accessToken: string): Promise<string> {
    const endpoint = `${getApiEndpoint()}/sell/account/v1/location`;
    const locationKey = 'LISTINGFLOW_MAIN_LOCATION';

    // First, try to get the specific location
    try {
        const response = await fetch(`${endpoint}/${locationKey}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (response.ok) {
            const data = await response.json();
            return data.merchantLocationKey;
        }
    } catch (e) {
        // This might fail if the location doesn't exist, which is fine.
    }
    
    // If getting it failed, assume it doesn't exist and create it.
    console.log('Merchant location not found, creating a new one...');
    const createResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            location: {
                address: {
                    country: 'DE', // Germany
                    addressLine1: 'Default Street 1',
                    city: 'Berlin',
                    postalCode: '10115',
                },
            },
            name: 'Main Warehouse',
            merchantLocationStatus: 'ENABLED',
            locationTypes: ['STORE'],
        }),
    });

    if (!createResponse.ok) {
        const errorBody = await createResponse.json();
        console.error('Failed to create merchant location:', errorBody);
        throw new Error('Failed to create default eBay merchant location.');
    }

    // After creating, we need to fetch it again to get the key, or just return our static key.
    // The key is set by us in the `merchantLocationKey` field of the request.
    return locationKey;
}

/**
 * Fetches the first available policy ID for each policy type.
 * @param {string} accessToken - A valid eBay access token.
 * @param {string} marketplaceId - The eBay marketplace ID (e.g., 'EBAY_DE').
 * @returns {Promise<object>} An object containing the policy IDs.
 */
export async function getPolicies(accessToken: string, marketplaceId: string): Promise<{fulfillmentPolicyId: string, paymentPolicyId: string, returnPolicyId: string}> {
    const fetchPolicy = async (policyType: 'fulfillment' | 'payment' | 'return') => {
        const response = await fetch(
            `${getApiEndpoint()}/sell/account/v1/${policyType}_policy?marketplace_id=${marketplaceId}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error(`Failed to fetch ${policyType} policies.`);
        const data = await response.json();
        
        const policy = data[`${policyType}Policies`]?.find((p: any) => p.name === 'Default' || p.isDefault) || data[`${policyType}Policies`]?.[0];
        
        if (!policy) throw new Error(`No active ${policyType} policy found for marketplace ${marketplaceId}. Please set a default policy in your eBay account.`);

        return policy[`${policyType}PolicyId`];
    };

    try {
        const [fulfillmentPolicyId, paymentPolicyId, returnPolicyId] = await Promise.all([
            fetchPolicy('fulfillment'),
            fetchPolicy('payment'),
            fetchPolicy('return'),
        ]);

        return { fulfillmentPolicyId, paymentPolicyId, returnPolicyId };
    } catch (error) {
        console.error('Error fetching eBay policies:', error);
        throw error;
    }
}
