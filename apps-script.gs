/**
 * MetIQ intake form — Google Apps Script backend.
 *
 * Setup:
 *   1. Create a Google Sheet with these column headers in row 1:
 *        timestamp | name | email | company | project | budget | page
 *   2. Extensions → Apps Script. Replace the file contents with this.
 *   3. Deploy → New deployment → Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Copy the /exec URL.
 *   4. Paste that URL into SHEETS_ENDPOINT in form.js and redeploy.
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var p = (e && e.parameter) || {};
    sheet.appendRow([
      new Date(),
      p.name    || '',
      p.email   || '',
      p.company || '',
      p.project || '',
      p.budget  || '',
      p.page    || '',
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: lets you sanity-check the deploy in a browser.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: 'MetIQ intake endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
