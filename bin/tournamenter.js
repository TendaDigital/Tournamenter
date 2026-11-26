#!/usr/bin/env node
async function start() {
  try {
    const host = await require('../app').listen();
    console.log('Tournamenter listening on port', host.listener.address().port);
    let stopping = false;
    const shutdown = async () => {
      if (stopping) return;
      stopping = true;
      try { await host.close(); process.exit(0); }
      catch (error) { console.error(error.message); process.exit(1); }
    };
    // Electron utility processes can request an orderly stop on every OS.
    process.parentPort?.on('message', ({ data }) => {
      if (data === 'shutdown') shutdown();
    });
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    console.error('Tournamenter could not start:', error.message);
    process.exitCode = 1;
  }
}
module.exports = { start };
if (require.main === module) start();
