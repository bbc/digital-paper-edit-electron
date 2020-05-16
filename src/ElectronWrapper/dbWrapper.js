const path = require('path');
const fs = require('fs');
const diskdb = require('diskdb');
const { ipcRenderer } = require('electron');
const appPath = ipcRenderer.sendSync('synchronous-message-get-app-path', 'ping');
const dataPath = ipcRenderer.sendSync('synchronous-message-get-user-data-folder', 'ping');

const models = ['projects', 'transcripts', 'annotations', 'labels', 'paperedits'];
/* eslint-disable class-methods-use-this */
class DBWrapper {
  constructor() {
    // TODO: move to user data folder, so that is in the system but not inside the app
    // easier to persist data between upgrades of the app
    let pathToDiskDb;
    if (process.env.NODE_ENV === 'development') {
      pathToDiskDb = path.join(`${appPath}`, 'src', 'ElectronWrapper', 'db');
    } else {
      // if production - check if folder exists
      pathToDiskDb = path.join(dataPath, 'db');
      const isDbFolderPresent = fs.existsSync(pathToDiskDb);
      if (!isDbFolderPresent) {
        fs.mkdirSync(pathToDiskDb);
        // seed db with demo projects
        models.forEach(model => {
          fs.copyFileSync(path.join(appPath, 'src', 'ElectronWrapper', 'seed-db', `${model}.json`), path.join(dataPath, 'db', `${model}.json`));
        });
      }
    }
    this.diskdb = diskdb.connect(pathToDiskDb, models);
  }

  getAll(model, id) {
    if (id) {
      return this.diskdb[model].find({ ...id });
    }

    return this.diskdb[model].find();
  }

  get(model, id) {
    return this.diskdb[model].findOne({ ...id });
  }

  create(model, data) {
    return this.diskdb[model].save(data);
  }

  update(model, id, data) {
    return this.diskdb[model].update(
      { ...id },
      { ...data },
      {
        multi: false, // update multiple - default false
        upsert: false, // if object is not found, add it (update-insert) - default false
      }
    );
  }

  delete(model, id) {
    // remove only the first match
    return this.diskdb[model].remove({ ...id }, false);
  }
}
const db = new DBWrapper();
Object.freeze(db);
module.exports = db;
