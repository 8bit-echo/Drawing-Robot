/* jshint esversion: 6 */
$(document).ready(function() {
    console.log('document is ready');

    var socket = io.connect();
    socket.on('news', function(data) {
        console.log(data);
        socket.emit('my other event', {
            my: 'data'
        });
    });
    document.getElementById('socket-button').addEventListener('click', function() {
        socket.emit('click', {
            action: 'client button clicked'
        });
    });
});
