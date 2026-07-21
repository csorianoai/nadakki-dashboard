# Share flow

1. `generateShareUrl()` serializa carrito + compare en token base64url.
2. URL: `/autos/cart?share_token=...`
3. Al abrir, `loadFromShareUrl` valida tenant y expiración (7 días).
4. Sin persistencia en servidor.
