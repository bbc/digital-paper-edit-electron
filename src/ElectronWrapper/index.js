/* eslint-disable class-methods-use-this */
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static-electron');
// TODO: remove dialog, eg make dialog go via main process?
// v9 of electron, remote gets deprecated and moved to userland
const { dialog } = require('electron').remote;
const { ipcRenderer } = require('electron');
const dataPath = ipcRenderer.sendSync('synchronous-message-get-user-data-folder', 'ping');

const mediaDir = path.join(dataPath, 'media');
const db = require('./dbWrapper.js');
const convertToVideo = require('./lib/convert-to-video');
const { readMetadataForEDL } = require('./lib/av-metadata-reader/index.js');
const transcribe = require('./lib/transcriber');
const remix = require('./ffmpeg-remix/index.js');
const { getDefaultStt } = require('../stt-settings/default-stt.js');
function getDefaultSttAndLanguageProvider() {
  // const pathToDefaultStt = path.join(dataPath, 'default-stt.json');
  // const defaultStt = JSON.parse(fs.readFileSync(pathToDefaultStt).toString());
  const defaultStt = getDefaultStt();
  console.log('getDefaultSttAndLanguage', defaultStt, defaultStt.provider);

  return defaultStt.provider;
}

class ElectronWrapper {
  /**
   * Projects
   */
  async getAllProjects() {
    const projects = db.getAll('projects');
    // Temporary workaround.
    let results = 0;
    if (projects.length !== 0) {
      results = projects.map(project => {
        project.id = project._id;

        return project;
      });

      return results;
    }
  }

  async getProject(id) {
    const project = db.get('projects', { _id: id });

    return { status: 'ok', project: project };
  }

  async createProject(data) {
    const project = db.create('projects', data);
    project.id = project._id;
    // At this point need to run update otherwise
    // project.id in db is equal to null.
    db.update('projects', { _id: project._id }, project);
    return { status: 'ok', project };
  }

  async updateProject(id, data) {
    const projectId = id;
    const newProject = {
      id: projectId,
      title: data.title,
      description: data.description,
    };

    db.update('projects', { _id: projectId }, newProject);

    return { status: 'ok', project: newProject };
  }

  async deleteProject(id) {
    const projectId = id;
    const confirmation = confirm('Deleting a project, will delete all included transcript and paperedits, are you sure you want to continue?');
    if (confirmation) {
      // deleting project
      db.delete('projects', { _id: id });
      // deleting transcripts belonging to that project
      const transcripts = db.getAll('transcripts', { projectId });
      if (transcripts) {
        // deleting transcript and corresponding media media
        transcripts.forEach(transcript => {
          const transcriptId = transcript._id;
          this.deleteTranscript(projectId, transcriptId);
        });
      }
      // deleting paper edits belonging to the project
      db.delete('paperedits', { projectId: id });
    } else {
      alert('Nothing was deleted');
    }

    return { ok: true, status: 'ok', project: {} };
  }

  /**
   * Transcripts
   */
  async getTranscripts(projectId) {
    let transcripts = [];
    transcripts = db.getAll('transcripts', { projectId });
    // Temporary workaround.
    transcripts.map(transcript => {
      transcript.id = transcript._id;

      return transcript;
    });

    return { transcripts: transcripts };
  }

