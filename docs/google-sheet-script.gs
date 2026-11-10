// Paste this into Google Sheets → Extensions → Apps Script. See setup steps in chat.
var SECRET = 'CHANGE-THIS-TO-YOUR-OWN-LONG-RANDOM-TEXT';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return ContentService.createTextOutput('forbidden');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Paid at (IST)','Name','Phone','Email','Trek','Sharing','Travellers',
      'Preferred date','Total (₹)','Advance paid (₹)','Balance due (₹)','Payment ID','Order ID','Status']);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(data.row);
  return ContentService.createTextOutput('ok');
}
