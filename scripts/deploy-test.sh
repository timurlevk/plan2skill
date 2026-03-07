#!/usr/bin/env bash
set -euo pipefail

# deploy-test.sh — merge current branch into test env, build, and start services
# Usage: pnpm deploy:test  OR  bash scripts/deploy-test.sh
#
# All test env config is in one place below. Edit these vars to change ports/paths.

# ── Config ──────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_ENV="/c/plan2skill_TEST"
TEST_API_PORT=4001
TEST_WEB_PORT=3501
TEST_DB_PORT=5434
TEST_DB_NAME="plan2skill_test"
TEST_DB_USER="plan2skill"
TEST_DB_PASS="plan2skill_dev"
# ────────────────────────────────────────────────────────

PIDS_FILE="$TEST_ENV/.pids"
DATABASE_URL="postgresql://${TEST_DB_USER}:${TEST_DB_PASS}@localhost:${TEST_DB_PORT}/${TEST_DB_NAME}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[test-env]${NC} $1"; }
warn() { echo -e "${YELLOW}[test-env]${NC} $1"; }
err()  { echo -e "${RED}[test-env]${NC} $1"; }

# 1. Get current branch
BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)
log "Deploying branch: $BRANCH"
log "  Path: $TEST_ENV"
log "  API:  :$TEST_API_PORT  Web: :$TEST_WEB_PORT  DB: :$TEST_DB_PORT/$TEST_DB_NAME"

# 2. Check worktree exists
if [ ! -d "$TEST_ENV" ]; then
  err "Test environment not found at $TEST_ENV"
  err "Run: git worktree add $TEST_ENV master"
  exit 1
fi

# 3. Merge current branch into test env
log "Merging $BRANCH into test env..."
cd "$TEST_ENV"
git checkout master 2>/dev/null || true
git merge "$BRANCH" --no-edit
log "Merge complete"

# 3b. Patch next.config to skip ESLint + TypeScript errors during build (test env only)
NEXT_CONFIG="$TEST_ENV/apps/web/next.config.ts"
if ! grep -q 'ignoreDuringBuilds' "$NEXT_CONFIG" 2>/dev/null; then
  sed -i '/^};/i\  eslint: { ignoreDuringBuilds: true },' "$NEXT_CONFIG"
  log "Patched next.config.ts: eslint.ignoreDuringBuilds"
fi
if ! grep -q 'ignoreBuildErrors' "$NEXT_CONFIG" 2>/dev/null; then
  sed -i '/^};/i\  typescript: { ignoreBuildErrors: true },' "$NEXT_CONFIG"
  log "Patched next.config.ts: typescript.ignoreBuildErrors"
fi

# 3c. Ensure CORS_ORIGINS patch exists in main.ts (until merged into master)
API_MAIN="$TEST_ENV/apps/api/src/main.ts"
if ! grep -q 'CORS_ORIGINS' "$API_MAIN" 2>/dev/null; then
  sed -i "s|app.enableCors({|const corsOrigins = process.env.CORS_ORIGINS\n    ? process.env.CORS_ORIGINS.split(',')\n    : ['http://localhost:3500', 'exp://localhost:8081'];\n\n  app.enableCors({|" "$API_MAIN"
  sed -i "s|origin: \[|origin: corsOrigins, // was: [|" "$API_MAIN"
  log "Patched main.ts: CORS_ORIGINS env var"
fi

# 3d. Write env files with current config
cat > "$TEST_ENV/apps/api/.env" <<EOF
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="test-env-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
ANTHROPIC_API_KEY=""
PORT=${TEST_API_PORT}
NODE_ENV="development"
CORS_ORIGINS="http://localhost:${TEST_WEB_PORT}"
EOF

cat > "$TEST_ENV/apps/web/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:${TEST_API_PORT}
EOF
log "Wrote env files"

# 4. Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile

# 5. Prisma generate + migrate + seed
log "Running Prisma generate & migrate..."
cd "$TEST_ENV/apps/api"
npx prisma generate
npx prisma migrate deploy
log "Seeding database..."
npx tsx prisma/seed.ts
npx tsx prisma/seed-i18n-full.ts
cd "$TEST_ENV"

# 6. Build
log "Building all packages..."
pnpm build

# 7. Kill old test processes
if [ -f "$PIDS_FILE" ]; then
  log "Stopping previous test processes..."
  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      log "  Stopped PID $pid"
    fi
  done < "$PIDS_FILE"
  rm -f "$PIDS_FILE"
fi

# 8. Start API
log "Starting API on :$TEST_API_PORT..."
cd "$TEST_ENV/apps/api"
node dist/main.js &
API_PID=$!
cd "$TEST_ENV"

# 9. Start Web
log "Starting Web on :$TEST_WEB_PORT..."
cd "$TEST_ENV/apps/web"
npx next start -p "$TEST_WEB_PORT" &
WEB_PID=$!
cd "$TEST_ENV"

# 10. Save PIDs
echo "$API_PID" > "$PIDS_FILE"
echo "$WEB_PID" >> "$PIDS_FILE"

log "==============================="
log "Test environment is running!"
log "  Web:  http://localhost:$TEST_WEB_PORT"
log "  API:  http://localhost:$TEST_API_PORT"
log "  DB:   $TEST_DB_NAME on :$TEST_DB_PORT"
log "  PIDs: API=$API_PID, Web=$WEB_PID"
log "==============================="
log "Branch deployed: $BRANCH"
log "To stop: kill $API_PID $WEB_PID"
