---
type: how-to
title: "Make, store and restore a backup"
description: "Steps for an app owner to encrypt their essential data folder with encrypt.sh, and for the key holders to store it in Drive and restore it with decrypt.sh."
---

# Make, store and restore a backup

## Make one (app owner)

1. Put your app's essential data in one folder.
2. Get [encrypt.sh](/internals/data-backup/encrypt.sh) and [isa-backup.crt](/internals/data-backup/isa-backup.crt) side by side, outside the data folder (clone the repo or download both). Needs bash and openssl, already on macOS and Linux.
3. Run `encrypt.sh <app-name> <folder>`. It writes `isa-backup-<app-name>-<date>.tar.gz.p7m` with a checksum manifest inside.
4. Send that file to the ISA, or upload it to the ISA Google Drive backup folder if you have access.

## Store it (key holder)

1. Put the file in the ISA Google Drive backup folder.

## Restore one (key holder)

1. Run [decrypt.sh](/internals/data-backup/decrypt.sh) `<file> <private-key>`. It unpacks into a folder named like the file and checks every file against the manifest.

## New key

1. [generate-key.sh](/internals/data-backup/generate-key.sh) creates a key pair. Commit the certificate; give the private key to the key holders. Backups made with the old certificate still need the old key.
