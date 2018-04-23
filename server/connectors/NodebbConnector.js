'use strict';

const readlineSync = require('readline-sync');

const jwt = require('jsonwebtoken');

const request = require('request');

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

		//////////////////////////////////////////////////////////////////////
		// If nodebb api key doesn't exist within config file prompt for it 
		// on the command line
		//////////////////////////////////////////////////////////////////////

		if(typeof config.nodebb.api_key === 'undefined'){
			config.nodebb.api_key = readlineSync.question("Nodebb api key: ",{
				hideEchoBack: true
			});
		}

		this.config = config;

	}

	create_jwt(config,payload,callback){
		jwt.sign(payload,config.nodebb.secret,callback);
	}

	create_category(data,callback){
		let body = '';

		for(let i in data){
			if(data.hasOwnProperty(i)){
				body+=(i+'='+data[i]+'&');
			}
		}

		request.post(
			{
				url: this.config.nodebb.address+'/api/v2/categories',
				headers:{
					'content-type' : 'application/x-www-form-urlencoded',
					Authorization: "Bearer "+this.config.nodebb.api_key,
				},
				body: body
			},
			// Passed (error,response,body)
			callback
		);
	}

	modify_category(c_id,data,callback){
		let body = '';

		for(let i in data){
			if(data.hasOwnProperty(i)){
				body+=(i+'='+data[i]+'&');
			}
		}

		request.put(
			{
				url: this.config.nodebb.address+'/api/v2/categories/'+c_id,
				headers:{
					'content-type' : 'application/x-www-form-urlencoded',
					Authorization: "Bearer "+this.config.nodebb.api_key,
				},
				body: body
			},
			// Passed (error,response,body)
			callback
		);
	}
}