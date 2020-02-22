const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();
const moment = require('moment');

const {
  SHEET_ID,
  GOOGLE_SERVICE_CREDS,
  DATE_START_OF_WORK
} = process.env;

async function main() {
  const doc = new GoogleSpreadsheet(SHEET_ID);

  await doc.useServiceAccountAuth(JSON.parse(GOOGLE_SERVICE_CREDS));
  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells('A1:E11');

  setInvoiceNumber(sheet);

  await sheet.saveUpdatedCells();
}

function setInvoiceNumber(sheet) {
  let cell_InvoiceFromDate = sheet.getCell(5, 0);
  const dateStartOfWork = moment.utc(DATE_START_OF_WORK);
  const invoiceNumber = moment.utc().diff(dateStartOfWork, 'month') + 1;
  const currentDay = moment.utc().format('MMMM DD, YYYY');
  const invoiceFromDate = `Invoice № ${invoiceNumber} from ${currentDay}`;
  cell_InvoiceFromDate.value = invoiceFromDate;
}

main()
  .then((res) => console.log('result:', res))
  .catch((err) => console.log('error:', err));
