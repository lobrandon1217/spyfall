import React from 'react';
import {Link} from 'react-router-dom';
import LobbyCreator from "./LobbyCreator";
import LobbyJoiner from "./LobbyJoiner";

class LobbyBrowser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: 0,
            rooms: []
        };

        this.getLobbies = this.getLobbies.bind(this);
    }

    getLobbies() {
        let request = new XMLHttpRequest();
        request.open('POST', '/api/getlobbies');
        request.send();
        request.onreadystatechange = e => {
            if (request.readyState == 4 && request.status == 200) {
                console.log(request.responseText);
                this.setState({
                    rooms: JSON.parse(request.responseText)
                });
            }
        }
    }

    componentDidMount() {
        this.getLobbies();
    }

    render() {
        let lobbyList = [];

        for (let room of this.state.rooms) {
            lobbyList.push(
                <div className={"col-3"}>
                    <div className={'card'}>
                        <div className={'card-body'}>
                            <div className={'card-title'}>
                                {room.name}
                            </div>
                            <Link to={`/game/${room.id}`} className={"card-link"}>Join</Link>
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

export default LobbyBrowser;