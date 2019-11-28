import React from 'react';

export default class Input extends React.Component {
  componentDidMount() {
    this.props.getRef(this.refs.myInput);
  }

  render() {
    return (
      <input
        data-test="entrada"
        ref="myInput"
        onChange={this.props.getValue}
        type="text"
        id="myInput"
      />
    );
  }
}
