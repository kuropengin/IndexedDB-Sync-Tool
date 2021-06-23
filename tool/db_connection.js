const mongoose = require('mongoose');

const db_config = require('../config/db_config.json');


const db_path = 'mongodb://' + db_config.mongo_url ;
mongoose.connect( db_path , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: db_config.user,
  pass: db_config.pass,
  dbName: db_config.db_name,
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