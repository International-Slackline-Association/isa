#!/usr/bin/env bash
set -euo pipefail

out="${1:?usage: generate-key.sh <output-dir>}"
key="$out/isa-backup.key"
crt="$out/isa-backup.crt"
[ -e "$key" ] && { echo "refusing to overwrite $key" >&2; exit 1; }

mkdir -p "$out"
openssl req -x509 -newkey rsa:4096 -nodes -days 36500 \
  -subj "/CN=ISA data backup" -keyout "$key" -out "$crt" 2>/dev/null
chmod 600 "$key"

echo "private key: $key   (never into the repo, AWS or Drive)"
echo "certificate: $crt   (commit as internals/data-backup/isa-backup.crt)"
