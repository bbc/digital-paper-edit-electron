const async = require('async');
const ffmpeg = require('fluent-ffmpeg');
const tmp = require('tmp');
const debug = require('debug');
const d = debug('ffmpeg-remix');
tmp.setGracefulCleanup();

const ingest = (data, tmpDir,waveForm) => {
    if(data.ffmpegPath){
      ffmpeg.setFfmpegPath(data.ffmpegPath);
    }
    return (input, callback) => {
      const ff = ffmpeg(input.source);
  
      if (input.start) {
        ff.seekInput(input.start);
      } else {
        input.start = 0;
      }
  
      if (input.end) input.duration = input.end - input.start;
      if (input.duration) ff.duration(input.duration);

      input.path = tmp.fileSync({
        dir:     tmpDir.name,
        prefix:  'ingest-',
        postfix: '.ts'
      }).name;
  
    //   ff.audioCodec('copy').videoCodec('copy');
      ff.videoCodec('libx264').audioCodec('aac')

      if(waveForm){
        // wave form reference https://trac.ffmpeg.org/wiki/Waveform
        // https://ffmpeg.org/ffmpeg-filters.html#showwaves 
        // TODO: colour, and mode could be optional parameter, for mode eg line, point,p2p,cline.
        ff.complexFilter('[0:a]showwaves=s=1920x1080:colors=Red:mode=p2p,format=yuv420p[v]')
        // ff.complexFilter('[0:a]showwaves=s=1920x1080:colors=DodgerBlue:mode=cline,format=yuv420p[v]')
        ff.outputOption(['-map [v]','-map', '0:a'])
      }
      ff.output(input.path);
  
      ff.on('start', (commandLine) => {
        d(`Spawned: ${commandLine}`);
      });
  
      ff.on('error', (err, stdout, stderr) => {
        d(err);
        callback(err, null);
      });
  
      ff.on('end', () => {
        d(`Created: ${input.path}`);
        callback(null, input);
      });
  
      ff.run();
    };
  };
  
  
  const concat = (data, tmpDir, callback) => {
    if(data.ffmpegPath){
      ffmpeg.setFfmpegPath(data.ffmpegPath);
    }
    return (err, ingest) => {
      const ff = ffmpeg();
  
      const input = [];
      for (const segment of ingest) {
        input.push(segment.path);
      }
  
      ff.input(`concat:${input.join('|')}`);
      ff.output(data.output);
  
      ff.on('start', (commandLine) => {
        d(`Spawned: ${commandLine}`);
      });
  
      ff.on('error', (err, stdout, stderr) => {
        d(err);
        tmpDir.removeCallback();
        callback(err);
      });
  
      ff.on('end', () => {
        d(`Created: ${data.output}`);
        tmpDir.removeCallback();
        callback(null, data);
      });
  
      ff.run();
    };
  };
  

module.exports = function (data,waveForm, callback) {
  const tmpDir = tmp.dirSync({
      unsafeCleanup: true
  });

  if (data.limit) {
    async.mapLimit(data.input, data.limit, ingest(data, tmpDir,waveForm), concat(data, tmpDir, callback));
  } else {
    async.map(data.input, ingest(data, tmpDir,waveForm), concat(data, tmpDir, callback));
  }
}