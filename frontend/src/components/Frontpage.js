import React from 'react';
import {Link} from 'react-router-dom';

class Frontpage extends React.Component {
    render() {
        return <div>
            <p>Welcome to Spyfall!</p>
            <p>There's not much here. Just <Link to={'/play'}>play</Link> the game.</p>
        </div>
    }
}

export default Frontpage;