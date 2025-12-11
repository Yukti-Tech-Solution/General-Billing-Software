# Environment Variables Setup

## Quick Setup

1. **Create a `.env` file** in the project root directory
2. **Copy the template below** and fill in your Firebase credentials

## Environment Variables Template

Create a `.env` file with the following content:

```env
# Firebase Configuration
# You can find these in Firebase Console > Project Settings > General > Your apps

# Important: In Vite, environment variables must be prefixed with VITE_ to be exposed to client-side code

VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Important Notes

- **Never commit `.env` files** to version control (they are already in `.gitignore`)
- Environment variables **must be prefixed with `VITE_`** for Vite to expose them to client-side code
- Replace all placeholder values with your actual Firebase credentials
- After creating the `.env` file, restart your development server for changes to take effect

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you haven't added a web app, click "Add app" and select the web icon (</>)
7. Copy the configuration values to your `.env` file

## Without Firebase

If you don't need Firebase right now, you can skip creating the `.env` file. The app will use placeholder values, but Firebase features won't work until you configure it.

