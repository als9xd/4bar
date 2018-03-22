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

		const PgConnector = require(config.root_dir+'/server/connectors/PgConnector');

		this.pg_conn = new PgConnector(config);

		//////////////////////////////////////////////////////////////////////
		// Express connector
		//////////////////////////////////////////////////////////////////////

		const ExpressConnector = require(config.root_dir+'/server/connectors/ExpressConnector');

		this.express_conn = new ExpressConnector(config);

		//////////////////////////////////////////////////////////////////////
		// Setup ssl key and certification
		//////////////////////////////////////////////////////////////////////

		const fs = require('fs');
		let options = null;
		if(config.ssl){
			options = {
				key: fs.readFileSync(config.ssl.key,'utf8'),
				cert: fs.readFileSync(config.ssl.cert,'utf8')
			};
		}else{
			console.log("Error: could not find ssl config in\""+config_file+"\"");
			process.exit(1);
		}		

		//////////////////////////////////////////////////////////////////////
		// This creates an http server. Right now this is only being used to 
		// redirect traffic to the https server.
		//////////////////////////////////////////////////////////////////////

		const http = require('http');
		this.http_server = http.createServer(this.express_conn.app);

		//////////////////////////////////////////////////////////////////////
		// This creates an https server.
		//////////////////////////////////////////////////////////////////////

		const https = require('https');
		this.https_server = https.createServer(options,this.express_conn.app);


		//////////////////////////////////////////////////////////////////////
		// Socket.io connector
		//////////////////////////////////////////////////////////////////////

		const SocketIOConnector = require(config.root_dir+'/server/connectors/SocketIOConnector');

		this.socket_io_conn = new SocketIOConnector(
			config,
			this.https_server
		);

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
		// Build all community routes from database
		//////////////////////////////////////////////////////////////////////
		
		self.pg_conn.client.query(
			"SELECT name,url,wallpaper,id FROM communities",
			function(err,community_info){
				if(err){
					console.log(err);
					return;
				}
				if(typeof community_info.rows !== 'undefined'){
					for(let i in community_info.rows){
						self.express_conn.app.get(community_info.rows[i].url, self.express_conn.middleware['check_authorization'], function(req, res){
							self.pg_conn.client.query(
								"SELECT 1 FROM community_members WHERE user_id = $1 AND community_id = $2",
								[
									req.session.user_id,
									community_info.rows[i].id
								],
								function (err,is_member) {
									if(err){
										console.log(err);
										res.render('public/error',{error:'Could not get community membership information'});
										return
									}
									res.render(
										'private/cc_template',
										{
											username: req.session.username,
											user_id: req.session.user_id,
											c_name: community_info.rows[i].name,
											c_wallpaper: community_info.rows[i].wallpaper,
											c_id: community_info.rows[i].id,
											c_url: community_info.rows[i].url,
											is_member: (is_member && is_member.rowCount)
										}
									);						
								}
							);
						});

						self.express_conn.app.get(community_info.rows[i].url+'/layout', self.express_conn.middleware['check_authorization'], function(req, res){
							res.render('private/cc_layout',
								{
									username: req.session.username,
									user_id: req.session.user_id,
									c_name: community_info.rows[i].name,
									c_wallpaper: community_info.rows[i].wallpaper,
									c_id: community_info.rows[i].id,
									c_url: community_info.rows[i].url
								}
							);
						});	

						// Build that communities tournament creation wizard route
						self.express_conn.app.get(community_info.rows[i].url+'/tc_wizard', self.express_conn.middleware['check_authorization'], function(req, res){
							res.render('private/tc_wizard',{
								username: req.session.username,
								user_id: req.session.user_id,
								c_name: community_info.rows[i].name,
								c_id: community_info.rows[i].id,
								c_url: community_info.rows[i].url
							});
						});

					}
				}

				//////////////////////////////////////////////////////////////////////
				// Attach the express session to socket.io
				//////////////////////////////////////////////////////////////////////		

				self.socket_io_conn.attach_session(self.express_conn.session);

				//////////////////////////////////////////////////////////////////////
				// Build the socket.io lisenteners
				//////////////////////////////////////////////////////////////////////				

				self.socket_io_conn.build_listeners(
					self.config.root_dir+'/server/definitions/socket_io/socket_io_listener_definitions',
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