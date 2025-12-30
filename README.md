
# My Stocks App – Portfolio Coach (Zerodha)

A minimal Next.js App Router app that connects to Zerodha (Kite Connect) to show your holdings, valuation, red flags and tips, with realtime LTP via a simple polling fallback. You can deploy to Vercel and drop these files into GitHub.

## 1) Environment variables (Vercel)
Add these in **Vercel → Project → Settings → Environment Variables**:

- `KITE_API_KEY` – your Zerodha developer API key (client id)
- `KITE_API_SECRET` – your Zerodha API secret (**Sensitive**)
- `NEXT_PUBLIC_APP_URL` – your deployed URL, e.g. `https://YOUR-APP.vercel.app`
- `CRON_SECRET` – a random 16+ char string (for cron route)

## 2) Zerodha Developer Console
Set your Redirect URL to:
```
https://YOUR-APP.vercel.app/api/kite/callback
```

## 3) Install & run locally
```bash
npm i
npm run dev
```

## 4) Login flow
Visit `/api/kite/login` to authenticate. On success you land on `/dashboard` with data.

## 5) Notes
- Historical OHLC + realtime WebSocket data require Zerodha **Connect** plan.
- This app currently uses a **snapshot LTP polling** endpoint every 5s for simplicity. You can later switch to WebSocket using `/api/kite/ws`.
- `vercel.json` contains an optional pre-market cron job stub.