  // eslint-disable-next-line class-methods-use-this
  async createTranscript(projectId, formData, data) {
    const newTranscriptData = {
      projectId,
      ...data,
      url: null,
      status: 'in-progress',
    };

    const newTranscriptDataError = {};
    const newTranscriptDataVideo = {};
    const newTranscriptDataMetadata = {};

    const newTranscript = db.create('transcripts', newTranscriptData);
    const transcriptId = newTranscript._id;
    newTranscript.id = transcriptId;
    // updating id
    db.update('transcripts', { _id: transcriptId }, newTranscript);
    ////////////////////////////////////////////////
    convertToVideo({
      src: data.path,
      outputFullPathName: path.join(mediaDir, `${path.parse(data.path).name}.${transcriptId}.mp4`),
    })
      .then(videoPreviewPath => {
        newTranscriptDataVideo.videoUrl = videoPreviewPath;
        newTranscriptDataVideo.url = videoPreviewPath;
        console.log('newTranscriptDataVideo', newTranscriptDataVideo, 'transcriptId', transcriptId);
        db.update('transcripts', { _id: transcriptId }, newTranscriptDataVideo);
      })
      .catch(err => {
        console.error('Error converting to video', err);
      });
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    readMetadataForEDL({
      file: data.path,
    })
      .then(metadataResponse => {
        newTranscriptDataMetadata.metadata = metadataResponse;
        console.log('readMetadataForEDL', newTranscriptDataMetadata, 'transcriptId', transcriptId);
        db.update('transcripts', { _id: transcriptId }, newTranscriptDataMetadata);
      })
      .catch(err => {
        console.error('Error reading metadata', err);
      });
    console.log('about to call  ipcRenderer - deepspeech 1', getDefaultSttAndLanguageProvider());
    if (getDefaultSttAndLanguageProvider() === 'deepspeech') {
      console.log('about to call  ipcRenderer - deepspeech 2');
      ///////////////////////////////////////////////
      ipcRenderer.on('asynchronous-reply', (event, arg) => {
        console.log('asynchronous-reply', arg); // prints "pong"
        const res = JSON.parse(arg);
        console.log('transcribe', res);
        if (res.status === 'error') {
          newTranscriptDataError.status = 'error';
          newTranscriptDataError.errorMessage = `There was an error transcribing this file: ${res.errorMessage}.`;
          db.update('transcripts', { _id: res.id }, newTranscriptDataError);
        } else {
          const newTranscriptDataSTTResultRes = res;
          (newTranscriptDataSTTResultRes.status = 'done'), (newTranscriptDataSTTResultRes.transcript = res.transcript);
          newTranscriptDataSTTResultRes.audioUrl = res.url;
          newTranscriptDataSTTResultRes.sttEngine = res.sttEngine;
          newTranscriptDataSTTResultRes.clipName = res.clipName;
          // edge case if video has already been processed then don't override the url
          // but if it hasn't used the audio url instead
          // TODO: removing get with projectId to avoid collision in tretrieving results?
          // const tmpTranscript = db.get('transcripts', { _id: res.id, projectId: res.projectId });
          const tmpTranscript = db.get('transcripts', { _id: res.id });
          if (!tmpTranscript.url) {
            newTranscriptDataSTTResultRes.url = res.url;
          } else {
            newTranscriptDataSTTResultRes.url = tmpTranscript.url;
          }
          db.update('transcripts', { _id: newTranscriptDataSTTResultRes.id }, newTranscriptDataSTTResultRes);
        }
      });

      // TODO: re introduce offline error
      // but not for pocketsphinx and mozilla deepspeech as those run offline
      // so only for AssemblyAI and Speechmatics
      // if (!navigator.onLine) {
      //   throw new Error("You don't seem to be connected to the internet");
      // }
      const transcriberMessageData = JSON.stringify({ ...newTranscript });
      ipcRenderer.send('asynchronous-message-start-transcription', transcriberMessageData);
      ////////////////////////////////////////////////
    } else {
      transcribe(newTranscript, mediaDir)
        .then(res => {
          console.log('transcribe res', res);
          if (res.status === 'error') {
            newTranscriptDataError.status = 'error';
            newTranscriptDataError.errorMessage = `There was an error transcribing this file: ${res.errorMessage}.`;
            db.update('transcripts', { _id: res.id }, newTranscriptDataError);
          } else {
            const newTranscriptDataSTTResultRes = res;
            (newTranscriptDataSTTResultRes.status = 'done'), (newTranscriptDataSTTResultRes.transcript = res.transcript);
            newTranscriptDataSTTResultRes.audioUrl = res.url;
            newTranscriptDataSTTResultRes.sttEngine = res.sttEngine;
            newTranscriptDataSTTResultRes.clipName = res.clipName;
            // edge case if video has already been processed then don't override the url
            // but if it hasn't used the audio url instead
            // TODO: removing get with projectId to avoid collision in tretrieving results?
            // const tmpTranscript = db.get('transcripts', { _id: res.id, projectId: res.projectId });
            const tmpTranscript = db.get('transcripts', { _id: res.id });
            if (!tmpTranscript.url) {
              newTranscriptDataSTTResultRes.url = res.url;
            } else {
              newTranscriptDataSTTResultRes.url = tmpTranscript.url;
            }
            db.update('transcripts', { _id: newTranscriptDataSTTResultRes.id }, newTranscriptDataSTTResultRes);
          }
        })
        .catch(err => {
          console.error('There was an error transcribing', err);
        });
    }

    return {
      status: 'ok',
      transcript: newTranscript,
      transcriptId: transcriptId,
    };
  }

  async getTranscript(projectId, transcriptId, queryParamsOptions) {
    const transcript = db.get('transcripts', { _id: transcriptId, projectId });
    transcript.id = transcript._id;
    const resProject = await this.getProject(projectId);
    transcript.projectTitle = resProject.project.title;
    transcript.transcriptTitle = transcript.title;

    return transcript;
  }

