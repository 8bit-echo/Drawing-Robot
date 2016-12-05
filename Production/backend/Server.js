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
const event = require('events'); // Control Flow
const j5 = require('johnny-five'); // robotics


//=============================//
//          Router             //
//=============================//

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

//=============================//
//    Global Scope Variables   //
//=============================//

//From socket.on('upload complete')
var uploadedFileName;
var uploadedFilePath;

//For analyzeImage()
var myTargetSize = {
    width: 315 / 25.4,
    height: 381 / 25.4
};

//From sliceImage()
var sliceDimensions = {};

var analysisResults = {};

//from client => [{x,y}, {x,y}]
var xyCoordinates;

// Server control flow manager
var scheduler = new event.EventEmitter();

// Robotics control flow manager
var robot = new event.EventEmitter();

var arduino = new j5.Board();





//=============================//
//   Global Scope Functions    //
//=============================//

function getFileExtension(fileName) {
    return fileName.substr(-3, fileName.length);
}

function analyzeImage(imagePath, targetSize, callback) {
    // var sourceSize = sizeOf(imagePath);
    var extension = getFileExtension(imagePath);
    var isSVG = (extension == 'svg') ? true : false;

    //convert inch => mm
    targetSize.width = targetSize.width * 25.4;
    targetSize.height = targetSize.height * 25.4;

    // calculate the number of horizontal and vertical slices needed
    var hSlices = Math.floor(targetSize.width / 315);
    var vSlices = Math.floor(targetSize.height / 381);

    //calculate the leftover slice sizes
    var leftoverHSliceWidth = targetSize.width - (hSlices * 315);
    var leftoverVSliceHeight = targetSize.height - (vSlices * 381);

    setTimeout(callback, 0);
    return {
        isSVG: isSVG,
        dimensions: {
            // source: {
            //     width: sourceSize.width,
            //     height: sourceSize.height
            // },
            target: {
                width: targetSize.width,
                height: targetSize.height,
            }
        },

        slices: {
            horiztonalSlices: hSlices,
            verticalSlices: vSlices,
        }
    };
}

