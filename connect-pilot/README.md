# SHORASH CONNECT — LAN proof of concept

This is an independent foreground browser pilot, not an APK update and not a production service. It does not touch the menu, Supabase or its data. One administrator can select one online waiter, wait for the connection to be ready, hold the microphone button and release to stop. An independent bell sends a tone and visual notification. No microphone permission is needed on the waiter. WebRTC audio is peer-to-peer with no external STUN/TURN; WebSocket handles authenticated signaling. The server does not record audio.

## Start on a Windows cashier PC
Install Node.js 22+, Git and mkcert from its official distribution. The cashier and both test devices must be on the same trusted staff LAN (no client isolation); find the cashier's IPv4 address using ipconfig and reserve it in the router. Allow TCP port 8443 for Private network only, not public internet. Do not forward the port.

In PowerShell:
```powershell
git clone --single-branch --branch feat/shorash-connect-pilot https://github.com/hamodybr/restbr-shorash.git
cd restbr-shorash/connect-pilot
npm install
mkcert -install
mkcert -key-file key.pem -cert-file cert.pem 192.168.1.50 localhost
node setup.mjs
npm run check
npm start
```
Replace 192.168.1.50 with the actual cashier LAN IP. The example must not be used literally unless that is the correct address. The setup command generates unique random admin and worker credentials in connect.local.json. Keep them private. The demo uses two fictitious worker identities; edit their names/IDs locally as needed. Never commit the local config, key or CA private key.

The certificate must be trusted on each test device. For mkcert, install only the public rootCA.pem (found with mkcert -CAROOT) on managed test devices following their OS instructions; on iOS enable full trust in Settings > General > About > Certificate Trust Settings after installing the profile. Never copy rootCA-key.pem or ignore certificate errors. Remove test CA trust when finished unless deliberately retained by the network administrator. An organisation-managed trusted certificate is preferable for production.

On iPhone Safari open https://CASHIER-IP:8443/ and choose Administration; enter the generated admin code. On the tablet's Chrome open the same URL, select Waiter and enter worker ID (w01) and its unique code. Tap connect to unlock audio playback. Keep the browser in the foreground and screens on. On the dashboard, press the bell, then select the microphone and wait until ready. Hold the microphone button, wait for red “تحدث الآن”, speak, release to stop. First use requires granting the iPhone microphone permission. End the session before selecting another worker. A second tablet with w02 should remain silent during a private test.

## Test checklist
- Bell and live audio to w01, w02 remains silent; repeat with w02.
- Release, cancel or leave the page: microphone stops.
- Wrong or duplicated worker code is rejected; worker cannot send offers or bells.
- Disconnect internet while retaining Wi-Fi and repeat.
- Move between access points; reconnect manually if required.
- Try iPhone Safari and Android Chrome on the actual hardware.

## Limitations and next steps
No real-device verification yet. Background playback, screen-off behavior, automatic reconnection, delivery acknowledgements, Android audio routing and native integration are not implemented; do not rely on this for operational or emergency calls. Browser audio may require fresh user interaction after suspension. A trusted HTTPS certificate is mandatory for browser microphone access. Direct WebRTC may fail if Wi-Fi clients cannot reach each other or if mDNS/local ICE fails. This pilot uses static private device codes, not existing staff accounts. Production needs device enrollment, stronger authorization, reconnect handling and explicit foreground-service integration in the Android app. Do not merge into main or distribute an APK until tests pass.