  async updateTranscript(projectId, transcriptId, queryParamsOptions, data) {
    console.log('updateTranscript', projectId, transcriptId, data);
    const updatedTranscriptData = {
      id: transcriptId,
      projectId,
      title: data.title,
    };
    if (data.description) {
      updatedTranscriptData.description = data.description;
    }
    // TODO: this part is for when correcting transcript with react-transcript-editor as it's not ready
    if (data.words) {
      updatedTranscriptData.transcript = {};
      updatedTranscriptData.transcript.words = data.words;
      if (data.paragraphs) {
        updatedTranscriptData.transcript.paragraphs = data.paragraphs;
      }
    }
    const updated = db.update('transcripts', { _id: transcriptId }, updatedTranscriptData);
    updatedTranscriptData.id = transcriptId;

    return { ok: true, transcript: updatedTranscriptData };
  }

  async deleteTranscript(projectId, transcriptId) {
    // Deleting associated media
    const transcript = db.get('transcripts', { _id: transcriptId, projectId });
    if (transcript.videoUrl) {
      try {
        fs.unlink(transcript.videoUrl, function(err) {
          if (err) return console.error('Error deleting video file for this transcript', err);
          console.log('video file deleted successfully');
        });
      } catch (e) {
        console.error('Error deleting video file for this transcript');
      }
    }

    if (transcript.audioUrl) {
      try {
        fs.unlink(transcript.audioUrl, function(err) {
          if (err) return console.error('Error deleting audio file for this transcript', err);
          console.log('audio file deleted successfully');
        });
      } catch (e) {
        console.error('Error deleting audio file for this transcript');
      }
    }

    // deleting transcript
    db.delete('transcripts', { _id: transcriptId });

    return {
      ok: true,
      status: 'ok',
      message: `DELETE: transcript ${transcriptId}`,
    };
  }

  /**
   * Annotations
   */
  async getAllAnnotations(projectId, transcriptId) {
    let annotations = db.getAll('annotations', { projectId, transcriptId });
    if (annotations) {
      annotations = annotations
        // Temporary workaround.
        .map(annotation => {
          annotation.id = annotation._id;

          return annotation;
        });
    } else {
      annotations = [];
    }

    return { annotations };
  }

  // not used
  async getAnnotation(projectId, transcriptId, annotationId) {
    const annotation = db.get('annotations', {
      _id: annotationId,
      projectId,
      transcriptId,
    }); //

    return { annotation };
  }

  async createAnnotation(projectId, transcriptId, data) {
    const newAnnotationData = {
      projectId,
      transcriptId,
      ...data,
    };
    const newAnnotation = db.create('annotations', newAnnotationData);
    newAnnotation.id = newAnnotation._id;

    return { ok: true, status: 'ok', annotation: newAnnotation };
  }

  async updateAnnotation(projectId, transcriptId, annotationId, data) {
    const annotationData = {
      _id: annotationId,
      id: annotationId,
      transcriptId,
      projectId,
      ...data,
    };
    db.update('annotations', { _id: annotationId }, annotationData);

    return { ok: true, status: 'ok', annotation: annotationData };
  }

  async deleteAnnotation(projectId, transcriptId, annotationId) {
    db.delete('annotations', { _id: annotationId });

    return { ok: true, status: 'ok' };
  }

  /**
   * Labels
   */

  // Get All Labels
  async getAllLabels(projectId) {
    let labels = db.getAll('labels', { projectId });
    if (!labels) {
      labels = [];
    }
    const defaultLabel = db.get('labels', { _id: 'default' });
    labels.unshift(defaultLabel);

    return { ok: true, status: 'ok', labels };
  }
  // Get Label - not used
  async getLabel(projectId, labelId) {
    const label = db.get('labels', { _id: labelId, projectId });

    return { ok: true, status: 'ok', label };
  }

