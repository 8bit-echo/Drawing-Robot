/* jshint esversion: 6 */

//=============================//
//     Modules & Constants     //
//=============================//

const app = require('express')();
const socketServer = require('http').Server(app);
const io = require('socket.io')(socketServer);
socketServer.listen(3000, () => {
    console.log('Server up on localhost:3000');
    console.log('waiting for commands...');
}); //for server

const bodyParser = require('body-parser'); // for POST
var urlEncodedParser = bodyParser.urlencoded({
    extended: false
}); // for POST

const fs = require('fs'); // for upload
const multer = require('multer'); // for upload

const upload = multer({
    dest: './uploads'
}).single('file'); // for upload

const jimp = require('jimp'); //Javascript Image Processing
const sizeOf = require('image-size'); //slicing image

const imageTracer = require(__dirname + '/lib/imagetracer_v1.1.2'); // Tracer
const PNGReader = require(__dirname + '/lib/PNGReader.js'); // Tracer

const serialPort = require('serialport'); //Serial Com

const series = require('async-series'); // chaining of events 11/22


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
    // TODO: POST as AJAX request and return JSON for front-end processing.
    var file = __dirname + "/uploads/" + 'image' + '.png';

    //read the file submitted
    fs.readFile(req.file.path, function(err, data) {
        //save the file to the path
        fs.writeFile(file, data, function(err) {
            if (err) throw err;

            //     console.log(err);
            // } else {
                var dimensions = analyzeImage(file);
                response = {
                    message: 'File uploaded successfully',
                    filename: 'image.png',
                    size: dimensions
                };
            // }
            //print to console for debugging.
            console.log(response);
            res.end(JSON.stringify(response));
        });
    });
});


//=============================//
//       Image Processing      //
//=============================//
io.on('connection', function(socket) {

    function analyzeImage(imagePath, targetSize) {
        var sourceSize = sizeOf(imagePath);

        //convert inch => mm
        targetSize.width = targetSize.width * 25.4;
        targetSize.height = targetSize.height * 25.4;

        // calculate the number of horizontal and vertical slices needed
        var hSlices = Math.floor(targetSize.width / 315);
        var vSlices = Math.floor(targetSize.height / 381);
        var totalSlices = hSlices == 1 && vSlices == 1 ? 1 : hSlices + vSlices;

        //calculate the leftover slice sizes
        var leftoverHSliceWidth = targetSize.width - (hSlices * 315);
        var leftoverVSliceHeight = targetSize.height - (vSlices * 381);

        return {
            dimensions: {
                source: {
                    width: sourceSize.width,
                    height: sourceSize.height
                },
                target: {
                    width: targetSize.width,
                    height: targetSize.height,
                    units: 'mm'
                }
            },

            slices: {
                horiztonalSlices: hSlices,
                verticalSlices: vSlices,
                totalSlices: totalSlices
            }
        };
    }

    //called inside processImage().
    function sliceImage(imagePath, jimpImage, dimensionsObject) {
        var slices = dimensionsObject.slices.totalSlices;

        var slicesArray = [];
        // jimpImage = jimpImage.resize(dimensionsObject.dimensions.target.width,jimp.AUTO);
        // jimpImage.write(__dirname + '/slices/fullsize.png');

        var dimensions = sizeOf(imagePath);
        var sliceWidth = dimensions.width / dimensionsObject.slices.horiztonalSlices;
        console.log(sliceWidth);
        var sliceHeight = dimensions.height / dimensionsObject.slices.verticalSlices;
        var sliceXOrigin = 0;
        var sliceYOrigin = 0;


        for (var i = 0; i < slices; i++) {
            var newSlice = jimpImage.clone();
            newSlice.crop(sliceXOrigin, sliceYOrigin, sliceWidth, sliceHeight);
            sliceXOrigin += sliceWidth;
            // if (sliceXOrigin > dimensions.width) {
            //     sliceXOrigin = 0;
            //     sliceYOrigin += dimensions.height - 381;
            // }
            slicesArray.push(newSlice);
        }
        return slicesArray;
    }

    //Responsible for reading the image, sectioning into pieces and saving to disk.
    function processImage(imagePath, analysisResults) {
        jimp.read(imagePath, function(err, image) {
            if (err) throw err;

            // //slice the image from the path into n slices.
            var slices = sliceImage(imagePath, image, analysisResults);

            series(
                [
                    function(done) {
                        console.log('task 1');
                        // write each slice to 'slices' folder.
                        for (var i = 0; i < slices.length; i++) {
                            slices[i].write(__dirname + '/slices/' + 'slice' + i + '.png', successCallback('Slice write'));
                        }
                        console.log('task 1 complete');
                        setTimeout(function() {
                            done();
                        }, 2000);
                    },

                    function(done) {
                        console.log('task 2');
                        setTimeout(function() {
                            for (var x = 0; x < slices.length; x++) {
                                trace(__dirname + '/slices/' + 'slice' + x + '.png', x);
                            }
                        }, 2000);
                        setTimeout(function() {
                            done();
                        }, 2000);
                        console.log('task 2 complete');
                    }
                ],
                function(err) {
                    console.log(err);
                }, true);

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



    //=============================//
    //     Manual Event Space      //
    //=============================//

    //Choose an uploadedFile:
        // var uploadedFile = __dirname + "/uploads/" + 'image' + '.png';
        // var uploadedFile = __dirname + "/uploads/" + 'rotated-scaled' + '.png';

    //Pretend like this is from the front-end.
    // var mySize = {
    //     height: 381 / 25.4,
    //     width: 315 / 25.4
    // };

    //Analyze the Image
        // var analyzedImage = analyzeImage(uploadedFile, mySize);
        // console.log(analyzedImage);

    //Process & Slice the image.
        // processImage(uploadedFile, analyzedImage);

    // Make into SVG
        // trace(__dirname + '/slices/'+ 'slice0.png');

    //Send the SVG Data to Front End.
        // var svgPath = __dirname + '/output/output0.svg';
        // var svgData;
        // fs.readFile(svgPath, 'utf-8', (err, data) => {
        //     if (err) throw err;
        //     socket.emit('svgData', {
        //         svgData: data
        //     });
        // });



    //helper callback
    function successCallback(operationName) {
        console.log(operationName + ' successful');
    }

    //helper callback
    function errorCallback(err) {
        if (err) throw err;
    }

    //=============================//
    //           Socket            //
    //=============================//

    console.log('reqesting handshake from client...');
    socket.emit('server handshake', {
        action: 'received handshake from server'
    });
    socket.on('client handshake', function(data) {
        console.log(data.action);
    });
    socket.on('click', function(data) {
        console.log(data.action);
    });
});
