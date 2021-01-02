const r = require('request');
const request = require('request-promise-native');
const xmlParser = require('xml-parser');

const cbrApiUrl = 'http://www.cbr.ru/scripts/XML_daily.asp';

class Cbr {
  static async getRates() {
    const cbrRatesXml = await request.get(cbrApiUrl);

    const rates = {};
    const xmlRates = xmlParser(cbrRatesXml);

    xmlRates.root.children.forEach(({ children }) => {
      rates[children[1].content.toLowerCase()] = {
        par: parseInt(children[2].content, 10),
        value: parseFloat(children[4].content.replace(/,/g, '.'))
      };
    });

    return rates;
  }
}
module.exports = Cbr;
