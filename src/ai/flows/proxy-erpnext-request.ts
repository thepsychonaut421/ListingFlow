'use server';
/**
 * @fileOverview A server-side proxy to handle requests to the ERPNext API, avoiding CORS issues.
 *
 * - proxyErpNextRequest - A function that forwards requests to a specified ERPNext instance.
 * - ProxyErpNextRequestInput - The input type for the proxy function.
 * - ProxyErpNextRequestOutput - The return type for the proxy function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProxyErpNextRequestInputSchema = z.object({
    url: z.string().url().describe('The base URL of the ERPNext instance.'),
    apiKey: z.string().describe('The API Key for ERPNext authentication.'),
    apiSecret: z.string().describe('The API Secret for ERPNext authentication.'),
    endpoint: z.string().describe('The API endpoint to call (e.g., /api/resource/Item).'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET').describe('The HTTP method to use.'),
    body: z.any().optional().describe('The request body for POST/PUT/PATCH requests.'),
});
export type ProxyErpNextRequestInput = z.infer<typeof ProxyErpNextRequestInputSchema>;

// The output can be anything, so we use z.any()
const ProxyErpNextRequestOutputSchema = z.any();
export type ProxyErpNextRequestOutput = z.infer<typeof ProxyErpNextRequestOutputSchema>;

export async function proxyErpNextRequest(input: ProxyErpNextRequestInput): Promise<ProxyErpNextRequestOutput> {
  return proxyErpNextRequestFlow(input);
}

const proxyErpNextRequestFlow = ai.defineFlow(
  {
    name: 'proxyErpNextRequestFlow',
    inputSchema: ProxyErpNextRequestInputSchema,
    outputSchema: ProxyErpNextRequestOutputSchema,
  },
  async ({ url, apiKey, apiSecret, endpoint, method, body }) => {
    
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
    
    const fullUrl = `${url.replace(/\/$/, '')}${endpoint}`;

    try {
      const response = await fetch(fullUrl, requestOptions);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorDetails = '';
        try {
            const errJson = JSON.parse(errorBody);
            errorDetails = errJson.message || errJson.exception || errJson.error || errorBody;
        } catch {
            errorDetails = errorBody;
        }
        // Throwing an error here will propagate it to the client-side caller.
        throw new Error(`${response.status} - ${errorDetails}`);
      }

      // Handle cases with no content in response
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();

    } catch (error: any) {
        console.error("ERPNext Proxy Flow Error:", error);
        // Rethrow the error to be caught by the client.
        throw new Error(error.message || 'An unexpected error occurred in the proxy flow.');
    }
  }
);
