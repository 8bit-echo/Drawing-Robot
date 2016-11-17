/* jshint esversion: 6 */


//=================================//
//          Sidebar Things         //
//=================================//

//+/- Buttons and Text Fields
var InputGroup = React.createClass({
    counter: function(){
        console.log("Counter");
    },

    subtract: function(i){
        console.log("Subtract - 1");
    },

    add: function(i){
        console.log("Add + 1");
    },

    render: function() {
        return (
            <div className="inputGroup">
                <span>{this.props.labelTitle}</span>
                <br />
                <input type="number" className="numberInput" />
                <button className="incriment-btn">-</button>
                <button className="incriment-btn" onClick={this.add}>+</button>
                <br />
                <input type="number" className="numberInput" />
                <button className="incriment-btn">-</button>
                <button className="incriment-btn">+</button>
            </div>
        );
    }
});

//Debugger Panel
var DebugWindow = React.createClass({
    log: function(text){
        return (
            // document.getElementById('debug').innerHTML += text
            console.log("")
         );
    },
    render: function() {
        return (
            <div className="debug">
                <input type="textarea" id="debug"></input>
            </div>
        );
    }
});

// Button Class
var Button = React.createClass({
    render: function() {
        return (
            <button className= "bigButton" type="button" onClick={this.run}>{this.props.title}</button>
            //Rendered in the
        );
    },

    run: function() {
        console.log(this.props.title + " button clicked");
    }
});

//Sidebar class
var Sidebar = React.createClass({
    render: function() {
        return (
            <div className="sidebar">
                <Button title="Open"/>
                <InputGroup labelTitle="Target Size (in)"/>
                <InputGroup labelTitle="Manual XY Override (mm)"/>
                <DebugWindow />
                <Button title="Go" />
            </div>
        );
    }
});


//=================================//
//         Main Window Things      //
//=================================//

var MainWindowButton = React.createClass({
    run: function(){
         console.log(this.props.title + " button clicked.");
    },
    render: function() {
        return (
            <button className="mainWindowButton" onClick={this.run}>
            <i className={"fa fa-3x fa-" + this.props.iconName}></i>
            </button>
        );
    }
});

var RobotFrame = React.createClass({
    moveTo: function(x,y){
        // TODO: Must be within bounds of ArtFrame.

    },

    render: function() {
        return (
            <div className="robotFrame"></div>
            // TODO: Must maintain Aspect ratio of 1 : 1.2405

        );
    }
});

var ArtFrame = React.createClass({
    render: function() {
        return (
            <div className="artContainer">
                <canvas id="artContainer" width="100%" height="350px"></canvas>
                <span>(0,0)</span>
            </div>

                    // TODO: Get the target size from the InputGroup
        );
    }
});


// The whole app class
var Window = React.createClass({
    render: function() {
        return (
            <div>
                <div className="mainWindow">
                    <div className="mainButtonContainer">
                        <MainWindowButton iconName="home" title="Home"/>
                        <MainWindowButton iconName="rotate-right" title="Rotate Right"/>
                        <MainWindowButton iconName="rotate-left" title="Rotate Left"/>
                        <MainWindowButton iconName="arrows-h" title = "Horizontal Flip" />
                        <MainWindowButton iconName="arrows-v" title = "Veritcal Flip" />
                        <MainWindowButton iconName="remove" title="Remove" />
                    </div>

                    <div className="mainContainer">
                        <ArtFrame />
                    </div>
                </div>
                <Sidebar></Sidebar>
            </div>
        );
    }
});

ReactDOM.render(
    <Window/>, document.getElementById('container'));
