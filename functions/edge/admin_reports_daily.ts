// admin_reports_daily.ts - Edge Function stub
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
serve(() => new Response(JSON.stringify({ ok: true, report: [] }), { headers: { 'content-type': 'application/json' } }))
