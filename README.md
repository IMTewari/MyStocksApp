
# India Portfolio Coach — Web (Next.js)

Paste your NSE/BSE tickers and get a live dashboard with prices, ATR/RSI, AI‑inspired stop suggestions, and headlines from BSE + Bing + Google News RSS.

> Data via `yahoo-finance2` (unofficial; personal/research use per Yahoo terms). News via Bing News API (server) and Google News RSS; BSE corporate announcements filtered via `site:bseindia.com` RSS.> Yahoo Finance usage notes: [npm docs](https://www.npmjs.com/package/yahoo-finance2). Bing News docs: Microsoft Learn. Google News RSS query format reference. BSE RSS hub for corporate announcements.  

## One‑Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=REPO_URL_PLACEHOLDER&env=BING_NEWS_KEY&project-name=india-portfolio-coach-ui&repository-name=india-portfolio-coach-ui)

**Before clicking:** replace `REPO_URL_PLACEHOLDER` with your GitHub repo URL (e.g., `https://github.com/yourname/india-portfolio-coach-ui`).

### Env Vars
- `BING_NEWS_KEY` — Azure Bing News Search API key.

## Local Dev
```bash
npm i
npm run dev
# open http://localhost:3000
```

## Notes
- **Tickers**: Use `.NS` for NSE and `.BO` for BSE (e.g., `RELAXO.NS`, `TCS.NS`).
- **CORS**: RSS is fetched server‑side (API routes) to avoid browser CORS blocks on cross‑origin feeds.
- **Stops**: Recommended stop = max( trailing%, ATR×mult, MA‑support ); tightened automatically in downtrends.

## License
MIT (app code). Third‑party data providers’ terms apply.
