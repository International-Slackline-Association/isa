#!/usr/bin/env bash
set -euo pipefail

file="${1:?usage: decrypt.sh <backup.tar.gz.p7m> <private-key>}"
key="${2:?usage: decrypt.sh <backup.tar.gz.p7m> <private-key>}"
out="$PWD/$(basename "$file" .tar.gz.p7m)"

[ -e "$out" ] && { echo "refusing to overwrite $out" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

openssl cms -decrypt -binary -inform DER -in "$file" -inkey "$key" -out "$tmp/data.tar.gz"
mkdir "$out"
tar -xzf "$tmp/data.tar.gz" -C "$out"

sed -n '/^sha256:$/,$p' "$out/MANIFEST.txt" | tail -n +2 > "$tmp/expected"
(cd "$out" && find . -type f ! -path ./MANIFEST.txt -print0 | sort -z | xargs -0 openssl dgst -sha256 -r) > "$tmp/actual"

if diff "$tmp/expected" "$tmp/actual" > "$tmp/diff"; then
  echo "$(wc -l < "$tmp/actual" | tr -d ' ') files verified in $out"
else
  echo "manifest mismatch in $out:" >&2; cat "$tmp/diff" >&2; exit 1
fi
