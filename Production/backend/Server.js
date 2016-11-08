/* jshint esversion: 6 */
//https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm

const express = require('express');
var app = express();

const bodyParser = require('body-parser'); // for POST
var urlEncodedParser = bodyParser.urlencoded({
    extended: false
}); //for POST
const fs = require('fs'); //for upload
const multer = require('multer'); // for upload


app.use(express.static('public')); //for server
const upload = multer({
    dest: './uploads'
}).single('file'); // for upload

//=============================//
//           Router            //
//=============================//


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/' + 'index.html');
});

app.get('/main.js', function(req, res) {
    res.sendFile(__dirname + '/' + 'main.js');
});

app.get('/uploads/image.png', function(req,res){
     res.sendFile(__dirname + '/uploads/image.png');
});



//=============================//
//         File Upload         //
//=============================//




app.post('/file_upload', upload, function(req, res) {
    console.log(req.file.filename);
    console.log(req.file.path);
    console.log(req.file.mimetype);
    var file = __dirname + "/uploads/" + 'image' + '.png';

    fs.readFile(req.file.path, function(err, data) {
        fs.writeFile(file, data, function(err) {
            if (err) {
                console.log(err);
            } else {
                response = {
                    message: 'File uploaded successfully',
                    filename: 'image.png'
                };
            }
            console.log(response);
            res.end(JSON.stringify(response));
        });
    });
});


//=============================//
//         Server Init         //
//=============================//



var server = app.listen(3000, function() {
    console.log('Server is up: localhost:3000');
});
