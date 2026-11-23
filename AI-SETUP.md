# Dev AI provider setup

Dev AI is online-only: it needs an internet connection and does not require installing or downloading a local AI model. Choose Gemini or an OpenRouter model from **Dev AI Assistant → AI model**, then use **Refresh models** when the online catalog changes.

The OpenRouter catalog is fetched live and lists up to 25 models whose reported prompt and completion prices are both zero. The number can be lower, including zero. A zero catalog price does not guarantee a model is usable, available, or permanently free. Providers can require an account, API key, or other eligibility, and can change quotas and terms. Free usage is not guaranteed.

## Gemini

Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey), then paste it under **Settings → AI Providers**. Alternatively, configure `GEMINI_API_KEY` on the server. Gemini access and free quotas depend on Google's current account and service terms.

## OpenRouter

Create an [OpenRouter account and API key](https://openrouter.ai/keys), then save the key under **Settings → AI Providers** (or configure `OPENROUTER_API_KEY` on your own server). You need internet access to browse the live catalog and send prompts. The free-priced models may still have availability limits or require an eligible account/key.

## Key storage and privacy

Keys entered in Settings are kept in the current browser tab's `sessionStorage`, not workspace data, localStorage, backups, or cloud sync. They are sent to the DevDesk server only when you submit a request to the corresponding provider. Anyone able to run scripts in this browser origin could access session data, so only use trusted DevDesk deployments. Server environment keys remain on the server. Prompts and explicitly attached workspace context are sent to the selected online provider; do not include passwords or private credentials.
