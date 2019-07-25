/* eslint-disable no-case-declarations */
const fs = require('fs');
const path = require('path');
const { app } = require('electron').remote;
const convertToAudio = require('../convert-to-audio/index.js');
const convertAssemblyAIToDpeJson = require('./assemblyai/assemblyai-to-dpe/index.js');
const assemblyAiStt = require('./assemblyai/index');
const { getDefaultStt, setDefaultStt } = require('../../../stt-settings/default-stt.js');

const dataPath = app.getPath('userData');
const mediaDir = path.join(dataPath, 'media');

function getDefaultSttAndLanguage() {
  // const pathToDefaultStt = path.join(dataPath, 'default-stt.json');
  // const defaultStt = JSON.parse(fs.readFileSync(pathToDefaultStt).toString());
  const defaultStt = getDefaultStt();
  console.log('getDefaultSttAndLanguage', defaultStt);

  return defaultStt;
}

const transcriber = async (inputFilePath) => {
  // default stt engine and language
  const { provider, language } = getDefaultSttAndLanguage();
  if (!provider) {
    // TODO: should probably do this check and throw this error before converting video preview as well?
    throw new Error('Default STT Engine has not been set');
  }

  if(!navigator.onLine){
     throw new Error('You don\'t seem to be connected to the internet');
  }
  const defaultSttEngine = provider;

  const response = {};
  //   check media folder exits
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir);
  }

  // convert to audio
  const inputFileName = path.parse(inputFilePath).name;
  const inputFileNameWithExtension = `${ inputFileName }${ path.parse(inputFilePath).ext }`;
  const audioFileOutput = path.join(mediaDir, inputFileName);

  // TODO: add try catch
  const newAudioFile = await convertToAudio(inputFilePath, audioFileOutput);
  response.url = await newAudioFile;

  // transcribe
  switch (defaultSttEngine) {
  case 'AssemblyAI':
    const transcript = await assemblyAiStt(newAudioFile);
    response.transcript = await convertAssemblyAIToDpeJson(transcript);
    response.clipName = inputFileNameWithExtension;

    return response;
  case 'speechmatics':
    // language

    // code block
    break;
  case 'BBC':
    // code block
    break;
  default:
      // code block
  }

  // return transcription
};

module.exports = transcriber;