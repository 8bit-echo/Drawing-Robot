/* jshint esversion: 6 */
$(document).ready(function() {
    console.log('Client is ready');

    var socket = io.connect();
    socket.on('server handshake', function(data) {
        console.log(data.action);
        socket.emit('client handshake', {
                action: 'handshake returned from client'
        });
    });
    document.getElementById('socket-button').addEventListener('click', function() {
        socket.emit('click', {
            action: 'client button clicked'
        });
    });
});
