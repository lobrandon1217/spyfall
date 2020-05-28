import React from 'react';
import {withRouter} from 'react-router';

class LobbyCreator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            public: true,
            name: 'Spyfall Game',
            alert: null
        };

        this.createGame = this.createGame.bind(this);
    }

    createGame() {
        let request = new XMLHttpRequest();
        request.open('POST', '/api/createlobby');
        request.send(JSON.stringify({
            public: this.state.public,
            name: this.state.name
        }));
        request.onreadystatechange = e => {
            if (request.status == 200 && request.readyState == 4) {
                let response = JSON.parse(request.responseText);
                console.log(response);
                if (response.pass) {
                    this.props.history.push(`/game/${response.message}`);
                } else {
                    this.setState({
                        alert: response.message
                    });
                }
            }
        }
    };

    render() {
        return <div>
            <h4>Create Lobby</h4>
            <p>Here you can define the settings before creating your own lobby.</p>
            <hr/>
            {this.state.alert != null ? <div className={'alert alert-danger'}>{this.state.alert}</div> : ''}
            <div>
                <label>Lobby name:</label>
                <input type={'text'} value={this.state.name}
                       onChange={e => this.setState({name: e.target.value})}
                       className={'form-control'}
                       onKeyDown={e => { if (e.key == 'Enter') this.createGame(); }}
                />
            </div>
            <div className={'mt-4'}>
                <label className={'d-block'}>The lobby is currently <b>{this.state.public ? 'PUBLIC' : 'PRIVATE'}</b>.</label>
                <button className={`btn ${this.state.public ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                        onClick={() => {
                    this.setState({public: !this.state.public})
                }}>
                    {this.state.public ? 'Make Private' : 'Make Public'}
                </button>
            </div>
            <hr/>
            <button onClick={this.createGame} className={"btn btn-outline-success"}>Create</button>
        </div>;
    }
}

export default withRouter(LobbyCreator);