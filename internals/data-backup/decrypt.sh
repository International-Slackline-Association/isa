#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

usage="usage: decrypt.sh <backup.p7m.tar> <private-key>"
file="${1:?$usage}"
key="${2:?$usage}"
out="$PWD/$(basename "$file" .p7m.tar)"

[ -e "$out" ] && { echo "refusing to overwrite $out" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/parts"
tar -xf "$file" -C "$tmp/parts"

for part in "$tmp/parts"/part-*.p7m; do
  openssl cms -decrypt -binary -inform DER -in "$part" -inkey "$key" -out "$tmp/part"
  cat "$tmp/part" >> "$tmp/data.tar.gz"
  rm "$part" "$tmp/part"
done
mkdir "$out"
tar -xzf "$tmp/data.tar.gz" -C "$out"

sed -n '/^sha256:$/,$p' "$out/MANIFEST.txt" | tail -n +2 > "$tmp/expected"
(cd "$out/data" && find . -type f -print0 | sort -z | xargs -0 openssl dgst -sha256 -r) > "$tmp/actual"

if diff "$tmp/expected" "$tmp/actual" > "$tmp/diff"; then
  echo "$(wc -l < "$tmp/actual" | tr -d ' ') files verified in $out/data"
else
  echo "manifest mismatch in $out:" >&2; cat "$tmp/diff" >&2; exit 1
fi
