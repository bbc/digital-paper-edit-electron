const React = require('react');
const Alert = require('react-bootstrap/Alert');
class CustomAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
    };
  }

  handleDismiss = () => this.setState({ show: false });

  render() {
    if (this.state.show) {
      return (
        <Alert
          variant={this.props.variant}
          onClose={this.handleDismiss}
          // dismissible
        >
          {this.props.heading ? <Alert.Heading>{this.props.heading}</Alert.Heading> : ''}
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
