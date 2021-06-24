const mongoose = require('mongoose');

const db_config = require('../config/db_config.json');

const DB_URL = db_config.mongo_url || process.env.REMOTE_DB_URL || "mongo";
const DB_NAME = db_config.db_name || process.env.REMOTE_DB_NAME || "remote-indexedDB";
const DB_USER = db_config.user || process.env.REMOTE_DB_USER || "";
const DB_PASS = db_config.pass || process.env.REMOTE_DB_PASS || "";


const db_path = 'mongodb://' + DB_URL ;
mongoose.connect( db_path , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: DB_USER,
  pass: DB_PASS,
  dbName: DB_NAME,
},
  (err) => {
    if(err) {
      return console.log(err);
    }
});
mongoose.Promise = Promise;

const template_indexedDB = new mongoose.Schema({class_id: 'String', student_id: 'String', path_name: 'String', last_modified: 'String', value: {}});
const template_last_check = new mongoose.Schema({class_id: 'String', student_id: 'String', last_modified: 'String'});

exports.connection = mongoose.connection;
exports.collection_indexedDB = mongoose.model('files', template_indexedDB);
exports.collection_last_modified = mongoose.model('last_modified', template_last_check);