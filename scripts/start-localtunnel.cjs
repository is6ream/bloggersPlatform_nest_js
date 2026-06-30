const localtunnel = require('localtunnel');

function getTunnelPort() {
  const rawPort = process.env.LOCAL_PORT ?? process.env.PORT ?? '5000';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `Invalid port "${rawPort}". Set LOCAL_PORT or PORT to a valid positive integer.`,
    );
  }

  return port;
}

async function start() {
  const port = getTunnelPort();
  const subdomain = process.env.LT_SUBDOMAIN?.trim();

  const tunnel = await localtunnel({
    port,
    ...(subdomain ? { subdomain } : {}),
  });

  console.log(`[localtunnel] Local port: ${port}`);
  console.log(`[localtunnel] Public URL: ${tunnel.url}`);

  if (subdomain) {
    console.log(`[localtunnel] Requested subdomain: ${subdomain}`);
  }

  tunnel.on('error', (error) => {
    console.error('[localtunnel] Error:', error.message);
  });

  tunnel.on('close', () => {
    console.log('[localtunnel] Tunnel closed');
  });

  const closeTunnel = async () => {
    try {
      await tunnel.close();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', closeTunnel);
  process.on('SIGTERM', closeTunnel);
}

start().catch((error) => {
  console.error('[localtunnel] Failed to start:', error.message);
  process.exit(1);
});
