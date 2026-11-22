#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

usage="usage: encrypt.sh <app-name> <folder>"
app="${1:?$usage}"
dir="${2:?$usage}"
crt="$(cd "$(dirname "$0")" && pwd)/isa-backup.crt"
date="$(date +%Y-%m-%d)"
out="$PWD/isa-backup-$app-$date.p7m.tar"

[ -f "$crt" ] || { echo "missing $crt" >&2; exit 1; }
[ -d "$dir" ] || { echo "not a folder: $dir" >&2; exit 1; }
dir="$(cd "$dir" && pwd)"
[ -n "$(find -L "$dir" -type f -print -quit)" ] || { echo "folder is empty: $dir" >&2; exit 1; }
[ -e "$out" ] && { echo "refusing to overwrite $out" >&2; exit 1; }

tmp="$(mktemp -d)"
ok=""
trap 'rm -rf "$tmp"; [ -n "$ok" ] || rm -f "$out"' EXIT
mkdir "$tmp/pack" "$tmp/parts"
ln -s "$dir" "$tmp/pack/data"

{
  echo "app: $app"
  echo "date: $date"
  echo "sha256:"
  (cd "$dir" && find -L . -type f -print0 | sort -z | xargs -0 openssl dgst -sha256 -r)
} > "$tmp/pack/MANIFEST.txt"

# openssl cms holds a whole message in one buffer and cannot decrypt one over ~1.5 GiB, so the archive is encrypted in parts.
tar -czhf - -C "$tmp/pack" MANIFEST.txt data | split -b 512m - "$tmp/parts/part-"
for part in "$tmp/parts"/part-*; do
  openssl cms -encrypt -binary -aes-256-cbc -outform DER -in "$part" -out "$part.p7m" "$crt"
  rm "$part"
done
tar -cf "$out" -C "$tmp/parts" .
ok=1

echo "$(grep -c ' \*' "$tmp/pack/MANIFEST.txt") files encrypted to $out"
