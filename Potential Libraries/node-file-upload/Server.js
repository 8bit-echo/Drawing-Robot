var express = require("express");
var multer = require('multer');
var fs = require('fs');
var app = express();


//Upload Photo
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },
    filename: function(req, file, callback) {
        var date = new Date();
        var timestamp = (date.getMonth() + 1).toString();
        timestamp += date.getDate().toString();
        timestamp += date.getHours().toString();
        timestamp += date.getMinutes().toString();
        callback(null, file.fieldname + '-' + timestamp + '.png');
    }
});



//Upload / Open

var upload = multer({
    storage: storage
}).single('userPhoto');

//Router

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/api/photo', function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
    });
});

app.listen(3000, function() {
    console.log("Working on port 3000");
});