//called inside processImage().
function sliceImage(imagePath, jimpImage, dimensionsObject) {
    var slices = dimensionsObject.slices.horiztonalSlices;
    slices = slices === 0 ? 1 : dimensionsObject.slices.horiztonalSlices;

    var slicesArray = [];

    var dimensions = sizeOf(imagePath);
    var sliceWidth = dimensions.width / 1; //dimensionsObject.slices.horiztonalSlices;
    var sliceHeight = dimensions.height / 1; //dimensionsObject.slices.verticalSlices;

    //send the slice dimensions to the client for XY conversion.
    sliceDimensions.width = sliceWidth;
    sliceDimensions.height = sliceHeight;

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

function processImage(imagePath, analysisResults, callback) {
    jimp.read(imagePath, function(err, image) {
        if (err) throw err;


        // //slice the image from the path into n slices.
        var slices = sliceImage(imagePath, image, analysisResults);

        // write each slice to 'slices' folder.
        for (var i = 0; i < slices.length; i++) {
            slices[i].write(__dirname + '/slices/' + 'slice' + i + '.png', successCallback('Slice write'));

            if (i == slices.length - 1) {
                slices[i].write(__dirname + '/slices/' + 'slice' + i + '.png', function() {
                    successCallback('Slice write');
                    setTimeout(function() {
                        callback();
                    }, 0);
                });

            }
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

//value mapper
function mapXY(val, low, high, min, max) {
    var newVal = (val - low) * (max - min) / (high - (low + 1) + min);
    //decimal point accuracy
    return newVal.toFixed(2);
}

//Robot directions
function prepareCoordinate(coordObj, i, cb) {
    var xDelta;
    var yDelta;
    var xDir;
    var yDir;

    //map each xy pair to motor steps
    // coordObj.x = mapXY(coordObj.x, 0, 315, 0, 14000);
    // coordObj.y = mapXY(coordObj.y, 0, 381, 0, 16900);

    if (i === 0) {
        //default delta from the first point is here.
        xDelta = coordObj.x;
        yDelta = coordObj.y;
        // console.log(xDelta);

    } else {
        //calculate the delta movement from each previous steps
        xDelta = calculateDeltas(coordObj.x, xyCoordinates[i - 1].x);
        yDelta = calculateDeltas(coordObj.y, xyCoordinates[i - 1].y);
    }

    // determine if the direction is positive or negative
    if (xDelta < 0) {
        xDir = 0;
        xDelta = xDelta * -1;

        coordObj.xDelta = xDelta;
        coordObj.xDir = xDir;
    } else {
        xDir = 1;

        coordObj.xDelta = xDelta;
        coordObj.xDir = xDir;
    }

    if (yDelta < 0) {
        yDir = 1;
        yDelta = yDelta * -1;

        coordObj.yDelta = yDelta;
        coordObj.yDir = yDir;
    } else {
        yDir = 0;

        coordObj.yDelta = yDelta;
        coordObj.yDir = yDir;
    }

    // setTimeout(function() {cb();}, 0);
    return cb(coordObj);
}

function calculateDeltas(current, prev) {
    var delta = current - prev;
    return delta;
}

//might not even need this one.
function mm(mm) {
    return mm * 44.44444444444;
}



//helper callback
function successCallback(operationName) {
    console.log(operationName + ' successful');
}

//helper callback
function errorCallback(err) {
    if (err) throw err;
}



//=============================//
//          Events             //
//=============================//





io.on('connection', function(socket) {
    console.log('Requesting Handshake from client...');

    var uploader = new siofu();
    uploader.dir = __dirname + '/uploads/';
    uploader.listen(socket);


    socket.emit('server handshake', {
        action: 'received handshake from server'
    });

    socket.on('client handshake', function(data) {
        console.log(data.action);
    });

    socket.on('upload complete', function(data) {
        console.log('file uploaded to server successfully');
        uploadedFileName = data.filename;
        var fileType = getFileExtension(uploadedFileName);

        if (fileType !== 'png') {
            if (fileType !== 'svg') {
                console.log('unsupported file type uploaded. Deleting...');
                fs.unlink(__dirname + '/uploads/' + uploadedFileName, successCallback('deletion'));
            }
        }
        console.log('uploaded file name is: ' + uploadedFileName);
    });

    socket.on('new target size', function(targetSizeObject) {

        uploadedFilePath = __dirname + "/uploads/" + uploadedFileName;

        analysisResults = analyzeImage(uploadedFilePath, targetSizeObject, function() {
            scheduler.emit('image analysis complete');
        });

    });

    scheduler.on('image analysis complete', function() {
        console.log('image analysis complete');

        if (analysisResults.isSVG) {
            //straight to svg.
            console.log('is svg');
            //assume single slice for now.
            scheduler.emit('svg complete', 'uploads');

            //send to front
        } else {
            //png processing.
            console.log('is png');
            //slicing
            processImage(uploadedFilePath, analysisResults, function() {
                scheduler.emit('images sliced', 1);
                socket.emit('slice dimensions', sliceDimensions);
            });
        }

    });

    scheduler.on('images sliced', function(numSlices) {
        console.log('images sliced');
        console.log(numSlices);
        //trace
        for (var i = 0; i < numSlices; i++) {
            trace(__dirname + '/slices/' + 'slice' + i + '.png', i);
            if (i == numSlices - 1) {
                setTimeout(function() {
                    scheduler.emit('svg complete', 'output');
                }, 2000);
            }
        }
        //send to front
    });

    scheduler.on('svg complete', function(folder) {
        console.log(folder);
        var fileName;
        if (folder == 'output') {
            fileName = 'output0.svg';
        } else {
            fileName = uploadedFileName;
        }
        var svgPath = __dirname + '/' + folder + '/' + fileName;
        var svgData;

        fs.readFile(svgPath, 'utf-8', (err, data) => {
            if (err) throw err;
            socket.emit('svgData', {
                svgData: data
            });
        });
    });

    socket.on('coordinates', function(coordinates) {
        xyCoordinates = coordinates;
        setTimeout(function() {
            scheduler.emit('coordinates ready for bot');
        }, 0);
    });

    scheduler.on('coordinates ready for bot', function() {
        console.log('coordinates ready for bot');
        socket.emit('server ready for bot');
    });

    socket.on('go', function() {
        console.log('Go Button clicked');
        scheduler.emit('go');
    });

    scheduler.on('go', function() {
        console.log('beep borp bleep');
        robot.emit('begin');
    });



    //=============================//
    //       Robotic Events        //
    //=============================//

    arduino.on('ready', function() {
        console.log('Arduino online.');

        var xStepper = new j5.Stepper({
            type: j5.Stepper.TYPE.DRIVER,
            stepsPerRev: 200,
            pins: {
                step: 10,
                dir: 11
            }
        });

        var yStepper = new j5.Stepper({
            type: j5.Stepper.TYPE.DRIVER,
            stepsPerRev: 200,
            pins: {
                step: 9,
                dir: 3
            }
        });

        // xStepper.direction(0).step(mm(50), function() {
        // console.log('done moving');


        robot.on('done', function() {
            console.log('finished');
        });

        robot.on('next', function(i) {
            console.log('received next', i);
            if (i < xyCoordinates.length) {
                prepareCoordinate(xyCoordinates[i], i, function(coord) {
                    console.log(coord);
                    move(coord, function() {
                        robot.emit('next', i + 1);
                    });
                });
            } else {
                robot.emit('done');
            }
        });

        robot.on('begin', function() {
            console.log('received begin');
            prepareCoordinate(xyCoordinates[0], 0, function(coord) {
                console.log(coord);
                move(coord, function() {
                    robot.emit('next', 1);
                });
            });
        });

        function move(coord, done) {
            var xDone = false;
            var yDone = false;
            xStepper.direction(coord.xDir).step(mm(coord.xDelta), function() {
                console.log('x done');
                xDone = true;
                if (xDone && yDone) {
                    console.log('both done');
                    if (typeof done === 'function') {
                        done();
                    } else {
                        console.log(typeof done);
                    }
                }
            });

            yStepper.direction(coord.yDir).step(mm(coord.yDelta), function() {
                console.log('y done');
                yDone = true;
                if (xDone && yDone) {
                    console.log('both done');
                    if (typeof done === 'function') {
                        done();
                    } else {
                        console.log(typeof done);
                    }
                }
            });
        }
    });
});

//
