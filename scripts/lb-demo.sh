#!/usr/bin/env bash
# Load balancer demo: sends requests through the gateway and prints which API replica answered each one.
# Usage: bash scripts/lb-demo.sh [number-of-requests]
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOTAL="${1:-10}"

declare -A count=()

for i in $(seq 1 "$TOTAL"); do
  instance=$(curl -s -o /dev/null -D - "$BASE_URL/actuator/health" \
    | tr -d '\r' \
    | awk -F': ' 'tolower($1) == "x-instance-id" { print $2 }')
  instance="${instance:-sem resposta}"
  count["$instance"]=$(( ${count["$instance"]:-0} + 1 ))
  printf '#%-2d -> %s\n' "$i" "$instance"
done

echo
echo "Resumo:"
for instance in "${!count[@]}"; do
  echo "  $instance: ${count[$instance]}"
done
