//////////////////////////////////////////////////////////////////////
// 4bar/server/connectors/SocketIOConnector.js
//
// Overview: 
//	- Builds a connector between socket.io related functionality 
//    and definitions
//  
// Constructor Objectives:
//  1. import and initialize socket.io by attaching it to the https
//     server
//
// Public Functions:
//   
//	 SocketIOConnector.attach_session(ExpressConnector.session session)
//   SocketIOConnector.build_listeners(PgConnector pg_conn)
//
// More about socket.io:
//
//   https://socket.io/docs/
//
//////////////////////////////////////////////////////////////////////

'use strict';

const path = require('path');

module.exports = class SocketIOConnector{
		
	constructor(config,https_server,nodebb_conn){

		//////////////////////////////////////////////////////////////////////
		// Store config inside class so that it can be accessed from member 
		// functions
		//////////////////////////////////////////////////////////////////////

		this.config = config;

		this.middleware_definitions = require(config.root_dir+'/server/definitions/socket_io/socket_io_middleware_definitions');

		//////////////////////////////////////////////////////////////////////
		// Attach socket.io to the https server (all socket.io messages are
		// encrypted)
		//////////////////////////////////////////////////////////////////////	

		let io = require('socket.io')(https_server);

		this.public_ns = io.of('/public');

		this.private_ns = io.of('/private');

		this.uuidv1 = require('uuid/v1');

		this.SocketIOFile = require('socket.io-file');

		this.nodebb_conn = nodebb_conn;

	}

	//////////////////////////////////////////////////////////////////////
	// SocketIOConnector.attach_session(
	//   String definition_file,
	//   ExpressConnector.session session
	// );
	//
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
		this.public_ns.use(express_socket_io_session);
		this.private_ns.use(express_socket_io_session);
	}

	//////////////////////////////////////////////////////////////////////
	// SocketIOConnector.build_listeners(
	//   String definition_file,
	//   PgConnector pg_conn,
	//   PgConnector.widget_definitions widget_definitions
	// );
	//
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
	//				console.log('I listened for and heard "some_message"!');
	//			});
	//	   });
	// 
	//////////////////////////////////////////////////////////////////////	

	build_listeners(pg_conn){
		let self = this;

		const public_listener_definitions = require(
			self.config.root_dir+'/server/definitions/socket_io/socket_io_public_listener_definitions'
		)(this.config,pg_conn,this.nodebb_conn);

		self.public_ns.on('connection',function(socket){
			for(let i = 0; i < public_listener_definitions.length;i++){
				public_listener_definitions[i](socket,self.public_ns);
			}
		});

		const private_listener_definitions = require(
			self.config.root_dir+'/server/definitions/socket_io/socket_io_private_listener_definitions'
		)(this.config,pg_conn,self.uuidv1,this.nodebb_conn);
		
		// Add authentication middlware
		this.private_ns.use(this.middleware_definitions['check_authentication']);
		
		self.private_ns.on('connection',function(socket){

			// This allows other users to send a notification to another user by their user_id
			socket.join(socket.handshake.session.user_id);

		    let uploader = new self.SocketIOFile(socket, {
		        uploadDir: {			// multiple directories,
		        	avatar: self.config.root_dir+'/client/media/avatars',
		        	icons: self.config.root_dir+'/client/media/icons',
		        	wallpapers: self.config.root_dir+'/client/media/wallpapers'
		        },
		        // uploadDir: config.root_dir+'/client/media/uploads',							// simple directory
		        accepts: ['image/x-icon', 'image/png', 'image/jpeg'],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
		        maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
		        chunkSize: 10240,							// default is 10240(1KB)
		        transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
		        overwrite: false,
				rename: function(filename) {
				        let file_extension = path.parse(filename).ext;
					    return self.uuidv1()+file_extension;
					}
		    });

		    uploader.on('complete', (fileInfo) => {
		    	switch(fileInfo.data.type){
		    		case 'avatar': 
					pg_conn.client.query(
						"UPDATE users "+
						"SET avatar = $1 "+
						"WHERE id = $2"
						,
						[
							fileInfo.name,
							socket.handshake.session.user_id
						],
						function(err){
							if(err){
								console.log(err);
								socket.emit('notification',{error: "Could not save avatar to profile"});
								return;
							}

							socket.handshake.session.avatar = fileInfo.name;

							socket.handshake.session.save();

							socket.emit('notification',{success: "Successfully uploaded avatar"});
							socket.emit('avatar_upload_status',{status:true,url:fileInfo.name});
						}
					);
					break;

		    		case 'wallpaper': 
		    		pg_conn.client.query(
		    			"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2 LIMIT 1",
		    			[
		    				socket.handshake.session.user_id,
		    				fileInfo.data.community_id
		    			],
		    			function(err,privilege_level){
		    				if(err){
		    					console.log(err);
		    					socket.emit('notification',{error:'Could not get privilege level for community wallpaper upload'});
		    					return;
		    				}

		    				if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
		    					socket.emit('notification',{error:'You must be a member of the community to submit a wallpaper change'});
		    					return;
		    				}

		    				if(privilege_level.rows[0].privilege_level > self.config.privileges['admin']){
		    					socket.emit('notification',{error:'Insufficient privleges. You must be an admin to submit a wallpaper.'});
		    					return;
		    				}

							pg_conn.client.query(
								"UPDATE communities \
								SET wallpaper = $1 \
								WHERE id = $2 \
								RETURNING wallpaper"
								,
								[
									fileInfo.name,
									fileInfo.data.community_id
								],
								function(err,wallpaper){
									if(err){
										console.log(err);
										socket.emit('notification',{error: "Could not save wallpaper to community"});
										return;
									}

									if(typeof wallpaper === 'undefined' || wallpaper.rowCount === 0){
										socket.emit('notification',{error:"No community found with an id of '"+fileInfo.data.community_id+"'"});
										return;
									}

									socket.emit('notification',{success: "Successfully uploaded wallpaper"});
									socket.emit('wallpaper_upload_status',{status:true});
								}
							);

		    			}
		    		);
					break;

		    		case 'icon': 
		    		pg_conn.client.query(
		    			"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2 LIMIT 1",
		    			[
		    				socket.handshake.session.user_id,
		    				fileInfo.data.community_id
		    			],
		    			function(err,privilege_level){
		    				if(err){
		    					console.log(err);
		    					socket.emit('notification',{error:'Could not get privilege level for community icon upload'});
		    					return;
		    				}

		    				if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
		    					socket.emit('notification',{error:'You must be a member of the community to submit a icon change'});
		    					return;
		    				}

		    				if(privilege_level.rows[0].privilege_level > self.config.privileges['admin']){
		    					socket.emit('notification',{error:'Insufficient privleges. You must be an admin to submit a icon.'});
		    					return;
		    				}
		    				
							pg_conn.client.query(
								"UPDATE communities \
								SET icon = $1 \
								WHERE id = $2 \
								RETURNING icon"
								,
								[
									fileInfo.name,
									fileInfo.data.community_id
								],
								function(err,icon){
									if(err){
										console.log(err);
										socket.emit('notification',{error: "Could not save icon to community"});
										return;
									}

									if(typeof icon === 'undefined' || icon.rowCount === 0){
										socket.emit('notification',{error:"No community found with an id of '"+fileInfo.data.community_id+"'"});
										return;
									}

									self.nodebb_conn.modify_category(
										fileInfo.data.community_id,
										{
											_uid: 1,
											backgroundImage: config.server.address+'/icons/'+icon.rows[0].icon
										},
										function(err,response,body){
											if(!err && response.statusCode == 200){
												socket.emit('notification',{success: "Successfully uploaded icon to nodebb"});
												socket.emit('icon_upload_status',{status:true});
											}else{
												socket.emit('notification',{error: 'Could not upload community icon to nodebb'});
												return;
											}
										}
									);
								}
							);
		    			}
		    		);
					break;

					default:
					socket.emit('notification',{error: "Unknown image submission type"});
		    	}

		    });

		    uploader.on('error', (err) => {
		        console.log(err);
		        socket.emit('notification',{error: 'Could not upload file'});
		    });

			for(let i = 0; i < private_listener_definitions.length;i++){
				private_listener_definitions[i](socket,self.private_ns);
			}
		});	
	}
}