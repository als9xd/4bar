'use strict';

const jwt = require('jsonwebtoken');

module.exports = class NodebbConnector{
	constructor(config,key){
		this.key=key
	}

	create_jwt(data,callback){
		jwt.sign(data,this.key,{algorithm: 'RS256'},callback);
	}
}