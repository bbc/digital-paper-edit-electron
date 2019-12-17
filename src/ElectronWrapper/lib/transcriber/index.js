/* eslint-disable no-case-declarations */
const fs = require("fs");
const path = require("path");
const { app } = require("electron").remote;
const convertToAudio = require("../convert-to-audio/index.js");
const convertAssemblyAIToDpeJson = require("./assemblyai/assemblyai-to-dpe/index.js");
const assemblyAiStt = require("./assemblyai/index");
const speechmaticsSTT = require("./speechmatics/index.js");
const convertSpeechmaticsDpe = require("./speechmatics/speechmatics-to-dpe/index.js");
const pocketsphinxSTT = require("./pocketsphinx-stt/index.js");
const deepspeechSTT =  require("./deepspeech/index.js");
const convertPocketsphinxOutputToDpe = require("./pocketsphinx-stt/pocketsphinx-to-dpe/index.js");
const { getDefaultStt } = require("../../../stt-settings/default-stt.js");
const { getDeepSpeechModelPath } = require("../../../stt-settings/credentials.js");

const dataPath = app.getPath("userData");
const mediaDir = path.join(dataPath, "media");

function getDefaultSttAndLanguage() {
  // const pathToDefaultStt = path.join(dataPath, 'default-stt.json');
  // const defaultStt = JSON.parse(fs.readFileSync(pathToDefaultStt).toString());
  const defaultStt = getDefaultStt();
  console.log("getDefaultSttAndLanguage", defaultStt);

  return defaultStt;
}

const transcriber = async inputFilePath => {
  // default stt engine and language
  const { provider, language } = getDefaultSttAndLanguage();
  if (!provider) {
    // TODO: should probably do this check and throw this error before converting video preview as well?
    throw new Error("Default STT Engine has not been set");
  }

  if (!navigator.onLine) {
    throw new Error("You don't seem to be connected to the internet");
  }
  const defaultSttEngine = provider;

  const response = {};
  //   check media folder exits
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir);
  }

  // convert to audio
  const inputFileName = path.parse(inputFilePath).name;
  const inputFileNameWithExtension = `${inputFileName}${
    path.parse(inputFilePath).ext
  }`;
  const audioFileOutput = path.join(mediaDir, inputFileName);

  // TODO: add try catch
  const newAudioFile = await convertToAudio(inputFilePath, audioFileOutput);
  response.url = await newAudioFile;

  // transcribe
  switch (defaultSttEngine) {
    case "AssemblyAI":
      const assemblyAITranscript = await assemblyAiStt(newAudioFile);
      response.transcript = await convertAssemblyAIToDpeJson(
        assemblyAITranscript
      );
      response.clipName = inputFileNameWithExtension;
      response.sttEngine =  "AssemblyAI";
      return response;
    case "Speechmatics":
      // language
      // const transcript = await speechmaticsSTT(newAudioFile);
      const speechmaticsTranscript = await speechmaticsSTT(
        newAudioFile,
        language
      );
      console.log("speechmaticsTranscript", speechmaticsTranscript);
      // TODO: convertSpeechmaticsToDpeJson
      response.transcript = convertSpeechmaticsDpe(speechmaticsTranscript);
      response.clipName = inputFileNameWithExtension;
      response.sttEngine =  "Speechmatics";
      return response;
    case "pocketsphinx":
      const pocketsphinxTranscript = await pocketsphinxSTT(newAudioFile);
      console.log("pocketsphinxTranscript", pocketsphinxTranscript);
      response.transcript = convertPocketsphinxOutputToDpe(
        pocketsphinxTranscript
      );
      response.clipName = inputFileNameWithExtension;
      console.log("pocketsphinxTranscript", response);
      response.sttEngine =  "pocketsphinx";
      return response;
    case "deepspeech":
      console.log('transcriber:deepspeech')
      const deepspeechModelsPath = getDeepSpeechModelPath();
      const deepspeechTranscript = await deepspeechSTT(newAudioFile, deepspeechModelsPath);
      const { dpeResult } = await deepspeechTranscript;
      console.log("deepspeechTranscript", deepspeechTranscript, dpeResult);
      response.transcript = dpeResult;
      response.clipName = inputFileNameWithExtension;
      console.log("deepspeechTranscript", response);
      response.sttEngine =  "deepspeech";
      return response;
    default:
      throw new Error(
        "A valid STT engine wasn't specified in the transcriber module"
      );
  }
  // return transcription
};

module.exports = transcriber;
