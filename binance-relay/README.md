# Binance relay

Servicio mínimo con un solo trabajo: reenviar una petición GET ya firmada
hacia Binance desde infraestructura que Binance no bloquea. Existe porque
las funciones serverless de Vercel corren en AWS EE. UU., y `api.binance.com`
rechaza esas peticiones con `451` ("restricted location"). Ver
`backend/wallet/binance_client.py` para el lado que lo llama.

**El bloqueo no es solo por país — probado en la práctica.** Dallas (EE. UU.)
y Ámsterdam (Fly.io) dieron 451 igual; Fráncfort (Fly.io) no. O sea Binance
bloquea rangos de IP específicos (probablemente por proveedor/ASN), no
"cualquier nube fuera de EE. UU." — por eso la región queda fija en `fra`
en `fly.toml`, no es un ejemplo intercambiable por cualquier otra.
Si algún día Fráncfort también empieza a fallar, hay que volver a probar
región por región con el mismo `curl` de abajo antes de asumir que hace
falta otra solución.

**Nunca ve el `api_secret`.** Django ya calculó la firma HMAC y construyó la
URL completa antes de llamar a este relay — aquí solo se reenvía esa URL.
Solo reenvía a `api.binance.com` (allowlist explícita); cualquier otro host
se rechaza con 403, aunque el llamador tuviera un bug.

## Desplegarlo (una sola vez)

1. Crea una cuenta en [fly.io](https://fly.io) (pide tarjeta para
   verificación, aunque el uso de este servicio debería quedar dentro del
   plan gratis/de muy bajo costo — casi no consume porque escala a cero
   cuando nadie sincroniza).

2. Instala la CLI e inicia sesión (abre el navegador):
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

3. Desde esta carpeta (`binance-relay/`), despliega:
   ```bash
   cd binance-relay
   fly launch --no-deploy   # usa la config de fly.toml; si "flowcash-binance-relay" ya existe, te pedirá otro nombre
   fly secrets set RELAY_SHARED_SECRET="X5uJoMHvvg4HiprUnLsV3TJDa1hnzGQFNumJC-HBGYU"
   fly deploy
   ```
   (El secreto de arriba ya está generado — puedes usarlo o generar uno propio con
   `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`.)

4. Confirma que responde:
   ```bash
   curl https://flowcash-binance-relay.fly.dev/health
   # {"ok":true}
   ```

## Conectarlo al backend

En Vercel (Settings → Environment Variables, marcando Production), agrega:

- `BINANCE_RELAY_URL` = `https://flowcash-binance-relay.fly.dev` (la URL que te dio `fly deploy` — sin `/` al final)
- `BINANCE_RELAY_SHARED_SECRET` = el mismo valor que pusiste en `RELAY_SHARED_SECRET` arriba

Redeploy del backend después de guardarlas. Con `BINANCE_RELAY_URL` sin
configurar, `binance_client.py` sigue llamando a Binance directo — así que
esto es opt-in y no rompe nada si algún día decides quitarlo.

## Diagnóstico rápido (sin tocar Vercel)

Prueba el relay directo, contra un endpoint público de Binance que no
necesita tu key — aísla si el problema es la infraestructura del relay o
la conexión Django→relay:
```bash
curl -X POST https://flowcash-binance-relay.fly.dev/forward \
  -H "X-Relay-Auth: <RELAY_SHARED_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.binance.com/api/v3/time", "headers": {}}'
```
`{"status_code":200,"body":{"serverTime":...}}` = el relay sí llega a Binance.
`{"status_code":451,...}` = esta región/proveedor está bloqueada, prueba otra.

## Mantenimiento

Sin base de datos, sin estado, sin lógica de negocio — si algún día quieres
moverlo a otro proveedor/región, es literalmente copiar `main.py` y
`requirements.txt` a donde sea que corra Python.
