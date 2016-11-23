/* jshint esversion: 6 */
$(document).ready(function() {
    console.log('Client is ready');

    //initialize server connection
    var socket = io.connect();

    //waits for the server to start the process, then sends confirmation back.
    socket.on('server handshake', function(data) {
        console.log(data.action);
        console.log('returning handshake to server.');
        socket.emit('client handshake', {
                action: 'handshake returned from client'
        });
    });

    //sends message to server when clicked.
    document.getElementById('socket-button').addEventListener('click', function() {
        socket.emit('click', {
            action: 'client button clicked'
        });
    });

    //runs when receives SVG string from the server.
    socket.on('svgData', function(data){
        console.log('receiving svg Data...');
        // console.log(data.svgData);
    });
});
