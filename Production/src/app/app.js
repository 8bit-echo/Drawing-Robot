/* jshint esversion: 6 */

// Button Class
var Button = React.createClass({
    render: function() {
        return (
            <button className= "bigButton" type="button" onClick="this.run">{this.props.title}</button>
            //Rendered in the
        );
    },

    run: function() {
        return ("???");
    }
});

//Sidebar class
var Sidebar = React.createClass({
    render: function() {
        return (
            <div className="sidebar">
                <h2>This is the sidebar</h2>
                <Button title="Open"/>
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
                    <h1>This is the Window</h1>
                </div>
                <Sidebar></Sidebar>
            </div>
        );
    }
});

ReactDOM.render(
    <Window/>, document.getElementById('container'));
