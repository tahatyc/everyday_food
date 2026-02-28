# iOS Infrastructure Deployment Plan

**App**: Everyday Food
**Bundle ID**: `everyday-food`
**EAS Project ID**: `d6a6c2b1-81c2-40d5-9f56-2c2604f21d1c`
**Owner**: `gtsolov`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Apple Developer Account Setup](#2-apple-developer-account-setup)
3. [Certificate & Provisioning Profile Management](#3-certificate--provisioning-profile-management)
4. [Environment Variables](#4-environment-variables)
5. [EAS Build Configuration](#5-eas-build-configuration)
6. [Convex Backend Deployment](#6-convex-backend-deployment)
7. [TestFlight Beta Distribution](#7-testflight-beta-distribution)
8. [CI/CD Pipeline — GitHub Actions](#8-cicd-pipeline--github-actions)
9. [App Store Submission](#9-app-store-submission)
10. [OTA Updates via EAS Update](#10-ota-updates-via-eas-update)
11. [Monitoring & Crash Reporting](#11-monitoring--crash-reporting)
12. [Environment Management](#12-environment-management)
13. [Deployment Checklist](#13-deployment-checklist)

---

## 1. Prerequisites

### Accounts & Subscriptions

| Requirement | Purpose | Cost |
|-------------|---------|------|
| [Apple Developer Program](https://developer.apple.com/programs/) | App Store distribution, certificates, TestFlight | $99/year |
| [Expo Account](https://expo.dev/signup) | EAS Build, Submit, Update | Free tier available |
| [Convex Dashboard](https://dashboard.convex.dev/) | Backend management | Free tier available |
| GitHub Account | Source control, CI/CD | Free |

### CLI Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo/EAS
eas login

# Verify login
eas whoami

# Install Convex CLI (already a project dependency)
npx convex --version
```

### System Requirements

- **macOS** required for iOS builds (EAS handles this in the cloud)
- Node.js 20+
- Xcode 16+ (for local builds only — not required for EAS cloud builds)

---

## 2. Apple Developer Account Setup

### 2.1 Register in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps** > **+** > **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Everyday Food
   - **Primary Language**: English
   - **Bundle ID**: `everyday-food`
   - **SKU**: `everyday-food-ios`

### 2.2 App Store Listing Preparation

Prepare these assets before submission:

| Asset | Specification |
|-------|--------------|
| App Icon | 1024x1024px PNG (no alpha) |
| Screenshots (6.7") | 1290x2796px (iPhone 15 Pro Max) — minimum 3 |
| Screenshots (6.5") | 1284x2778px (iPhone 14 Plus) — minimum 3 |
| Screenshots (5.5") | 1242x2208px (iPhone 8 Plus) — optional |
| iPad Screenshots | 2048x2732px — if `supportsTablet: true` |
| App Description | Up to 4000 characters |
| Keywords | Up to 100 characters, comma-separated |
| Privacy Policy URL | Required for all apps |
| Support URL | Required |

---

## 3. Certificate & Provisioning Profile Management

EAS handles certificates automatically. No manual management needed.

### Automatic (Recommended)

```bash
# EAS manages all signing credentials
eas credentials

# View current iOS credentials
eas credentials --platform ios
```

EAS will:
- Generate a Distribution Certificate
- Create App Store provisioning profiles
- Create Ad Hoc provisioning profiles (for TestFlight/internal)
- Store them securely on Expo servers

### Manual (If Required)

If your organization requires manual certificate management:

```bash
# Configure eas.json for manual signing
# Add to the relevant build profile:
{
  "build": {
    "production": {
      "ios": {
        "credentialsSource": "local"
      }
    }
  }
}
```

Then place credentials in `credentials.json` (add to `.gitignore`):

```json
{
  "ios": {
    "provisioningProfilePath": "./certs/profile.mobileprovision",
    "distributionCertificate": {
      "path": "./certs/dist-cert.p12",
      "password": "CERTIFICATE_PASSWORD"
    }
  }
}
```

---

## 4. Environment Variables

### 4.1 EAS Build Environment Variables

Set secrets via EAS CLI (never commit these):

```bash
# Convex production URL
eas secret:create --name EXPO_PUBLIC_CONVEX_URL \
  --value "https://your-production-deployment.convex.cloud" \
  --scope project

# Convex site URL (for auth)
eas secret:create --name CONVEX_SITE_URL \
  --value "https://your-production-deployment.convex.site" \
  --scope project
```

### 4.2 GitHub Actions Secrets

Add these in **GitHub > Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | EAS access token (generate at expo.dev/accounts/[owner]/settings/access-tokens) |
| `EXPO_PUBLIC_CONVEX_URL` | Convex production deployment URL |
| `CONVEX_DEPLOY_KEY` | Convex deploy key (from Convex dashboard > Settings > Deploy Key) |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for Apple ID (generated at appleid.apple.com) |
| `ASC_KEY_ID` | App Store Connect API Key ID |
| `ASC_ISSUER_ID` | App Store Connect API Issuer ID |
| `ASC_API_KEY_P8` | Base64-encoded App Store Connect API key (.p8 file) |

### 4.3 Local `.env` File

For local development (already in `.gitignore`):

```env
EXPO_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
CONVEX_SITE_URL=https://your-dev-deployment.convex.site
```

---

## 5. EAS Build Configuration

### 5.1 Updated `eas.json`

The current `eas.json` needs iOS-specific configuration. Updated version:

```json
{
  "cli": {
    "version": ">= 18.0.5",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      },
      "channel": "preview"
    },
    "testflight": {
      "distribution": "store",
      "ios": {
        "buildConfiguration": "Release"
      },
      "channel": "testflight",
      "autoIncrement": true
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascApiKeyId": "ASC_KEY_ID",
        "ascApiKeyIssuerId": "ASC_ISSUER_ID",
        "ascApiKeyPath": "./keys/AuthKey.p8"
      }
    }
  }
}
```

### 5.2 Build Commands

```bash
# Development build (for simulator)
eas build --platform ios --profile development

# Preview build (internal testing via QR code)
eas build --platform ios --profile preview

# TestFlight build
eas build --platform ios --profile testflight

# Production build (App Store)
eas build --platform ios --profile production
```

### 5.3 `app.json` Updates for Production

Ensure these fields are set before first submission:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "everyday-food",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSCameraUsageDescription": "Used to take photos of recipes",
        "NSPhotoLibraryUsageDescription": "Used to select recipe images"
      }
    }
  }
}
```

---

## 6. Convex Backend Deployment

### 6.1 Create Production Deployment

```bash
# Create a production deployment in Convex dashboard
# Go to: dashboard.convex.dev > Project > Settings > Deployments

# Or via CLI:
npx convex deploy --prod
```

### 6.2 Environment Variables in Convex

Set production environment variables in the Convex dashboard:

1. Go to **Convex Dashboard** > your project > **Settings** > **Environment Variables**
2. Set for the **production** deployment:
   - `CONVEX_SITE_URL` = your production site URL

### 6.3 Database Seeding (Optional)

```bash
# Seed the production database if needed
npx convex run seed:seedDatabase --prod
```

### 6.4 Convex Deploy Key

For CI/CD automated deployments:

1. Go to **Convex Dashboard** > **Settings** > **Deploy Key**
2. Generate a deploy key
3. Add it as `CONVEX_DEPLOY_KEY` in GitHub Secrets

---

## 7. TestFlight Beta Distribution

### 7.1 Initial TestFlight Setup

1. Build for TestFlight:
   ```bash
   eas build --platform ios --profile testflight
   ```

2. Submit to TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```

3. In **App Store Connect** > **TestFlight**:
   - Add **internal testers** (up to 100, Apple Developer team members)
   - Create **external testing group** (up to 10,000 testers)
   - Fill in **Beta App Description** and **What to Test**
   - Submit for **Beta App Review** (required for external testers)

### 7.2 TestFlight Workflow

```
Code Push → CI Tests Pass → EAS Build (testflight) → EAS Submit →
→ Apple Beta Review (first time / significant changes) →
→ Available on TestFlight → Testers notified
```

### 7.3 Managing Beta Testers

- **Internal testers**: No review needed, builds available immediately
- **External testers**: First build requires Beta App Review (~24h)
- Share via **public TestFlight link** or **email invitation**

---

## 8. CI/CD Pipeline — GitHub Actions

### 8.1 iOS Build & Deploy Workflow

Create `.github/workflows/ios-deploy.yml`:

```yaml
name: iOS Build & Deploy

on:
  push:
    branches: [master]
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      profile:
        description: 'Build profile'
        required: true
        default: 'testflight'
        type: choice
        options:
          - preview
          - testflight
          - production
      submit:
        description: 'Submit to App Store / TestFlight'
        required: true
        default: true
        type: boolean

concurrency:
  group: ios-build-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ──────────────────────────────────────────
  # Job 1: Run tests before building
  # ──────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:ci
        env:
          JEST_JUNIT_OUTPUT_DIR: ./reports
          JEST_JUNIT_OUTPUT_NAME: junit.xml

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: ./reports/junit.xml

  # ──────────────────────────────────────────
  # Job 2: Deploy Convex backend
  # ──────────────────────────────────────────
  deploy-backend:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/master' || startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Deploy Convex to production
        run: npx convex deploy
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}

  # ──────────────────────────────────────────
  # Job 3: Build iOS app with EAS
  # ──────────────────────────────────────────
  build-ios:
    runs-on: ubuntu-latest
    needs: [test, deploy-backend]
    outputs:
      build_id: ${{ steps.build.outputs.build_id }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup EAS CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Determine build profile
        id: profile
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "profile=${{ github.event.inputs.profile }}" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == refs/tags/v* ]]; then
            echo "profile=production" >> $GITHUB_OUTPUT
          else
            echo "profile=testflight" >> $GITHUB_OUTPUT
          fi

      - name: Build iOS app
        id: build
        run: |
          BUILD_OUTPUT=$(eas build \
            --platform ios \
            --profile ${{ steps.profile.outputs.profile }} \
            --non-interactive \
            --json)
          BUILD_ID=$(echo $BUILD_OUTPUT | jq -r '.[0].id')
          echo "build_id=$BUILD_ID" >> $GITHUB_OUTPUT
          echo "Build ID: $BUILD_ID"

  # ──────────────────────────────────────────
  # Job 4: Submit to App Store / TestFlight
  # ──────────────────────────────────────────
  submit-ios:
    runs-on: ubuntu-latest
    needs: build-ios
    if: |
      (github.event_name == 'workflow_dispatch' && github.event.inputs.submit == 'true') ||
      (github.event_name == 'push' && (github.ref == 'refs/heads/master' || startsWith(github.ref, 'refs/tags/v')))
    steps:
      - uses: actions/checkout@v4

      - name: Setup EAS CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to App Store / TestFlight
        run: |
          eas submit \
            --platform ios \
            --id ${{ needs.build-ios.outputs.build_id }} \
            --non-interactive
        env:
          EXPO_APPLE_ID: ${{ secrets.APPLE_ID }}
          EXPO_APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
```

### 8.2 Trigger Flows

| Trigger | Profile | Action |
|---------|---------|--------|
| Push to `master` | `testflight` | Build + Submit to TestFlight |
| Push tag `v*` (e.g., `v1.2.0`) | `production` | Build + Submit to App Store |
| Manual (`workflow_dispatch`) | User's choice | Build + optionally Submit |

### 8.3 Creating a Release

```bash
# Tag a production release
git tag v1.0.0
git push origin v1.0.0

# This triggers: tests → Convex deploy → EAS production build → App Store submit
```

---

## 9. App Store Submission

### 9.1 First-Time Submission Checklist

- [ ] App icon uploaded (1024x1024)
- [ ] Screenshots for all required device sizes
- [ ] App description, keywords, categories filled in
- [ ] Privacy Policy URL provided
- [ ] Support URL provided
- [ ] Age rating questionnaire completed
- [ ] App Review Information (contact details, demo account)
- [ ] `ITSAppUsesNonExemptEncryption: false` set in `app.json`

### 9.2 EAS Submit Command

```bash
# Submit the latest build
eas submit --platform ios --latest

# Submit a specific build
eas submit --platform ios --id BUILD_ID

# Submit with ASC API key
eas submit --platform ios --latest \
  --asc-api-key-id ASC_KEY_ID \
  --asc-api-key-issuer-id ASC_ISSUER_ID \
  --asc-api-key-path ./keys/AuthKey.p8
```

### 9.3 App Review Tips

- Provide a **demo account** if login is required
- Include clear **review notes** explaining app functionality
- Ensure the app works without network issues during review
- First review typically takes 24-48 hours

---

## 10. OTA Updates via EAS Update

EAS Update allows pushing JavaScript/asset changes without a new App Store build.

### 10.1 Setup

```bash
# Initialize EAS Update
eas update:configure

# This adds runtime version and update URL to app.json
```

### 10.2 Publish Updates

```bash
# Push an update to the testflight channel
eas update --channel testflight --message "Fix recipe display bug"

# Push an update to the production channel
eas update --channel production --message "Fix recipe display bug"
```

### 10.3 Update Policy in `app.json`

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/d6a6c2b1-81c2-40d5-9f56-2c2604f21d1c",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### 10.4 When to Use OTA vs New Build

| Change Type | Method |
|-------------|--------|
| Bug fix in JS/TS code | OTA Update |
| UI changes (styling, layout) | OTA Update |
| New native dependency added | New EAS Build |
| Expo SDK upgrade | New EAS Build |
| `app.json` config change | New EAS Build |
| Asset changes (images, fonts) | OTA Update |

---

## 11. Monitoring & Crash Reporting

### 11.1 Recommended Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| [Sentry](https://sentry.io/) | Crash reporting, error tracking | `sentry-expo` package |
| [EAS Insights](https://expo.dev/) | Build analytics, update metrics | Built into EAS |
| [Convex Dashboard](https://dashboard.convex.dev/) | Backend monitoring, function logs | Built into Convex |

### 11.2 Sentry Setup (Recommended)

```bash
npx expo install sentry-expo @sentry/react-native
```

```typescript
// app/_layout.tsx
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

### 11.3 Convex Monitoring

- **Dashboard Logs**: Real-time function execution logs at `dashboard.convex.dev`
- **Error Alerts**: Configure alerts in Convex dashboard for function failures
- **Usage Metrics**: Monitor database reads/writes and function calls

---

## 12. Environment Management

### 12.1 Environment Strategy

```
┌─────────────────────────────────────────────────────┐
│                    ENVIRONMENTS                      │
├──────────────┬──────────────┬───────────────────────┤
│ Development  │   Staging    │     Production        │
├──────────────┼──────────────┼───────────────────────┤
│ Local Expo   │ TestFlight   │ App Store             │
│ Convex dev   │ Convex prod  │ Convex prod           │
│              │ (preview)    │                       │
│ EAS profile: │ EAS profile: │ EAS profile:          │
│ development  │ testflight   │ production            │
│              │              │                       │
│ Channel: N/A │ Channel:     │ Channel:              │
│              │ testflight   │ production            │
└──────────────┴──────────────┴───────────────────────┘
```

### 12.2 Convex Multi-Environment Setup

For separate staging/production backends:

1. **Create two Convex deployments** in the dashboard
2. **Configure environment-specific URLs**:

```bash
# .env.development
EXPO_PUBLIC_CONVEX_URL=https://dev-deployment.convex.cloud

# .env.staging
EXPO_PUBLIC_CONVEX_URL=https://staging-deployment.convex.cloud

# .env.production
EXPO_PUBLIC_CONVEX_URL=https://prod-deployment.convex.cloud
```

3. **EAS build environment variables** per profile:

```bash
# Set staging Convex URL for testflight builds
eas secret:create --name EXPO_PUBLIC_CONVEX_URL \
  --value "https://staging-deployment.convex.cloud" \
  --scope project \
  --type string

# Override for production builds using eas.json env
```

### 12.3 Convex Deploy per Environment

```bash
# Deploy to development (default)
npx convex dev

# Deploy to production
npx convex deploy --prod
```

---

## 13. Deployment Checklist

### Pre-Release

- [ ] All unit tests pass (`npm test`)
- [ ] E2E tests pass for critical flows
- [ ] Convex backend deployed to production (`npx convex deploy --prod`)
- [ ] Environment variables set in EAS and Convex dashboard
- [ ] App version bumped in `app.json` (or auto-incremented by EAS)
- [ ] Privacy policy and support URLs are live
- [ ] App Store listing assets prepared (screenshots, description, keywords)

### Build & Submit

- [ ] Run production build: `eas build --platform ios --profile production`
- [ ] Verify build succeeds on [expo.dev](https://expo.dev) dashboard
- [ ] Submit to App Store: `eas submit --platform ios --latest`
- [ ] Monitor submission status in App Store Connect

### Post-Release

- [ ] Verify app is live on the App Store
- [ ] Test critical flows on a real device from the App Store download
- [ ] Monitor Sentry/crash reports for first 24-48 hours
- [ ] Monitor Convex dashboard for backend errors
- [ ] Announce release to TestFlight beta testers (if applicable)

### Hotfix Process

```bash
# 1. Fix the bug on master
git commit -m "fix: critical recipe loading bug"
git push origin master

# 2. Option A: OTA update (JS-only changes)
eas update --channel production --message "Fix recipe loading bug"

# 3. Option B: New build (native changes)
git tag v1.0.1
git push origin v1.0.1
# CI/CD handles the rest
```

---

## Architecture Diagram

```
                    ┌──────────────────┐
                    │   GitHub Repo    │
                    │  (master branch) │
                    └────────┬─────────┘
                             │
                     push / tag v*
                             │
                    ┌────────▼─────────┐
                    │  GitHub Actions  │
                    │                  │
                    │  1. Run Tests    │
                    │  2. Deploy Convex│
                    │  3. EAS Build    │
                    │  4. EAS Submit   │
                    └───┬─────────┬────┘
                        │         │
              ┌─────────▼──┐  ┌──▼──────────┐
              │   Convex   │  │  EAS Build  │
              │  (Backend) │  │  (Cloud)    │
              │            │  │             │
              │ - Database │  │ - iOS .ipa  │
              │ - Functions│  │ - Signing   │
              │ - Auth     │  │             │
              └────────────┘  └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │  TestFlight │
                              │  or         │
                              │  App Store  │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │  End Users  │
                              │  (iOS App)  │
                              └─────────────┘
```