  // Create Label
  async createLabel(projectId, data) {
    const newLabelData = {
      ...data,
      projectId,
    };
    delete newLabelData.id;
    const newLabel = db.create('labels', newLabelData);
    const labelId = newLabel._id;
    newLabel.id = labelId;
    // temporary workaround to update the id
    const updated = db.update('labels', { _id: labelId }, newLabelData);
    // TODO: clint requires to send all the ids back
    // when a new one is created - this should be refactored
    const labels = db.getAll('labels', { projectId });

    // Adds default label
    const defaultLabel = db.get('labels', { _id: 'default' });
    labels.unshift(defaultLabel);
    // TODO: does the post labels need to return all the labels?
    // does the client side logic needs to be adjusted?
    return { ok: true, status: 'ok', labels };
  }
  // Update Label
  async updateLabel(projectId, labelId, labelData) {
    const updated = db.update('labels', { _id: labelId }, labelData);
    const labels = db.getAll('labels', { projectId });
    const defaultLabel = db.get('labels', { _id: 'default' });
    labels.unshift(defaultLabel);

    return { ok: true, status: 'ok', labels };
  }
  // Delete Label
  async deleteLabel(projectId, labelId) {
    db.delete('labels', { _id: labelId });
    const labels = db.getAll('labels', { projectId });
    // Adds default label
    const defaultLabel = db.get('labels', { _id: 'default' });
    labels.unshift(defaultLabel);

    return { status: 'ok', labels };
  }
  /**
   * PaperEdits
   */
  async getAllPaperEdits(projectId) {
    const data = {};
    data.paperedits = [];
    data.paperedits = db.getAll('paperedits', { projectId });

    if (data.paperedits) {
      // data.transcripts = [ data.transcripts ];
      data.paperedits = data.paperedits
        // Temporary workaround.
        .map(paperedit => {
          paperedit.id = paperedit._id;

          return paperedit;
        });
    }
    // return { ok: true, status: 'ok', paperedits: data.paperedits};
    return data.paperedits;
  }

  async getPaperEdit(projectId, id) {
    const paperEditId = id;
    const paperEdit = db.get('paperedits', { _id: paperEditId, projectId });
    if (!paperEdit) {
      const err = new Error('No paper edit found');
      err.statusCode = 404;

      return next(err);
    }

    return { ok: true, status: 'ok', programmeScript: paperEdit };
  }

  async createPaperEdit(projectId, data) {
    const newPapereditData = {
      projectId,
      title: data.title,
      description: data.description,
      elements: [],
      created: Date(),
    };

    const newPaperedit = db.create('paperedits', newPapereditData);
    newPaperedit.id = newPaperedit._id;

    return { ok: true, status: 'ok', paperedit: newPaperedit };
  }

  async updatePaperEdit(projectId, id, data) {
    const paperEditId = id;
    const paperEditData = {
      id: paperEditId,
      title: data.title,
      description: data.description,
    };

    if (data.elements) {
      paperEditData.elements = data.elements;
    }

    const updated = db.update('paperedits', { _id: paperEditId }, paperEditData);

    return { ok: true, status: 'ok', paperedit: paperEditData };
  }

  async deletePaperEdit(projectId, id) {
    const paperEditId = id;
    db.delete('paperedits', { _id: paperEditId });

    return { ok: true, status: 'ok' };
  }

  /**
   * Helper SDK function to avoid making multiple calls client side when in Annotated Transcript view
   * Transcript + Annotations for that transcript + Labels for the project
   */
  async getTranscriptLabelsAnnotations(projectId, transcriptId) {
    // GET Transcripts
    const transcriptResult = await this.getTranscript(projectId, transcriptId);
    // GET Labels for Project <-- or separate request in label component
    const labelsResults = await this.getAllLabels(projectId, transcriptId);
    // GET Annotation for Transcript
    const annotationsResult = await this.getAllAnnotations(projectId, transcriptId);

    // Combine results
    const results = {
      transcriptId: transcriptId,
      projectId: projectId,
      projectTitle: transcriptResult.projectTitle,
      transcriptTitle: transcriptResult.transcriptTitle,
      url: transcriptResult.url,
      labels: labelsResults.labels,
      transcript: transcriptResult.transcript,
      annotations: annotationsResult.annotations,
    };

    return results;
  }

