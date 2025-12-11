# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Mode**
   ```bash
   npm run electron-dev
   ```
   This will start the Vite dev server and Electron app simultaneously.

3. **Build for Production**
   ```bash
   npm run build
   npm run dist
   ```

## Important Notes

### Database
- The database file (`billing.db`) is stored in the user data directory
- On Windows: `%APPDATA%\billing-software\`
- On macOS: `~/Library/Application Support/billing-software/`
- On Linux: `~/.config/billing-software/`

### Icon
- Add an `icon.png` file (256x256 pixels) to the `public/` directory
- This will be used as the application icon

### Building better-sqlite3
If you encounter issues building better-sqlite3:

**Windows:**
```bash
npm install --global windows-build-tools
npm install
```

**macOS:**
```bash
xcode-select --install
npm install
```

**Linux:**
```bash
sudo apt-get install build-essential
npm install
```

## Troubleshooting

### Electron won't start
- Make sure the dev server is running on port 5173
- Check console for errors
- Try deleting `node_modules` and reinstalling

### Database errors
- Check that better-sqlite3 is properly installed
- Verify the user data directory has write permissions
- Try deleting the database file to start fresh (will lose all data)

### Build errors
- Make sure all dependencies are installed
- Check that you have the correct Node.js version (v16+)
- On Windows, ensure windows-build-tools are installed

## Development Tips

1. The app uses React Router for navigation
2. All database operations go through IPC to the main process
3. The database is initialized on app startup
4. Use the browser dev tools (Cmd/Ctrl + Shift + I) for debugging

## Production Build

After building, the installer will be in the `dist` folder:
- Windows: `.exe` installer
- macOS: `.dmg` file
- Linux: `.AppImage` file

