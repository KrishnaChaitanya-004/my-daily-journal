# 🔐 Security Policy

## 📔 KC’s Diary — Security Overview

**KC’s Diary** is designed with a **privacy-first, offline-first** security model.  
All user data is stored **locally on the device**, and **no data is transmitted to any server**.

This document explains how security is handled, how to report vulnerabilities, and what guarantees the app provides.

---

## 🔒 Data Storage & Privacy

### ✅ Local-Only Storage
- All diary entries, photos, voice notes, locations, and settings are stored **locally** on the device.
- No cloud sync.
- No analytics.
- No tracking.
- No third-party data sharing.

### 📂 Storage Locations
- Text data: LocalStorage / Capacitor Filesystem
- Media files: App-scoped internal storage
- Voice notes: Local audio files (Base64 + filesystem)
- Photos: Stored per-date in app directories

---

## 🔐 App Lock & Authentication

### PIN Lock
- Users can secure the app using a **4–6 digit PIN**.
- PIN is **never transmitted** or logged.
- PIN is stored securely in local encrypted storage.

### Biometric Authentication
- Optional fingerprint authentication (Android).
- Uses **system-level biometric APIs**.
- Biometric data is **never accessible** to the app.
- Authentication is verified by the OS only.

---

## 🔔 Notifications Security

- Notifications are scheduled locally on the device.
- No push notification servers are used.
- No personal content is sent externally.
- Notification permissions are requested explicitly from the user.

---

## 📍 Location & Weather Data

- Location access is **optional** and user-controlled.
- Location data is saved **only when the user adds it**.
- Weather data is fetched only at the time of location tagging.
- Location data is stored locally and never shared.

---

## 📸 Camera & 🎙️ Microphone Access

- Camera permission is used **only** for capturing photos.
- Microphone permission is used **only** for recording voice notes.
- Permissions are requested at runtime.
- Media access is user-initiated and transparent.

---

## 📦 Import / Export Security

- Exported data is packaged as a ZIP file.
- Exports are generated locally.
- Imports restore only data created by the app.
- No automatic uploads or downloads occur.

---

## 🔎 Search & Indexing

- Full-text search runs **entirely on-device**.
- Search indexes are built in memory.
- No external search services are used.

---

## 🧩 Third-Party Libraries

All third-party dependencies are open-source and used locally:

- React
- Capacitor
- Tailwind CSS
- Lucide Icons
- Recharts
- date-fns

No analytics SDKs, ads, or tracking libraries are included.

---

## 🧠 Threat Model

### What We Protect Against
- Accidental data leakage
- Unauthorized app access (PIN / biometric)
- Background data exfiltration
- Network-based attacks (no backend)

### What Users Are Responsible For
- Device-level security (lock screen, OS updates)
- Backup safety of exported ZIP files
- Physical access protection to their device

---

## 🚨 Reporting a Security Vulnerability

If you discover a security issue, please report it responsibly.

### How to Report
- Open a **GitHub Issue** (private if possible)
- Clearly describe:
  - Affected feature
  - Steps to reproduce
  - Expected vs actual behavior

### What to Avoid
- Do not publicly disclose vulnerabilities before a fix.
- Do not attempt to access other users’ data.

---

## ⏱️ Response Timeline

- **Initial response:** within 72 hours
- **Assessment & fix:** as soon as possible
- **Disclosure:** after fix is released

---

## 🔄 Security Updates

Security improvements are delivered via:
- App updates
- Dependency upgrades
- Android permission hardening
- Runtime checks and safeguards

---

## 📜 Security Philosophy

> Your diary is personal.  
> Security is not optional — it is the foundation.

KC’s Diary prioritizes:
- **User ownership**
- **Transparency**
- **Minimal permissions**
- **No hidden data flows**

---

## 🙏 Acknowledgements

Security design and hardening were guided with the help of:
- **Lovable** — for rapid UI and architectural foundations
- **ChatGPT (OpenAI)** — for threat modeling, Android security guidance, and permission handling best practices

---

## 📄 License & Scope

This security policy applies to:
- KC’s Diary application
- Official builds only

It does not cover:
- Modified or forked versions
- Rooted or compromised devices

---

*Last updated: 2026*
