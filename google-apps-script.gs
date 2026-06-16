// ─── TIKEDUCA 2.0 - GOOGLE APPS SCRIPT BACKEND ──────────────────────────────
// Instrucciones:
// 1. Ve a tu Google Sheet (Hoja de cálculo) de registros.
// 2. Ve al menú superior: Extensiones -> Apps Script.
// 3. Borra el código existente y pega este archivo completo.
// 4. (Opcional) Crea una carpeta en Google Drive para los comprobantes, copia su ID y pégala en DRIVE_FOLDER_ID abajo.
// 5. Haz clic en "Guardar" (icono de disquete).
// 6. Haz clic en "Implementar" (botón azul) -> "Nueva implementación".
// 7. Selecciona tipo: "Aplicación web". En "Quién tiene acceso", selecciona "Cualquiera" (Anyone).
// 8. Haz clic en "Implementar", autoriza los permisos con tu cuenta de Google y copia la URL de la aplicación web.
// 9. Si la URL es diferente a la configurada en tu js/config.js, actualízala ahí.

// CONFIGURACIONES GLOBALES
const DRIVE_FOLDER_ID = ""; // Opcional: ID de carpeta de Drive para guardar recibos. Si se deja vacío, se guardarán en la raíz.

function doPost(e) {
  // Configuración de CORS para peticiones desde el frontend
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  try {
    var params = e.parameter;
    var tipo = params.tipo;
    
    // Obtener la hoja activa vinculada al script
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (tipo === "tikeduca") {
      saveTikeduca(ss, params);
    } else if (tipo === "fest") {
      saveFest(ss, params);
    } else if (tipo === "hotel") {
      saveHotel(ss, params);
    }
    
    var response = { status: "success", message: "Registro guardado correctamente" };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    var errorResponse = { status: "error", message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

// Permitir peticiones de tipo OPTIONS (CORS preflight)
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

// 1. GUARDAR PRE-REGISTROS (TIKEDUCA)
function saveTikeduca(ss, params) {
  var sheet = ss.getSheetByName("PreRegistros") || ss.insertSheet("PreRegistros");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Fecha", "Nombre", "Email", "WhatsApp", "Nivel", "Boleto", "Precio", "Instagram", "TikTok", "Fuente"]);
  }
  sheet.appendRow([
    new Date(),
    params.nombre || "",
    params.email || "",
    params.whatsapp || "",
    params.nivel || "",
    params.ticket || "",
    params.precio || "",
    params.instagram || "",
    params.tiktok || "",
    params.fuente || ""
  ]);
}

// 2. GUARDAR PAGOS DE BOLETOS Y ENVIAR BOLETO AUTOMÁTICO
function saveFest(ss, params) {
  var sheet = ss.getSheetByName("PagosBoletos") || ss.insertSheet("PagosBoletos");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Fecha", "Nombre", "Email", "WhatsApp", "Escuela", "Ciudad", "Boleto", "Titular Transferencia", "Referencia", "Fecha Pago", "Enlace Comprobante", "ID Boleto"]);
  }
  
  var fileUrl = "";
  if (params.comprobanteBase64 && params.comprobanteNombre) {
    fileUrl = uploadToDrive(params.comprobanteBase64, params.comprobanteNombre, params.comprobanteMime);
  }
  
  // Generar un código único de boleto (TKT-XXXXXX)
  var ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
  
  sheet.appendRow([
    new Date(),
    params.nombre || "",
    params.email || "",
    params.whatsapp || "",
    params.escuela || "",
    params.ciudad || "",
    params.boleto || "",
    params.titular || "",
    params.referencia || "",
    params.fechaPago || "",
    fileUrl,
    ticketId
  ]);
  
  // Enviar el boleto por correo electrónico si hay dirección válida
  if (params.email) {
    sendTicketEmail(params.email, params.nombre, params.boleto, ticketId, params.referencia);
  }
}

// 3. GUARDAR RESERVAS DE HOTEL Y ENVIAR CONFIRMACIÓN AUTOMÁTICA
function saveHotel(ss, params) {
  var sheet = ss.getSheetByName("ReservacionesHotel") || ss.insertSheet("ReservacionesHotel");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Fecha", "Nombre", "Apellidos", "Email", "Teléfono", "Habitación", "Noches", "Total", "Check-In", "Check-Out", "Notas", "Titular Transferencia", "Referencia", "Fecha Pago", "Enlace Comprobante", "ID Reservacion"]);
  }
  
  var fileUrl = "";
  if (params.comprobanteBase64 && params.comprobanteNombre) {
    fileUrl = uploadToDrive(params.comprobanteBase64, params.comprobanteNombre, params.comprobanteMime);
  }
  
  // Generar un código único de reserva (HTL-XXXXXX)
  var reservationId = "HTL-" + Math.floor(100000 + Math.random() * 900000);
  
  sheet.appendRow([
    new Date(),
    params.nombre || "",
    params.apellidos || "",
    params.email || "",
    params.tel || "",
    params.habitacion || "",
    params.noches || "",
    params.total || "",
    params.checkin || "",
    params.checkout || "",
    params.notas || "",
    params.titular || "",
    params.referencia || "",
    params.fechaPago || "",
    fileUrl,
    reservationId
  ]);
  
  // Enviar la confirmación del hotel por correo electrónico
  if (params.email) {
    var fullName = (params.nombre || "") + " " + (params.apellidos || "");
    sendHotelEmail(params.email, fullName.trim(), params.habitacion, params.noches, params.total, reservationId, params.checkin, params.checkout);
  }
}

