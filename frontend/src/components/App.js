import React from 'react';
import {BrowserRouter, NavLink, Route, Switch} from 'react-router-dom';
import Frontpage from './Frontpage';
import Game from './Game';
import LobbyBrowser from './LobbyBrowser';
import LobbyCreator from './LobbyCreator';
import FallbackPage from "./FallbackPage";

class App extends React.Component {
    render() {
        return <BrowserRouter>
            <nav className={'navbar navbar-expand-lg navbar-light bg-light'}>
                <div className={'container'}>
                    <a className={'navbar-brand'} href={'/'}>
                        SPYFALL
                    </a>
                    <button className='navbar-toggler' type='button' data-toggle='collapse'
                            data-target='#navbarSupportedContent' aria-controls='navbarSupportedContent'
                            aria-expanded='false' aria-label='Toggle navigation'>
                        <span className='navbar-toggler-icon'></span>
                    </button>

                    <div className='collapse navbar-collapse' id='navbarSupportedContent'>
                        <ul className={'navbar-nav mr-auto'}>
                            <li className={'nav-item'}>
                                <NavLink to={'/'} exact={true} className={'nav-link'} activeClassName={'active'}>Home</NavLink>
                            </li>
                            <li className={'nav-item'}>
                                <NavLink to={'/play'} exact={true} className={'nav-link'} activeClassName={'active'}>Play</NavLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            <div className={'container mt-4'}>
                <Switch>
                    <Route exact={true} path={'/play'} component={LobbyBrowser}></Route>
                    <Route exact={true} path={'/createlobby'} component={LobbyCreator}></Route>
                    <Route exact={true} path={'/game/:id'} component={Game}></Route>
                    <Route exact={true} path={'/'} component={Frontpage}></Route>
                    <Route path={'*'} component={FallbackPage}></Route>
                </Switch>
            </div>
        </BrowserRouter>;
    }
}

export default App;