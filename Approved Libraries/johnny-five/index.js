/* jshint esversion: 6 */
const j5 = require('johnny-five');
const series = require('async-series');
const waterfall = require('async-waterfall');
const promise = require('promise');
const each = require('async-each-series');
const events = require('events');

var robot = new events.EventEmitter();

var arduino = new j5.Board();

function goHome(currentPos) {
    console.log('moving to home position');
}

function mapXY(val, low, high, min, max) {
    var newVal = (val - low) * (max - min) / (high - (low + 1) + min);
    //decimal point accuracy
    return newVal.toFixed(2);
}

var home = {
    x: 0,
    y: 0
};
var currentPosition = {
    x: 0,
    y: 0
};

var targetPosition = {
    x: 157.5,
    y: 190.5
};

// X:
//1 = positive
// 0 = negative

// Y:
//0 = positive
//1 = negative


var squareCoordinates = [{
    x: 86,
    y: 120
}, {
    x: 226,
    y: 120
}, {
    x: 226,
    y: 260
}, {
    x: 86,
    y: 260
}, {
    x: 86,
    y: 120
}];


arduino.on('ready', function() {
    function goToCoordinate(currentPos, toPos) {
        var xDirection;
        var yDirection;
        toPos.x = mapXY(toPos.x, 0, 315, 0, 14000);
        toPos.y = mapXY(toPos.y, 0, 381, 0, 16930);

        if (currentPos.x < toPos.x) {
            xDirection = 1;
        } else {
            xDirection = 0;
        }

        if (currentPos.y < toPos.y) {
            yDirection = 0;
        } else {
            yDirection = 1;
        }

        xStepper.direction(xDirection).step(toPos.x, function() {
            currentPosition.x = toPos.x;
            console.log('xMove done');
        });
        yStepper.direction(yDirection).step(toPos.y, function() {
            currentPosition.y = toPos.y;
            console.log('yMove done');
        });
    }

    function getCurrentPosition() {
        return currentPosition;
    }

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

    //=============================//
    //       Testing               //
    //=============================//
    //}
    //Definitely Port 7
    // var zServo = new j5.Servo({
    //     controller: 'PCA9685',
    //     port: 7,
    //     pin: 6,
    //     center: false,
    //     startAt: 0
    // });

    // var stepOptions = {
    //     // steps: 14000,
    //     steps: 16930,
    //     direction: 0, //(CCW, CW),
    //     rpm: 500,
    //     accel: 200, // 1600
    //     decel: 200 //1600
    // };


    // xStepper.direction(0).step(2000, function() {
    //     xStepper.direction(1).step(2000, function() {
    //         console.log('there and back');
    //     });
    // });

    // Ystepper.step(stepOptions, function(){
    //     console.log('done Y stepping ');
    // });
    //
    // Xstepper.step(stepOptions, function(){
    //     console.log('done X stepping');
    // });

    function calculateDeltas(current, prev) {
        var delta = current - prev;
        return delta;
    }

    function drawSquare(coords, cb) {

        // loop through all the coordinates
        for (var i = 0; i < coords.length; i++) {
            var xDelta;
            var yDelta;
            var xDir;
            var yDir;

            //map each xy pair to motor steps
            coords[i].x = mapXY(coords[i].x, 0, 315, 0, 14000);
            coords[i].y = mapXY(coords[i].y, 0, 381, 0, 16900);

            if (i === 0) {
                //default delta from the first point is here.
                xDelta = coords[i].x;
                yDelta = coords[i].y;
                // console.log(xDelta);

            } else {
                //calculate the delta movement from each previous steps
                xDelta = calculateDeltas(coords[i].x, coords[i - 1].x);
                yDelta = calculateDeltas(coords[i].y, coords[i - 1].y);
                console.log(xDelta);
            }

            // determine if the direction is positive or negative
            if (xDelta < 0) {
                xDir = 0;
                xDelta = xDelta * -1;

                coords[i].xDelta = xDelta;
                coords[i].xDir = xDir;
            } else {
                xDir = 1;

                coords[i].xDelta = xDelta;
                coords[i].xDir = xDir;
            }

            if (yDelta < 0) {
                yDir = 1;
                yDelta = yDelta * -1;

                coords[i].yDelta = yDelta;
                coords[i].yDir = yDir;
            } else {
                yDir = 0;

                coords[i].yDelta = yDelta;
                coords[i].yDir = yDir;
            }
        }

        cb();
    }

    function mm(mm) {
        return mm * 44.44444444444;
    }

    function move(coord, done) {
        var xDone = false;
        var yDone = false;
        xStepper.direction(coord.xDir).rpm(300).step(mm(coord.x), function() {
            console.log('x done');
            xDone = true;
            if (xDone && yDone){
                console.log('both done');
                if (typeof done === 'function') {
                    done();
                } else{
                    console.log(typeof done);
                }
            }
        });

        yStepper.direction(coord.yDir).rpm(300).step(mm(coord.y), function() {
            console.log('y done');
            yDone = true;
            if (xDone && yDone){
                console.log('both done');
                if (typeof done === 'function') {
                    done();
                } else{
                    console.log(typeof done);
                }
            }
        });

    }

    var steps = [{
        x: 50,
        y: 0,
        xDir: 1,
        yDir: 0
    }, {
        x: 0,
        y: 50,
        xDir: 1,
        yDir: 0
    }, {
        x: 50,
        y: 0,
        xDir: 0,
        yDir: 1
    }, {
        x: 0,
        y: 50,
        xDir: 0,
        yDir: 1
    }];


    robot.on('done', function() {
    console.log('finished');
    });

    robot.on('next', function(i) {
        console.log('received next', i);
        if (i < steps.length) {
            move(steps[i], function(){robot.emit('next', i + 1);});

        } else {
            robot.emit('done');
        }
    });

    robot.on('begin', function() {
        console.log('received begin');
        move(steps[0], function(){robot.emit('next', 1);});

    });

    robot.emit('begin');


});
