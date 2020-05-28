import React from 'react';
import {withRouter} from 'react-router';

class LobbyJoiner extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            gameid: ""
        };
    }
    render() {
        return <React.Fragment>
            <h4>Join Lobby</h4>
            <p>Have a code from someone? You can enter it here.</p>
            <input type={"text"} className={"form-control"} onChange={e => {
                this.setState({gameid: e.target.value})
            }} onKeyDown={e => {
                if (e.key == 'Enter') this.props.history.push(`/game/${this.state.gameid}`);
            }}/>
            <button className={"btn btn-outline-primary mt-2"} onClick={e => {
                this.props.history.push(`/game/${this.state.gameid}`);
            }}>Join Game</button>
        </React.Fragment>;
    }
}

export default withRouter(LobbyJoiner);