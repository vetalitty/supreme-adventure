module.exports = {
  GOOGLE_TOKEN_PATH: 'config/token.json',
  GOOGLE_SCOPES: ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.readonly'],
  SHEET_ID: process.env.SHEET_ID,
  GOOGLE_SERVICE_CREDS: JSON.parse(process.env.GOOGLE_SERVICE_CREDS),
  DATE_START_OF_WORK: process.env.DATE_START_OF_WORK,
  RUR_COSTS: JSON.parse(process.env.RUR_COSTS),
  EUR_COSTS: JSON.parse(process.env.EUR_COSTS),
  GOOGLE_CREDENTIALS: require('./credentials.json'),
};
