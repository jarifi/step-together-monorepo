## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm run start:dev
   ```

3. chrome.exe --disable-web-security --disable-gpu --user-data-dir=%LOCALAPPDATA%\Google\chromeTemp

### Some helper commands

# --------------------------------------------

# Run project on localhost and mobile device:

# --------------------------------------------

# 1. On Desktop

npx expo start -c

# 2. On Mobile device

Install Expo Go

# Start Terminal and login in Expo Go using email and password

npx expo login

# --------------------------------------------

# Run project and Force LAN mode:

# --------------------------------------------

npx expo start -c --lan

# Optionally clear npm cache (sometimes needed on Windows)

npm cache clean --force

## APK For Android

https://mandalorian.at/st/step.apk

npx expo install expo-image@~3.0.10 expo-system-ui@~6.0.8 expo-web-browser@~15.0.8 react-native@0.81.5

# 09.12.2025 BIg Update

npm install react@19.2.1 react-dom@19.2.1
npx expo install --fix

10.12.2025 Update
npm uninstall react-native-reanimated react-native-worklets
npm install react-native-reanimated@~3.10.1 react-native-worklets@0.5.1 --legacy-peer-deps

# Allow scripts tu run

(Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

# Workaround for IP Problems

Remove-Item -Recurse -Force $env:TEMP\metro-cache
Remove-Item -Recurse -Force $env:TEMP\haste-map-\*
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
npx react-native start --reset-cache
npx expo start -c --lan
