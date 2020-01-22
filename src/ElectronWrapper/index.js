/* eslint-disable class-methods-use-this */
const fs = require('fs');
const path = require('path');
const { app } = require('electron').remote;
const dataPath = app.getPath('userData');

const db = require('./dbWrapper.js');
const mediaDir = path.join(dataPath, 'media');

const transcribe = require('./lib/transcriber');
const convertToVideo = require('./lib/convert-to-video');
const { readMetadataForEDL } = require('./lib/av-metadata-reader/index.js');
class ElectronWrapper {
  /**
   * Projects
   */
  async getAllProjects() {
    // ipcRenderer.send('asynchronous-message', 'ping')
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

    return { status: 'ok', project };
  }

  async updateProject(id, data) {
    const projectId = id;
    const newProject = {
      id: projectId,
      title: data.title,
      description: data.description
    };

    db.update('projects', { _id: projectId }, newProject);

    return { status: 'ok', project: newProject };
  }

  async deleteProject(id) {
    db.delete('projects', { _id: id });

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
      status: 'in-progress'
    };

    const newTranscript = db.create('transcripts', newTranscriptData);
    const transcriptId = newTranscript._id;
    newTranscript.id = transcriptId;

    // Start transcript
    // const transcriptResult = await transcribe(data.path);
    transcribe(data.path)
      .then(res => {
        console.log('transcribe', res);
        newTranscriptData.status = 'done';
        newTranscriptData.transcript = res.transcript;
        newTranscriptData.audioUrl = res.url;
        newTranscriptData.sttEngine = res.sttEngine;
        // edge case if video has already been processed then don't override the url
        console.log('newTranscriptData.url', newTranscriptData.url);
        if (!newTranscriptData.url) {
          console.log('if newTranscriptData.url', newTranscriptData.url);
          newTranscriptData.url = res.url;
        }
        newTranscriptData.clipName = res.clipName;
        db.update(
          'transcripts',
          { _id: transcriptId, projectId },
          newTranscriptData
        );
      })
      .catch(err => {
        // TODO: audioUrl is not saved, and so cannot be deleted when deleting transcript
        console.error('Transcription error', err);
        newTranscriptData.status = 'error';
        newTranscriptData.errorMessage = `There was an error transcribing this file: ${ err.message }.`;
        db.update(
          'transcripts',
          { _id: transcriptId, projectId },
          newTranscriptData
        );
      });

    // TODO: UUIDs for converted media?
    convertToVideo({
      src: data.path,
      outputFullPathName: path.join(
        mediaDir,
        path.parse(data.path).name + '.mp4'
      )
    })
      .then(videoPreviewPath => {
        console.log('videoPreviewPath', videoPreviewPath);
        newTranscriptData.videoUrl = videoPreviewPath;
        newTranscriptData.url = videoPreviewPath;
        db.update(
          'transcripts',
          { _id: transcriptId, projectId },
          newTranscriptData
        );
      })
      .catch(err => {
        console.error('Error converting to video', err);
      });

    readMetadataForEDL({
      file: data.path
    })
      .then(metadataResponse => {
        newTranscriptData.metadata = metadataResponse;
        db.update(
          'transcripts',
          { _id: transcriptId, projectId },
          newTranscriptData
        );
      })
      .catch(err => {
        console.error('Error reading metadata', err);
      });

    return {
      status: 'ok',
      transcript: newTranscript,
      transcriptId: transcriptId
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
    const updatedTranscriptData = {
      id: transcriptId,
      projectId,
      title: data.title,
      description: data.description
    };
    // TODO: this part is for when correcting transcript with @bbc/react-transcript-editor as it's not ready
    if (data.words) {
      updatedTranscriptData.transcript = {};
      updatedTranscriptData.transcript.words = data.words;
      if (data.paragraphs) {
        updatedTranscriptData.transcript.paragraphs = data.paragraphs;
      }
    }
    const updated = db.update(
      'transcripts',
      { _id: transcriptId, projectId },
      updatedTranscriptData
    );
    updatedTranscriptData.id = transcriptId;

    return { ok: true, transcript: updatedTranscriptData };
  }

  async deleteTranscript(projectId, transcriptId) {
    // Deleting associated media
    const transcript = db.get('transcripts', { _id: transcriptId, projectId });
    if (transcript.videoUrl) {
      fs.unlink(transcript.videoUrl, function(err) {
        if (err)
          return console.error(
            'Error deleting video file for this transcript',
            err
          );
        console.log('video file deleted successfully');
      });
    }

    if (transcript.audioUrl) {
      fs.unlink(transcript.audioUrl, function(err) {
        if (err)
          return console.error(
            'Error deleting audio file for this transcript',
            err
          );
        console.log('audio file deleted successfully');
      });
    }

    // deleting transcript
    db.delete('transcripts', { _id: transcriptId });

    return {
      ok: true,
      status: 'ok',
      message: `DELETE: transcript ${ transcriptId }`
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
      transcriptId
    }); //

    return { annotation };
  }

  async createAnnotation(projectId, transcriptId, data) {
    const newAnnotationData = {
      projectId,
      transcriptId,
      ...data
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
      ...data
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
      projectId
    };
    delete newLabelData.id;
    const newLabel = db.create('labels', newLabelData);
    const labelId = newLabel._id;
    newLabel.id = labelId;
    // temporary workaround to update the id
    const updated = db.update(
      'labels',
      { _id: labelId, projectId },
      newLabelData
    );
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
      created: Date()
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
      description: data.description
    };

    if (data.elements) {
      paperEditData.elements = data.elements;
    }

    const updated = db.update(
      'paperedits',
      { _id: paperEditId, projectId },
      paperEditData
    );

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
  async get_TranscriptLabelsAnnotations(projectId, transcriptId) {
    // GET Transcripts
    const transcriptResult = await this.getTranscript(projectId, transcriptId);
    // GET Labels for Project <-- or separate request in label component
    const labelsResults = await this.getAllLabels(projectId, transcriptId);
    // GET Annotation for Transcript
    const annotationsResult = await this.getAllAnnotations(
      projectId,
      transcriptId
    );

    // Combine results
    const results = {
      transcriptId: transcriptId,
      projectId: projectId,
      projectTitle: transcriptResult.projectTitle,
      transcriptTitle: transcriptResult.transcriptTitle,
      url: transcriptResult.url,
      labels: labelsResults.labels,
      transcript: transcriptResult.transcript,
      annotations: annotationsResult.annotations
    };

    return results;
  }

  // Helper function to get program script & associated transcript
  // https://flaviocopes.com/javascript-async-await-array-map/
  async get_ProgrammeScriptAndTranscripts(projectId, papereditId) {
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
      transcriptsResult.transcripts.map(transcript => {
        const annotations = this.getAllAnnotations(projectId, transcript.id);

        return annotations;
      })
    );

    // add annotations to transcript
    transcriptsJson.forEach(tr => {
      // get annotations for transcript
      const currentAnnotationsSet = annotationsJson.find(a => {
        return a.transcriptId === tr.id;
      });
      // if there are annotations for this transcript add them to it
      if (currentAnnotationsSet) {
        tr.annotations = currentAnnotationsSet.annotations;

        return;
      } else {
        tr.annotations = [];
      }
    });
    console.log('ApiWrapper transcriptsJson', transcriptsJson);

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
      labels: labelsResults.labels
    };
    console.log('ApiWrapper - results', results);

    return results;
  }
}

module.exports = ElectronWrapper;
