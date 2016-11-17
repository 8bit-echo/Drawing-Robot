/* jshint esversion: 6 */
//https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm
//=============================//
//     Modules & Constants     //
//=============================//
const app = require('express')();
const socketServer = require('http').Server(app);
const io = require('socket.io')(socketServer);
socketServer.listen(3000, () => {
    console.log('Server up on localhost:3000');
    console.log('waiting for commands...');
});                                              //for server

const bodyParser = require('body-parser');                              // for POST
var urlEncodedParser = bodyParser.urlencoded({
    extended: false
});                                                                     // for POST

const fs = require('fs');                                               // for upload
const multer = require('multer');                                       // for upload

const upload = multer({
    dest: './uploads'
}).single('file');                                                      // for upload

const jimp = require('jimp');                                           //Javascript Image Processing
const sizeOf = require('image-size');                                   //slicing image

const imageTracer = require(__dirname + '/lib/imagetracer_v1.1.2');     // Tracer
const PNGReader = require(__dirname + '/lib/PNGReader.js');             // Tracer


const serialPort = require('serialport');                               //Serial Com
// const svg2wkt = require(__dirname + '/lib/svg2wkt.js');


// var converter = new svg2wkt();

var svgPath = __dirname + '/output/output0.svg';
console.log(svgPath);

// Gets raw SVG string data. TODO catch the raw data string to a variable for use later with svg2wkt.
var svgData;
fs.readFile(svgPath, 'utf-8', (err, data) => {
    if (err) throw err;
    // svgData = data;
    console.log(data);
});

console.log(svgData);




//=============================//
//    Server Initialization    //
//=============================//

// var server = app.listen(3000, function() {
//     console.log('Server is up: localhost:3000');
// });

//=============================//
//           Router            //
//=============================//


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/' + 'index.html');
});

app.get('/main.js', function(req, res) {
    res.sendFile(__dirname + '/' + 'main.js');
});
app.get('/lib/socket.io.js', function(req, res) {
    res.sendFile(__dirname + '/lib/' + 'socket.io.js');
});

app.get('/uploads/image.png', function(req, res) {
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

//Responsible for sending API data to the POST request.
function analyzeImage(imagePath) {
    var dimensions = sizeOf(imagePath);
    //return object to be parsed to JSON data.
    return {
        width: dimensions.width,
        height: dimensions.height
    };
}

//helper callback
function successCallback(operationName) {
    console.log(operationName + ' successful');
}

//helper callback
function errorCallback(err) {
    if (err) throw err;
}

//called inside processImage().
function sliceImage(imagePath, jimpImage, slices) {
    var slicesArray = [];
    var dimensions = sizeOf(imagePath);
    var sliceWidth = dimensions.width / slices;
    var sliceHeight = dimensions.height;
    var sliceXOrigin = 0;
    var sliceYOrigin = 0;

    for (var i = 0; i < slices; i++) {
        var newSlice = jimpImage.clone();
        newSlice.crop(sliceXOrigin, sliceYOrigin, sliceWidth, sliceHeight);
        sliceXOrigin += sliceWidth;
        slicesArray.push(newSlice);
    }
    return slicesArray;
}

//Responsible for reading the image, sectioning into pieces and saving to disk.
function processImage(imagePath) {
    jimp.read(imagePath, function(err, image) {
        if (err) throw err;

        //slice the image from the path into n slices.
        // TODO: Remove hardcoded number of slices.
        var slices = sliceImage(imagePath, image, 3);
        var wait = true;

        //write each slice to 'slices' folder.
        for (var i = 0; i < slices.length; i++) {
            slices[i].write(__dirname + '/slices/' + 'slice' + i + '.png', successCallback('Slice write'));
            if (i === 2) {
                wait = false;
            }
        }

        if (!wait) {
            setTimeout(
                function() {
                    for (var x = 0; x < slices.length; x++) {
                        trace(__dirname + '/slices/' + 'slice' + x + '.png', x);
                    }
                }, 3000);
        }
    });
}

//Image Tracer
function trace(slicePath, i) {
    fs.readFile(slicePath, function(err, bytes) {
        if (err) throw err;
        console.log('now tracing ' + slicePath);

        var reader = new PNGReader(bytes);
        reader.parse(function(err, png) {
            var imageData = {
                width: png.width,
                height: png.height,
                data: png.pixels
            };
            var options = {
                ltres: 1,
                numberofcolors: 2,
                pathomit: 8
            };
            var svgstring = imageTracer.imagedataToSVG(imageData, options);

            fs.writeFile(__dirname + '/output/' + 'output' + i + '.svg', svgstring, function(err) {
                if (err) throw err;
                console.log('writing svg to ' + '/output/' + 'output' + i + '.svg');
                successCallback('svg output');
            });
        });
    });
}

// TODO: Something is wrong with the timeline. Images get traced before image is fully processed.
var uploadedFile = __dirname + "/uploads/" + 'image' + '.png';
// processImage(uploadedFile);
// trace(__dirname + '/slices/'+ 'slice1.png');





//=============================//
//           Socket            //
//=============================//

io.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });
  socket.emit('server handshake', {action:'handshake from server'});
  socket.on('client handshake', function(data){
       console.log(data.action);
  });
  socket.on('click', function(data){console.log(data.action);});
});
