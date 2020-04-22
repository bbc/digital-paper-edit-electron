const  assemblyai  = require('@pietrop/assemblyai');

const { getCredentials, areCredentialsSet } = require('../../../../stt-settings/credentials.js');

const sampleJson = require('./assemblyai-to-dpe/assemblyai-sample.json');

async function assemblyAiStt (filePath, language='assemblyai_default', languageModel= 'assemblyai_media') {
  let assemblyAiCredentials;
  if (areCredentialsSet('AssemblyAI')) {
 assemblyAiCredentials = getCredentials('AssemblyAI');
 const  ApiKey = assemblyAiCredentials.sttAPIKey;
 console.log('language' ,language ,'languageModel', languageModel);
 // assemblyai.setAPIKey(assemblyAiCredentials.sttAPIKey);
    try {
      // if in development, stub the response from STT
      // if (process.env.NODE_ENV === 'development') {
      //   return sampleJson;
      // }
      // else {
        // const transcript = new assemblyai.Upload(inputPath);
        // const response = await transcript.create();
        // const data = response.get();

        // return data;

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