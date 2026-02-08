#!/usr/bin/env bash
# deploy-cloudrun.sh — Deploy Sentinel Demo to Google Cloud Run
# Run this from Google Cloud Shell: bash deploy-cloudrun.sh
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
PROJECT_ID="gen-lang-client-0754692302"
REGION="us-central1"
SERVICE_NAME="sentinel-demo"
REPO_URL="https://github.com/Kaide-LABS/leamur.git"
REPO_DIR="$HOME/leamur"

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

phase() { echo -e "\n${BLUE}═══ Phase $1: $2 ═══${NC}\n"; }
ok()    { echo -e "${GREEN}✓ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $1${NC}"; }
fail()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ─── Phase 1: Validate Prerequisites ────────────────────────────────────────
phase 1 "Validate Prerequisites"

if ! command -v gcloud &>/dev/null; then
  fail "gcloud CLI not found. Run this script in Google Cloud Shell."
fi

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  warn "Current project is '$CURRENT_PROJECT', switching to '$PROJECT_ID'"
  gcloud config set project "$PROJECT_ID"
fi
ok "GCP project set to $PROJECT_ID"

ACCOUNT=$(gcloud config get-value account 2>/dev/null || true)
ok "Authenticated as $ACCOUNT"

# ─── Phase 2: Enable APIs ───────────────────────────────────────────────────
phase 2 "Enable APIs"

APIS=(
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "aiplatform.googleapis.com"
)

for api in "${APIS[@]}"; do
  echo "  Enabling $api..."
  gcloud services enable "$api" --quiet
done
ok "All required APIs enabled"

# ─── Phase 3: Grant Vertex AI Access to Cloud Run Service Account ────────────
phase 3 "IAM Permissions"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CR_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "  Granting roles/aiplatform.user to $CR_SA..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CR_SA}" \
  --role="roles/aiplatform.user" \
  --quiet >/dev/null
ok "Cloud Run service account has Vertex AI access"

# ─── Phase 4: Clone / Pull Repository ───────────────────────────────────────
phase 4 "Repository"

if [ -d "$REPO_DIR/.git" ]; then
  echo "  Repo exists at $REPO_DIR, pulling latest..."
  git -C "$REPO_DIR" pull --ff-only
else
  echo "  Cloning $REPO_URL..."
  git clone "$REPO_URL" "$REPO_DIR"
fi
ok "Repository ready at $REPO_DIR"

# ─── Phase 5: Collect Secrets ────────────────────────────────────────────────
phase 5 "Collect Secrets"

echo "Enter the following credentials (input is hidden):"
echo ""

read -s -p "  AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
echo ""
if [ -z "$AWS_ACCESS_KEY_ID" ]; then fail "AWS_ACCESS_KEY_ID is required"; fi

read -s -p "  AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
echo ""
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then fail "AWS_SECRET_ACCESS_KEY is required"; fi

read -s -p "  OPENAI_API_KEY: " OPENAI_API_KEY
echo ""
if [ -z "$OPENAI_API_KEY" ]; then fail "OPENAI_API_KEY is required"; fi

ok "Secrets collected"

# ─── Phase 6: Deploy to Cloud Run ───────────────────────────────────────────
phase 6 "Deploy to Cloud Run"

echo "  Deploying $SERVICE_NAME to $REGION (this takes 3-7 minutes)..."
echo ""

cd "$REPO_DIR/sentinel-demo"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --timeout=600 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=global,AWS_REGION=us-east-1,AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID},AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY},OPENAI_API_KEY=${OPENAI_API_KEY},AI_MODE=live,NODE_ENV=production" \
  --quiet

ok "Deployment complete"

# ─── Phase 7: Verify ────────────────────────────────────────────────────────
phase 7 "Verify Deployment"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format="value(status.url)" 2>/dev/null || true)

if [ -z "$SERVICE_URL" ]; then
  fail "Could not retrieve service URL. Check: gcloud run services list --region $REGION"
fi

echo "  Service URL: $SERVICE_URL"
echo "  Testing..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$SERVICE_URL" || echo "000")

echo ""
if [ "$HTTP_STATUS" = "200" ]; then
  ok "App is live! HTTP $HTTP_STATUS"
else
  warn "HTTP $HTTP_STATUS — app may still be starting up"
  echo "  Check logs: gcloud run logs read --service $SERVICE_NAME --region $REGION --limit 50"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Service:  $SERVICE_NAME"
echo "  Region:   $REGION"
echo "  URL:      $SERVICE_URL"
echo "  Timeout:  600s"
echo "  Memory:   1Gi"
echo ""
echo "  To redeploy after code changes:"
echo "    cd $REPO_DIR/sentinel-demo && git pull && gcloud run deploy $SERVICE_NAME --source . --region $REGION --quiet"
echo ""
echo "  To view logs:"
echo "    gcloud run logs read --service $SERVICE_NAME --region $REGION --limit 50"
echo ""
echo "  To delete:"
echo "    gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""
