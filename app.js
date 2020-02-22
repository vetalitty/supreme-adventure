const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();
const moment = require('moment');

const {
  SHEET_ID,
  GOOGLE_SERVICE_CREDS,
  DATE_START_OF_WORK
} = process.env;

function setPeriod(sheet) {
  let periodCell = sheet.getCell(8, 2);
  const startOfPeriod = moment.utc().startOf('month').format('MMMM DD, YYYY');
  const endOfPeriod = moment.utc().endOf('month').format('MMMM DD, YYYY');
  const periodRowText = `${startOfPeriod} - ${endOfPeriod}`;
  periodCell.value = periodRowText;
  console.log('period:', periodRowText);
}



async function main() {
  const doc = new GoogleSpreadsheet(SHEET_ID);

  await doc.useServiceAccountAuth(JSON.parse(GOOGLE_SERVICE_CREDS));
  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells('A1:E11');

  setInvoiceNumber(sheet);
  setPeriod(sheet);

  await sheet.saveUpdatedCells();
}

function setInvoiceNumber(sheet) {
  let invoiceFromDateCell = sheet.getCell(5, 0);
  const dateStartOfWork = moment.utc(DATE_START_OF_WORK);
  const invoiceNumber = moment.utc().diff(dateStartOfWork, 'month') + 1;
  const currentDay = moment.utc().format('MMMM DD, YYYY');
  const invoiceRowText = `Invoice № ${invoiceNumber} from ${currentDay}`;
  invoiceFromDateCell.value = invoiceRowText;
  console.log('invoiceFromDateCell:', invoiceRowText);
}

main()
  .then((res) => console.log('result:', res))
  .catch((err) => console.log('error:', err));
