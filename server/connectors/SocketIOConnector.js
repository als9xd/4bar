//////////////////////////////////////////////////////////////////////
// 4bar/server/connectors/ExpressConnector.js
//
// Overview: 
//	- Builds a connector for socket.io related functionality 
//    and definitions
//  
// Constructor Objectives:
//  1. import and initialize socket.io by attaching it to the https
//     server
//
// Public Functions:
//   
//	 attach_session(ExpressConnector.session session)
//   build_listeners(PgConnector pg_conn)
//
// More about socket.io:
//
//   https://socket.io/docs/
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = class SocketIOConnector{
		
	constructor(config,https_server){

		//////////////////////////////////////////////////////////////////////
		// Store config inside class so that it can be accessed from member 
		// functions
		//////////////////////////////////////////////////////////////////////

		this.config = config;

		//////////////////////////////////////////////////////////////////////
		// Attach socket.io to the https server (all socket.io messages are
		// encrypted)
		//////////////////////////////////////////////////////////////////////	

		this.io = require('socket.io')(https_server);

	}

	//////////////////////////////////////////////////////////////////////
	// This function attaches a new middleware that allows socket.io 
	// connections to access express session data
	//
	// Example:
	//
	//		socket.on('example',function(){
	//			console.log(socket.handshake.session);
	//		});
	// 
	//////////////////////////////////////////////////////////////////////

	attach_session(session){
		const express_socket_io_session = require('express-socket.io-session')(session);
		this.io.use(express_socket_io_session);
	}

	//////////////////////////////////////////////////////////////////////
	// This builds all socket.io listeners from their definitions in 
	// '4bar/server/definitions/socket_io/socket_io_listener_definitions'
	//
	// What a socket.io listener looks like:
	//
	//     // When a client connects, the callback to this function is
	//     // called
	//     socket.on('connection',function(socket){
	//			
	//          // This is the listener
	//			socket.on('some_message',function(){
	//				console.log('I listened and heard');
	//			});
	//	   });
	//
	//////////////////////////////////////////////////////////////////////		

	build_listeners(definition_file,pg_conn,widget_definitions){

		const listener_definitions = require(definition_file)(this.config,pg_conn,widget_definitions);
		
		this.io.on('connection',function(socket){	
			for(let i = 0; i < listener_definitions.length;i++){
				listener_definitions[i](socket);
			}
		});	
	}

}