// src/app/api/diag/erpnext/route.ts
import { NextResponse } from 'next/server';

/**
 * A generic fetch wrapper for making API calls to the ERPNext.
 * This is a simplified version for diagnostic purposes.
 */
async function erpApiFetch(endpoint: string, init?: RequestInit) {
    const url = process.env.ERPNEXT_BASE_URL;
    const apiKey = process.env.ERPNEXT_API_KEY;
    const apiSecret = process.env.ERPNEXT_API_SECRET;
    
    if (!url || !apiKey || !apiSecret) {
        throw new Error('ERPNext credentials (URL, Key, or Secret) are not configured on the server.');
    }

    const fullUrl = `${url.replace(/\/$/, '')}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `token ${apiKey}:${apiSecret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const requestOptions: RequestInit = {
      ...init,
      headers,
      cache: 'no-store',
    };
    
    const response = await fetch(fullUrl, requestOptions);

    if (!response.ok) {
        let errorDetails = `Request to ERPNext failed with status ${response.status}`;
        try {
            const errorText = await response.text();
            if (errorText.includes("frappe.exceptions.AuthenticationError")) {
                errorDetails = "Authentication Error. Please check your ERPNext API Key and Secret.";
            } else {
                 errorDetails = "An unknown error occurred while connecting to ERPNext.";
            }
        } catch (e: any) {
            errorDetails = `Failed to parse error response. Status: ${response.status}`;
        }
        throw new Error(errorDetails);
    }

    return response.json();
}


export async function GET() {
  try {
    // A safe, read-only endpoint that confirms authentication.
    const data = await erpApiFetch(`/api/method/frappe.auth.get_logged_user`);
    
    return NextResponse.json({ 
        ok: true, 
        message: 'Successfully connected to ERPNext.',
        user: data.message,
        baseUrl: process.env.ERPNEXT_BASE_URL,
        apiKeyHint: `${(process.env.ERPNEXT_API_KEY || '').substring(0, 4)}...`,
    });
  } catch (e: any) {
    console.error('[DIAG_ERR] ERPNext Connection:', e);
    return NextResponse.json({ 
        ok: false, 
        error: e.message,
        hint: "This usually means your .env.local file is missing or has incorrect values for local development, or your secrets are not set correctly in Firebase App Hosting for production."
    }, { status: 500 });
  }
}
