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
    sheet.appendRow(["Fecha", "Nombre", "Email", "WhatsApp", "Escuela", "Ciudad", "Boleto", "Titular Transferencia", "Referencia", "Fecha Pago", "Enlace Comprobante", "ID Boleto", "Estado Correo"]);
  }
  
  // Asegurar cabecera de "Estado Correo" en la columna 13
  if (sheet.getRange(1, 13).getValue() === "") {
    sheet.getRange(1, 13).setValue("Estado Correo");
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
  var emailStatus = "No enviado";
  if (params.email) {
    try {
      sendTicketEmail(params.email, params.nombre, params.boleto, ticketId, params.referencia);
      emailStatus = "Enviado con éxito";
    } catch (e) {
      emailStatus = "Error: " + e.toString();
    }
  } else {
    emailStatus = "Sin email proporcionado";
  }
  
  // Escribir el estado en la columna 13 (M) de la fila recién creada
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 13).setValue(emailStatus);
}

// 3. GUARDAR RESERVAS DE HOTEL Y ENVIAR CONFIRMACIÓN AUTOMÁTICA
function saveHotel(ss, params) {
  var sheet = ss.getSheetByName("ReservacionesHotel") || ss.insertSheet("ReservacionesHotel");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Fecha", "Nombre", "Apellidos", "Email", "Teléfono", "Habitación", "Noches", "Total", "Check-In", "Check-Out", "Notas", "Titular Transferencia", "Referencia", "Fecha Pago", "Enlace Comprobante", "ID Reservacion", "Estado Correo"]);
  }
  
  // Asegurar cabecera en columna 17 (Q)
  if (sheet.getRange(1, 17).getValue() === "") {
    sheet.getRange(1, 17).setValue("Estado Correo");
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
  var emailStatus = "No enviado";
  if (params.email) {
    try {
      var fullName = (params.nombre || "") + " " + (params.apellidos || "");
      sendHotelEmail(params.email, fullName.trim(), params.habitacion, params.noches, params.total, reservationId, params.checkin, params.checkout);
      emailStatus = "Enviado con éxito";
    } catch (e) {
      emailStatus = "Error: " + e.toString();
    }
  } else {
    emailStatus = "Sin email proporcionado";
  }
  
  // Escribir el estado en la columna 17 (Q) de la fila recién creada
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 17).setValue(emailStatus);
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
  
  GmailApp.sendEmail(toEmail, subject, "", {
    name: "TikEduca",
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
  
  GmailApp.sendEmail(toEmail, subject, "", {
    name: "TikEduca",
    htmlBody: htmlBody
  });
}

// ─── UTILERÍAS ADICIONALES PARA EL SPREADSHEET ─────────────────────────────────

// Crear menú personalizado al abrir el documento
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('TikEduca 2.0')
    .addItem('Generar IDs Faltantes (Sin enviar correo)', 'generateMissingIds')
    .addItem('Generar IDs y Enviar Correos Faltantes', 'generateAndSendMissingTickets')
    .addSeparator()
    .addItem('Ver Cuota de Correos Restante', 'checkEmailQuota')
    .addToUi();
}

function checkEmailQuota() {
  var limit = MailApp.getRemainingDailyEmailsLimit();
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "Cuota de Correos Restante",
    "Puedes enviar aproximadamente " + limit + " correos más el día de hoy.\n\n" +
    "Nota: Las cuentas de Gmail gratuitas tienen un límite diario de 100 correos, mientras que las cuentas de Google Workspace (corporativas) tienen un límite de 1500 correos por día. Si alcanzas este límite, Google suspenderá el envío de correos hasta el día siguiente.",
    ui.ButtonSet.OK
  );
}

// Función auxiliar: obtener valor de celda por el nombre de la cabecera
function getRowValueByHeader(headers, rowValues, headerName) {
  var lowerHeaderName = headerName.toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].toString().toLowerCase().trim();
    if (h === lowerHeaderName || h.replace(/[-_]/g, " ") === lowerHeaderName) {
      return rowValues[i];
    }
  }
  return "";
}

