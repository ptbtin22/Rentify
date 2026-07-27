# Rentify 🏡

Rentify is a cross-platform rental management mobile application built using **React Native + Expo** and **TypeScript**. 

It simplifies operations for landlords and provides a unified dashboard for tenants to access notices, check lease contracts, trace payment logs, and trigger emergency broadcasts.

---

## 📂 Codebase Structure

*   **`app/`**: Contains the Expo Router file-based pages and layouts.
    *   **`app/(landlord)/`**: Screens and bottom tabs for the Landlord portal (Dashboard, Properties, Tenants, Payments, Notices).
    *   **`app/(tenant)/`**: Screens and bottom tabs for the Tenant portal (Home, Bulletin).
    *   **`app/onboarding.tsx`**: Paging slide carousel for introducing the app.
    *   **`app/login.tsx`**: Segmented role picker, animated input fields, and country code validations.
*   **`services/`**: Core application logic layers:
    *   `Database.ts`: Replicates SwiftData models (Properties, Tenants, Leases, Payments) reactively.
    *   `AuthManager.ts`: Stores active user roles and handles onboarding logs.
    *   `LanguageManager.ts`: Manages English and Vietnamese translations.
*   **`native-ios-backup/`**: Holds the original native iOS Swift project files (preserved for reference).

---

## ✨ Features

### 🏠 Landlord Portal
*   **Dashboard**: Calculate monthly revenue, overdue/pending balances, occupancy rates, and view payment overview legends.
*   **Properties Registry**: List rental units, add rooms with bedroom/bathroom configurations, and inspect lease histories.
*   **Tenants Registry**: Maintain contacts and write notes.
*   **Payments & Leases**: Build new lease agreements linking properties to tenants, generate invoices, and record payments.
*   **Notices board**: Post building announcements (Info, Urgent, Fire Alerts) and delete bulletins.

### 👤 Tenant Portal
*   **Tenant Portal (Home)**: View active lease terms (rental address, monthly rent, deposits, and duration dates) and pay logs.
*   **Community Bulletin**: Review announcements and trigger immediate **evacuation fire alarms** ("Báo Cháy").
*   **Emergency Warning Banner**: If a fire alert notice is added, a warning banner slides down from the top of the screen instantly.

---

## 🚀 How to Run the App

Ensure you have **Node.js** (v18 or higher) installed on your system.

### 1. Install Dependencies
Navigate to the project root and run:
```bash
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```

### 3. Open on Devices / Simulators

*   **iOS Simulator (Mac)**: Press **`i`** in the terminal.
*   **Android Emulator**: Open your emulator and press **`a`** in the terminal.
*   **Physical Phones (iOS & Android)**:
    1. Download the free **Expo Go** app from the App Store or Google Play Store.
    2. Scan the **QR Code** printed in your terminal.
    3. The app will launch instantly on your device!

---

## 🌐 Localization & Language Support
Rentify is localized in both **English (EN)** and **Vietnamese (VI)**. You can dynamically swap languages using the toolbar selector in the login screen header.
