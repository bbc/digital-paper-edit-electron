const fs = require('fs');
const path = require('path');
const electron = require('electron');
const appUserDataPath = electron.remote.app.getPath('userData');

const credentialsTemplate = {
  provider: '',
  sttUserName: '',
  sttAPIKey: '',
  sttAPIUrl: ''
};

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
}

function getCredentialsFilePath(provider) {
  return path.join(appUserDataPath, `${ provider }.json`);
}

function setCredentials (data) {
  fs.writeFileSync(getCredentialsFilePath(data.provider), JSON.stringify(data, null, 2));
}

function getCredentials (provider) {
  let credentials = deepCopy(credentialsTemplate);
  credentials.provider = provider;
  const credentialsFilePath = getCredentialsFilePath(provider);

  if (fs.existsSync(credentialsFilePath)) {
    credentials = JSON.parse(fs.readFileSync(credentialsFilePath).toString());

    return credentials;
  }
  else {
    return credentials;
  }
}

function areCredentialsSet(provider) {
  const credentials = getCredentials(provider);
  switch (provider) {
  case 'AssemblyAI':
    return credentials.sttAPIKey !== '';
  case 'Speechmatics':
    return credentials.sttUserName !== '' && credentials.sttAPIKey !== '';
  case 'BBC':
    return credentials.sttUserName !== '';
  default:
    console.error(`Could not find credentials for provier: ${ provider }`);

    return false;
  }
}

module.exports.setCredentials = setCredentials;
module.exports.getCredentials = getCredentials;
module.exports.areCredentialsSet = areCredentialsSet;
