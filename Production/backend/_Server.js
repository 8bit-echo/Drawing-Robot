 /* jshint esversion: 6 */

//=============================//
//     Modules & Constants     //
//=============================//

const siofu = require('socketio-file-upload');
const app = require('express')().use(siofu.router);
const socketServer = require('http').Server(app);
const io = require('socket.io')(socketServer);
socketServer.listen(3000, () => {
    console.log('Server up on localhost:3000');
    console.log('waiting for commands...');
}); //for server
const fs = require('fs'); // for upload
const jimp = require('jimp'); //Javascript Image Processing
const sizeOf = require('image-size'); //slicing image
const imageTracer = require(__dirname + '/lib/imagetracer_v1.1.2'); // Tracer
const PNGReader = require(__dirname + '/lib/PNGReader.js'); // Tracer
const serialPort = require('serialport'); //Serial Com
const series = require('async-series'); // chaining of events


//=============================//
//           Router            //
//=============================//

//TEST FILES
// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/' + 'index.html');
// });
// app.get('/main.js', function(req, res) {
//     res.sendFile(__dirname + '/' + 'main.js');
// });
// app.get('/lib/socket.io.js', function(req, res) {
//     res.sendFile(__dirname + '/lib/' + 'socket.io.js');
// });
// app.get('/lib/client.min.js', function(req, res) {
//     res.sendFile(__dirname + '/lib/' + 'client.min.js');
// });
// app.get('/uploads/image.png', function(req, res) {
//     res.sendFile(__dirname + '/uploads/image.png');
// });

//PRODUCTION FILES
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public_html/' + 'index.html');
});
app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + '/public_html/' + 'style.css');
});
app.get('/main.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/' + 'main.js');
});
app.get('/lib/jquery.min.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/lib/' + 'jquery.min.js');
});
app.get('/lib/client.min.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/lib/' + 'client.min.js');
});
app.get('/lib/lodash.min.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/lib/' + 'lodash.min.js');
});
app.get('/lib/socket.io.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/lib/' + 'socket.io.js');
});
app.get('/lib/svg-to-wkt.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/lib/' + 'svg-to-wkt.js');
});
app.get('/lib/svg2xy.js', function(req, res) {
    res.sendFile(__dirname + '/public_html/lib/' + 'svg2xy.js');
});
app.get('/uploads/image.png', function(req, res) {
    res.sendFile(__dirname + '/uploads/image.png');
});


//=============================//
//       Setup & Init          //
//=============================//



//Global Variables from / for Client
var uploadedFileName;
var myTargetSize = {
    width: 315 / 25.4,
    height: 381 / 25.4
};




//=============================//
//       Image Processing      //
//=============================//

io.on('connection', function(socket) {

    function getFileExtension(fileName){
        return fileName.substr(-3, fileName.length);
    }

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
        var slices = dimensionsObject.slices.horiztonalSlices;

        var slicesArray = [];
        // jimpImage = jimpImage.resize(dimensionsObject.dimensions.target.width,jimp.AUTO);
        // jimpImage.write(__dirname + '/slices/fullsize.png');

        var dimensions = sizeOf(imagePath);
        var sliceWidth = dimensions.width / dimensionsObject.slices.horiztonalSlices;
        console.log(sliceWidth);
        var sliceHeight = dimensions.height / dimensionsObject.slices.verticalSlices;

        //send the slice dimensions to the client for XY conversion.
        socket.emit('slice dimensions', {
            width: sliceWidth,
            height: sliceHeight
        });
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
                }, true
            );

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
        // var uploadedFile = __dirname + "/uploads/" + 'doublewide.png';
        //var uploadedFile = __dirname + "/uploads/" + uploadedFileName;

    //Analyze the Image
        // var analyzedImage = analyzeImage(uploadedFile, myTargetSize);
        // console.log(analyzedImage);

    //Process & Slice the image.
        // processImage(uploadedFile, analyzedImage);

    // Make into SVG
        // trace(__dirname + '/slices/'+ 'slice0.png');

    //Send the SVG Data to Front End.
        //this should be in a socket when the server receives the slice size.
        // console.log('sendSVG data called');
        // var svgPath = __dirname + '/output/output0.svg';
        // var svgData;
        // fs.readFile(svgPath, 'utf-8', (err, data) => {
        //     if (err) throw err;
        //     socket.emit('svgData', {
        //         svgData: data
        //     });
        // });


        // console.log('sendSVG data called');
        // var svgPath = __dirname + '/uploads/'+ 'circle.svg';
        // console.log(svgPath);
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
    //         Socket Events       //
    //=============================//

    console.log('reqesting handshake from client...');

    socket.emit('server handshake', {
        action: 'received handshake from server'
    });

    socket.on('client handshake', function(data) {
        console.log(data.action);
    });

    socket.on('New target size', function(data) {
        myTargetSize = data;
        console.log(myTargetSize);
    });

    var uploader = new siofu();
    uploader.dir = __dirname + '/uploads/';
    uploader.listen(socket);

    socket.on('upload complete', function(data) {
        console.log('file uploaded to server successfully');
        uploadedFileName = data.filename;
        var fileType = getFileExtension(uploadedFileName);

        if (fileType !== 'png' || fileType !== 'svg') {
            console.log('unsupported file type uploaded. Deleting...');
            fs.unlink(__dirname + '/uploads/'+ uploadedFileName, successCallback('deletion'));
        }
        console.log('uploaded file name is: ' + uploadedFileName);
    });

    socket.on('coordinates', function(data) {
        console.log('receiving coordinate data from client');

    });
});



// TODO: Send slice dimensions back to the front-end.

// TODO: move events into their respective Socket sections for timing?
