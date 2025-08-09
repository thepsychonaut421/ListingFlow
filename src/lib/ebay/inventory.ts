// src/lib/ebay/inventory.ts
'use server';

import type { Product } from '@/lib/types';
import { getApiEndpoint, getMarketplaceId } from './account';

// Map our internal status to eBay's condition enum
const getEbayCondition = (status: Product['listingStatus']): string => {
    switch (status) {
        case 'new': return 'NEW';
        case 'used': return 'USED_EXCELLENT'; // Or USED_VERY_GOOD, USED_GOOD
        case 'refurbished': return 'SELLER_REFURBISHED';
        default: return 'NEW';
    }
};

/**
 * Creates or updates an inventory item on eBay.
 * @param {string} accessToken - A valid eBay access token.
 * @param {Product} product - The product data from ListingFlow.
 */
export async function upsertInventoryItem(accessToken: string, product: Product) {
    const sku = product.code;
    if (!sku) throw new Error('Product SKU is required to create an inventory item.');
    
    // Filter out any non-HTTPS or invalid URLs
    const imageUrls = [product.image].filter(url => url && url.startsWith('https://'));

    const inventoryItemBody = {
        product: {
            title: product.name,
            description: product.description.substring(0, 500000), // eBay has a max length
            brand: product.brand || 'Unbranded',
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        },
        condition: getEbayCondition(product.listingStatus),
        availability: {
            shipToLocationAvailability: {
                quantity: product.quantity > 0 ? product.quantity : 1,
            },
        },
    };

    const response = await fetch(
        `${getApiEndpoint()}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Language': 'de-DE',
            },
            body: JSON.stringify(inventoryItemBody),
        }
    );

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Failed to upsert eBay inventory item:', errorBody);
        throw new Error(`Failed to create/update inventory item for SKU ${sku}: ${errorBody.errors?.[0]?.message || 'Unknown error'}`);
    }

    console.log(`Successfully upserted inventory item for SKU: ${sku}`);
}

/**
 * Creates or updates an offer draft on eBay for a given SKU.
 * @param {string} accessToken - A valid eBay access token.
 * @param {Product} product - The product data.
 * @param {any} policies - The fetched policy IDs.
 * @param {string} merchantLocationKey - The merchant location key.
 * @returns {Promise<any>} The response from the eBay API.
 */
export async function createOrUpdateOfferDraft(
    accessToken: string,
    product: Product,
    policies: { fulfillmentPolicyId: string, paymentPolicyId: string, returnPolicyId: string },
    merchantLocationKey: string
): Promise<any> {
    const sku = product.code;

    // 1. Check for an existing draft offer for this SKU
    const getOfferUrl = `${getApiEndpoint()}/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}&marketplace_id=${getMarketplaceId()}`;
    const existingOffersResponse = await fetch(getOfferUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    let existingDraftOfferId: string | null = null;
    if (existingOffersResponse.ok) {
        const offersData = await existingOffersResponse.json();
        const draftOffer = offersData.offers?.find((o: any) => o.status === 'DRAFT');
        if (draftOffer) {
            existingDraftOfferId = draftOffer.offerId;
        }
    }

    // 2. Prepare the offer body
    const offerBody = {
        sku: sku,
        marketplaceId: getMarketplaceId(),
        format: 'FIXED_PRICE',
        availableQuantity: product.quantity > 0 ? product.quantity : 1,
        categoryId: product.ebayCategoryId,
        listingPolicies: policies,
        pricingSummary: {
            price: {
                value: product.price.toFixed(2),
                currency: 'EUR',
            },
        },
        merchantLocationKey: merchantLocationKey,
        listingDescription: product.description, // Can be simple text or basic HTML
    };

    // 3. Decide whether to create a new offer or update an existing one
    const isUpdate = !!existingDraftOfferId;
    const url = isUpdate
        ? `${getApiEndpoint()}/sell/inventory/v1/offer/${existingDraftOfferId}/update`
        : `${getApiEndpoint()}/sell/inventory/v1/offer`;

    const response = await fetch(url, {
        method: 'POST', // Update also uses POST for this specific endpoint
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Language': 'de-DE',
        },
        body: JSON.stringify(offerBody),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Failed to create/update eBay offer draft:', errorBody);
        throw new Error(`Failed to process offer for SKU ${sku}: ${errorBody.errors?.[0]?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();
    console.log(`Successfully ${isUpdate ? 'updated' : 'created'} offer draft for SKU: ${sku}. Offer ID: ${responseData.offerId}`);
    return { ...responseData, status: 'DRAFT' }; // The API returns an empty body on success, so we add status for clarity
}
