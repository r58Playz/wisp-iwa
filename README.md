# wisp-iwa
Wisp client in an Isolated Web App.
Requires the server to support Wisp V2 with the UDP and twisp protocol extensions.

## Running 
- `pnpm i`
- `bash build.sh` in the rust subdir. This requires wasm-bindgen-cli and rust nightly.
- `pnpm dev`
- Install the IWA as a dev server proxy.

## Building a Isolated Web App bundle
- Follow the steps to run.
- In a directory named certs, run:
    - `openssl genpkey -algorithm Ed25519 -out private_key.pem`
    - `openssl pkcs8 -in private_key.pem -topk8 -out encrypted_key.pem`
    - `rm private_key.pem`
    - This key will be used to sign the bundle.
- `NODE_ENV=production pnpm build`
- See [Getting Started With Isolated Web Apps](https://chromeos.dev/en/tutorials/getting-started-with-isolated-web-apps/2) for more info.
