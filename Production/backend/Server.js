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

const sizeOf = require('image-size'); //slicing image

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
    //set the path for the upload
    // TODO: Should probably timestamp this altough it is okay for file to be overwritten every timer right now.
    // TODO: POST as AJAX request and return JSON for front-end processing.
    var file = __dirname + "/uploads/" + 'image' + '.png';

    //read the file submitted
    fs.readFile(req.file.path, function(err, data) {
        //save the file to the path
        fs.writeFile(file, data, function(err) {
            if (err) {
                console.log(err);
            } else {
                //return JSON data to browser.
                // IMPORTANT: THIS WILL BE THE API ENTRY POINT FOR REACT!
                var dimensions = analyzeImage(file);
                response = {
                    message: 'File uploaded successfully',
                    filename: 'image.png',
                    size: dimensions
                };
            }
            //print to console for debugging.
            console.log(response);
            res.end(JSON.stringify(response));
        });
    });
});


//=============================//
//       Image Processing      //
//=============================//

 function analyzeImage(imageName){
      var dimensions = sizeOf(imageName);
      //return object to be parsed to JSON data.
      return {
          width: dimensions.width,
          height: dimensions.height
      };
 }


//=============================//
//         Server Init         //
//=============================//



var server = app.listen(3000, function() {
    console.log('Server is up: localhost:3000');
});
