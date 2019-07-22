const assemblyai = require('assemblyai');

const { getCredentials, areCredentialsSet } = require('../../../../stt-settings/credentials.js');

const sampleJson = require('./assemblyai-to-dpe/assemblyai-sample.json');

async function assemblyAiStt (inputPath) {
  let assemblyAiCredentials;
  if (areCredentialsSet('AssemblyAI')) {
    assemblyAiCredentials = getCredentials('AssemblyAI');
    assemblyai.setAPIKey(assemblyAiCredentials.sttAPIKey);
    try {
      // if in development, stub the response from STT
      if (process.env.NODE_ENV === 'development') {
        return sampleJson;
      }
      else {
        const transcript = new assemblyai.Upload(inputPath);
        const response = await transcript.create();
        const data = response.get();

        return data;
      }
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