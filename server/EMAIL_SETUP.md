# Configuración de Reporte de Pagos por Email

## Instrucciones para configurar Gmail

1. **Habilitar 2FA en tu cuenta de Gmail**
   - Ve a https://myaccount.google.com/
   - Seguridad → Verificación en dos pasos
   - Sigue los pasos para habilitar 2FA

2. **Generar una "App Password"**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Mail" y "Windows Computer" (o tu dispositivo)
   - Google generará una contraseña de 16 caracteres
   - Copia esa contraseña

3. **Configurar el archivo .env**
   - En la carpeta `/server`, copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   
   - Abre `.env` y actualiza los valores:
   ```
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=contraseña-de-16-caracteres-generada
   EMAIL_RECIPIENT=correo-donde-recibir-reportes@example.com
   PORT=3001
   ```

4. **Reinicia el servidor**
   ```bash
   node index.js
   ```

## Uso

### Enviar Reporte Manualmente desde la UI
- Ve a la página de "Maestros"
- En la sección "Reporte de Pagos Semanal"
- Click en "Enviar por Email"
- Ingresa el correo destino
- El reporte se generará y enviará automáticamente

### Envío Automático
- El servidor enviará automáticamente el reporte cada **viernes a las 4pm** (16:00)
- Por ahora, está configurado a las 4pm para pruebas
- Para cambiar a las 9pm, edita el archivo `/server/payroll-report.js` línea ~165:
  ```javascript
  // Cambiar esta línea:
  schedule.scheduleJob('0 16 * * 5', async () => {
  
  // A esto para 9pm (21:00):
  schedule.scheduleJob('0 21 * * 5', async () => {
  ```

### Endpoint de API
```
POST /api/payroll-report/send
Content-Type: application/json

{
  "email": "destino@example.com"
}
```

## Solución de Problemas

### "Connection refused" o error de conexión
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de haber generado una App Password (no uses tu contraseña de Gmail)
- Si usas 2FA, debes usar obligatoriamente App Password

### "Invalid login" o "Authentication failed"
- Verifica que el EMAIL_USER sea exactamente igual al correo de tu cuenta
- Verifica que EMAIL_PASSWORD sea los 16 caracteres generados (sin espacios)

### El reporte no se envía automáticamente
- Verifica que el servidor esté corriendo: `node index.js`
- Revisa la consola del servidor para ver si hay errores
- Comprueba la hora del servidor con `date`

