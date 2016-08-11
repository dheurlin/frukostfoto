import _ from 'lodash';
import {Router} from 'express';
import bodyParser from 'body-parser';
import krb5 from 'kerberos';

import User from '../model/user';

import Logger from '../logger';
const Kerberos = new krb5.Kerberos();

const router = Router();
export default router;

const jsonParser = bodyParser.json();

// Get the currently logged in user
//  - Returns 403 if not logged-in
router.get('/auth/user', LoggedInRequired, (req, res) => {
  const user = req.session.user;
  res.send(user);
});

// Get all users
//  - Returns 403 if not logged-in
router.get('/auth/users', LoggedInAsDfotoRequired, (req, res) => {
  User.find({}, (err, users) => {
    if (err) {
      res.status(500);
      res.send(err);
      throw err;
    }

    Logger.info(`User ${req.session.user.cid} fetched all other users`);

    res.send(users);
  });
});

// Login a user
//  - Logs out the previous user if any
router.post('/auth/login', jsonParser, (req, res) => {
  const {cid, password} = req.body;
  
  Kerberos.authUserKrb5Password(cid, password, '', (err, ok) => {
    abortOnError(err, res);
    
    if (ok) {
      User.find({ cid: cid }, (err, results) => {
        abortOnError(err, res);

        // first time login ?
        if (_.isEmpty(results)) {
          const user = {
            cid: cid, fullname: ''
          };
          
          User(user).save((err) => {
            abortOnError(err, res);
            
            req.session.user = user;
            res.send(user);
          });
        } else {
          const user = _.head(results);
          req.session.user = user;
          res.send(user);
        }
      });
    } else {
      res.status(401).end();
    }
  });
});

// Change user-data
router.put('/auth/user/:cid', LoggedInRequired, jsonParser, (req, res) => {
  const cid = req.params.cid;
  const {fullname} = req.body;
  const dfotoMember = _.get(req.body, 'dfotoMember', false);
  
  // Only allow dfoto-members to elevate other dfotos
  const {isDfotoMember} = req.session.user;
  const updated = {
    fullname: fullname,
    dfotoMember: (dfotoMember && isDfotoMember)
  };
  
  User.findOneAndUpdate({ cid: cid }, { $set: updated }, (err) => {
    if (err) {
      res.status(500).send(err);
      throw err;
    }

    // Update current user object
    if (req.session.user.cid === cid) {
      _.merge(req.session.user, updated);
    }
    
    res.status(202).end();
  });
});

// Logout the currently logged-in user
//  - Returns 403 if not logged-in
router.post('/auth/logout', LoggedInRequired, (req, res) => {
  req.session.destroy();
  res.status(200);
  res.end();
});

function isLoggedIn(req) {
  const hasSession = _.has(req, 'session');
  const hasSessionUser = _.has(req, 'session.user');
  return hasSession && hasSessionUser
}

// Middleware for express to ensure
//  that a valid user is logged-in before continuing.
export function LoggedInRequired(req, res, next) {
  if (isLoggedIn(req)) {
    next();
  } else {
    res.status(403).end();
  }
}

export function LoggedInAsDfotoRequired(req, res, next) {
  const loggedIn = isLoggedIn(req);
  const isDfoto = _.get(req, 'session.user.dfotoMember', false);
  if (loggedIn && isDfoto) {
    next();
  } else {
    res.status(403).end();
  }
}

function abortOnError(err, res) {
  if (err) {
    res.status(500);
    res.send(err);

    throw err;
  }
}
