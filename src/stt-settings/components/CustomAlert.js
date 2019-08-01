const React = require('react');
const ReactDOM = require('react-dom');
const Container = require('react-bootstrap/Container');
const Breadcrumb = require('react-bootstrap/Breadcrumb');
const Nav = require('react-bootstrap/Nav');
const Tabs = require('react-bootstrap/Tabs');
const Tab = require('react-bootstrap/Tab');
const Button = require('react-bootstrap/Button');
const Form = require('react-bootstrap/Form');
const Alert = require('react-bootstrap/Alert');
const getDefaultStt = require('./default-stt.js').getDefaultStt;
const setDefaultStt = require('./default-stt.js').setDefaultStt;
const speechmaticsLanguages = require('./language-options/speechmatics.json');
const { app } = require('electron').remote;
const appVersion = app.getVersion();

class CustomAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true
    };
  }

  handleDismiss = () => this.setState({ show: false });

  render() {
    if (this.state.show) {
      return (
        <Alert
          variant={ this.props.variant }
          onClose={ this.handleDismiss }
          // dismissible
        >
          {this.props.heading ? (
            <Alert.Heading>{this.props.heading}</Alert.Heading>
          ) : (
            ''
          )}
          {this.props.message}
        </Alert>
      );
    } else {
      return (
        <React.Fragment>
          <br />
        </React.Fragment>
      );
    }
  }
}

module.exports = CustomAlert;