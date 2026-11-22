#!/usr/bin/env bash
set -euo pipefail

app="${1:?usage: encrypt.sh <app-name> <folder>}"
dir="${2:?usage: encrypt.sh <app-name> <folder>}"
[ -d "$dir" ] && dir="$(cd "$dir" && pwd)"
crt="$(cd "$(dirname "$0")" && pwd)/isa-backup.crt"
date="$(date +%Y-%m-%d)"
out="$PWD/isa-backup-$app-$date.tar.gz.p7m"

[ -f "$crt" ] || { echo "missing $crt" >&2; exit 1; }
[ -d "$dir" ] || { echo "not a folder: $dir" >&2; exit 1; }
[ -n "$(find "$dir" -type f -print -quit)" ] || { echo "folder is empty: $dir" >&2; exit 1; }
[ -e "$out" ] && { echo "refusing to overwrite $out" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

{
  echo "app: $app"
  echo "date: $date"
  echo "sha256:"
  (cd "$dir" && find . -type f -print0 | sort -z | xargs -0 openssl dgst -sha256 -r)
} > "$tmp/MANIFEST.txt"

tar -czf "$tmp/data.tar.gz" -C "$tmp" MANIFEST.txt -C "$dir" .
openssl cms -encrypt -binary -aes-256-cbc -outform DER \
  -in "$tmp/data.tar.gz" -out "$out" "$crt"

echo "$(grep -c ' \*' "$tmp/MANIFEST.txt") files encrypted to $out"
