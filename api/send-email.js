export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { servicio, profesional, fecha, hora, nombre, telefono, email, notas } = req.body;

  if (!email || !nombre) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY no configurada' });
  }

  const htmlCliente = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmación de cita</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Cabecera -->
          <tr>
            <td align="center" style="background-color:#1a1a1a;padding:40px 40px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">Áureo Studio</p>
              <h1 style="margin:12px 0 0;font-size:26px;color:#ffffff;font-weight:normal;letter-spacing:1px;">Tu cita está confirmada</h1>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0;font-size:16px;color:#444;line-height:1.6;">
                Hola, <strong style="color:#1a1a1a;">${nombre}</strong>.<br/>
                Nos alegramos de verte pronto. Aquí tienes el resumen de tu reserva:
              </p>
            </td>
          </tr>

          <!-- Resumen de la reserva -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f4;border-radius:8px;border-left:4px solid #c9a96e;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="8">
                      <tr>
                        <td style="font-size:12px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;padding-bottom:16px;" colspan="2">Detalles de la cita</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#888;width:120px;padding-bottom:10px;">Servicio</td>
                        <td style="font-size:14px;color:#1a1a1a;font-weight:bold;padding-bottom:10px;">${servicio || '—'}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#888;padding-bottom:10px;">Profesional</td>
                        <td style="font-size:14px;color:#1a1a1a;font-weight:bold;padding-bottom:10px;">${profesional || '—'}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#888;padding-bottom:10px;">Fecha</td>
                        <td style="font-size:14px;color:#1a1a1a;font-weight:bold;padding-bottom:10px;">${fecha || '—'}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#888;">Hora</td>
                        <td style="font-size:14px;color:#1a1a1a;font-weight:bold;">${hora || '—'}</td>
                      </tr>
                      ${notas ? `
                      <tr>
                        <td style="font-size:14px;color:#888;padding-top:10px;vertical-align:top;">Notas</td>
                        <td style="font-size:14px;color:#1a1a1a;padding-top:10px;">${notas}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Información del salón -->
          <tr>
            <td style="padding:0 40px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:10px;">
                    <p style="margin:0;font-size:12px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;">Cómo llegar</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
                      📍 <strong>Áureo Studio</strong><br/>
                      Calle Ejemplo 12, 28001 Madrid<br/>
                      📞 <a href="tel:+34600000000" style="color:#c9a96e;text-decoration:none;">+34 600 000 000</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Aviso cancelación -->
          <tr>
            <td style="padding:0 40px 36px;">
              <p style="margin:0;font-size:13px;color:#999;line-height:1.6;border-top:1px solid #eee;padding-top:24px;">
                Si necesitas modificar o cancelar tu cita, contáctanos con al menos 24 horas de antelación.
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td align="center" style="background-color:#1a1a1a;padding:24px 40px;">
              <p style="margin:0;font-size:12px;color:#666;letter-spacing:1px;">© 2025 Áureo Studio · Todos los derechos reservados</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const htmlAdmin = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;color:#333;padding:24px;">
  <h2 style="color:#1a1a1a;border-bottom:2px solid #c9a96e;padding-bottom:8px;">Nueva reserva recibida</h2>
  <table cellpadding="8" cellspacing="0" style="font-size:15px;width:100%;max-width:520px;">
    <tr><td style="color:#888;width:120px;">Nombre</td><td><strong>${nombre}</strong></td></tr>
    <tr><td style="color:#888;">Teléfono</td><td>${telefono || '—'}</td></tr>
    <tr><td style="color:#888;">Email</td><td>${email}</td></tr>
    <tr><td style="color:#888;">Servicio</td><td>${servicio || '—'}</td></tr>
    <tr><td style="color:#888;">Profesional</td><td>${profesional || '—'}</td></tr>
    <tr><td style="color:#888;">Fecha</td><td>${fecha || '—'}</td></tr>
    <tr><td style="color:#888;">Hora</td><td>${hora || '—'}</td></tr>
    <tr><td style="color:#888;vertical-align:top;">Notas</td><td>${notas || '—'}</td></tr>
  </table>
</body>
</html>
  `.trim();

  const from = 'Áureo Studio <onboarding@resend.dev>';

  async function sendEmail(to, subject, html) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error enviando email');
    }

    return response.json();
  }

  try {
    await Promise.all([
      sendEmail(email, 'Tu cita en Áureo Studio', htmlCliente),
      sendEmail('ivanuu08@gmail.com', 'Nueva reserva recibida', htmlAdmin),
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error enviando emails:', err);
    return res.status(500).json({ error: err.message });
  }
}