// 1. GENERAR IDs FALTANTES (SÓLO SPREADSHEET - SIN ENVIAR CORREOS)
function generateMissingIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var summary = [];
  
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    
    // Ignorar hojas vacías o Hoja 1 predeterminada sin datos
    if (sheet.getLastRow() <= 1 || sheet.getLastColumn() === 0) {
      continue;
    }
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    
    var idColumnIndex = -1;
    var idHeaderName = "";
    var idPrefix = "";
    
    // Buscar si existe columna de ID
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j].toString().toLowerCase().trim();
      if (header.includes("id boleto") || header.includes("id ticket")) {
        idColumnIndex = j + 1;
        idHeaderName = headers[j];
        idPrefix = "TKT-";
        break;
      } else if (header.includes("id reservacion") || header.includes("id reserva")) {
        idColumnIndex = j + 1;
        idHeaderName = headers[j];
        idPrefix = "HTL-";
        break;
      } else if (header.includes("id pre-registro") || header.includes("id preregistro")) {
        idColumnIndex = j + 1;
        idHeaderName = headers[j];
        idPrefix = "PRE-";
        break;
      }
    }
    
    // Si no se encontró columna de ID, determinar según el nombre de la hoja
    if (idColumnIndex === -1) {
      if (sheetName.toLowerCase().includes("pre")) {
        idHeaderName = "ID Pre-Registro";
        idPrefix = "PRE-";
      } else if (sheetName.toLowerCase().includes("hotel") || sheetName.toLowerCase().includes("habitacion")) {
        idHeaderName = "ID Reservacion";
        idPrefix = "HTL-";
      } else {
        idHeaderName = "ID Boleto";
        idPrefix = "TKT-";
      }
      
      // Agregar la nueva columna de ID al final
      sheet.getRange(1, lastColumn + 1).setValue(idHeaderName);
      idColumnIndex = lastColumn + 1;
      lastColumn = lastColumn + 1;
    }
    
    // Cargar la columna de IDs para procesar
    var idRange = sheet.getRange(2, idColumnIndex, lastRow - 1, 1);
    var idValues = idRange.getValues();
    var count = 0;
    
    for (var r = 0; r < idValues.length; r++) {
      if (!idValues[r][0] || idValues[r][0].toString().trim() === "") {
        idValues[r][0] = idPrefix + Math.floor(100000 + Math.random() * 900000);
        count++;
      }
    }
    
    if (count > 0) {
      idRange.setValues(idValues);
    }
    
    summary.push("Hoja '" + sheetName + "': " + count + " IDs generados (" + idPrefix + "XXXXXX)");
  }
  
  var ui = SpreadsheetApp.getUi();
  ui.alert("Proceso Completado", "Se han generado los IDs faltantes con éxito:\n\n" + summary.join("\n"), ui.ButtonSet.OK);
}

