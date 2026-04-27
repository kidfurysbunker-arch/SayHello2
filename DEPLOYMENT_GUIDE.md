# TracePro iOS Deployment Guide

## 1. Prepare your GitHub Repository
1. Create a **new** GitHub repository.
2. **Download the project** from AI Studio.
3. **IMPORTANT: DELETE THESE FOLDERS BEFORE UPLOADING**
   - On your PC, open the folder you downloaded.
   - **Delete these folders:** `node_modules`, `ios`, `android`.
   - These folders are either too large or can interfere with the build. My build script will recreate them automatically and correctly.
4. **Unzip** everything else and upload all other files/folders to your GitHub repo.
   - If you have many files, use the [GitHub Desktop](https://desktop.github.com/) app.

## 2. Generate the IPA
1. Once your code is on GitHub, click the **Actions** tab.
2. Click **"Build iOS IPA"** on the left.
3. Click **"Run workflow"** -> **"Run workflow"**.
4. Wait about 3-5 minutes. When it finishes, scroll to the bottom of the page.
5. Download the **TracePro-iOS-IPA** artifact. Unzip it on your PC to find `TracePro.ipa`.

## 3. Sideload onto iPhone from Windows
Since you are on Windows, you will need a tool to install the IPA onto your iPhone:
- **AltStore (Highly Recommended):** [altstore.io](https://altstore.io/)
- **Sideloadly:** [sideloadly.io](https://sideloadly.io/)

**Steps:**
1. Install AltStore on your Windows PC.
2. Connect your iPhone via USB.
3. Use AltStore to "Install IPA..." and select the `TracePro.ipa` file.
4. You will need to sign in with your Apple ID (this "self-signs" the app so it runs on your phone).

## Troubleshooting
- **Build Fails with "Could not read package.json":** This happens if you upload the `.zip` file directly to GitHub instead of unzipping it first. I have updated the "Build iOS IPA" script to try and fix this automatically by unzipping any file it finds, but for the best results, you should unzip the project on your PC and upload the files/folders inside.
- **File too big for GitHub:** This is usually because you are trying to upload the `node_modules` folder. **Delete `node_modules`** before uploading. GitHub will install them automatically during the build process.
