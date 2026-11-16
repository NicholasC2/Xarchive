# Xarchive

how to run:

## Step 1. Install Node.js
Windows:
```bat
winget install -e --id OpenJS.NodeJS --scope user --source winget
```
Arch:
```sh
sudo pacman -S node npm
```

## Step 2. Install Dependencies
```sh
npm ci
```

## Step 3. Run
```sh
npm run dev
```