const SendToSpeechmatics = require('./send-to-speechmatics.js');
const { getCredentials, areCredentialsSet } = require('../../../../stt-settings/credentials.js');

const speechmaticsSTT = (newFile, language = 'en') => {

  let speechmaticsCredentials;
  if (areCredentialsSet('Speechmatics')) {
    speechmaticsCredentials = getCredentials('Speechmatics');

    return new Promise((resolve, reject) => {
      const SendToSpeechmaticsUtil = new SendToSpeechmatics();
      SendToSpeechmaticsUtil.send(newFile, { username: speechmaticsCredentials.sttUserName, password: speechmaticsCredentials.sttAPIKey }, language, function(error, data) {
        if (error) {
        //   callback(error, null);
          reject(error);
        }
        // else {
        console.log('SPEECHMATICS-DATA', JSON.stringify(data));
        // console.log('SPEECHMATICS-JSON', JSON.stringify(convertSpeechmaticsJsonToTranscripJson(data), null, 2));
        // TODO Convert to promise
        //   callback(null, convertSpeechmaticsJsonToTranscripJson(data));
        // }

        // TODO: convert to DPE specs
        resolve(data);
      });
    });
  }
  else {
    throw new Error('No credentials found for Speechmatics');
  }
};

module.exports = speechmaticsSTT;