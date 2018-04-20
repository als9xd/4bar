'use strict';

const readlineSync = require('readline-sync');

const jwt = require('jsonwebtoken');

module.exports = class NodebbConnector{
	constructor(config){
		
		//////////////////////////////////////////////////////////////////////
		// If secret doesn't exist within config file prompt for it on the
		// command line
		//////////////////////////////////////////////////////////////////////

		if(typeof config.nodebb.secret === 'undefined'){
			config.nodebb.secret = readlineSync.question("SSO nodebb secret: ",{
				hideEchoBack: true
			});
		}

	}

	create_jwt(config,payload,callback){
		jwt.sign(payload,config.nodebb.secret,callback);
	}
}