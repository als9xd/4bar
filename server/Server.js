//////////////////////////////////////////////////////////////////////
// 4bar/server/Server.js
//
// Overview: 
//   - Builds all the connectors and starts the 4bar server
//  
// Constructor Objectives: 
//   1. Initialize the Postgres Connector
//   2. Initialize the Express Connector
//   3. Initialize the http/https servers 
//   4. Initialize the Socket.io Connector
//
// Public Functions:
//   
//	 Server.start()
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = class Server{

	constructor(config) {

		this.config = config;

		//////////////////////////////////////////////////////////////////////
		// Postgresql connector
		//////////////////////////////////////////////////////////////////////

		this.PgConnector = require(config.root_dir+'/server/connectors/PgConnector');

		//////////////////////////////////////////////////////////////////////
		// Express connector
		//////////////////////////////////////////////////////////////////////

		this.ExpressConnector = require(config.root_dir+'/server/connectors/ExpressConnector');

		//////////////////////////////////////////////////////////////////////
		// Setup ssl key and certification
		//////////////////////////////////////////////////////////////////////

		const fs = require('fs');
		this.https_options = null;
		if(this.config.ssl){
			this.https_options = {
				key: fs.readFileSync(this.config.ssl.key,'utf8'),
				cert: fs.readFileSync(this.config.ssl.cert,'utf8')
			};
		}else{
			console.log("Error: could not find ssl config in\""+this.config.ssl+"\"");
			process.exit(1);
		}		

		//////////////////////////////////////////////////////////////////////
		// This creates an http server. Right now this is only being used to 
		// redirect traffic to the https server.
		//////////////////////////////////////////////////////////////////////

		this.http = require('http');

		//////////////////////////////////////////////////////////////////////
		// This creates an https server.
		//////////////////////////////////////////////////////////////////////

		this.https = require('https');

		//////////////////////////////////////////////////////////////////////
		// Nodebb connector
		//////////////////////////////////////////////////////////////////////		

		this.NodebbConnector = require(this.config.root_dir+'/server/connectors/NodebbConnector');


		//////////////////////////////////////////////////////////////////////
		// Socket.io connector
		//////////////////////////////////////////////////////////////////////

		this.SocketIOConnector = require(this.config.root_dir+'/server/connectors/SocketIOConnector');

	}

	//////////////////////////////////////////////////////////////////////
	// Server.start() - Member function for starting the 4bar server
	// 
	// Objectives:
	//  1. Load the widgets from their definitions
	// 	2. Build static express routes
	//  3. Build community express routes from database
	//  4. Attach the express session to socket.io
	//  5. Build the socket.io routes
	//  6. Start http/https servers
	//
	//////////////////////////////////////////////////////////////////////	

	start(){
		let self = this;	

		self.pg_conn = new self.PgConnector(self.config);

		self.express_conn = new self.ExpressConnector(self.config,self.pg_conn);

		self.http_server = self.http.createServer(this.express_conn.app);

		self.https_server = self.https.createServer(self.https_options,self.express_conn.app);

		self.nodebb_conn = new self.NodebbConnector(
			self.config
		);


		//////////////////////////////////////////////////////////////////////
		// Test communication with nodebb
		//////////////////////////////////////////////////////////////////////		

		self.nodebb_conn.test(
			function(success){
				self.nodebb_conn.enabled = success;
				if(success === false){
					console.log('Warning: Could not connect to nodebb at '+self.config.nodebb.address+'\nNodebb integration will be disabled.');
				}

				self.socket_io_conn = new self.SocketIOConnector(
					self.config,
					self.https_server,
					self.nodebb_conn
				);

				//////////////////////////////////////////////////////////////////////
				// Load the widget definitions
				//////////////////////////////////////////////////////////////////////		

				self.pg_conn.load_widgets(self.config.root_dir+'/server/definitions/postgres/pg_widget_definitions');
				
				//////////////////////////////////////////////////////////////////////
				// Build Express routes
				//////////////////////////////////////////////////////////////////////

				self.express_conn.build_routes(
					self.config.root_dir+'/server/definitions/express/express_route_definitions',
					self.pg_conn,
					self.socket_io_conn
				);


				//////////////////////////////////////////////////////////////////////
				// Attach the express session to socket.io
				//////////////////////////////////////////////////////////////////////		

				self.socket_io_conn.attach_session(self.express_conn.session);

				//////////////////////////////////////////////////////////////////////
				// Build the socket.io lisenteners
				//////////////////////////////////////////////////////////////////////				

				self.socket_io_conn.build_listeners(
					self.pg_conn
				);

				//////////////////////////////////////////////////////////////////////
				// Start the http server
				//////////////////////////////////////////////////////////////////////


				self.http_server.listen(self.config.server.http.port,function(){
					console.log('listening on *:'+self.config.server.http.port);
				});

				//////////////////////////////////////////////////////////////////////
				// Start the https server
				//////////////////////////////////////////////////////////////////////

				self.https_server.listen(self.config.server.https.port,function(){
					console.log('listening on *:'+self.config.server.https.port);
				});

			}
		);
	}
}