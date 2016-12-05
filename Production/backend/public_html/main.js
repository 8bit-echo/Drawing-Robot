$(document).ready(function() {
    console.log('Client is Ready');

    //=============================//
    //         UI Elements         //
    //=============================//

    var c = document.getElementById('artContainer');
    console.log(c);
    var canvas = c.getContext('2d');
    canvas.moveTo(0, 0);
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    canvas.strokeStyle = '#449AC6';
    canvas.strokeRect(5, 5, 100, 100);

    $('#targetSize-W-up').click(function() {
        targetSizeW++;
        $('#targetSize-W').val(targetSizeW);
        getDimensionsForServer();
        adjustCanvasSize();
        drawRobotFrame();
    });

    $('#targetSize-W-down').click(function() {
        targetSizeW--;
        $('#targetSize-W').val(targetSizeW);
        getDimensionsForServer();
        adjustCanvasSize();
        drawRobotFrame();
    });

    $('#targetSize-H-up').click(function() {
        targetSizeH++;
        $('#targetSize-H').val(targetSizeH);
        getDimensionsForServer();
        adjustCanvasSize();
        drawRobotFrame();
    });

    $('#targetSize-H-down').click(function() {
        targetSizeH--;
        $('#targetSize-H').val(targetSizeH);
        getDimensionsForServer();
        adjustCanvasSize();
        drawRobotFrame();
    });



    //

    $('#manualXY-W-up').click(function() {
        manualXYW++;
        $('#manualXY-W').val(manualXYW);
    });

    $('#manualXY-W-down').click(function() {
        manualXYW--;
        $('#manualXY-W').val(manualXYW);
    });


    $('#manualXY-H-up').click(function() {
        manualXYH++;
        $('#manualXY-H').val(manualXYH);
    });

    $('#manualXY-H-down').click(function() {
        manualXYH--;
        $('#manualXY-H').val(manualXYH);
    });


    $('#exit').click(function(){
        jQuery.event.trigger({ type : 'keypress', which : character.charCodeAt(122) });
    });

    //=============================//
    //   Global Scope Functions    //
    //=============================//

    // Create an object that sends the target size (in) to the server.
    function getDimensionsForServer() {
        var targetWidthInches = $('#targetSize-W').val();
        var targetHeightInches = $('#targetSize-H').val();

        targetSizeObject.width = targetWidthInches;
        targetSizeObject.height = targetHeightInches;

        socket.emit('New target size', targetSizeObject);
    }

    // Adjust the canvas on the screen
    function adjustCanvasSize() {
        var targetWidthInches = $('#targetSize-W').val();
        var targetHeightInches = $('#targetSize-H').val();
        var largerSide = targetWidthInches > targetHeightInches ? 'width' : 'height';

        if (largerSide == 'width') {
            canvasWidth = 550;
            canvasHeight = 550 * (targetHeightInches / targetWidthInches);
            if (canvasHeight > 370) {
                canvasHeight = 370;
                canvasWidth = canvasWidth = 370 * (targetWidthInches / targetHeightInches);
            }
            c.width = canvasWidth;
            c.height = canvasHeight;

        } else {
            canvasWidth = 370 * (targetWidthInches / targetHeightInches);
            canvasHeight = 370;
            c.width = canvasWidth;
            c.height = canvasHeight;

        }
    }

    // TODO: Not drawing rectangles correctly.
    function drawRobotFrame() {
        //Get the Value from the UI
        var targetWidthInches = $('#targetSize-W').val();
        var targetHeightInches = $('#targetSize-H').val();

        // Convert to Millimeters
        var targetWidthMM = parseInt(targetWidthInches) * 25.4;
        var targetHeightMM = parseInt(targetHeightInches) * 25.4;
        var frameDimensions = {
            width: 315,
            height: 381
        };

        // get the shorter dimension of the two
        var shorterSide = targetWidthMM > targetHeightMM ? 'width' : 'height';

        var percentage;
        if (shorterSide == 'height') {
            percentage = 381 / targetHeightMM;
            frameDimensions.height = frameDimensions.height * percentage;
            frameDimensions.width = frameDimensions.height * (315 / 381);

        } else {
            percentage = 315 / targetWidthMM;
            frameDimensions.width = frameDimensions.width * percentage;
            frameDimensions.height = frameDimensions.width * (381 / 315);
        }
        canvas.strokeStyle = '#449AC6';
        canvas.strokeRect(0, 0, frameDimensions.width, frameDimensions.height);

    }

    function getFileExtension(fileName) {
        return fileName.substr(-3, fileName.length);
    }

    var targetSizeW = 12;
    var targetSizeH = 15;
    var manualXYW = 0;
    var manualXYH = 0;

    function initializeUI() {
        $('#targetSize-W').val(targetSizeW);
        $('#targetSize-H').val(targetSizeH);
        $('#manualXY-W').val(manualXYW);
        $('#manualXY-H').val(manualXYH);
        $('#go').prop('disabled', true);
        adjustCanvasSize();
        drawRobotFrame();

    }
    initializeUI();


    //=============================//
    //    Global Scope Variables   //
    //=============================//


    // server expects inches
    var targetSizeObject = {
        width: 0,
        height: 0
    };

    // Default pixel dimensions for 315mm x 381mm svg
    var sliceDimensionsObject = {width:892.9 , height:1080 };

    var socket = io.connect();
    var uploader = new SocketIOFileUpload(socket);


    //=============================//
    //           Events            //
    //=============================//

    uploader.listenOnInput(document.getElementById('file'));

    //waits for the server to start the process, then sends confirmation back.
    socket.on('server handshake', function(data) {
        console.log(data.action);
        console.log('returning handshake to server.');
        socket.emit('client handshake', {
            action: 'handshake returned from client'
        });







    });

    // when file upload is complete, send the file name
    uploader.addEventListener('complete', function(event) {
        var fileType = getFileExtension(event.file.name);
        if (fileType !== 'png') {
            if (fileType !== 'svg') {
                alert('Please upload a supported file type: "PNG, SVG"');
            }
        }
        console.log('upload to server complete');

        socket.emit('upload complete', {
            filename: event.file.name
        });
    });

    $('#targetSizeConfirm').click(function() {
        targetSizeObject.width = $('#targetSize-W').val();
        targetSizeObject.height = $('#targetSize-H').val();
        socket.emit('new target size', targetSizeObject);
    });

    socket.on('slice dimensions', function(sliceDimensions) {
        //do something with slice dimensions.
        console.log('received slice dimensions');
        console.log(sliceDimensions);

        sliceDimensionsObject = sliceDimensions;
    });

    socket.on('svgData', function(data) {
        console.log('receiving svg Data...');
        var svgData = data.svgData;

        var coordinates = svg2xy(svgData, sliceDimensionsObject);
        // console.log(coordinates);
        //Send the coordinates to the server.
        setTimeout(function() {
            socket.emit('coordinates', coordinates);
            $('#go').prop('disabled', false);
        }, 2000);
    });

    socket.on('server ready for bot', function() {
        $('#go').prop('disabled', false);
    });

    //GO
    $('#go').click(function(){
        socket.emit('go');
    });

});