// FUNCIÓN AUXILIAR: SUBIR ARCHIVO A GOOGLE DRIVE
function uploadToDrive(base64Data, fileName, mimeType) {
  try {
    var rawData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(rawData, mimeType, fileName);
    var folder = DRIVE_FOLDER_ID ? DriveApp.getFolderById(DRIVE_FOLDER_ID) : DriveApp.getRootFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "Error al subir: " + err.toString();
  }
}

// FUNCIÓN AUXILIAR: ENVIAR EMAIL DE BOLETO (DISEÑO PREMIUM)
function sendTicketEmail(toEmail, attendeeName, ticketType, ticketId, reference) {
  var subject = "🎟️ ¡Boleto Confirmado! - Maestros Fest 2.0";
  var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tu Boleto para Maestros Fest 2.0</title>
      <style>
        body {
          background-color: #030612;
          color: #ffffff;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .ticket-card {
          background: #0a1128;
          border: 2px solid #00e5ff;
          border-radius: 16px;
          box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);
          overflow: hidden;
          margin-top: 20px;
        }
        .header-glow {
          height: 6px;
          background: linear-gradient(90deg, #ff007f, #9b00ff, #00e5ff);
        }
        .ticket-content {
          padding: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #ff007f;
          text-align: center;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .subtitle {
          font-size: 16px;
          color: #ffffff;
          text-align: center;
          margin-bottom: 25px;
          letter-spacing: 2px;
        }
        .divider {
          border-top: 1px dashed rgba(0, 229, 255, 0.3);
          margin: 20px 0;
        }
        .details-grid {
          margin-bottom: 20px;
        }
        .detail-item {
          margin-bottom: 15px;
        }
        .label {
          font-size: 11px;
          color: #00e5ff;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 2px;
        }
        .value {
          font-size: 16px;
          color: #ffffff;
          font-weight: 600;
        }
        .ticket-code-container {
          background: rgba(0, 229, 255, 0.05);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          margin-top: 25px;
        }
        .ticket-code {
          font-size: 24px;
          font-family: 'Courier New', Courier, monospace;
          color: #ffe500;
          font-weight: bold;
          letter-spacing: 3px;
        }
        .info-text {
          font-size: 12px;
          color: #8f9cae;
          text-align: center;
          line-height: 1.6;
          margin-top: 25px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 11px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: center; margin-bottom: 10px;">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 300;">TIKEDUCA 2.0</h1>
        </div>
        
        <div class="ticket-card">
          <div class="header-glow"></div>
          <div class="ticket-content">
            <div class="title">Maestros Fest 2.0</div>
            <div class="subtitle">Boleto Digital de Acceso</div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Asistente Registrado</div>
                <div class="value">${attendeeName}</div>
              </div>
              <div class="detail-item">
                <div class="label">Tipo de Boleto</div>
                <div class="value">${ticketType}</div>
              </div>
              <table style="width: 100%; border: none; padding: 0;">
                <tr>
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div class="detail-item">
                      <div class="label">Fecha del Evento</div>
                      <div class="value">3 y 4 de Octubre 2026</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div class="detail-item">
                      <div class="label">Sede / Ciudad</div>
                      <div class="value">Guadalajara, Jalisco</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <div class="divider"></div>
            
            <div class="ticket-code-container">
              <div class="label">Código Único de Entrada</div>
              <div class="ticket-code">${ticketId}</div>
              <div style="font-size: 9px; color: #8f9cae; margin-top: 5px; text-transform: uppercase;">Presenta este código al ingresar al evento</div>
            </div>
            
            <div class="info-text">
              Tu pago con referencia <strong>${reference}</strong> ha sido recibido y validado.<br>
              ¡Guarda este correo! Contiene tu código de acceso para los controles de entrada.
            </div>
          </div>
        </div>
        
        <div class="footer">
          Este es un correo automático de confirmación de registro de TikEduca.<br>
          Si tienes alguna duda o aclaración, contáctanos a soporte@tikeduca.com o por WhatsApp al +52 1 33 4900 4784.
        </div>
      </div>
    </body>
    </html>
  `;
  
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

// FUNCIÓN AUXILIAR: ENVIAR EMAIL DE HOTEL (DISEÑO PREMIUM)
function sendHotelEmail(toEmail, guestName, roomType, nights, total, reservationId, checkin, checkout) {
  var subject = "🏨 Confirmación de Reserva de Hotel - Maestros Fest 2.0";
  var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de Reserva de Hotel</title>
      <style>
        body {
          background-color: #030612;
          color: #ffffff;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .ticket-card {
          background: #0a1128;
          border: 2px solid #9b00ff;
          border-radius: 16px;
          box-shadow: 0 0 30px rgba(155, 0, 255, 0.2);
          overflow: hidden;
          margin-top: 20px;
        }
        .header-glow {
          height: 6px;
          background: linear-gradient(90deg, #9b00ff, #ffe500, #00e5ff);
        }
        .ticket-content {
          padding: 30px;
        }
        .title {
          font-size: 22px;
          font-weight: bold;
          color: #ffe500;
          text-align: center;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: 15px;
          color: #ffffff;
          text-align: center;
          margin-bottom: 25px;
          letter-spacing: 2px;
        }
        .divider {
          border-top: 1px dashed rgba(155, 0, 255, 0.3);
          margin: 20px 0;
        }
        .details-grid {
          margin-bottom: 20px;
        }
        .detail-item {
          margin-bottom: 15px;
        }
        .label {
          font-size: 11px;
          color: #9b00ff;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 2px;
        }
        .value {
          font-size: 16px;
          color: #ffffff;
          font-weight: 600;
        }
        .ticket-code-container {
          background: rgba(155, 0, 255, 0.05);
          border: 1px solid rgba(155, 0, 255, 0.2);
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          margin-top: 25px;
        }
        .ticket-code {
          font-size: 22px;
          font-family: 'Courier New', Courier, monospace;
          color: #ffe500;
          font-weight: bold;
          letter-spacing: 3px;
        }
        .info-text {
          font-size: 12px;
          color: #8f9cae;
          text-align: center;
          line-height: 1.6;
          margin-top: 25px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 11px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: center; margin-bottom: 10px;">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 300;">TIKEDUCA 2.0</h1>
        </div>
        
        <div class="ticket-card">
          <div class="header-glow"></div>
          <div class="ticket-content">
            <div class="title">Reserva de Hospedaje</div>
            <div class="subtitle">Maestros Fest 2.0</div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Huésped Titular</div>
                <div class="value">${guestName}</div>
              </div>
              <div class="detail-item">
                <div class="label">Tipo de Habitación</div>
                <div class="value">${roomType}</div>
              </div>
              <table style="width: 100%; border: none; padding: 0;">
                <tr>
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div class="detail-item">
                      <div class="label">Check-In</div>
                      <div class="value">${checkin}</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div class="detail-item">
                      <div class="label">Check-Out</div>
                      <div class="value">${checkout}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div class="detail-item">
                      <div class="label">Estancia</div>
                      <div class="value">${nights} noche(s)</div>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 0; vertical-align: top;">
                    <div class="detail-item">
                      <div class="label">Total Pagado</div>
                      <div class="value" style="color: #ffe500;">${total}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <div class="divider"></div>
            
            <div class="ticket-code-container">
              <div class="label">Código de Reservación de Hotel</div>
              <div class="ticket-code">${reservationId}</div>
              <div style="font-size: 9px; color: #8f9cae; margin-top: 5px; text-transform: uppercase;">Presenta este código al hacer check-in en el hotel</div>
            </div>
            
            <div class="info-text">
              Tu pago ha sido registrado correctamente.<br>
              ¡Guarda este correo para presentarlo en la recepción del hotel a tu llegada!
            </div>
          </div>
        </div>
        
        <div class="footer">
          Este es un correo automático de confirmación de hospedaje de TikEduca.<br>
          Si tienes alguna duda o necesitas realizar cambios en tu reserva, contáctanos a soporte@tikeduca.com o por WhatsApp al +52 1 33 4900 4784.
        </div>
      </div>
    </body>
    </html>
  `;
  
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}
