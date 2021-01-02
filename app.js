const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();
const moment = require('moment');
const fsPromise = require('fs').promises;
const { google } = require('googleapis');

const cbr = require('./services/cbr');
const config = require('./config/index');
const gmailAuth = require('./services/gmailAuth');

class Invoicer {
  constructor(config, cbr) {
    this.cbrRates = null;
    this.config = config;
    this.cbr = cbr;
  }

  async main() {
    this.cbrRates = await this.cbr.getRates();
    const doc = new GoogleSpreadsheet(this.config.SHEET_ID);

    await doc.useServiceAccountAuth(this.config.GOOGLE_SERVICE_CREDS);
    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells('A1:E11');

    this.setInvoiceNumber(sheet);
    this.setPeriod(sheet);
    await this.setCosts(sheet);

    await sheet.saveUpdatedCells();

    console.log('Saving PDF...');

    const googleAuth = await gmailAuth.authorize(this.config.GOOGLE_CREDENTIALS);
    const invoicePdf = await this.downloadPdf(this.config.SHEET_ID, googleAuth);
    await this.savePdf(invoicePdf);
  }

  setInvoiceNumber(sheet) {
    let invoiceFromDateCell = sheet.getCell(5, 0);
    const dateStartOfWork = moment.utc(this.config.DATE_START_OF_WORK);
    const invoiceNumber = moment.utc().diff(dateStartOfWork, 'month') + 1;
    const currentDay = moment.utc().format('MMMM DD, YYYY');
    const currentMonthYear = moment.utc().format('MMMM YYYY');
    const invoiceRowText = `Invoice № ${invoiceNumber} from ${currentDay}`;
    invoiceFromDateCell.value = invoiceRowText;
    console.log('invoiceFromDateCell:', invoiceRowText);
    console.log(`subject: Invoice ${invoiceNumber}, ${currentMonthYear}`);
  }

  calcRurCosts(costs) {
    let rurCostsSum = 0;
    Object.values(costs).forEach(key => rurCostsSum += key);
    const rurCostsInEur = Math.ceil(this.rurToEur(rurCostsSum));
    return rurCostsInEur;
  }

  calcEurCosts(costs) {
    let eurCostsSum = 0;
    Object.values(costs).forEach(key => eurCostsSum += key);
    return eurCostsSum;
  }

  async setCosts(sheet) {
    let costsCell = sheet.getCell(8, 4);

    const rurCosts = this.calcRurCosts(this.config.RUR_COSTS);
    const eurCosts = this.calcEurCosts(this.config.EUR_COSTS);

    const overallSum = rurCosts + eurCosts;
    costsCell.value = overallSum;
  }

  setPeriod(sheet) {
    let periodCell = sheet.getCell(8, 2);
    const startOfPeriod = moment.utc().startOf('month').format('MMMM DD, YYYY');
    const endOfPeriod = moment.utc().endOf('month').format('MMMM DD, YYYY');
    const periodRowText = `${startOfPeriod} - ${endOfPeriod}`;
    periodCell.value = periodRowText;
    console.log('period:', periodRowText);
  }

  rurToEur(amount) {
    return amount / this.cbrRates.eur.value;
  }

  downloadPdf(fileId, auth) {
    return new Promise(function (resolve, reject) {
      const drive = google.drive({
        version: 'v3',
        auth
      });

      drive.files.export({
          fileId,
          mimeType: 'application/pdf'
        },
        {
          encoding: null,
          responseType: 'arraybuffer'
        },
        (err, res) => {
          if (err) return reject(err);
          resolve(Buffer.from(res.data));
        });
    });
  }

  getInvoiceName() {
    const dateStartOfWork = moment.utc(this.config.DATE_START_OF_WORK);
    const invoiceNumber = moment.utc().diff(dateStartOfWork, 'month') + 1;
    return invoiceNumber;
  }

  async savePdf(invoicePdf) {
    const fileName = `Invoice ${this.getInvoiceName()}.pdf`;
    await fsPromise.writeFile(`./pdf/${fileName}`, invoicePdf);
  }
}

const invoicer = new Invoicer(config, cbr);
invoicer.main()
  .then()
  .catch((err) => console.log('error:', err));
