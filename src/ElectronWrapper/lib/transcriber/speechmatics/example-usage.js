console.log('SPEECHMATICS config.sttEngine: ', JSON.stringify(newFile, null, 2));
var SendToSpeechmaticsUtil = new SendToSpeechmatics();
SendToSpeechmaticsUtil.send(newFile, config.keys.speechmatics, config.languageModel, function(error, data) {
  if (error) {
    callback(error, null);
  } else {
    console.log('SPEECHMATICS-DATA', JSON.stringify(data));
    console.log('SPEECHMATICS-JSON', JSON.stringify(convertSpeechmaticsJsonToTranscripJson(data), null, 2));
    callback(null, convertSpeechmaticsJsonToTranscripJson(data));
  }
});