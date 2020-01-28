// originally from https://github.com/OpenNewsLabs/autoEdit_2/blob/master/lib/interactive_transcription_generator/transcriber/convert_to_audio.js

/**
* @module convertToAudio
* @description Converts video or audio file into `.wav` (or any ffmpeg supported input)
* takes in input file, output destination file, and returns a promise.
* It converts into an audio file that meets the specs for STT services
* @requires fluent-ffmpeg
* @requires ffmpeg-static-electron
*/

const path = require('path');
const ffmpegBin = require('ffmpeg-static-electron');
const ffmpeg = require('fluent-ffmpeg');

const ffmpegBinPath = ffmpegBin.path;
ffmpeg.setFfmpegPath(ffmpegBinPath);

/**
 * Adding an helper function to force the file extension to be `.wav`
 * this also allows the file extension in output file name/path to be optional
 * @param {string} path - path to an audio file
 */
function wavFileExtension(filePath) {
  let audioFileOutputPath = filePath;
  // https://nodejs.org/api/path.html#path_path_parse_path
  const pathParsed = path.parse(audioFileOutputPath);
  if (pathParsed.ext !== '.wav') {
    // audioFileOutputPath = path.join(pathParsed.root, pathParsed.dir, `${ pathParsed.name }.wav`);
    audioFileOutputPath = path.join(pathParsed.dir, `${ pathParsed.name }.wav`);
  }

  return audioFileOutputPath;
}

/**
 * @function convertToAudio
 * @param {string} file -  path to audio or viceo file to convert to wav
 * @param {string} audioFileOutput - path to output wav audio file - needs to have .wav extension
 * @returns {callback} callback - callback to return audio file path as string.
*/
function convertToAudio(file, audioFileOutput) {
  const audioFileOutputPath = wavFileExtension(audioFileOutput);

  return new Promise((resolve, reject) => {
    ffmpeg(file)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .output(audioFileOutputPath)
      .on('end', () => {
        resolve(audioFileOutputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

module.exports = convertToAudio;
