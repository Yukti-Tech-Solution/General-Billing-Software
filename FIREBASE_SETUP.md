# Firebase Firestore Integration Setup Guide

This guide will help you set up Firebase Firestore for real-time sync across devices in your Electron billing software.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Configure Firebase Credentials](#configure-firebase-credentials)
4. [Firebase Security Rules](#firebase-security-rules)
5. [Testing Sync Functionality](#testing-sync-functionality)
6. [Troubleshooting](#troubleshooting)
7. [Architecture Overview](#architecture-overview)

## Prerequisites

- A Google account
- Node.js and npm installed
- Firebase CLI (optional, for advanced setup)

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "Billing Software")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for project creation to complete

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click on **Sign-in method** tab
3. Enable **Email/Password** authentication:
   - Click on **Email/Password**
   - Toggle **Enable** switch
   - Click **Save**

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select a location for your database (choose closest to your users)
5. Click **"Enable"**

### Step 4: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to **Project Overview**
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web** icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "Billing Software Web")
6. Copy the Firebase configuration object

The configuration will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Configure Firebase Credentials

### Option 1: Environment Variables (Recommended for Production)

1. Create a `.env` file in the project root:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

2. Update `src/firebase/config.js` to use environment variables (already configured)

### Option 2: Direct Configuration (For Development)

1. Open `src/firebase/config.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

**Important:** Never commit your Firebase credentials to version control. Use environment variables or a secure configuration management system.

## Firebase Security Rules

### Step 1: Set Up Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the data
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users can only access their own data
    match /users/{userId} {
      // Allow read/write only if the user is the owner
      allow read, write: if isOwner(userId);
      
      // Company settings
      match /company/{document=**} {
        allow read, write: if isOwner(userId);
      }
      
      // Products collection
      match /products/{productId} {
        allow read, write: if isOwner(userId);
      }
      
      // Customers collection
      match /customers/{customerId} {
        allow read, write: if isOwner(userId);
      }
      
      // Invoices collection
      match /invoices/{invoiceId} {
        allow read, write: if isOwner(userId);
        
        // Invoice items sub-collection
        match /items/{itemId} {
          allow read, write: if isOwner(userId);
        }
      }
    }
  }
}
```

3. Click **"Publish"** to save the rules

### Step 2: Test Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules** tab
2. Click **"Rules playground"** to test your rules
3. Test scenarios:
   - Authenticated user accessing their own data (should succeed)
   - Authenticated user accessing another user's data (should fail)
   - Unauthenticated user accessing any data (should fail)

## Testing Sync Functionality

### Step 1: Install Dependencies

```bash
npm install
```

This will install Firebase SDK along with other dependencies.

### Step 2: Start the Application

```bash
npm run electron-dev
```

### Step 3: Test Authentication

1. Open the application
2. Go to **Settings**
3. Click **"Sign In / Sign Up"**
4. Create a new account or sign in with existing credentials
5. Verify that you see "Signed in as [your-email]"

### Step 4: Test Manual Sync

1. In Settings, ensure you're signed in
2. Add some test data:
   - Create a product
   - Create a customer
   - Create an invoice
3. Click **"Sync Now"** button
4. Check the sync status indicator in the header
5. Verify data appears in Firebase Console > Firestore Database

### Step 5: Test Auto Sync

1. In Settings, toggle **"Enable Auto Sync"** ON
2. Make changes to data (add/edit products, customers, invoices)
3. Observe the sync status indicator in the header
4. Changes should sync automatically within a few seconds

### Step 6: Test Real-time Sync (Multi-Device)

1. Open the application on Device A
2. Sign in with the same account
3. Open the application on Device B (or another browser window)
4. Sign in with the same account
5. Make changes on Device A
6. Verify changes appear on Device B in real-time

### Step 7: Test Offline Support

1. Enable auto sync
2. Disconnect from the internet
3. Make some changes to data
4. Verify changes are saved locally (check sync status shows "pending")
5. Reconnect to the internet
6. Verify changes sync automatically

## Troubleshooting

### Issue: "Firebase initialization error"

**Possible Causes:**
- Invalid Firebase configuration
- Missing environment variables
- Network connectivity issues

**Solutions:**
1. Verify Firebase config values in `src/firebase/config.js`
2. Check that all required fields are present
3. Ensure you have internet connection
4. Check browser console for detailed error messages

### Issue: "User not authenticated" error

**Possible Causes:**
- User not signed in
- Authentication token expired
- Firebase Auth not enabled

**Solutions:**
1. Go to Settings and sign in
2. Check Firebase Console > Authentication to verify email/password is enabled
3. Try signing out and signing in again

### Issue: "Permission denied" error

**Possible Causes:**
- Security rules not configured correctly
- User trying to access another user's data
- Security rules not published

**Solutions:**
1. Verify security rules in Firebase Console
2. Ensure rules are published
3. Check that user is authenticated
4. Verify user ID matches the document path

### Issue: Sync not working

**Possible Causes:**
- Offline mode
- Network issues
- Sync errors in console
- Auto sync disabled

**Solutions:**
1. Check internet connection
2. Verify sync status in header
3. Check browser console for errors
4. Enable auto sync in Settings
5. Try manual sync
6. Check Firebase Console for data

### Issue: Data conflicts

**Possible Causes:**
- Same record modified on multiple devices simultaneously
- Network delays
- Sync timing issues

**Solutions:**
1. The system uses "last-write-wins" conflict resolution
2. Check `lastModified` timestamps in database
3. Most recent change will be kept
4. For critical data, consider manual review before syncing

### Issue: "Firestore persistence failed: Multiple tabs open"

**Possible Causes:**
- Multiple instances of the app running
- Multiple browser tabs with the app

**Solutions:**
1. This is a warning, not an error
2. Firestore offline persistence works in one tab at a time
3. Close other tabs/instances if you need offline persistence
4. Sync will still work, but offline cache may not be available

### Issue: Slow sync performance

**Possible Causes:**
- Large amount of data
- Network latency
- Too many simultaneous syncs

**Solutions:**
1. Sync happens in batches for efficiency
2. Check network connection speed
3. Reduce amount of data if possible
4. Sync happens in background, so it shouldn't block UI

## Architecture Overview

### Data Flow

```
Local SQLite Database
    ↓ (on change)
Sync Manager
    ↓ (if online)
Firebase Firestore
    ↓ (real-time listener)
Other Devices
```

### Database Structure

```
/users/{userId}/
  ├── company/
  │   └── settings (document)
  ├── products/
  │   └── {productId} (documents)
  ├── customers/
  │   └── {customerId} (documents)
  └── invoices/
      ├── {invoiceId} (documents)
      └── {invoiceId}/items/
          └── {itemId} (sub-collection documents)
```

### Sync Fields in Local Database

Each table now includes:
- `userId`: Firebase user ID
- `cloudId`: Firestore document ID
- `syncStatus`: 'synced', 'pending', or 'conflict'
- `lastModified`: Timestamp of last modification
- `lastModifiedBy`: Device identifier

### Sync Process

1. **Local Change**: User makes change → Saved to SQLite with `syncStatus='pending'`
2. **Background Sync**: Sync manager detects pending changes → Uploads to Firestore
3. **Real-time Update**: Firestore listeners on other devices → Download changes
4. **Conflict Resolution**: If conflicts occur → Last-write-wins strategy

### Offline Support

- Changes are queued locally when offline
- Sync automatically resumes when connection is restored
- Firestore offline persistence caches data locally
- All operations work offline, sync happens when online

## Best Practices

1. **Security**
   - Never commit Firebase credentials to version control
   - Use environment variables for production
   - Regularly review and update security rules
   - Enable Firebase App Check for additional security

2. **Performance**
   - Sync happens in background to avoid blocking UI
   - Batch operations are used for multiple updates
   - Index frequently queried fields in Firestore

3. **Data Management**
   - Regularly backup Firestore data
   - Monitor Firestore usage and costs
   - Set up alerts for unusual activity
   - Clean up old/deleted data periodically

4. **Testing**
   - Test sync on multiple devices
   - Test offline/online transitions
   - Test conflict resolution scenarios
   - Monitor sync errors and logs

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)

## Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages
2. Check Firebase Console for errors
3. Review Firestore security rules
4. Verify Firebase configuration
5. Check network connectivity
6. Review sync logs in the application

For additional help, refer to the Firebase support documentation or create an issue in the project repository.

