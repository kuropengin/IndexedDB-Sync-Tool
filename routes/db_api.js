var express = require('express');
var router = express.Router();

require('date-utils');

const mongodb = require('../tool/db_connection');
const remote_indexedDB = mongodb.collection_indexedDB;
const remote_last_modified = mongodb.collection_last_modified;

var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

/* GET home page. */
router.post('/update-check', function(req, res, next) {
    if(req.query.ealps_sid && req.query.ealps_cid){
        remote_indexedDB.find(
            { "class_id": req.query.ealps_cid, "student_id": req.query.ealps_sid}, 
            { "path_name": 1, "last_modified": 1, "_id": 0},
            function(err, docs){
                if(err){
                    res.status(400).send();
                }
                else{
                    remote_last_modified.find(
                        { "class_id": req.query.ealps_cid, "student_id": req.query.ealps_sid}, 
                        { "last_modified": 1, "_id": 0 },
                        function(err, _docs){
                            if(err){
                                res.status(400).send();
                            }
                            else{
                                if(_docs.length){
                                    res.status(200).send({
                                        "list":JSON.stringify(docs),
                                        "last_modified":_docs[0].last_modified
                                    });
                                }
                                else{
                                    res.status(200).send({
                                        "list":JSON.stringify(docs),
                                        "last_modified":false
                                    });
                                }
                            }
                        }
                    );
                }
            }
        );
      
    }
    else{
      res.status(403).send();
    }
});

router.post('/update', function(req, res, next) {
    if(req.query.ealps_sid && req.query.ealps_cid){

        var err_list = [];
        
        req.body.forEach(function(value) {
            remote_indexedDB.updateOne(
                {"class_id":req.query.ealps_cid , "student_id":req.query.ealps_sid , "path_name":value.path},
                {$set: {
                    "class_id":req.query.ealps_cid , 
                    "student_id":req.query.ealps_sid , 
                    "path_name":value.name,
                    "last_modified": value.last_modified, 
                    "value": value
                }},
                { upsert: true },
                function(err){
                    if (err){
                        err_list.push(value.name);
                    }
                }
            );
        });

        if(err_list.length){
            console.log(err_list);
            res.status(400).send();
        }
        else{
            remote_last_modified.updateOne(
                {"class_id":req.query.ealps_cid , "student_id":req.query.ealps_sid },
                {$set: {
                    "class_id":req.query.ealps_cid , 
                    "student_id":req.query.ealps_sid , 
                    "last_modified": new Date()
                }},
                { upsert: true },
                function(err){
                    if (err){
                        res.status(400).send();
                    }
                    else{
                        res.status(200).send();
                    }
                }
            );
        }
        
    }
    else{
        console.log(req.body);
        res.status(403).send();
    }
});

router.post('/push', function(req, res, next) {
    if(req.query.ealps_sid && req.query.ealps_cid){

        var err_list = [];
        req.body.forEach(function(value) {
            remote_indexedDB.updateOne(
                {"class_id":req.query.ealps_cid , "student_id":req.query.ealps_sid , "path_name":value.path},
                {$set: {
                    "class_id":req.query.ealps_cid , 
                    "student_id":req.query.ealps_sid , 
                    "path_name":value.path,
                    "last_modified": value.last_modified, 
                    "value": value
                }},
                { upsert: true },
                function(err){
                    if (err){
                        err_list.push(value.name);
                    }
                }
            );
        });

        if(err_list.length){
            console.log(err_list);
            res.status(400).send();
        }
        else{
            remote_last_modified.updateOne(
                {"class_id":req.query.ealps_cid , "student_id":req.query.ealps_sid },
                {$set: {
                    "class_id":req.query.ealps_cid , 
                    "student_id":req.query.ealps_sid , 
                    "last_modified": new Date()
                }},
                { upsert: true },
                function(err){
                    if (err){
                        res.status(400).send();
                    }
                    else{
                        res.status(200).send();
                    }
                }
            );
        }
        
    }
    else{
        console.log(req.body);
        res.status(403).send();
    }
});

router.post('/pull', function(req, res, next) {
    if(req.query.ealps_sid && req.query.ealps_cid){
        
        var or_query = req.body.map(function(value) {
            return {"path_name":value.path_name}
        });

        var query = {
            $and: [
                {class_id: req.query.ealps_cid, student_id: req.query.ealps_sid },
                {$or : or_query}
            ]
        };

        remote_indexedDB.find(query,
            {value: 1, _id: 0},
            function(err, docs){
                if(err){
                    res.status(400).send();
                }
                else{
                    var send_data = docs.map(function(doc) {
                        return doc.value;
                    });
                    res.status(200).send(send_data);
                }
            }
        );  
    }
    else{
        res.status(403).send();
    }
});

router.post('/all-pull', function(req, res, next) {
    if(req.query.ealps_sid && req.query.ealps_cid){
        
        var query = {
            $and: [
                {class_id: req.query.ealps_cid, student_id: req.query.ealps_sid }
            ]
        };

        remote_indexedDB.find(query,
            {value: 1, _id: 0},
            function(err, docs){
                if(err){
                    res.status(400).send();
                }
                else{
                    var send_data = docs.map(function(doc) {
                        return doc.value;
                    });
                    res.status(200).send(send_data);
                }
            }
        );  
    }
    else{
        res.status(403).send();
    }
});

router.post('/delete', function(req, res, next) {
    if(req.query.ealps_sid && req.query.ealps_cid){

        var err_list = [];

        var or_query = req.body.map(function(value) {
            return {"path_name":value.path_name}
        });

        if(or_query.length){
            var query = {
                $and: [
                    {class_id: req.query.ealps_cid, student_id: req.query.ealps_sid },
                    {$or : or_query}
                ]
            };
            
            remote_indexedDB.remove(query,
                function(err, docs){
                    if(err){
                        res.status(400).send();
                    }
                    else{
                        remote_last_modified.updateOne(
                            {"class_id":req.query.ealps_cid , "student_id":req.query.ealps_sid },
                            {$set: {
                                "class_id":req.query.ealps_cid , 
                                "student_id":req.query.ealps_sid , 
                                "last_modified": new Date()
                            }},
                            { upsert: true },
                            function(err){
                                if (err){
                                    res.status(400).send();
                                }
                                else{
                                    res.status(200).send();
                                }
                            }
                        );
                    }
                }
            );
     
        }
        else{
            res.status(400).send();
        }
   
    }
    else{
        console.log(req.body);
        res.status(403).send();
    }
});

  

module.exports = router;