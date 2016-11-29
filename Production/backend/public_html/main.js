$(document).ready(function() {
    var c = document.getElementById('artContainer');
    console.log(c);
    var canvas = c.getContext('2d');
    canvas.moveTo(0, 0);
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    canvas.strokeStyle = '#449AC6';
    canvas.strokeRect(5, 5, 100, 100);

    var targetSizeW = 12;
    var targetSizeH = 15;
    var manualXYW = 0;
    var manualXYH = 0;

    // server expects inches
    var targetSizeObject = {width: 0 , height: 0};


    function getDimensionsForServer(){
        var targetWidthInches = $('#targetSize-W').val();
        var targetHeightInches = $('#targetSize-H').val();

        targetSizeObject.width = targetWidthInches;
        targetSizeObject.height = targetHeightInches;

        socket.emit('New target size', targetSizeObject);
    }

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
    function drawRobotFrame(){
        //Get the Value from the UI
        var targetWidthInches = $('#targetSize-W').val();
        var targetHeightInches = $('#targetSize-H').val();

        // Convert to Millimeters
        var targetWidthMM = parseInt(targetWidthInches) * 25.4;
        var targetHeightMM = parseInt(targetHeightInches) * 25.4;
        var frameDimensions = {width: 315, height: 381};

        // get the shorter dimension of the two
        var shorterSide = targetWidthMM > targetHeightMM ? 'width' : 'height';

        var percentage;
        if (shorterSide == 'height') {
            percentage = 381 / targetHeightMM;
            console.log(percentage);
            frameDimensions.height = frameDimensions.height * percentage;
            frameDimensions.width = frameDimensions.height *(315/381);

        } else {
            percentage = 315 / targetWidthMM;
            console.log(percentage);
            frameDimensions.width = frameDimensions.width * percentage;
            frameDimensions.height = frameDimensions.width * (381/315);
        }
        canvas.strokeStyle = '#449AC6';
        canvas.strokeRect(0,0,frameDimensions.width, frameDimensions.height);

    }



    //=============================//
    //       UI Buttons            //
    //=============================//

    //This seems like a really bad way to do this, but it's all I've got right now.

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

    function initializeUI() {
        $('#targetSize-W').val(targetSizeW);
        $('#targetSize-H').val(targetSizeH);
        $('#manualXY-W').val(manualXYW);
        $('#manualXY-H').val(manualXYH);

    }
    initializeUI();




    //=============================//
    //    Server Driven events     //
    //=============================//


    //Global Variables from the server.

    var sliceDimensionsObject;




    console.log('Client is ready');

    var socket = io.connect();
    var uploader = new SocketIOFileUpload(socket);
    uploader.listenOnInput(document.getElementById('file'));

    uploader.addEventListener('complete', function(event){
        console.log('upload to server complete');
        socket.emit('upload complete', {filename: event.file.name});
    });

    //waits for the server to start the process, then sends confirmation back.
    socket.on('server handshake', function(data) {
        console.log(data.action);
        console.log('returning handshake to server.');
        socket.emit('client handshake', {
            action: 'handshake returned from client'
        });
    });

    // emit dimensions to the server
    // close the connection or create a done object
    // send the file name to the server as well?

    // socket.on('slice dimensions', function(data){
    //     console.log('getting slice dimensions from server');
    //     sliceDimensionsObject = data;
    //     console.log(sliceDimensionsObject);
    // });


    //runs when receives SVG string from the server.
    socket.on('svgData', function(data) {
        console.log('receiving svg Data...');
        var svgData = data.svgData;
        socket.on('slice dimensions', function(data){
            console.log('getting slice dimensions from server');
            sliceDimensionsObject = data;
            console.log(sliceDimensionsObject);
            var coordinates = svg2xy(svgData,sliceDimensionsObject);
            console.log(coordinates);
        });


    });
});
