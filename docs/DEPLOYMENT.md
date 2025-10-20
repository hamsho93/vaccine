# Deployment Guide

Complete guide to deploying VaxRecord to AWS Amplify.

## Architecture Overview

```
┌─────────────────────┐
│   React Frontend    │  (Amplify Hosting - Static)
│   Vite + TypeScript │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│  API Gateway (HTTP) │
│  + Lambda Handler   │  (Amplify Gen 2 Backend)
└──────────┬──────────┘
           │
           ▼
   ┌──────────────┐
   │  OpenAI API  │  (Vaccine Parsing)
   └──────────────┘
```

## Prerequisites

1. **AWS Account** with Amplify access
2. **GitHub Repository** (public or private)
3. **OpenAI API Key** for vaccine parsing
4. **Node.js 20+** for local development

## Deployment Steps

### Option 1: One-Click Amplify Deployment (Recommended)

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/hamsho93/vaccine.git
   cd vaccine
   ```

2. **Push to Your GitHub**
   ```bash
   # If you forked, skip this
   # If you cloned, create new repo and push
   git remote set-url origin https://github.com/YOUR_USERNAME/vaccine.git
   git push -u origin main
   ```

3. **Create Two Amplify Apps**

   **Frontend App:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "Host web app"
   - Connect GitHub repository
   - Branch: `main`
   - App root: `.` (leave empty or set to root)
   - Build spec: Amplify will detect `amplify.yml`
   - **Environment variables:**
     ```
     VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
     ```
   - Deploy

   **Backend App:**
   - Create another Amplify app
   - Same repository, branch `main`
   - App root: `packages/my-shared-backend`
   - Build spec: Detected from `amplify.yml`
   - **Environment variables:**
     ```
     OPENAI_API_KEY=sk-your-openai-api-key
     ALLOWED_ORIGIN=https://your-amplify-frontend-domain.amplifyapp.com
     NODE_OPTIONS=--max-old-space-size=4096
     ```
   - Deploy

4. **Update Frontend with Backend URL**
   - After backend deploys, copy the API Gateway endpoint
   - Update frontend environment variable `VITE_API_URL`
   - Redeploy frontend

5. **Verify Deployment**
   ```bash
   # Test backend health
   curl https://your-api-id.execute-api.region.amazonaws.com/api/health
   
   # Run smoke test
   API_URL=https://your-api-id.execute-api.region.amazonaws.com npm run smoke
   ```

### Option 2: Manual Deployment

See detailed manual steps in the main README.

## Environment Variables Reference

### Frontend (Amplify App 1)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API Gateway endpoint | `https://abc123.execute-api.us-east-1.amazonaws.com` |

### Backend (Amplify App 2)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for parsing | `sk-proj-...` |
| `ALLOWED_ORIGIN` | Recommended | CORS-allowed frontend domain | `https://main.d123abc.amplifyapp.com` |
| `NODE_OPTIONS` | Optional | Node.js memory limit | `--max-old-space-size=4096` |

## Post-Deployment Configuration

### 1. Set Up Custom Domain (Optional)

- Amplify Console → App → Domain management
- Add custom domain (e.g., `vaxrecord.yourdomain.com`)
- Verify DNS and SSL certificate

### 2. Enable Monitoring

- CloudWatch automatically enabled
- Set up alarms:
  - Lambda errors > 1%
  - API Gateway 5xx > 1%
  - Lambda duration > 10s

### 3. Review Security

- Verify `ALLOWED_ORIGIN` is set (not `*`)
- Rotate `OPENAI_API_KEY` every 90 days
- Enable CloudWatch Insights for log analysis

## Updating Your Deployment

### Via Git Push

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Amplify auto-deploys on push to main
```

### Manual Rebuild

- Amplify Console → App → Redeploy this version

## Rollback

If a deployment fails:

1. Amplify Console → App → Build History
2. Find last successful build
3. Click "Redeploy this version"

Or rollback via git:

```bash
git revert HEAD
git push origin main
```

## Cost Estimation

**AWS Amplify:**
- Hosting: ~$0.01/GB stored + $0.15/GB served
- Build minutes: First 1,000 free, then $0.01/minute
- Typical monthly cost: $5-20 for low-moderate traffic

**OpenAI API:**
- GPT-4o: ~$0.01-0.03 per vaccine history parse
- Typical monthly cost: $10-50 depending on usage

**Total:** ~$15-70/month for small clinic usage

## Troubleshooting

### Build Failures

**"Cannot find module"**
- Check `amplify.yml` app root paths
- Verify `package.json` scripts use correct paths

**"TypeScript errors"**
- Run `npm run check` locally first
- Fix type errors before pushing

**"Out of memory"**
- Increase `NODE_OPTIONS=--max-old-space-size=8192`

### Runtime Issues

**"CORS error"**
- Verify `ALLOWED_ORIGIN` matches your frontend domain exactly
- Check API Gateway CORS headers

**"OpenAI API error"**
- Verify `OPENAI_API_KEY` is valid
- Check rate limits and billing

**"403 Forbidden"**
- Check `ALLOWED_ORIGIN` environment variable
- Verify frontend is calling correct API URL

## Local Development

```bash
# Install dependencies
npm ci

# Start dev server (backend on :8080, frontend on :5173)
npm run dev

# In another terminal, run QA
npm run qa

# Build for production
npm run build:frontend
```

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] `ALLOWED_ORIGIN` configured (not `*`)
- [ ] OpenAI API key valid and has credits
- [ ] Smoke test passes against production API
- [ ] QA scenarios pass (8/8)
- [ ] Frontend loads without console errors
- [ ] Test with real vaccine data
- [ ] HIPAA compliance reviewed (if applicable)

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/hamsho93/vaccine/issues)
- Join [GitHub Discussions](https://github.com/hamsho93/vaccine/discussions)
- Review AWS Amplify build logs

