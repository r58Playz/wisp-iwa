# wisp-iwa
to test:
- enable flags `#enable-isolated-web-apps` `#enable-isolated-web-app-dev-mode` `#enable-direct-sockets-web-api`
- run pnpm dev as usual
- go to `chrome://web-app-internals/`
- install iwa via dev mode proxy `http://localhost:5193`
- open the iwa, you should only need to reinstall if you change the manifest at `public/.well-known/manifest.webmanifest`
