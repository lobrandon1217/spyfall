import React, {createRef, Fragment, useRef} from 'react';
import io from 'socket.io-client';
import {withRouter} from "react-router";
import * as ReactDOM from "react-dom";

class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            socket: io(),
            name: '',
            state: -1, // set name, view lobby, in game
            serverMessage: '',
            players: {},
            firstPlayer: '',
            allLocations: {},
            location: '',
            votes: {},
            seconds: 0,
            isSpy: false,
            guessing: false,
            chatLog: [],
            chatMsg: ''
        };

        this.bottomScroll = createRef();
        this.chatBar = createRef();

        this.state.socket.on('connect', () => {
            this.setState({state: 0});
        });
        this.state.socket.on('joined', () => {
            this.setState({state: 1});
        });
        this.state.socket.on('server message', (data) => {
            this.setState({serverMessage: data});
        });
        this.state.socket.on('player list', playersObj => {
            this.setState({
                players: playersObj
            });
        });

        this.state.socket.on('chat message', message => {
            this.state.chatLog.push(
                <div className={
                    `my-0 list-group-item py-1 px-2 rounded-0 border-0 ${
                        this.state.chatLog.length % 2 == 0 ? 'bg-light' : ''
                    }`
                } key={this.state.chatLog.length}>
                    {message}
                </div>
            );
            this.forceUpdate();
        });

        this.state.socket.on('game data', data => {
            this.state.firstPlayer = data.firstPlayer;
            this.state.votes = data.votes;
            this.state.allLocations = {};
            for (let location of data.allLocations) {
                this.state.allLocations[location] = false;
            }
            this.forceUpdate();
        });

        this.state.socket.on('time', time => {
            this.setState({
                seconds: time
            });
        });

        this.state.socket.on('location', ({spy, location}) => {
            if (spy) {
                this.setState({
                    location: 'unknown. You are the spy!',
                    isSpy: true
                });
            } else {
                this.setState({
                    location: location,
                    isSpy: false
                });
            }
        });

        this.state.socket.on('state', state => {
            if (state == 1) { this.state.guessing = false; }
            this.setState({
                state: state
            });
        });

        this.setName = this.setName.bind(this);
    }

    componentWillUnmount() {
        this.state.socket.disconnect(true);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.bottomScroll.current) {
            this.bottomScroll.current.scrollTop = this.bottomScroll.current.scrollHeight;
        }
    }

    setName() {
        this.state.socket.emit('join', this.props.match.params.id, this.state.name);
    }

    render() {
        let playerList = [];
        let chatbox = <div className={'border'}>
            <div className={'list-group p-2'} style={{
                'maxHeight': '10rem',
                'minHeight': '10rem',
                'overflowY': 'scroll'
            }} ref={this.bottomScroll}>
                {this.state.chatLog}
            </div>
            <input type={'text'} value={this.state.chatBar} className={'form-control'} onKeyDown={
                e => {
                    if (e.key == 'Enter') {
                        this.state.socket.emit('chat message', this.state.chatBar);
                        this.setState({
                            chatBar: ''
                        });
                    }
                }
            } onChange={e => {
                this.setState({
                    chatBar: e.target.value
                });
            }}/>
        </div>;

        switch (this.state.state) {
            case -1:
                return <h4>Connecting to game {this.props.match.params.id}...</h4>;
            case 0:
                return <div>
                    <h4>Enter Username</h4>
                    <p>Enter the username that you want.</p>
                    {this.state.serverMessage ? <p className={'text-danger'}>{this.state.serverMessage}</p> : '' }
                    <input type={'text'} className={'form-control'}
                           onChange={e => this.setState({name: e.target.value})}
                           onKeyDown={e => {
                               if (e.key == 'Enter') this.setName();
                           }}/>
                    <button className={'btn btn-outline-primary mt-2'} onClick={this.setName}>Join</button>
                    <p className={'mt-4 text-muted text-right'}>
                        Joining game {this.props.match.params.id}
                    </p>
                </div>;
            case 1:
                if (Object.keys(this.state.players).length > 0) {
                    playerList = this.state.players.players.map((value, index) => {
                        return <li className={'list-group-item'} key={index}>
                            {
                                this.state.players.host == value ?
                                <Fragment><b>HOST</b> </Fragment> : ''
                            }{value}{
                                this.state.name == value ? <i> (you)</i> : ''
                            }
                        </li>
                    });
                }
                return <div>
                    <h4>Waiting for Host...</h4>
                    <p>
                        {
                            this.state.players.host == this.state.name ?
                                'Waiting for you to start the game.' :
                                'Waiting for the host to start the game.'
                        }
                    </p>
                    <div className={'row'}>
                        <div className={'col-4'}>
                            <b>Current Players:</b>
                            <ul className={'list-group'}>
                                {playerList}
                            </ul>
                        </div>
                        <div className={'col-8'}>
                            {chatbox}
                        </div>
                    </div>
                    <button className={'btn btn-outline-danger mt-4 d-inline-block'} onClick={e => {
                        this.props.history.push('/play');
                    }}>Leave Lobby</button>
                    {
                        this.state.players.host == this.state.name ?
                            <button className={'btn ml-2 btn-outline-success mt-4 d-inline-block'} onClick={e => {
                                this.state.socket.emit('start');
                            }}>Start Game</button> :
                            ''
                    }
                </div>;
            case 2:
                let cleanVotes = {};
                Object.keys(this.state.votes).forEach(id => {
                    let name = this.state.votes[id];
                    if (name in cleanVotes) {
                        cleanVotes[name] += 1;
                    } else {
                        cleanVotes[name] = 1;
                    }
                });
                console.log(cleanVotes);
                if (Object.keys(this.state.players).length > 0) {
                    playerList = this.state.players.players.map((value, index) => {
                        return <button
                            className={'list-group-item list-group-item-action d-flex justify-content-between'}
                            key={index}
                            onClick={e => {
                                this.state.socket.emit('vote', value);
                            }
                        }>
                            {this.state.firstPlayer == value ? <Fragment><b>1st.&nbsp;</b></Fragment> : ''}{value}
                            <span className={'badge badge-secondary d-inline-block ml-auto mr-0'}>{cleanVotes[value] | 0}</span>
                        </button>
                    });
                }
                let seconds = this.state.seconds % 60;
                let places = Object.keys(this.state.allLocations).map(loc =>
                    <div className={'col-4'}>
                        <button className={`btn my-1 ${this.state.guessing? 'btn-outline-danger' : ''} w-100`}
                                onClick={e => {
                                    if (this.state.guessing) {
                                        this.state.socket.emit('guess', loc);
                                    } else {
                                        this.state.allLocations[loc] = !this.state.allLocations[loc];
                                        this.forceUpdate();
                                    }
                        }}>
                            { this.state.allLocations[loc] == true ? <s>{loc}</s> : loc }
                        </button>
                    </div>
                );
                return <div>
                    <h4>In Game</h4>
                    <div className={'container'}>
                        <h4 className={'text-center'}>
                            The location is {this.state.location}
                        </h4>
                        <button className={'btn text-center mx-auto d-block'} onClick={e => {
                            this.state.socket.emit('timer click');
                        }}>
                            {Math.floor(this.state.seconds / 60)}:{seconds < 10 ? `0${seconds}` : seconds}
                        </button>
                        <div className={'row'}>
                            <div className={'col-3'}>
                                <div className={'col-12'}>
                                    <h4 className={'text-center'}>Players</h4>
                                </div>
                                <div className={'list-group'}>
                                    {
                                        playerList
                                    }
                                </div>
                            </div>
                            <div className={'col-5'}>
                                <div className={'row'}>
                                    <div className={'col-12'}>
                                        <h4 className={'text-center'}>
                                            {
                                                this.state.isSpy ? 'Potential ' : ''
                                            }Locations
                                        </h4>
                                    </div>
                                    {places}
                                    {
                                        this.state.isSpy ?
                                            <div className={'col-12 mt-4'}>
                                                <button className={'btn btn-outline-danger w-100'}
                                                        onClick={e => {
                                                    this.setState({
                                                        guessing: !this.state.guessing
                                                    });
                                                }}>
                                                    Guess Location
                                                </button>
                                            </div> :
                                            ''
                                    }
                                </div>
                            </div>
                            <div className={'col-4'}>
                                {chatbox}
                            </div>
                        </div>
                    </div>
                </div>;
        }
    }
}

export default withRouter(Game);