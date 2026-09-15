#!/usr/bin/env bash
# Rate limit demo: fires login attempts through the gateway and counts how many reach the API and how many
# the gateway rejects with 429. The login route allows 10 requests/minute per IP with a burst of 5.
# Usage: bash scripts/rate-limit-demo.sh [number-of-requests]
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOTAL="${1:-15}"
passed=0
limited=0

for i in $(seq 1 "$TOTAL"); do
  status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email": "test@gmail.com", "password": "WrongPassword1!"}')

  if [[ "$status" == "429" ]]; then
    limited=$((limited + 1))
    label="bloqueada pelo gateway"
  else
    passed=$((passed + 1))
    label="chegou na API"
  fi
  printf '#%-2d -> %s (%s)\n' "$i" "$status" "$label"
done

echo
echo "Chegaram na API: $passed | Bloqueadas (429): $limited"
