var pgp = require('pg-promise')();
var postgres = require('../lib/postgres.js');
var jwt = require('jsonwebtoken');

/**
* Created By: Ashish N
* Date: May 15, 2017
* Descrition: Method to create json web token
*/
var createToken = function(user) {
	console.log('*** createToken');
	// create token if user is found and password is right
	var signingSecret = process.env.SIGNING_SECRET;
	var tokenExpiresIn = process.env.TOKEN_EXPIRES_IN ? process.env.TOKEN_EXPIRES_IN : 300;
	console.log('tokenExpiresIn: ' + tokenExpiresIn);
	var token = jwt.sign(user, signingSecret, {
		expiresIn: parseInt(tokenExpiresIn) // token expiry in seconds
	});
	return token;
}

/**
* Created By: Ashish N
* Date: May 15, 2017
* Descrition: Method to check if user is authenticated in the app
*/
var isAuthenticated = function(req, res, next) {
	console.log('*** isAuthenticated');

	validateRequest(req, res, false, function(decoded) {
		if(decoded) {
			next();
		}
	});
}

/**
* Created By: Ashish N
* Date: May 15, 2017
* Descrition: Method to check if user is authorized to access the Apis
*/
var isAuthorized = function(req, res, next) {
	console.log('*** isAuthenticated');
	
	validateRequest(req, res, true, function(decoded) {
		if(decoded) {
			next();
		}
	});
}


/**
* Created By: Ashish N
* Date: May 15, 2017
* Descrition: Method to validate request using token (if provided) in the request
*/
var validateRequest = function(req, res, checkApiAccess, callback) {
	console.log('*** validateRequest');
	
	var token;
	// check if the token exists in the cookie. This is for the first time this API is loaded on login. This is not used to check if user has api access
	if(!checkApiAccess) {
		console.log('Checking cookie');
		token = req.cookies.accessToken;
	}
	// find the token which was provided as part of authetication in the request body, query or headers
	else {
		console.log('Checking API access');
		console.log(req.headers.authorization);
		token = req.body.token || req.headers.authorization;
	} 

	// decode token
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, process.env.SIGNING_SECRET, function(err, decoded) {      
		  if (err) {
		  	console.log(err);
		    //return res.json({ success: false, message: 'Failed to authenticate token.', error: err });    
		  	res.render('signin', { title: 'Sign In' });
		  } 
		  else {
		  	console.log('Authentication successful.');
		    // if everything is good, save to request for use in other routes
		    req.decoded = decoded;    
		    callback(req.decoded);
		  }
		});

	}
	// if token is not provided in the request 
	else {
		// if api authorization is being checked
		if(checkApiAccess) {
			console.log('No token provided');
			res.json({'status': 403, 'success': false, 'message': 'No token provided'});
		}
		else {
			// render the login page if no token is provided by the client
			res.render('signin', { title: 'Sign In' });
		}
	}
}

module.exports = {
	isAuthenticated: isAuthenticated,
	isAuthorized: isAuthorized,
	validateRequest: validateRequest,
	createToken: createToken
};
