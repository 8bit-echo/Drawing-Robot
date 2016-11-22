//=============================================//
//    this document has been refactored into   //
//                  svg2xy.js                  //
//=============================================//

 
//Canvas Setup
var c = document.getElementById('canvas');
var canvas = c.getContext("2d");
canvas.moveTo(0, 0);
//Canvas Registration Marks.
canvas.fillRect(0, 0, 10, 10);
canvas.fillRect(0, 371, 10, 10);
canvas.fillRect(305, 0, 10, 10);
canvas.fillRect(305, 371, 10, 10);



//accepts svg string => wkt string
function svg2wkt() {
    var input = $('#area').val();
    var svgConverter = new svgClass();

    //Convert raw SVG data to WKT format
    var output = svgConverter.SVGtoWKT.convert(input);
    $('#output').val(output);

    return output;
}


// TODO: pass svgData as argument.
//accepts wktString => [xy coordinates]
function wkt2xyCoordinates() {
    //get Value from textbox
    var uncompressedWKT = $('#output').val();

    //removes all data that is not xy coordinate data.
    var formatter = new Formatter();
    var coordinatesOnly = formatter.removeErroneousInfo(uncompressedWKT);
    //separates into array in the format of [x y, x y]
    var array = coordinatesOnly.split(',');

    var usableCoordinates = [];
    for (var i = 0; i < array.length; i++) {
        //turns [x y, x y] => [[x,y],[x,y]]
        var pair = array[i].split(' ');

        pair = convertToCoordinates(pair);

        //draw the coordinate pair to the canvas
        canvas.fillStyle = "#000";
        canvas.fillRect(pair[0], pair[1], 1, 1);

        //send to top level scope array
        usableCoordinates.push(pair);
    }

    return usableCoordinates;
}

//helper function
function Formatter() {
    return {
        removeErroneousInfo: function(wkt) {

            var strings = [/GEOMETRYCOLLECTION/, /LINESTRING/, /POLYGON/, /\(/, /\)/];
            var output;

            for (var i = 0; i < strings.length; i++) {
                var regex = new RegExp(strings[i], 'g');

                if (i === 0) {
                    if (wkt.match(regex)) {
                        output = wkt.replace(regex, '');
                    }
                } else {
                    if (output.match(regex)) {
                        tempOut = output.replace(regex, '');
                        output = tempOut;
                    }
                }
            }
            return output;
        }
    };
}

function convertToCoordinates(wktCoordinatePair) {

    var mmWidth = 315;
    var mmHeight = 381;
    //Needs this to compensate for Y axis flip.
    wktCoordinatePair[1] = wktCoordinatePair[1] * -1;

    //converts the WKT coordinates into x,y coordinates.
    wktCoordinatePair[0] = mapXY(wktCoordinatePair[0], 0, 315, 0, mmWidth);
    wktCoordinatePair[1] = mapXY(wktCoordinatePair[1], 0, 381, 0, mmHeight);

    return wktCoordinatePair;

}

function mapXY(val, low, high, min, max) {
    var newVal = (val - low) * (max - min) / (high - (low + 1) + min);
    return newVal.toFixed(2);
}

function calculateDeltas(xyCoordinatePair) {

}

function findMinMax(array) {

    var high = array[0];
    var low = array[0];
    //low
    for (var i = 0; i < array.length; i++) {
        if (i !== 0 || i !== array.length - 1) {
            if (parseInt(array[i]) < parseInt(low)) {
                low = array[i];
            }
        }
    }
    //high
    for (var j = 0; j < array.length; j++) {
        if (j !== 0 || j !== array.length - 1) {
            if (parseInt(array[j]) > parseInt(high)) {
                high = array[j];
            }
        }
    }

    return {
        low: low,
        high: high
    };
}
