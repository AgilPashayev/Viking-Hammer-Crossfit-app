// qr_mint.ts - Edge Function stub (Deno)
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'

serve(async (req) => {
  return new Response(JSON.stringify({ ok: true, token: 'hello-world' }), { headers: { 'content-type': 'application/json' } })
})
