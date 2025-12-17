<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1thwQlZSbloLyz3hgdAFciXvSCxjykHOx

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment (Cloudflare Pages)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **Compute (Workers & Pages)** > **Create Application** > **Pages** > **Connect to Git**.
3. Select this repository.
4. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Save and Deploy**.
