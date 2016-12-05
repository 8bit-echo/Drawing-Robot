
//===========================================================================//
//                                                                           //
//     For Front-End ONLY. The libraries used in this conversion process     //
//     rely on the browser's ParseXML() function to convert SVG data         //
//                                                                           //
//===========================================================================//


//takes svg raw data and converts it into xy coordinates.
//NOTE: Contigent on the fact that svg has dimensions of 315 x 381.
// see convertToCoordinates() @ line 89 to change this.
function svg2xy(svgString, sliceDimensions) {

    //These 2 values ultimately need to come from the server AND get passed into the main function.
    // var sliceDimensions = {
    //     width: 620,
    //     height: 750
    // };
    // var svgString = $('#area').val();


    var svgConverter = new svgClass();

    //Convert raw SVG data to WKT format
    var wktString = svgConverter.SVGtoWKT.convert(svgString);
    //converts WKT data to [[x,y],[x,y]]
    var coordinates = wkt2xyCoordinates(wktString,sliceDimensions);

    //optional
    // drawPointsToCanvas(coordinates);
    return coordinates;
}

//=============================//
//       Helper Functions      //
//=============================//

function wkt2xyCoordinates(wktString, sliceDimensions) {

    //remove all data that is not xy coordinate data.
    var formatter = new Formatter();
    var coordinatesOnly = formatter.removeErroneousInfo(wktString);
    var usableCoordinates = [];

    //separate into array in the format of [x y, x y]
    var array = coordinatesOnly.split(',');

    for (var i = 0; i < array.length; i++) {
        //turns [x y, x y] => [[x,y],[x,y]]
        var pair = array[i].split(' ');
        pair = convertToCoordinates(pair, sliceDimensions);

        //send to top level scope array
        usableCoordinates.push(pair);
    }
    //go back to origin
    usableCoordinates.push({x:0, y:0});
    return usableCoordinates;
}

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

function convertToCoordinates(wktCoordinatePair, sliceDimensions) {
    //[x,y]

    var mmWidth = 315;
    var mmHeight = 381;
    //Needs this to compensate for Y axis flip.
    wktCoordinatePair[1] = wktCoordinatePair[1] * -1;

    //converts the WKT coordinates into x,y coordinates.
    // wktCoordinatePair[0] = mapXY(wktCoordinatePair[0], 0, 315, 0, mmWidth);
    // wktCoordinatePair[1] = mapXY(wktCoordinatePair[1], 0, 381, 0, mmHeight);

    var wktObjectPair = {x:0, y:0};

    wktObjectPair.x = mapXY(wktCoordinatePair[0], 0, sliceDimensions.width, 0, mmWidth);
    wktObjectPair.y = mapXY(wktCoordinatePair[1], 0, sliceDimensions.height, 0, mmHeight);

    // wktCoordinatePair[0] = mapXY(wktCoordinatePair[0], 0, sliceDimensions.width, 0, mmWidth);
    // wktCoordinatePair[1] = mapXY(wktCoordinatePair[1], 0, sliceDimensions.height, 0, mmHeight);



    return wktObjectPair;

}

function mapXY(val, low, high, min, max) {
    var newVal = (val - low) * (max - min) / (high - (low + 1) + min);
    return newVal.toFixed(2);
}

function calculateDeltas(xyCoordinatePair) { }

// function drawPointsToCanvas(twoDimensionalCoordinateArray) {
//     canvas.fillStyle = '#000';
//
//     //what is this? an Apple API? this is just a shorter name.
//     var array = twoDimensionalCoordinateArray;
//
//     for (var i = 0; i < array.length; i++) {
//         canvas.fillRect(array[i][0], array[i][1], 1, 1);
//     }
// }
