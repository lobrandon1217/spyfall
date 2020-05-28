import React from 'react';
import {Link} from 'react-router-dom';

export default class FallbackPage extends React.Component {
    render() {
        return <React.Fragment>
            <h2>404!</h2>
            <p>The page you were looking for does not exist.</p>
            <Link to={"/"}>Click here to go back to the main page.</Link>
        </React.Fragment>
    }
}