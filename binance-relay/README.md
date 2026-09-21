# Binance relay

Servicio mínimo con un solo trabajo: reenviar una petición GET ya firmada
hacia Binance desde una región que Binance no bloquea. Existe porque las
funciones serverless de Vercel corren en infraestructura de AWS en EE. UU.,
y `api.binance.com` rechaza esas peticiones con `451` ("restricted
location") — el bloqueo es por la IP de origen, no por las credenciales del
usuario. Ver `backend/wallet/binance_client.py` para el lado que lo llama.

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

## Mantenimiento

Sin base de datos, sin estado, sin lógica de negocio — si algún día quieres
moverlo a otro proveedor/región, es literalmente copiar `main.py` y
`requirements.txt` a donde sea que corra Python.
