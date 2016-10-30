/* jshint esversion: 6 */


//=================================//
//          Sidebar Things         //
//=================================//

//+/- Buttons and Text Fields
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
            <i className={this.props.iconName}></i>
            </button>
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
                        <MainWindowButton iconName="fa fa-3x fa-home" title="Home"/>
                        <MainWindowButton iconName="fa fa-3x fa-rotate-right" title="Rotate Right"/>
                        <MainWindowButton iconName="fa fa-3x fa-rotate-left" title="Rotate Left"/>
                    </div>
                </div>
                <Sidebar></Sidebar>
            </div>
        );
    }
});

ReactDOM.render(
    <Window/>, document.getElementById('container'));