  // Helper function to get program script & associated transcript
  // https://flaviocopes.com/javascript-async-await-array-map/
  async getProgrammeScriptAndTranscripts(projectId, papereditId) {
    // // get transcripts list, this contain id, title, description only
    const transcriptsResult = await this.getTranscripts(projectId);
    // use that list of ids to loop through and get json payload for each individual transcript
    // as separate request

    // TODO: also add annotations for each Transcripts
    const transcriptsJson = await Promise.all(
      transcriptsResult.transcripts.map(transcript => {
        // const annotations = this.getAllAnnotations(projectId, transcript.id);
        const transcriptTmp = this.getTranscript(projectId, transcript.id);
        // transcriptTmp.annotations = annotations;

        return transcriptTmp;
      })
    );

    const annotationsJson = await Promise.all(
      transcriptsResult.transcripts.map(async transcript => {
        const annotations = await this.getAllAnnotations(projectId, transcript.id);

        return annotations;
      })
    );

    // add annotations to transcript
    transcriptsJson.forEach(tr => {
      // get annotations for transcript
      const currentAnnotationsSet = annotationsJson.find(a => {
        if (a.annotations.length !== 0) {
          return a.annotations[0].transcriptId === tr.id;
        }
      });
      // if there are annotations for this transcript add them to it
      if (currentAnnotationsSet) {
        tr.annotations = currentAnnotationsSet.annotations;
        return;
      } else {
        tr.annotations = [];
      }
    });

    // getting program script for paperEdit
    const paperEditResult = await this.getPaperEdit(projectId, papereditId);
    // getting project info - eg to get tile and description
    const projectResult = await this.getProject(projectId);
    // Get labels
    const labelsResults = await this.getAllLabels(projectId);
    // package results
    const results = {
      programmeScript: paperEditResult.programmeScript,
      project: projectResult.project,
      // each transcript contains its annotations
      transcripts: transcriptsJson,
      labels: labelsResults.labels,
    };

    return results;
  }
  async exportVideo(data, fileName) {
    return new Promise((resolve, reject) => {
      // In electron prompt for file destination
      // default to desktop on first pass
      // https://www.electronjs.org/docs/api/dialog#dialogshowopendialogbrowserwindow-options
      dialog
        .showOpenDialog({
          title: 'Export Video',
          buttonLabel: 'Choose folder destination for the video',
          properties: ['openDirectory', 'createDirectory', { message: 'choose a folder to save the video preview' }],
          message: 'choose a folder to save the video preview',
        })
        .then(result => {
          console.log(result.canceled);
          if (result.canceled) {
            reject(result.canceled);
          } else {
            console.log(result.filePaths);
            // prompt for file name
            let userFileName = prompt('Choose a name for your video file', fileName);
            if (userFileName) {
              // Making sure the user's file name input has got the right extension
              if (path.parse(userFileName).ext !== '.mp4') {
                userFileName = `${userFileName}.mp4`;
              }
            } else {
              userFileName = fileName;
            }
            const ffmpegRemixData = {
              input: data,
              output: path.join(result.filePaths[0], userFileName),
              ffmpegPath: ffmpeg.path,
            };
            console.log(ffmpegRemixData);
            remix(ffmpegRemixData, null, null, function(err, result) {
              if (err) {
                reject(err);
              }
              alert('finished exporting');
              resolve(result);
            });
          }
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  async exportAudio(data, fileName, waveForm, waveFormMode, waveFormColor) {
    console.log('waveForm', waveForm);
    return new Promise((resolve, reject) => {
      // In electron prompt for file destination
      // default to desktop on first pass
      // https://www.electronjs.org/docs/api/dialog#dialogshowopendialogbrowserwindow-options
      dialog
        .showOpenDialog({
          title: 'Export Audio',
          buttonLabel: 'Choose folder destination for the audio',
          properties: ['openDirectory', 'createDirectory', { message: 'choose a folder to save the audio preview' }],
          message: 'choose a folder to save the audio preview',
        })
        .then(result => {
          if (result.canceled) {
            reject(result.canceled);
          } else {
            console.log(result.filePaths);
            // prompt for file name
            let userFileName = prompt('Choose a name for your audio file', fileName);
            if (userFileName) {
              // Making sure the user's file name input has got the right extension
              if (waveForm && path.parse(userFileName).ext !== '.mp4') {
                userFileName = `${userFileName}.mp4`;
              } else if (!waveForm && path.parse(userFileName).ext !== '.wav') {
                userFileName = `${userFileName}.wav`;
              }
            } else {
              userFileName = fileName;
            }
            const ffmpegRemixData = {
              // input: data.map((evt)=>{
              //   evt.start = parseFloat(parseFloat(evt.start).toFixed(2))
              //   evt.end = parseFloat(parseFloat(evt.end).toFixed(2))
              //   return evt
              // }),
              input: data,
              output: path.join(result.filePaths[0], userFileName),
              ffmpegPath: ffmpeg.path,
            };
            console.log(ffmpegRemixData);
            console.log('remix-electron exportAudio::', ffmpegRemixData, waveForm, waveFormMode, waveFormColor);
            remix(ffmpegRemixData, waveForm, waveFormMode, waveFormColor, function(err, result) {
              if (err) {
                reject(err);
              }
              alert('finished exporting');
              resolve(result);
            });
          }
        })
        .catch(err => {
          console.log(err);
        });
    });
  }
}

module.exports = ElectronWrapper;
