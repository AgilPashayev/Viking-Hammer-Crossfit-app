# EXACT SQUARESPACE DNS CONFIGURATION GUIDE

## 🎯 Direct Mapping: Resend → Squarespace

You need to add **4 DNS records** to Squarespace. Here's exactly what to enter in each field:

---

## RECORD 1: Domain Verification (TXT)

### Resend Shows:
```
Type: TXT
Name: resend._domainkey
Content: p=MIGfMA0GCSqGSIb3DQEB... (long string)
```

### What to Enter in Squarespace:
1. Click **"ADD RECORD"** button (top right)
2. In the **"Add Record"** popup that appears:

| Squarespace Field | Enter This Value |
|------------------|------------------|
| **TYPE** dropdown | Select **TXT** |
| **HOST** field | `resend._domainkey` |
| **PRIORITY** field | Leave empty (not needed for TXT) |
| **TTL** dropdown | Select **4 hrs** (or leave as default) |
| **DATA** field | Copy the ENTIRE long string from Resend that starts with `p=MIGfMA0GCSqGSIb3DQEB...` |

3. Click **SAVE** button (bottom right of popup)

---

## RECORD 2: MX Record for Bounce Handling

### Resend Shows:
```
Type: MX
Name: send
Content: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

### What to Enter in Squarespace:
1. Click **"ADD RECORD"** button again
2. In the **"Add Record"** popup:

| Squarespace Field | Enter This Value |
|------------------|------------------|
| **TYPE** dropdown | Select **MX** |
| **HOST** field | `send` |
| **PRIORITY** field | `10` |
| **TTL** dropdown | Select **4 hrs** (or leave as default) |
| **DATA** field | `feedback-smtp.us-east-1.amazonses.com` |

3. Click **SAVE** button

---

## RECORD 3: SPF (TXT Record)

### Resend Shows:
```
Type: TXT
Name: send
Content: v=spf1 include:amazonses.com ~all
```

### What to Enter in Squarespace:
1. Click **"ADD RECORD"** button again
2. In the **"Add Record"** popup:

| Squarespace Field | Enter This Value |
|------------------|------------------|
| **TYPE** dropdown | Select **TXT** |
| **HOST** field | `send` |
| **PRIORITY** field | Leave empty (not needed for TXT) |
| **TTL** dropdown | Select **4 hrs** (or leave as default) |
| **DATA** field | `v=spf1 include:amazonses.com ~all` |

3. Click **SAVE** button

---

## RECORD 4: DMARC (TXT Record) - Optional but Recommended

### Resend Shows:
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none;
```

### What to Enter in Squarespace:
1. Click **"ADD RECORD"** button again
2. In the **"Add Record"** popup:

| Squarespace Field | Enter This Value |
|------------------|------------------|
| **TYPE** dropdown | Select **TXT** |
| **HOST** field | `_dmarc` |
| **PRIORITY** field | Leave empty (not needed for TXT) |
| **TTL** dropdown | Select **4 hrs** (or leave as default) |
| **DATA** field | `v=DMARC1; p=none;` |

3. Click **SAVE** button

---

## 📋 Step-by-Step Visual Guide

### Your Current Squarespace Screen:
You're seeing the **"Add Record"** popup with these fields:
- **HOST** (empty text field on the left)
- **TYPE** (dropdown showing "Type")
- **PRIORITY** (empty field)
- **TTL** (dropdown showing "4 hrs")
- **DATA** (empty text field on the right)

### For Each Record Above:

1. **Fill in all fields** exactly as shown in the tables
2. Click the **black "SAVE" button** on the bottom right
3. The popup will close and the record will appear in the "Custom records" section
4. Click **"ADD RECORD"** again for the next record
5. Repeat until all 4 records are added

---

## 🔍 Quick Reference Table - All Records at a Glance

| # | TYPE | HOST | PRIORITY | DATA |
|---|------|------|----------|------|
| 1 | TXT | `resend._domainkey` | (empty) | `p=MIGfMA0GCSqGSIb3DQEB...` (copy from Resend) |
| 2 | MX | `send` | `10` | `feedback-smtp.us-east-1.amazonses.com` |
| 3 | TXT | `send` | (empty) | `v=spf1 include:amazonses.com ~all` |
| 4 | TXT | `_dmarc` | (empty) | `v=DMARC1; p=none;` |

---

## ⚠️ Important Notes

### About the PRIORITY Field:
- **Only fill this for MX records** (Record #2 → enter `10`)
- **Leave empty for TXT records** (Records #1, #3, #4)

### About the HOST Field:
- Type EXACTLY as shown (no spaces, case-sensitive)
- Squarespace will automatically add `.crossfit-vikings-hammer.com` to the end
- So `send` becomes `send.crossfit-vikings-hammer.com`
- This is correct behavior ✅

### About the DATA Field for Record #1:
- This is a VERY LONG string (200+ characters)
- Copy the ENTIRE value from Resend
- It starts with `p=MIGfMA0GCSqGSIb3DQEB...`
- Don't cut it off - get all of it!

### About TTL:
- `4 hrs` is fine (this is 14400 seconds)
- Or you can select any value - doesn't matter much
- Lower TTL = faster updates, but more DNS queries

---

## ✅ After Adding All Records

### What You Should See in Squarespace:

Under **"Custom records"** section, you should see 4 records listed:

```
TXT   resend._domainkey     p=MIGfMA0GCSqGSIb...
MX    send                  feedback-smtp.us-east-1.amazonses.com  (Priority: 10)
TXT   send                  v=spf1 include:amazonses.com ~all
TXT   _dmarc                v=DMARC1; p=none;
```

### Next Steps:

1. **Save Changes** - Look for a "Save" or "Apply Changes" button at the top/bottom of the DNS Settings page
2. **Wait 15-30 minutes** for DNS propagation
3. **Go back to Resend** - Click the button that says "I've added the records" or similar
4. **Verify** - Resend will check your DNS and show green checkmarks ✅

---

## 🔧 Troubleshooting

### "HOST field too short" or similar error:
- This shouldn't happen, but if it does, try entering the full domain:
  - Instead of: `send`
  - Try: `send.crossfit-vikings-hammer.com`

### "DATA field too long" error:
- Squarespace TXT records support up to 255 characters per string
- If Record #1 (DKIM) is too long, break it into multiple quoted strings:
  - Example: `"first_part_of_string" "second_part_of_string"`
- Squarespace will automatically concatenate them

### Can't find "Save" button:
- Look at the very top or very bottom of the DNS Settings page
- Some Squarespace interfaces auto-save when you click "SAVE" on each record popup
- If auto-saved, records appear immediately in the list

---

## 📞 After DNS Verification

Once Resend shows all green checkmarks ✅, **let me know** and I'll update your backend configuration:

**Current config:**
```
FROM_EMAIL=noreply@vikinghammer.com
```

**Will need to change to:**
```
FROM_EMAIL=noreply@send.crossfit-vikings-hammer.com
```

Because Resend is using the `send` subdomain for email delivery.

---

## 🎯 Summary Checklist

- [ ] Record 1 added: TXT record with `resend._domainkey` host
- [ ] Record 2 added: MX record with `send` host and priority 10
- [ ] Record 3 added: TXT record with `send` host (SPF)
- [ ] Record 4 added: TXT record with `_dmarc` host
- [ ] All records visible in "Custom records" section
- [ ] Clicked Save/Apply if needed
- [ ] Waiting 15-30 minutes for DNS propagation
- [ ] Ready to verify on Resend

**Good luck! Let me know when DNS is verified and I'll update the email config! 🚀**
