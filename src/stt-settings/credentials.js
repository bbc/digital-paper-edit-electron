const fs = require('fs');
const path = require('path');
const electron = require('electron');
const appUserDataPath = electron.remote.app.getPath("userData");

const credentialsTemplate = {
    provider: '',
    sttUserName: '',
    sttAPIKey: '',
    sttAPIUrl: ''
  }

function deepCopy(data){
    return JSON.parse(JSON.stringify(data))
}

function getCredentialsFilePath(provider){
    return path.join(appUserDataPath, `${provider}.json`)
}

function getCredentials (provider){
    let credentials = deepCopy(credentialsTemplate);
    credentials.provider = provider;
    const credentialsFilePath = getCredentialsFilePath(provider);

    if(fs.existsSync(credentialsFilePath)){
        credentials = JSON.parse(fs.readFileSync(credentialsFilePath).toString());
        // console.log('fs.existsSync(credentialsFilePath)', credentials);
        return credentials;
    }
    else{
        return credentials;
    }    
}

function setCredentials (data){
    fs.writeFileSync(getCredentialsFilePath(data.provider), JSON.stringify(data,null,2));
}
module.exports.getCredentials = getCredentials
module.exports.setCredentials = setCredentials
