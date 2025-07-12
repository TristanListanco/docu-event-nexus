
import { RequestParams } from './types.ts';

export async function parseRequest(req: Request): Promise<RequestParams> {
  const url = new URL(req.url);
  const isDirectCall = url.searchParams.has('token') && url.searchParams.has('action');

  let token: string | null = null;
  let action: string | null = null;

  if (isDirectCall) {
    // Direct URL call from email links
    token = url.searchParams.get('token');
    action = url.searchParams.get('action');
  } else {
    // Client-side call via supabase.functions.invoke
    try {
      const body = await req.json();
      token = body.token;
      action = body.action;
    } catch (error) {
      console.error('Error parsing request body:', error);
    }
  }

  return { token, action, isDirectCall };
}