// 2. GENERAR IDs Y ADEMÁS ENVIAR CORREOS DE CONFIRMACIÓN (PARA REGISTROS PENDIENTES)
function generateAndSendMissingTickets() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "Enviar Correos Históricos",
    "Esta función buscará registros en las hojas de Boletos ('PagosBoletos', 'Maestros Fest', 'TikEduca') y Hotel ('Habitaciones', 'ReservacionesHotel') que no tengan ID.\n\n" +
    "Generará su código de boleto/reserva y les enviará el correo electrónico de confirmación correspondiente.\n\n" +
    "¿Deseas continuar?",
    ui.ButtonSet.YES_NO
  );
  
  if (confirm !== ui.ButtonSet.YES) {
    return;
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summary = [];
  
  // Procesar Boletos
  var ticketSheets = ["PagosBoletos", "Maestros Fest", "TikEduca"];
  for (var s = 0; s < ticketSheets.length; s++) {
    var sheet = ss.getSheetByName(ticketSheets[s]);
    if (!sheet || sheet.getLastRow() <= 1 || sheet.getLastColumn() === 0) continue;
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
    var values = dataRange.getValues();
    var headers = values[0];
    
    var idColIdx = -1;
    for (var j = 0; j < headers.length; j++) {
      var h = headers[j].toString().toLowerCase().trim();
      if (h.includes("id boleto") || h.includes("id ticket")) {
        idColIdx = j;
        break;
      }
    }
    
    if (idColIdx === -1) {
      sheet.getRange(1, lastColumn + 1).setValue("ID Boleto");
      idColIdx = lastColumn;
      lastColumn++;
      dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
      values = dataRange.getValues();
      headers = values[0];
    }
    
    // Buscar o crear columna de Estado Correo
    var emailStatusColIdx = -1;
    for (var j = 0; j < headers.length; j++) {
      var h = headers[j].toString().toLowerCase().trim();
      if (h.includes("estado correo") || h.includes("estado email")) {
        emailStatusColIdx = j;
        break;
      }
    }
    if (emailStatusColIdx === -1) {
      sheet.getRange(1, lastColumn + 1).setValue("Estado Correo");
      emailStatusColIdx = lastColumn;
      lastColumn++;
      dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
      values = dataRange.getValues();
      headers = values[0];
    }
    
    var count = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var currentId = row[idColIdx];
      
      if (!currentId || currentId.toString().trim() === "") {
        var email = getRowValueByHeader(headers, row, "Email") || getRowValueByHeader(headers, row, "Correo");
        var nombre = getRowValueByHeader(headers, row, "Nombre") || getRowValueByHeader(headers, row, "Asistente");
        var boleto = getRowValueByHeader(headers, row, "Boleto") || getRowValueByHeader(headers, row, "Tipo de Boleto");
        var referencia = getRowValueByHeader(headers, row, "Referencia") || "Histórico";
        
        var newId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
        sheet.getRange(r + 1, idColIdx + 1).setValue(newId);
        
        var emailStatus = "No enviado";
        if (email) {
          try {
            sendTicketEmail(email, nombre, boleto, newId, referencia);
            emailStatus = "Enviado con éxito";
            Utilities.sleep(1000); // 1 segundo entre envíos
          } catch(e) {
            emailStatus = "Error: " + e.toString();
          }
        } else {
          emailStatus = "Sin email proporcionado";
        }
        sheet.getRange(r + 1, emailStatusColIdx + 1).setValue(emailStatus);
        count++;
      }
    }
    summary.push("Boletos ('" + ticketSheets[s] + "'): " + count + " procesados y enviados");
  }
  
  // Procesar Hotel
  var hotelSheets = ["Habitaciones", "ReservacionesHotel"];
  for (var s = 0; s < hotelSheets.length; s++) {
    var sheet = ss.getSheetByName(hotelSheets[s]);
    if (!sheet || sheet.getLastRow() <= 1 || sheet.getLastColumn() === 0) continue;
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
    var values = dataRange.getValues();
    var headers = values[0];
    
    var idColIdx = -1;
    for (var j = 0; j < headers.length; j++) {
      var h = headers[j].toString().toLowerCase().trim();
      if (h.includes("id reservacion") || h.includes("id reserva")) {
        idColIdx = j;
        break;
      }
    }
    
    if (idColIdx === -1) {
      sheet.getRange(1, lastColumn + 1).setValue("ID Reservacion");
      idColIdx = lastColumn;
      lastColumn++;
      dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
      values = dataRange.getValues();
      headers = values[0];
    }
    
    // Buscar o crear columna de Estado Correo
    var emailStatusColIdx = -1;
    for (var j = 0; j < headers.length; j++) {
      var h = headers[j].toString().toLowerCase().trim();
      if (h.includes("estado correo") || h.includes("estado email")) {
        emailStatusColIdx = j;
        break;
      }
    }
    if (emailStatusColIdx === -1) {
      sheet.getRange(1, lastColumn + 1).setValue("Estado Correo");
      emailStatusColIdx = lastColumn;
      lastColumn++;
      dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
      values = dataRange.getValues();
      headers = values[0];
    }
    
    var count = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var currentId = row[idColIdx];
      
      if (!currentId || currentId.toString().trim() === "") {
        var email = getRowValueByHeader(headers, row, "Email") || getRowValueByHeader(headers, row, "Correo");
        var nombre = getRowValueByHeader(headers, row, "Nombre") || "";
        var apellidos = getRowValueByHeader(headers, row, "Apellidos") || "";
        var habitacion = getRowValueByHeader(headers, row, "Habitación") || getRowValueByHeader(headers, row, "Cuarto");
        var noches = getRowValueByHeader(headers, row, "Noches") || "1";
        var total = getRowValueByHeader(headers, row, "Total") || "$0";
        var checkin = getRowValueByHeader(headers, row, "Check-In") || "Por definir";
        var checkout = getRowValueByHeader(headers, row, "Check-Out") || "Por definir";
        
        var newId = "HTL-" + Math.floor(100000 + Math.random() * 900000);
        sheet.getRange(r + 1, idColIdx + 1).setValue(newId);
        
        var emailStatus = "No enviado";
        if (email) {
          try {
            var fullName = (nombre + " " + apellidos).trim();
            sendHotelEmail(email, fullName, habitacion, noches, total, newId, checkin, checkout);
            emailStatus = "Enviado con éxito";
            Utilities.sleep(1000);
          } catch(e) {
            emailStatus = "Error: " + e.toString();
          }
        } else {
          emailStatus = "Sin email proporcionado";
        }
        sheet.getRange(r + 1, emailStatusColIdx + 1).setValue(emailStatus);
        count++;
      }
    }
    summary.push("Hotel ('" + hotelSheets[s] + "'): " + count + " procesados y enviados");
  }
  
  ui.alert("Proceso de Envío Completado", "Se han procesado y enviado los correos de confirmación:\n\n" + summary.join("\n"), ui.ButtonSet.OK);
}

