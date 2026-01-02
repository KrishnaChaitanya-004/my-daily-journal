# 📔 KC’s Diary

**KC’s Diary** is a modern, offline-first personal journaling application built with **React + TypeScript** and powered by **Capacitor** for Android.  
It helps you capture daily thoughts, tasks, photos, voice notes, locations, habits, and memories — all stored **locally on your device** with full privacy.

---

## ✨ Features

### 📝 Daily Journal
- Write rich text diary entries per day  
- Auto-save when app goes to background  
- Insert timestamps while writing  
- Full-screen distraction-free editor  

### ✅ Tasks (Todos)
- Add tasks inline inside notes  
- Toggle tasks as completed/uncompleted  
- Tasks can be added via **Floating Action Button (FAB)**  

### 📸 Photos
- Capture photos using device camera  
- Import photos from gallery  
- Photos are stored locally per day  
- Inline photo rendering inside notes  
- Full-screen photo viewer  

### 🎙️ Voice Notes
- Record voice notes directly from the app  
- Play, pause, and delete recordings  
- Duration shown for each voice note  
- Stored securely on device  

### 📍 Location & 🌦️ Weather
- Attach current location to a diary entry  
- Save place name with coordinates  
- Fetch and store weather information  
- Optional — fully user-controlled  

### 🔖 Bookmarks
- Bookmark important days  
- Quickly access saved entries  

### 🗓️ Calendar
- Visual calendar with:
  - Selected date highlight  
  - Days with content indicator  
  - Bookmarked days indicator  
- Customizable **calendar selection color**  
- Collapsible calendar view  

### 📊 Statistics
- Daily, weekly, and monthly insights  
- Word count trends  
- Photo usage stats  
- Task completion overview  
- Habit consistency (last 30 days)  

### 🎯 Habits
- Create daily habits  
- Track completion per day  
- View consistency charts  

### 🏷️ Tags
- Add tags to diary entries  
- Filter and browse by tags  

### 🔍 Search
- Full-text search across all diary entries  
- Instant navigation to matched dates  

---

## 🎨 Customization & Settings

### 🎨 Theme & Appearance
- Theme color (preset + custom)  
- Background color  
- Font color  
- Calendar selection color  
- Widget theme color (Android)  
- Font family:
  - Inter  
  - Delius  
  - Georgia  
  - Courier  
  - Custom Google Fonts  
- Font size: Small / Medium / Large  

### 🔒 Security
- App lock with PIN (4–6 digits)  
- Optional biometric (fingerprint) unlock  
- Local-only authentication (no server)  

### 🔔 Notifications
- Daily reminder notifications  
- Custom reminder time  
- Custom message  
- Android exact-alarm support  
- Battery optimization guidance  

### 📦 Data Management
- Export diary data as ZIP  
- Import diary backup  
- 100% offline & local storage  

---

## 📱 Android Support

- Built using **Capacitor**  
- Native Android permissions handled:
  - Camera  
  - Microphone  
  - Storage  
  - Notifications  
  - Location  
- Offline-first (no backend required)  
- Android splash screen & app icons  
- Optimized for Android WebView quirks  

---

## 🛠️ Tech Stack

- **React + TypeScript**  
- **Vite**  
- **Tailwind CSS**  
- **Capacitor (Android)**  
- **Lucide Icons**  
- **Recharts**  
- **date-fns**  
- LocalStorage + Capacitor Filesystem  

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 18 recommended)  
- Android Studio  
- Capacitor CLI  

### Install Dependencies
```bash
npm install
```
---
###Run in Browser
```bash
npm run dev
```
---
###Build for Android
```bash
npm run build
npx cap sync android
npx cap open android
```
---
This project was made possible with the help of:

Lovable — for rapid UI scaffolding and idea acceleration

ChatGPT (OpenAI) — for deep debugging, Android-specific fixes, architecture guidance, and step-by-step problem solving
