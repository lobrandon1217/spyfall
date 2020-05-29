import React from 'react';
import {Link} from 'react-router-dom';
import {withRouter} from "react-router-dom";
import LobbyCreator from "./LobbyCreator";
import LobbyJoiner from "./LobbyJoiner";

class LobbyBrowser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: 0,
            rooms: [],
            refreshBtnState: 0
        };

        this.getLobbies = this.getLobbies.bind(this);
    }

    getLobbies() {
        this.setState({
            refreshBtnState: 1
        });
        let request = new XMLHttpRequest();
        request.open('POST', '/api/getlobbies');
        request.send();
        request.onreadystatechange = e => {
            if (request.readyState == 4 && request.status == 200) {
                this.setState({
                    rooms: JSON.parse(request.responseText),
                    refreshBtnState: 0
                });
            }
        }
    }

    componentDidMount() {
        this.getLobbies();
    }

    render() {
        document.title = ['Lobbies - Spyfall',
            'Create a Lobby - Spyfall',
            'Join a Game - Spyfall'][this.state.status];
        let lobbyList = [];

        for (let room of this.state.rooms) {
            lobbyList.push(
                <div className={"col-3"}>
                    <div className={'card'}>
                        <div className={'card-body'}>
                            <div className={'card-title'}>
                                <strong>{room.name}</strong> <span className={'text-muted'}>by {room.host}</span>
                            </div>
                            <div>Players:</div>
                            <ul>
                                {room.players.map(player => <li>{player}</li>)}
                            </ul>
                            <button className={'btn btn-outline-success w-100 d-block'} onClick={e => {
                                this.props.history.push(`/game/${room.id}`);
                            }}>Join</button>
                        </div>
                    </div>
                </div>
            )
        }


        let normal = <React.Fragment>
            <h4>Lobby Browser</h4>
            <Link to={"#"} onClick={() => {this.setState({status: 1})}}>
                Create your own lobby
            </Link> or <Link to={"#"} onClick={() => {this.setState({status: 2})}}>
                join a private game
            </Link>
            <hr/>
            <button className={`btn btn-outline-secondary mb-4 ${this.state.refreshBtnState == 1 ? 'disabled' : ''}`}
                    onClick={e => this.getLobbies()}>
                {['Refresh', 'Refreshing...'][this.state.refreshBtnState]}
            </button>
            <div className={"row"}>
                {lobbyList.length > 0 ? lobbyList : <div className={"col"}>
                    <p>No public lobbies found.</p>
                </div>}
            </div>
        </React.Fragment>;

        return <div>
            {this.state.status != 0 ? <Link to={"#"} onClick={() => {
                this.setState({status: 0});
            }}>Go Back</Link> : null}
            {[normal, <LobbyCreator/>, <LobbyJoiner/>][this.state.status]}
        </div>
    }
}

export default withRouter(LobbyBrowser);