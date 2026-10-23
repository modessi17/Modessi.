# Realistic bathroom image setup

On the final design page, check the consent box once to automatically create the full-room image. It refreshes when the customer changes selections. It sends selected product names and up to eight selected product photos to the server, along with either the customer's uploaded bathroom photo or the included standard bathroom reference. The API key stays on the server.

## Local setup

1. Install Node.js 22 or later.
2. Copy `env.example` to `.env`.
3. Add these values to `.env`:

   ```env
   OPENAI_API_KEY=your-api-key
   PUBLIC_BASE_URL=http://localhost:5173
   ```

4. In a terminal opened in this folder, run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL Vite prints, complete a bathroom design, and check the consent box on the final page. The picture starts automatically and refreshes as selections change.

Keep `OPENAI_API_KEY` server-side. Never add a `VITE_` prefix or paste the key into website source code. Image API usage may incur separate charges.

## Production hosting

The image-generation route runs in this project's Express/Node server. Uploading only the static `dist` folder to ordinary GoDaddy website hosting is not enough to run it. Deploy the full project to a Node-capable host, configure `OPENAI_API_KEY` and `PUBLIC_BASE_URL` as server environment variables, and run:

```bash
npm run build
npm start
```

If the public site remains on static GoDaddy hosting, deploy this API route separately and point the page's request to that API origin.

The generated result is a realistic concept based on the selected finishes and available product photos. Image generation can approximate product details; use the selected-item list as the authoritative model and finish record.
