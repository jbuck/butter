'use strict';

module.exports = function routesCtor( app, User, filter, sanitizer ) {
  app.get( '/api/whoami', filter.isLoggedIn, function( req, res ) {
    var email = req.session.email;

    res.json({
      email: email,
      name: email,
      username: email
    });
  });
};
