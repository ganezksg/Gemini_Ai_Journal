# EMORA — Personal Gemini Journal

> A private, security-first personal reflection sanctuary with botanical visual intelligence, interactive Topics Tree, and multi-turn Gemini conversations.

---

## Overview

**EMORA** is an introspective journaling space designed around strict user privacy, mindful design, and deep semantic intelligence. Powered by Google Gemini through an isolated, server-side architecture, EMORA transforms unstructured personal reflections into an interactive **Reflection Landscape** (Topics Tree) and surface recurring emotional patterns without ever compromising data isolation or security.

---

## Main Features

1. **Private Multi-Turn Gemini Journaling**
   - Natural conversational dialogue with an empathetic, insightful reflection companion.
   - Dynamic prompt generation grounded solely in the authenticated user's own thoughts.
   - Context is securely bounded per-user and per-journal session.

2. **Personal Reflection Intelligence (Original Hackathon Feature)**
   - Algorithmic analysis of the authenticated user's journal entries to detect recurring themes, emotional undertones, cognitive shifts, and growth arcs over time.
   - Zero cross-user data exposure: all analysis runs strictly within the user's isolated data perimeter.

3. **Reflection Landscape & Interactive Topics Tree**
   - Dynamic node-graph visualization using `@xyflow/react` mapping extracted reflection topics.
   - Frequency-scaled nodes, interactive connections, semantic clusters, and responsive canvas sizing.
   - Direct navigation from topics to the underlying journal reflections that sparked them.

4. **Share Card Studio**
   - High-fidelity visual cards for personal reflection milestones and insights.
   - **Download PNG** and **Copy Image to Clipboard** capabilities with styled typography and themes.

5. **Security-First Architecture**
   - **Firebase Authentication** as the authoritative identity provider.
   - **Private Cloud Firestore**: Strict tenant isolation under `users/{uid}/journals/{journalId}`.
   - **Server-Side Secret Management**: Gemini API credentials never touch browser bundles or client requests. Retrievable via Google Cloud Secret Manager or secure server-side environment variables.
   - **Input & Output Validation**: Prompt injection mitigations, character limits, schema enforcement, and sanitization before persistence.

6. **Responsive Botanical Interface**
   - Tailored dual-mode design with desktop sidebar navigation and an ergonomic mobile bottom navigation bar.
   - Thoughtful layout handling ensuring keyboard accessibility, safe-area inset support, and non-overlapping composers across screen sizes.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide React
- **Visualization**: `@xyflow/react`, HTML5 Canvas
- **Backend / API**: Node.js, Express, `tsx`, `esbuild`
- **AI / LLM**: `@google/genai` (Google Gen AI SDK), Gemini 2.5 Flash / Pro
- **Security & Secrets**: `@google-cloud/secret-manager`, Firebase Admin SDK
- **Database & Identity**: Firebase Authentication, Google Cloud Firestore

---

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm, pnpm, or bun
- A Firebase project with Firestore and Authentication enabled
- A Google Gemini API Key (or Google Cloud Secret Manager access)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd personal-gemini-journal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Duplicate `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Optional: Google Cloud Secret Manager resource identifier
# Format: projects/{PROJECT_ID}/secrets/{SECRET_NAME}/versions/{VERSION} or {SECRET_NAME}
GEMINI_SECRET_NAME=

# Fallback server-side Gemini API key (Required if GEMINI_SECRET_NAME is not set)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Project ID
FIREBASE_PROJECT_ID=footnote-507318

# Local application URL
APP_URL=http://localhost:3000
```

> **Security Note:** Never commit `.env` or any real API keys to version control.

### 4. Firebase Configuration

Ensure `firebase-applet-config.json` contains your client-facing Firebase web configuration:
- `projectId`
- `appId`
- `apiKey`
- `authDomain`
- `firestoreDatabaseId`

Deploy your Firestore Security Rules:
```bash
firebase deploy --only firestore:rules
```
The provided `firestore.rules` file enforces strict owner-only access:
```text
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### 5. Run in Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:3000` with Express serving the backend API routes and Vite handling the frontend HMR middleware.

### 6. Build and Run in Production

```bash
# Compile client assets and server bundle
npm run build

# Start the compiled production server
npm start
```

---

## Project Structure

```
.
├── firebase-applet-config.json # Client Firebase configuration
├── firestore.rules             # Cloud Firestore security rules
├── index.html                  # Application HTML entrypoint
├── metadata.json               # Platform metadata and permissions
├── package.json                # Dependencies and scripts
├── server.ts                   # Express server & Gemini backend proxy
├── src/
│   ├── App.tsx                 # Top-level view router
│   ├── components/
│   │   ├── AppShell.tsx        # Responsive navigation & layout wrapper
│   │   ├── AuthModal.tsx       # Firebase authentication dialog
│   │   ├── Dashboard.tsx       # Welcome dashboard & reflection prompt cards
│   │   ├── JournalScreen.tsx   # Interactive chat & reflection composer
│   │   ├── ReflectionLandscape.tsx # Topics Tree & node graph visualization
│   │   ├── ShareCardModal.tsx  # Share Card generation, PNG download, clipboard copy
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.tsx     # Firebase user session provider
│   ├── lib/
│   │   └── firebase.ts         # Client Firebase initialization
│   ├── services/
│   │   ├── gemini.ts           # Client API service proxy
│   │   └── journalService.ts   # Firestore journal operations
│   └── types/                  # Shared TypeScript interfaces
└── tsconfig.json
```

---

## Security & Privacy Highlights

- **Zero Trust Client**: All client-submitted entries undergo server-side validation and sanitization.
- **Tenant Isolation**: Firestore rules reject any read or write where `request.auth.uid != resource.data.userId`.
- **Credential Protection**: Gemini API tokens are never sent to or visible from the browser.
- **Safe Output Parsing**: Model summaries and JSON schema outputs are strictly validated before database persistence.

---

## License

This project was built for the Google AI Studio / Gemini Hackathon. All rights reserved.
