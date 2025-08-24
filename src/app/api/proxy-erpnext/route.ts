'use server';

import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { endpoint, method = 'GET', body } = await req.json();

    const url = process.env.ERPNEXT_BASE_URL;
    const apiKey = process.env.ERPNEXT_API_KEY;
    const apiSecret = process.env.ERPNEXT_API_SECRET;
    
    if (!url || !apiKey || !apiSecret) {
        const errorMessage = `ERPNext credentials are not configured. Please ensure ERPNEXT_BASE_URL, ERPNEXT_API_KEY, and ERPNEXT_API_SECRET are set in your environment.`;
        console.error(errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const fullUrl = `${url.replace(/\/$/, '')}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `token ${apiKey}:${apiSecret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const requestOptions: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    };
    
    const response = await fetch(fullUrl, requestOptions);

    if (!response.ok) {
        let errorDetails = `Request to ERPNext failed with status ${response.status}`;
        try {
            const errorText = await response.text();
            
            if (errorText.includes("frappe.exceptions.AuthenticationError")) {
                errorDetails = "Authentication Error. Please check your ERPNext API Key and Secret.";
            } else if (errorText.trim().startsWith('<!DOCTYPE html>')) {
                const $ = cheerio.load(errorText);
                const pageTitle = $('title').text();
                const h1Title = $('h1').first().text();
                errorDetails = `${pageTitle || h1Title || 'Received an HTML error page from the server.'}`;
            } else {
                 try {
                    const errorBody = JSON.parse(errorText);
                    if (errorBody._server_messages) {
                         const serverMessage = JSON.parse(errorBody._server_messages[0]);
                         errorDetails = serverMessage.message || JSON.stringify(serverMessage);
                    } else if (errorBody.exception) {
                        errorDetails = errorBody.exception;
                    }
                    else {
                        errorDetails = errorBody.message || errorBody.error || JSON.stringify(errorBody);
                    }
                } catch(e) {
                    errorDetails = errorText;
                }
            }
        } catch (e: any) {
            console.error("Failed to parse error response body:", e.message);
            errorDetails = `The server returned a non-JSON response that could not be parsed.`;
        }
        
        console.error("ERPNext Proxy Error:", errorDetails);
        return NextResponse.json({ error: errorDetails }, { status: response.status });
    }

    // Handle no content response
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("API Proxy Error:", err);
    const errorMessage = err.cause?.code === 'ENOTFOUND'
      ? `Could not connect to ERPNext server at ${process.env.ERPNEXT_BASE_URL}. Please check the URL and network connection.`
      : err.message || 'An unexpected error occurred in the API proxy.';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
