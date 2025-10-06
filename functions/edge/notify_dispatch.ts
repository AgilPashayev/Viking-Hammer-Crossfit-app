// notify_dispatch.ts - Edge Function stub
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
serve(() => new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } }))
