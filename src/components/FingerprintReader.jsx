import { useEffect, useRef } from 'react';

const FingerprintReader = ({ onMemberDetected }) => {
  const onDetectedRef = useRef(onMemberDetected);
  const scanInProgressRef = useRef(false);
  const stoppedRef = useRef(false);
  const abortRef = useRef(null);
  const lastDetectedRef = useRef({ id: null, at: 0 });

  // Mantener la referencia al callback sin reiniciar el bucle en cada render
  useEffect(() => {
    onDetectedRef.current = onMemberDetected;
  }, [onMemberDetected]);

  useEffect(() => {
    stoppedRef.current = false;
    let timer = null;

    const attempt = async () => {
      if (stoppedRef.current || scanInProgressRef.current) return;
      scanInProgressRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          'http://localhost:3001/api/fingerprint/auto-identify?maxWait=15000',
          { signal: controller.signal }
        );

        if (!response.ok || !response.body) {
          console.log('Error en auto-identify:', response.status);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;

            let evt;
            try {
              evt = JSON.parse(line);
            } catch (_) {
              continue;
            }
            if (evt.phase !== 'result') continue;

            if (evt.success && evt.member) {
              const now = Date.now();
              const last = lastDetectedRef.current;
              if (last.id === evt.member.id && now - last.at < 6000) continue;
              lastDetectedRef.current = { id: evt.member.id, at: now };
              console.log('Miembro detectado:', evt.member.name);
              onDetectedRef.current(evt.member);
            } else if (evt.error && evt.fingerPresent) {
              console.log('Huella no identificada:', evt.error);
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error durante escaneo:', err.message);
        }
      } finally {
        scanInProgressRef.current = false;
      }
    };

    const loop = () => {
      if (stoppedRef.current) return;
      attempt().finally(() => {
        if (stoppedRef.current) return;
        timer = setTimeout(loop, 600);
      });
    };

    loop();

    return () => {
      stoppedRef.current = true;
      if (timer) clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return null;
};

export default FingerprintReader;
