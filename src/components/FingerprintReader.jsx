import { useEffect, useState, useRef } from 'react';

const FingerprintReader = ({ onMemberDetected }) => {
  const isActivatedRef = useRef(false);
  const scanInProgressRef = useRef(false);

  useEffect(() => {
    // Monitorear tecla ENTER o activar desde otro lado
    const handleKeyPress = async (e) => {
      // Activar escaneo con tecla ENTER
      if (e.key === 'Enter' && !scanInProgressRef.current) {
        await attemptFingerprintScan();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Detectar cuando el usuario toca el área del sensor (cada 5 segundos máximo)
    const slowScanInterval = setInterval(() => {
      // Solo intenta si pasó suficiente tiempo y no hay escaneo en progreso
      if (!scanInProgressRef.current && isActivatedRef.current) {
        attemptFingerprintScan();
      }
    }, 5000); // Cada 5 segundos, no cada 2 segundos

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(slowScanInterval);
    };
  }, [onMemberDetected]);

  const attemptFingerprintScan = async () => {
    if (scanInProgressRef.current) return;

    scanInProgressRef.current = true;

    try {
      console.log('Intentando leer huella...');
      
      const fingerprintResponse = await fetch('http://localhost:3001/api/fingerprint/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!fingerprintResponse.ok) {
        console.log('Error en fingerprint response:', fingerprintResponse.status);
        scanInProgressRef.current = false;
        return;
      }

      const fingerprintData = await fingerprintResponse.json();
      
      if (fingerprintData.error) {
        console.log('Error del servidor:', fingerprintData.error);
        scanInProgressRef.current = false;
        return;
      }

      const fingerprint = fingerprintData.fingerprint || fingerprintData.template;

      if (!fingerprint) {
        console.log('No fingerprint data received');
        scanInProgressRef.current = false;
        return;
      }

      console.log('Huella detectada:', fingerprint.substring(0, 20) + '...');

      // Buscar miembro con esta huella
      const memberResponse = await fetch(
        `http://localhost:3001/api/members/by-fingerprint?fingerprint=${encodeURIComponent(fingerprint)}`,
        { method: 'GET' }
      );

      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        if (memberData.success && memberData.member) {
          console.log('Miembro encontrado:', memberData.member.name);
          onMemberDetected(memberData.member);
          isActivatedRef.current = false; // Resetear después de detectar
        }
      } else {
        console.log('Member search response status:', memberResponse.status);
        const errorText = await memberResponse.text();
        console.log('Error response:', errorText);
      }
    } catch (err) {
      console.error('Error durante escaneo:', err.message);
    } finally {
      scanInProgressRef.current = false;
    }
  };

  // Exponer función globalmente para activar manualmente si es necesario
  useEffect(() => {
    window.triggerFingerprintScan = () => {
      isActivatedRef.current = true;
      attemptFingerprintScan();
    };
  }, []);

  return null; // Este componente no renderiza UI
};

export default FingerprintReader;
