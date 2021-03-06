import React from "react";
import {Link} from 'react-router-dom';
import {BrowserRouter, Route, Switch, withRouter} from 'react-router-dom';
import {observer} from "mobx-react";

import uiState from './UiState';

import {StickyContainer} from 'react-sticky';


const LoginRequired = () => {
    if(!uiState.user.isLoggedIn) {
        return (
            <div className="wrapper login-required">
                <div className="site-contents">
                    <h2> Inlogging krävs </h2>
                    <p>Hej! Du måste <Link to="/login"> Logga in </Link> för att få tillgång till denna sida.  Om du inte har ett konto och vill ha access, kontakta <a href="mailto:daniel.heurlin@gmail.com">bs</a> med ditt cid så lägger han till dig! </p>
                </div>
            </div>
        );
  } else {
    return (
      <div className="wrapper login-required">
        <div className="site-contents">
          <h2> Du får inte vara här! </h2>
          <p> Ditt konto har inte tillgång till den här sidan. Om du vill ha access, kontakta <a href="mailto:daniel.heurlin@gmail.com">bs</a> med ditt cid så lägger han till dig! </p>
        </div>
      </div>
     );
  }
};

export default LoginRequired;
