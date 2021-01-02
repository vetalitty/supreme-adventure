const fs = require('fs');
const fsPromise = require('fs').promises;
const readline = require('readline');
const { google } = require('googleapis');

const { GOOGLE_TOKEN_PATH: TOKEN_PATH, GOOGLE_SCOPES: scope } = require('../config/index');

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @return {Promise}
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  let token;
  try {
    token = await fsPromise.readFile(TOKEN_PATH, 'utf8');
    token = JSON.parse(token);
  } catch (e) {
    token = await getAccessToken(oAuth2Client);
  }
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getAccessToken(oAuth2Client) {
  return new Promise(function (resolve, reject) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return reject(err);
        });
        resolve(oAuth2Client);
      });
    });
  });
}

module.exports = {
  authorize,
  getAccessToken,
};
