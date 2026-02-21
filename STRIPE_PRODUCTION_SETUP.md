# 🔐 Stripe Production Setup Guide

## Step 1: Get Production API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to Production Mode** (toggle in top-right corner)
3. Navigate to **Developers → API keys**
4. Copy your **Publishable key** (starts with `pk_live_`)
5. Click **Reveal test key** for **Secret key** (starts with `sk_live_`)

## Step 2: Configure Webhook for Production

1. In Stripe Dashboard (Production mode): **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://your-domain.com/api/tokens/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Update Backend .env File

Edit `/home/workstation/progetti/magicdeckgen/backend/.env`:

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET

# Enable production mode
PRODUCTION=1

# Production database (if different)
DATABASE_URL=postgresql://magicdeckgen:magicdeckgen_dev@localhost:5434/magicdeckgen

# Production frontend URL
FRONTEND_URL=https://your-domain.com

# Strong secret key for JWT (generate new one!)
SECRET_KEY=your-very-long-random-secret-key-here

# Brevo email (production)
BREVO_API_KEY=your-production-brevo-key
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=Magic Deck Builder
```

## Step 4: Generate Strong Secret Key

Run this to generate a secure SECRET_KEY:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Step 5: Test Production Payments

### Test with Real Card (will charge!)
1. Use a real credit card
2. Amount will be charged for real
3. Check Stripe Dashboard → Payments to verify

### Test with Stripe Test Cards (in test mode)
Before going live, test with:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date, any CVC, any postal code.

## Step 6: Security Checklist

- [ ] Production Stripe keys configured
- [ ] Webhook endpoint verified and working
- [ ] Strong SECRET_KEY generated (64+ characters)
- [ ] PRODUCTION=1 set in .env
- [ ] Database backed up before going live
- [ ] SSL/HTTPS enabled on production domain
- [ ] CORS configured for production domain only
- [ ] Email notifications working (Brevo configured)
- [ ] Test purchase completed successfully
- [ ] Webhook logs show successful events

## Step 7: Monitor Payments

After going live:
1. Check **Stripe Dashboard → Payments** regularly
2. Monitor **Webhooks → Events** for failures
3. Check backend logs for errors
4. Verify token balance updates in database

## Important Notes

⚠️ **Never commit .env file to git!**
⚠️ **Keep production keys secure and private**
⚠️ **Test thoroughly before accepting real payments**
⚠️ **Have a refund policy ready**
⚠️ **Monitor for fraudulent transactions**

## Rollback Plan

If issues occur:
1. Switch Stripe back to test mode
2. Update .env with test keys
3. Remove PRODUCTION=1
4. Restart backend
5. Investigate and fix issues
6. Re-test before going live again

## Support

- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing
