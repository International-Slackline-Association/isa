---
type: explanation
title: "Why backups work this way"
description: "Why the off-AWS backup is owner-made, encrypted to one certificate with openssl CMS, kept in Google Drive; who holds the private key."
---

# Why backups work this way

Everything we run is infrastructure as code in AWS, so losing AWS loses everything. This is the one copy outside it, kept deliberately simple.

- **Owners make it.** Each app owner generates their own archive and decides what is essential; their judgment is enough. They set their own 6-month reminders. We only receive the file and keep it.
- **Encrypted, because Drive is not trusted.** Some data is personal, and the ISA Google Workspace Drive is outside what we control.
- **One certificate, no shared secret.** Owners encrypt to a public certificate in this repo; only the private key decrypts. Nobody is handed a secret, and no owner can read another app's backup.
- **The private key** stays outside AWS and Drive, with 2-3 essential people at most.
- **Cold storage.** A backup will probably never be decrypted; if it is, it is an emergency and paying for compute once is fine. The tool matters little: openssl CMS is standard, decades old and already installed everywhere, so owners install nothing.
