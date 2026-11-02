const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HELPER_PATH = path.join(__dirname, 'fingerprint', 'bin', 'dpuareu.exe');

let deviceChain = Promise.resolve();

function withDeviceLock(fn) {
  const run = deviceChain.then(fn, fn);
  deviceChain = run.catch(() => {});
  return run;
}

function runHelper(command, data, timeout = 25000, signal, onEvent) {
  return new Promise((resolve) => {
    let child;
    let dataFile = null;
    const args = [command];

    if (data !== undefined) {
      dataFile = path.join(os.tmpdir(), `uareu-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
      try {
        fs.writeFileSync(dataFile, JSON.stringify(data), 'utf8');
        args.push(dataFile);
      } catch (err) {
        resolve({ success: false, error: `No se pudo preparar los datos para el helper: ${err.message}` });
        return;
      }
    }

    const cleanupFile = () => {
      if (!dataFile) return;
      try { fs.unlinkSync(dataFile); } catch (_) {}
      dataFile = null;
    };

    try {
      child = spawn(HELPER_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    } catch (err) {
      cleanupFile();
      resolve({ success: false, error: err.message });
      return;
    }

    let stdout = '';
    let stderr = '';
    let lineBuf = '';
    let done = false;
    let timer = null;

    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanupFile();
      if (child && !child.killed) {
        try { child.kill('SIGKILL'); } catch (_) {}
      }
      resolve(result);
    };

    child.stdout.on('data', (d) => {
      const text = d.toString();
      stdout += text;
      if (!onEvent) return;
      lineBuf += text;
      let nl;
      while ((nl = lineBuf.indexOf('\n')) >= 0) {
        const line = lineBuf.slice(0, nl).trim();
        lineBuf = lineBuf.slice(nl + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line);
          if (obj && obj.phase) onEvent(obj);
        } catch (_) {}
      }
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => {
      finish({ success: false, error: `No se pudo ejecutar el helper de huella (${err.message}). Verifica que dpuareu.exe y las DLLs del SDK esten en server/fingerprint/bin/.` });
    });

    child.on('close', () => {
      const lines = stdout.trim().split('\n').filter(Boolean);
      const last = lines[lines.length - 1];
      try {
        finish(JSON.parse(last));
      } catch (_) {
        finish({ success: false, error: stderr.trim() || 'Respuesta invalida del helper de huella' });
      }
    });

    timer = setTimeout(() => {
      finish({ success: false, error: 'Timeout esperando el lector de huellas' });
    }, timeout);

    if (signal) {
      if (signal.aborted) {
        finish({ success: false, error: 'Cancelado' });
        return;
      }
      signal.addEventListener('abort', () => finish({ success: false, error: 'Cancelado' }), { once: true });
    }
  });
}

async function isFingerprintAvailable() {
  try {
    const result = await runHelper('available', undefined, 8000);
    if (result && result.success) return true;
    if (result && result.error) console.log('Huellero no disponible:', result.error);
    return false;
  } catch (err) {
    console.log('Huellero no disponible:', err.message);
    return false;
  }
}

async function enrollFingerprint() {
  const result = await withDeviceLock(() => runHelper('enroll', undefined, 95000));
  if (result && result.success && result.fmd) {
    return { success: true, fmd: result.fmd, template: result.fmd };
  }
  return { success: false, fmd: null, template: null, error: result && result.error };
}

async function identifyFingerprint(templates) {
  const result = await withDeviceLock(() => runHelper('identify', { templates }, 25000));
  if (result && result.success) {
    return { success: true, matchedId: result.matchedId || null, compared: result.compared || 0 };
  }
  return { success: false, matchedId: null, compared: 0, error: result && result.error };
}

async function autoIdentifyFingerprint(templates, maxWaitMs = 30000, signal, onEvent) {
  const result = await withDeviceLock(() => runHelper('auto-identify', { templates, maxWaitMs }, maxWaitMs + 5000, signal, onEvent));
  return result || { success: false, error: 'Sin respuesta del lector de huellas' };
}

async function getFingerprintStatus() {
  const result = await runHelper('status', undefined, 8000);
  if (result && result.success) {
    return { success: true, fingerPresent: !!result.fingerPresent, error: result.error };
  }
  return { success: false, fingerPresent: false, error: result && result.error };
}

async function waitFingerprint(maxWaitMs = 30000, signal) {
  const result = await runHelper('wait', { maxWaitMs }, maxWaitMs + 5000, signal);
  if (result && result.success) {
    return { success: true, fingerPresent: !!result.fingerPresent, error: result.error };
  }
  return { success: false, fingerPresent: false, error: result && result.error };
}

module.exports = {
  isFingerprintAvailable,
  enrollFingerprint,
  identifyFingerprint,
  autoIdentifyFingerprint,
  getFingerprintStatus,
  waitFingerprint
};
