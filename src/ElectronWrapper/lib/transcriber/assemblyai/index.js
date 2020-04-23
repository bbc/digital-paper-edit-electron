const  assemblyai  = require('@pietrop/assemblyai');

const { getCredentials, areCredentialsSet } = require('../../../../stt-settings/credentials.js');

const sampleJson = require('./assemblyai-to-dpe/assemblyai-sample.json');

async function assemblyAiStt (filePath, language, languageModel) {
  let assemblyAiCredentials;
  if (areCredentialsSet('AssemblyAI')) {
 assemblyAiCredentials = getCredentials('AssemblyAI');
 const  ApiKey = assemblyAiCredentials.sttAPIKey;
 console.log('language' ,language ,'languageModel', languageModel);
    try {
        const response = await assemblyai({
          ApiKey, 
          filePath,
          languageModel: languageModel,
          acousticModel: language
       });

        return response;
      // }
    } catch (e) {
      // TODO: Do some error handling here
      console.error('error calling AssemblyAi SDK', e);
    }
  }
  else {
    throw new Error('No credentials found for AssemblyAI');
  }
}

module.exports = assemblyAiStt;