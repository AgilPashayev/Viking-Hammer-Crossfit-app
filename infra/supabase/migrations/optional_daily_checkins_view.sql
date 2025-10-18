-- OPTIONAL: Daily Check-ins View
-- This view can be created AFTER all migrations are complete
-- Run this separately if you need the daily check-ins analytics view

CREATE OR REPLACE VIEW public.daily_checkins_v AS
SELECT 
  date_trunc('day', ts) AS day, 
  count(*) AS checkins
FROM public.checkins
GROUP BY date_trunc('day', ts)
ORDER BY day DESC;

COMMENT ON VIEW public.daily_checkins_v IS 'Analytics view showing daily check-in counts';
