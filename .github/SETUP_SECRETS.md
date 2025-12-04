# GitHub Actions Secrets Setup Guide

This guide explains how to configure GitHub Secrets required for CI/CD workflows (unit tests, builds, and E2E tests).

## Required Secrets

The following secrets must be configured in your GitHub repository for the workflows to function properly:

### 1. Supabase Configuration

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon/public key | `eyJhbGci...` |

**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the **Project URL** and **anon/public key**

### 2. OpenRouter Configuration

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key for AI features | `sk-or-v1-xxxxx` |

**Where to find this:**
- Go to [OpenRouter Dashboard](https://openrouter.ai)
- Navigate to **API Keys**
- Create or copy your API key

### 3. E2E Test Configuration

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `E2E_USERNAME_ID` | UUID of test user in Supabase | `5893c20d-0b07-4057-9a00-bb9b14526952` |
| `E2E_USERNAME` | Email of test user | `test@test.com` |
| `E2E_PASSWORD` | Password of test user | `Test1234` |

**How to set up:**
1. Create a test user in your Supabase project (via Auth dashboard or signup page)
2. Use a dedicated test account (e.g., `test@test.com`)
3. Copy the user's UUID from the Supabase Auth dashboard
4. Use a secure password (tests will create/delete activities for this user)

## How to Add Secrets to GitHub

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret

For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown above, case-sensitive)
3. Paste the **Value**
4. Click **Add secret**

### Step 3: Verify Setup

After adding all secrets, you should see 6 repository secrets:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_KEY`
- ✅ `OPENROUTER_API_KEY`
- ✅ `E2E_USERNAME_ID`
- ✅ `E2E_USERNAME`
- ✅ `E2E_PASSWORD`

## Testing the Setup

### Manual Workflow Trigger

1. Go to **Actions** tab in your repository
2. Select the workflow you want to test:
   - **CI - Build & Test** (for unit tests and builds)
   - **Playwright Tests** (for E2E tests)
3. Click **Run workflow** dropdown
4. Select the `master` branch
5. Click **Run workflow**

### Automatic Triggers

Workflows will automatically run when:
- You push commits to the `master` branch
- You open a pull request targeting `master`

## Troubleshooting

### "supabaseUrl is required" Error

This means the `SUPABASE_URL` secret is missing or incorrectly named.

**Solution:**
- Double-check the secret name is exactly `SUPABASE_URL` (uppercase)
- Verify the value starts with `https://`

### E2E Tests Fail with Authentication Errors

This means the E2E user credentials are incorrect or the user doesn't exist.

**Solution:**
1. Verify the test user exists in Supabase Auth dashboard
2. Check that `E2E_USERNAME` and `E2E_PASSWORD` match the user's credentials
3. Ensure `E2E_USERNAME_ID` is the correct UUID from Supabase

### OpenRouter API Errors

This means the `OPENROUTER_API_KEY` is invalid or has insufficient quota.

**Solution:**
- Verify the API key is valid on [OpenRouter Dashboard](https://openrouter.ai)
- Check your OpenRouter account has sufficient credits/quota

### Secrets Not Being Read

GitHub Actions may cache old values briefly.

**Solution:**
- Re-run the workflow after updating secrets
- Wait 1-2 minutes for changes to propagate

## Security Best Practices

- ✅ **Use dedicated test accounts** for E2E tests, not your personal account
- ✅ **Rotate secrets regularly** (especially API keys)
- ✅ **Use the anon/public key** for `SUPABASE_KEY`, NOT the service role key
- ✅ **Never commit `.env` files** containing real secrets to Git
- ✅ **Limit test user permissions** in Supabase (only what's needed for tests)
- ❌ **Never expose secrets in logs** or test output

## Need Help?

If you encounter issues:
1. Check the workflow logs in the **Actions** tab
2. Verify all 6 secrets are configured correctly
3. Ensure the test user exists and can authenticate
4. Review the error messages for specific configuration issues

---

**Last Updated:** 2024-12-04
