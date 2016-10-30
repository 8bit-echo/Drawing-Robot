/* jshint esversion: 6 */



var InputGroup = React.createClass({
    render: function() {
        return (
            <div className="inputGroup">
                <span>{this.props.labelTitle}</span><br />
                <input type="number" className="numberInput"></input>
                <button className="incriment-btn">-</button>
                <button className="incriment-btn">+</button>
                <br />
                <input type="number" className="numberInput"></input>
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
            <button className= "bigButton" type="button" onClick="this.run">{this.props.title}</button>
            //Rendered in the
        );
    },
    // TODO: Figure out how to connect button to specific actions
    run: function() {
        return ("???");
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

// The whole app class
var Window = React.createClass({
    render: function() {
        return (
            <div>
                <div className="mainWindow">
                </div>
                <Sidebar></Sidebar>
            </div>
        );
    }
});

ReactDOM.render(
    <Window/>, document.getElementById('container'));
