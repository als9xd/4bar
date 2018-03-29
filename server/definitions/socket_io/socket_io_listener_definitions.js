//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/socket_io/socket_io_listener_definitions.js
//
// Overview: 
//	- Has all the definitions for socket.io listeners
//
// When to use Socket.io:
//
// Suppose we have two users A and B. Imagine A is creating a new community and
// B is looking at a list of communities. Once A creates a new community B's
// web-browser has no idea it was created. Normally it wouldn't show up in his
// communities list until he refreshes the page. Socket.io, however, allows for 
// a constant connection to B. This means as soon as A creates a community, node
// can give B's web-browser the new community without him having to refresh.
//
// A real world example can be found on '4bar/client/views/private/home.handlebars'
//////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////
// This module is used for password encryption within the 'login' and
// 'register' socket listeners
//////////////////////////////////////////////////////////////////////
const crypto = require('crypto');

const path = require('path');

const fs = require('fs');

module.exports = function(config,pg_conn,ss,uuidv1){	
	
	let widget_definitions = pg_conn.widget_definitions;

	return [

		/******************************** Example ***************************************/

		/* Within client-side, where >>client_message<< is some string

			socket.emit(>>client_message<<,'Hello World');
		
		*/

		/* Within Server-side (here)
		// Note '(socket) => {}' is equivalent to 'function(socket){}'

		(socket) => {
			socket.on(>>client_message<<,function(>>client_data<<){
				console.log(>>client_data<<); // outputs 'Hello World'
			});
		},

		*/

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener allows a user to login
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('login_req',function(data){
				if(!data.username){
					socket.emit('notification',{error:'Username is required'});
					return;
				}

				if(!data.password){
					socket.emit('notification',{error:'Please enter your password'});
					return;
				}

				pg_conn.client.query(
					"SELECT * FROM users \
						WHERE username = $1 \
						LIMIT 1 \
					",
					[
						data.username
					],
					function(err,user_info){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not get user'});
						}else if(user_info && user_info.rows.length){
							crypto.pbkdf2(
								data.password,
								user_info.rows[0].password_salt,
								Number(user_info.rows[0].password_iterations),
								user_info.rows[0].password.length,
								'sha256',
								function(err,str_hash){
									if(err){
										console.log(err);
									}else if(user_info.rows[0].password.equals(str_hash)){

										// This is used to check whether a user is logged in within the check_auth middleware
										socket.handshake.session.auth = true;

										socket.handshake.session.user_id = user_info.rows[0].id;
										socket.handshake.session.username = user_info.rows[0].username;
										socket.handshake.session.full_name = user_info.rows[0].name;
										socket.handshake.session.email = user_info.rows[0].email;
										socket.handshake.session.avatar = user_info.rows[0].avatar;

										socket.handshake.session.save();

										socket.emit('notification',{success: 'Successfully Logged in!'});	
										socket.emit('login_status',{status:true});
									}else{
										socket.emit('notification',{error: 'Invalid username or password'});
									}
								}
							);
						}else{
							socket.emit('notification',{error:'Invalid username or password'});
						}
					}
				);
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener allows a user to register
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('register_req',function(data){
				if(!data.username){
					socket.emit('notification',{error:'Username is required'});
					return;
				}

				if(!data.password){
					socket.emit('notification',{error:'Password is required'});
					return;
				}

				if(!data.password_confirmation){
					socket.emit('notification',{error:'Please confirm your password'});
					return;
				}

				if(data.password !== data.password_confirmation){
					socket.emit('notification',{error:'Passwords do not match'});
					return;		
				}

				// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
				let __invalid_lengths = function(table_name,lengths_obj){
					let inv_lens = [];
					for(let i in lengths_obj){
						if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
							inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
						}
						
					}
					return inv_lens;
				}


				// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
				let invalid_lengths = __invalid_lengths(
					'users',
					[
						[
							data.full_name, // Input string #1
							'name' // Check input string #1's length against the VARCHAR limits for column 'name'
						],
						[
							data.username,
							'username'
						],
						[
							data.email,
							'email'
						]
					]
				);
				if(invalid_lengths.length){
					let invalid_length_errors = [];
					for(var i in invalid_lengths){
						let table_name = invalid_lengths[i].table_name;
						invalid_length_errors.push(table_name.charAt(0).toUpperCase()+table_name.slice(1) + ' must be less than ' + invalid_lengths[i].limit + ' characters');
					}
					socket.emit('notification',{title:'Did not meet length requirements',error:invalid_length_errors});
					return;
				}	

				let __check_password_validity = function(str){
					let reqs = config.registration.password;
					
					let invalid_msgs = [];
					
					if(str.length < reqs.min_length){
						invalid_msgs.push("at least "+reqs.min_length+" character"+(reqs.min_length==1?"":"s")+" long")
					}
					if(str.replace(/[^A-Z]/g, "").length < reqs.min_alpha){
						invalid_msgs.push("at least "+reqs.min_alpha+" capital letter"+(reqs.min_alpha==1?"":"s"));
					}
					if(str.replace(/[^a-z]/g, "").length < reqs.min_lowercase){
						invalid_msgs.push("at least "+reqs.min_lowercase+" lowercase letter"+(reqs.min_lowercase==1?"":"s"));
					}
					if(str.replace(/[^0-9]/g, "").length < reqs.min_numbers){
						invalid_msgs.push("at least "+reqs.min_numbers+" number"+(reqs.min_numbers==1?"":"s"));
					}
					if(str.replace(/[^!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g,"").length < reqs.min_specials){
						invalid_msgs.push("at least "+reqs.min_specials+" special characters");
					}

					return invalid_msgs;					
				}

				// This is custom method that checks the password against the rules defined in the config file
				let invalid_pwd_msgs = __check_password_validity(data.password);
				if(invalid_pwd_msgs.length){
					socket.emit('notification',{title:'Did not meet password requirements',error:invalid_pwd_msgs});
					return;	
				}

				pg_conn.client.query(
					"SELECT username FROM users \
						WHERE username = $1 \
						LIMIT 1 \
					",
					[
						data.username
					],
					function(err,results){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if username is already used'});
							return;
						}else if(results && results.rows.length === 0){

							let salt = crypto.randomBytes(config.crypto.password.salt_bytes).toString('base64');
						    crypto.pbkdf2(data.password, salt, config.crypto.password.iterations, config.crypto.password.hash_bytes,'sha256',
						    	function(err,hash){
						    		if(err){
						    			console.log(err);
						    			socket.emit('notification',{error:'Could not encrypt password'});
						    			return;
						    		}else{
										pg_conn.client.query(
											"INSERT INTO users (username,name,password,password_salt,password_iterations,email) \
												VALUES ($1,$2,$3,$4,$5,$6) \
											RETURNING id \
											",
											[
												data.username,
												data.full_name,
												hash,
												salt,
												config.crypto.password.iterations,
												data.email
											],
											function(err,results){
												if(err){
													console.log(err);
													socket.emit('notification',{error:'Could not create user'});
													return;
												}
												// This is used to check whether a user is logged in within the check_auth middleware
												socket.handshake.session.auth = true;
												
												socket.handshake.session.user_id = results.rows[0].id;
												socket.handshake.session.username = data.username;
												socket.handshake.session.full_name = data.full_name;
												socket.handshake.session.email = data.email;
												socket.handshake.session.save();

												socket.emit('notification',{success:'Successfully registered!'});
												socket.emit('register_status',{status:true});
											}
										);    			
						    		}

						    	}
						    );
						}else{
							socket.emit('notification',{error:'User already exists'});
							return;
						}
					}
				);
			});

		},

		/********************************************************************************/

		(socket) => {
			socket.on('friends_req',function(){
				if(typeof socket.handshake.session.user_id === 'undefined'){
					return;
				}
				
				pg_conn.client.query(
					"SELECT users.id,users.username,users.avatar FROM users "+
					  "INNER JOIN friend_requests ON users.id = friend_requests.rx_user_id "+
					  "WHERE friend_requests.tx_user_id = $1 AND "+
					  "EXISTS (SELECT 1 FROM friend_requests WHERE tx_user_id = $1 AND rx_user_id = friend_requests.rx_user_id)"
					  ,
					[
						socket.handshake.session.user_id
					],
					function(err,friends){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not get friends'});
							return;
						}
						socket.emit('friends_res',friends.rows);
					}
				);
			});
		},


		/********************************************************************************/


		//////////////////////////////////////////////////////////////////////
		// This listener will retrieve a list of notifications to be dispayed
		// in a user's dropdown notification menu in the navbar
		//////////////////////////////////////////////////////////////////////

		(socket) => {
			socket.on('dropdown_notifications_req',function(){

				if(typeof socket.handshake.session.user_id === 'undefined'){
					return;
				}

				// This allows other users to send a notification to another user by their user_id
				socket.join(socket.handshake.session.user_id);

				let promises = [];

				for(let i in pg_conn.dropdown_notification_definitions){
					if(pg_conn.dropdown_notification_definitions.hasOwnProperty(i)){
						promises.push(pg_conn.dropdown_notification_definitions[i](socket));
					}
				}

				Promise.all(
					promises
					).then(
					function(values){
						let notifications = {}
						// Will probably need to order by date here
						for(let i = 0; i < values.length;i++){
							notifications[values[i].type] = values[i].data; 
						}
						socket.emit('dropdown_notifications_res',notifications);
					}
				);

			});
		},

		/********************************************************************************/

		(socket,io) => {

			socket.on('friend_request_submit',function(data){

				if(typeof socket.handshake.session.user_id === 'undefined'){
					return;
				}

				data.recipient_user_id = Number(data.recipient_user_id);

				if(isNaN(data.recipient_user_id)){
					socket.emit('notification',{error: 'User id for dropdown notification must be an integer'});
					return;
				}

				if(socket.handshake.session.user_id === data.recipient_user_id){
					socket.emit('notification',{error: "You can't send a friend request to yourself"});
					return;
				}
				
				pg_conn.client.query(
					"SELECT 1 FROM friend_requests WHERE rx_user_id = $1 AND tx_user_id = $2 LIMIT 1",
					[
						data.recipient_user_id,
						socket.handshake.session.user_id
					],
					function(err,friend_request_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if friend request already exists'});
							return;
						}

						if(typeof friend_requests !== 'undefined' && friend_requests.rowCount !== 0){
							socket.emit('notification',{error: 'You have already sent this user a friend request'});
							return;
						}

						pg_conn.client.query(
							"SELECT notification_id FROM friend_requests WHERE tx_user_id = $1 AND rx_user_id = $2 LIMIT 1",
							[
								data.recipient_user_id,
								socket.handshake.session.user_id
							],
							function(err,accept_req){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not check if this is a request or response'});
									return;
								}
								let ntf_date = new Date();

								let __build_friend_request = function(notification_id){
									pg_conn.client.query(
										"INSERT INTO friend_requests (notification_id,rx_user_id,tx_user_id) \
											VALUES($1,$2,$3) \
										",
										[
											notification_id,
											data.recipient_user_id,
											socket.handshake.session.user_id
										],
										function(err){
											if(err && err.code === '23505'){
												socket.emit('notification',{error: 'Friend request already sent'});
												return;
											}
											if(err){
												console.log(err);
												socket.emit('notification',{error: 'Could not send friend request'});
												return;
											}

											pg_conn.client.query(
												"SELECT users.id,users.username,users.avatar FROM USERS WHERE id = $1",
												[
													data.recipient_user_id
												],
												function(err,recipient_user_data){
													if(err){
														console.log(err);
														socket.emit('notification',{error:'Could not get user information'});
														return;
													}

													if(typeof recipient_user_data === 'undefined' || recipient_user_data.rowCount === 0){
														socket.emit('notification',{error:'No user with id of '+recipient_user_id});
														return;
													}


													if(notification_id !== null){
														io.sockets.in(data.recipient_user_id).emit('dropdown_notifications_res',
															{
																friend_requests: 
																[
																	{
																		id: socket.handshake.session.user_id,
																		username: recipient_user_data.rows[0].username,
																		avatar: recipient_user_data.rows[0].avatar,
																		date: ntf_date,
																		// Display as a friend request 
																		type: 'REQUEST'
																	}
																]
															}	
														);
														socket.emit('notification',{success: 'Successfully sent friend request'});
														socket.emit('friend_request_status',{status:true,type:'REQUEST'});
													}else{
														pg_conn.client.query(
															"UPDATE notifications SET active = FALSE WHERE id = $1",
															[
																accept_req.rows[0].notification_id
															],
															function(err){
																if(err){
																	console.log(err);
																	socket.emit('notification',{error: 'Could not update notifications'});
																	return;
																}
																socket.emit('notification',{success: 'Successfully accepted friend request'});
																socket.emit('friend_request_status',{status:true,type:'ACCEPT'});
																io.sockets.in(data.recipient_user_id).emit('dropdown_notifications_res',
																	{
																		friend_requests: 
																		[
																			{
																				id: socket.handshake.session.user_id,
																				username: recipient_user_data.rows[0].username,
																				avatar: recipient_user_data.rows[0].avatar,
																				date: ntf_date,
																				type: 'ACCEPT'
																			}
																		]
																	}	
																);
															}
															
														);

														
													}

													
												}
											);

										}
									);
								}


								if(accept_req.rowCount === 1){
									__build_friend_request(null);
								}else{
									pg_conn.client.query(
										"INSERT INTO notifications(date,active,read) \
											VALUES($1,$2,$3) \
											RETURNING id \
										",
										[
											ntf_date,
											true,
											false
										],
										function(err,notification_id){
											if(err){
												console.log(err);
												socket.emit('notification',{error:'Could not create notification'});
												return;
											}
											__build_friend_request(notification_id.rows[0].id);
										}
									);
								}
							}
						);
					}

				);
			});
		},

		/********************************************************************************/

		(socket) => {
			socket.on('tournament_submit',function(data){

				if(typeof data.community_id === 'undefined'){
					socket.emit('notification',{error:'Community id is required'});
					return;
				}

				data.community_id = Number(data.community_id);

				if(isNaN(data.community_id)){
					socket.emit('notification',{error:'Community id must be a number'});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM communities WHERE id = $1",
					[
						data.community_id
					],
					function(err,community_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if community exists'});
							return;
						}

						if(typeof community_exists === 'undefined' || community_exists.rowCount === 0){
							socket.emit('notification',{error:'Community with id of '+data.community_id+' does not exist'});
							return;							
						}

						pg_conn.client.query(
							"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2",
							[
								socket.handshake.session.user_id,
								data.community_id
							],
							function(err,privilege_level){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not get privilege information for community'});
									return;
								}


								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0 ){
									socket.emit('notification',{error:'You must be a member of the community to create a tournament'});
									return;
								}

								if(Number(privilege_level.rows[0].privilege_level) > config.privileges['mod']){
									socket.emit('notification',{error:'Insufficient privileges to create a tournament'});
									return;							
								}

								if(typeof data.name === 'undefined' || data.name.length === 0){
									socket.emit('notification',{error:'Tournament name is required'});
									return;
								}

								pg_conn.client.query(
									"SELECT 1 FROM tournaments WHERE name = $1 AND community_id = $2 LIMIT 1",
									[
										data.name,
										data.community_id
									],
									function(err,tournament_exists){
										if(err){
											console.log(err);
											socket.emit('notification',{error:'Could not check if tournament name already exists'});
											return;
										}else if(typeof tournament_exists !== 'undefined' && tournament_exists.rows.length === 0){

											// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
											let __invalid_lengths = function(table_name,lengths_obj){
												let inv_lens = [];
												for(let i in lengths_obj){
													if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
														inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
													}

												}
												return inv_lens;
											}

											let invalid_lengths = __invalid_lengths(
												'tournaments', // Table name
												[
													[
														data.name, // Input string #1
														'name' // Check input string #1's length against the VARCHAR limits for column 'name'
													],
													[
														data.location,
														'location'
													]
												]
											);
											if(invalid_lengths.length){
												let invalid_length_errors = [];
												for(var i in invalid_lengths){
													let table_name = invalid_lengths[i].table_name;
													invalid_length_errors.push(table_name.charAt(0).toUpperCase()+table_name.slice(1) + ' must be less than ' + invalid_lengths[i].limit + ' characters');
												}
												socket.emit('notification',{error:invalid_length_errors});
												return;
											}
											
											data.name = String(data.name);
											data.description = String(data.description);
											data.location = String(data.location);

											data.attendee_limit = Number(data.attendee_limit);
											if(isNaN(data.attendee_limit)){
												socket.emit('notification',{error:'Attendee limit must be a number'});
												return;
											}

											data.signup_deadline = String(data.signup_deadline);
											data.start_date = String(data.start_date);

											pg_conn.client.query(
												"INSERT INTO tournaments (community_id,name,description,location,attendee_limit,signup_deadline,start_date) \
												VALUES ($1,$2,$3,$4,$5,$6,$7) \
												RETURNING id",
												[
													data.community_id,
													data.name,
													data.description,
													data.location,
													data.attendee_limit,
													data.signup_deadline,
													data.start_date
												],
												function(err,tournament_id){

													if(err){
														console.log(err);
														socket.emit('notification',{error: 'Could not insert into communities'});
														return;
													}

													let unsanitize_tags_split = data.tags.split(',');

													let tags_split = [];
													for(let i = 0; i < unsanitize_tags_split.length;i++){
														if(typeof unsanitize_tags_split[i] === 'string' && unsanitize_tags_split[i].length !== 0){
															tags_split.push(unsanitize_tags_split[i]);
														}
													}
													
													let invalid_tag_lengths = []
													for(let i = 0; i < tags_split.length;i++){
														if(tags_split[i].length >  config.pg.varchar_limits.community_tags.tag){
															invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config.pg.varchar_limits.community_tags.tag + ' characters');
														}
													}
													if(invalid_tag_lengths.length){
														socket.emit('notification',{error: invalid_tag_lengths});
														return;
													}

													// This creates an array that is the same length as the split tags. Each element is filled with the tournament id.
													let tournament_ids_arr = Array(tags_split.length).fill(tournament_id.rows[0].id);

													pg_conn.client.query(
														"INSERT INTO tournament_tags (tournament_id,tag) SELECT * FROM UNNEST ($1::integer[], $2::text[])",
														[
															tournament_ids_arr,
															tags_split
														],
														function(err){
															if(err){
																console.log(err);
																socket.emit('notification',{error: 'Could not insert tags for tournament'});
																return;
															}

															pg_conn.client.query(
																"INSERT INTO tournament_attendees (user_id,tournament_id,privilege_level) \
																	VALUES ($1,$2,$3) \
																",
																[
																	socket.handshake.session.user_id,
																	tournament_id.rows[0].id,
																	config.privileges['admin']
																],
																function(err){
																	if(err){
																		console.log(err);
																		socket.emit('notification',{error:'Could not join tournament'});
																		return;
																	}

																	// 'name' is used to differentiate between file upload success messages so that we can upload files after the tournament has been successfully submitted
																	socket.emit('notification',{success: 'Successfully created and joined tournament'});
																	socket.emit('tournament_create_status',{status:true});
																}
															);
														}
													);
												}
											);
										}else{
											socket.emit('notification',{error: 'Tournament name already taken'});
											return;
										}
									}
								);

							}
						);
					}
				);
			});

		},

		/********************************************************************************/

		(socket) => {
			socket.on('community_submit',function(data){

				if(typeof data.name === 'undefined' || data.name.length === 0){
					socket.emit('notification',{error:'Community name is required'});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM communities where name = $1 LIMIT 1",
					[
						data.name
					],
					function(err,community_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if community name already exists'});
							return;
						}else if(typeof community_exists !== 'undefined' && community_exists.rows.length === 0){

							let date = new Date;

							// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
							let __invalid_lengths = function(table_name,lengths_obj){
								let inv_lens = [];
								for(let i in lengths_obj){
									if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
										inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
									}

								}
								return inv_lens;
							}

							let invalid_lengths = __invalid_lengths(
								'communities', // Table name
								[
									[
										data.name, // Input string #1
										'name' // Check input string #1's length against the VARCHAR limits for column 'name'
									],
									[
										date,
										'last_activity'
									]
								]
							);
							if(invalid_lengths.length){
								let invalid_length_errors = [];
								for(var i in invalid_lengths){
									let table_name = invalid_lengths[i].table_name;
									invalid_length_errors.push(table_name.charAt(0).toUpperCase()+table_name.slice(1) + ' must be less than ' + invalid_lengths[i].limit + ' characters');
								}
								socket.emit('notification',{error:invalid_length_errors});
								return;
							}

							pg_conn.client.query(
								"INSERT INTO communities (name,description,last_activity,num_members) \
								VALUES ($1,$2,$3,$4) \
								RETURNING id",
								[
									data.name,
									data.description,
									date,
									0
								],
								function(err,community_id){

									if(err){
										console.log(err);
										socket.emit('notification',{error: 'Could not insert into communities'});
										return;
									}

									let tags_split = data.tags.split(',');

									let invalid_tag_lengths = []
									for(let i = 0; i < tags_split.length;i++){
										if(tags_split[i].length >  config.pg.varchar_limits.community_tags.tag){
											invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config.pg.varchar_limits.community_tags.tag + ' characters');
										}
									}
									if(invalid_tag_lengths.length){
										socket.emit('notification',{error: invalid_tag_lengths});
										return;
									}

									// This creates an array that is the same length as the split tags. Each element is filled with the community id.
									let community_ids_arr = Array(tags_split.length).fill(community_id.rows[0].id);

									pg_conn.client.query(
										"INSERT INTO community_tags (community_id,tag) SELECT * FROM UNNEST ($1::integer[], $2::text[])",
										[
											community_ids_arr,
											tags_split
										],
										function(err){
											if(err){
												console.log(err);
												socket.emit('notification',{error: 'Could not insert tags for community'});
												return;
											}

											pg_conn.client.query(
												"INSERT INTO community_members (user_id,community_id,privilege_level) \
													VALUES ($1,$2,$3) \
												",
												[
													socket.handshake.session.user_id,
													community_id.rows[0].id,
													config.privileges['admin']
												],
												function(err){
													if(err){
														console.log(err);
														socket.emit('notification',{error:'Could not join community'});
														return;
													}

													// 'name' is used to differentiate between file upload success messages so that we can upload files after the community has been successfully submitted
													socket.emit('notification',{success: 'Successfully created and joined community'});
													socket.emit('community_creation_status',{status: true,new_community_id: community_id.rows[0].id});
												}
											);
										}
									);
								}
							);
						}else{
							socket.emit('notification',{error: 'Community name already taken'});
							return;
						}
					}
				);
			});

		},

		/********************************************************************************/

		(socket) => {
			socket.on('edit_community',function(data){

				if(typeof data.community_id === 'undefined'){
					socket.emit('notification',{error:'Community id is required'});
					return;
				}

				data.community_id = Number(data.community_id);

				if(isNaN(data.community_id)){
					socket.emit('notification',{error: 'Community id must be a number'});
				}

				pg_conn.client.query(
					"SELECT 1 FROM communities WHERE id = $1 LIMIT 1",
					[
						data.community_id
					],
					function(err,community_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:"Couldn't check if community exists"});
							return;
						}

						if(typeof community_exists === 'undefined' || community_exists.rowCount === 0){
							socket.emit('error',{error:"Community with id of "+data.community_id+" doesn't exist"});
							return;
						}

						pg_conn.client.query(
							"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2",
							[
								socket.handshake.session.user_id,
								data.community_id
							],
							function(err,privilege_level){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not get privilege information from community'});
									return;
								}

								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
									socket.emit('notification',{error:'You must be a member to edit a community'});
									return;
								}

								if(privilege_level.rows[0].privilege_level > config.privileges['admin']){
									socket.emit('notification',{error:'Insufficient privleges to edit community'});
									return;
								}

								if(typeof data.name === 'undefined' || data.name.length === 0){
									socket.emit('notification',{error:'Community name is required'});
									return;
								}

								pg_conn.client.query(
									"SELECT id FROM communities where name = $1 LIMIT 1",
									[
										data.name
									],
									function(err,community_exists){
										if(err){
											console.log(err);
											socket.emit('notification',{error:'Could not check if community name already exists'});
											return;
										}


										if(typeof community_exists !== 'undefined' && 
												community_exists.rowCount === 1 && Number(community_exists.rows[0].id) !== data.community_id
											){
											socket.emit('notification',{error: 'Community name already taken'});
											return;

										}


										let date = new Date;

										// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
										let __invalid_lengths = function(table_name,lengths_obj){
											let inv_lens = [];
											for(let i in lengths_obj){
												if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
													inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
												}

											}
											return inv_lens;
										}

										let invalid_lengths = __invalid_lengths(
											'communities', // Table name
											[
												[
													data.name, // Input string #1
													'name' // Check input string #1's length against the VARCHAR limits for column 'name'
												],
												[
													date,
													'last_activity'
												]
											]
										);
										if(invalid_lengths.length){
											let invalid_length_errors = [];
											for(var i in invalid_lengths){
												let table_name = invalid_lengths[i].table_name;
												invalid_length_errors.push(table_name.charAt(0).toUpperCase()+table_name.slice(1) + ' must be less than ' + invalid_lengths[i].limit + ' characters');
											}
											socket.emit('notification',{error:invalid_length_errors});
											return;
										}

										pg_conn.client.query(
											"UPDATE communities SET \
												name = $1, \
												description = $2, \
												last_activity = $3 \
											WHERE id = $4 \
											",
											[
												data.name,
												data.description,
												date,
												data.community_id
											],
											function(err,community_id){

												if(err){
													console.log(err);
													socket.emit('notification',{error: 'Could not update community'});
													return;
												}

												pg_conn.client.query(
													"DELETE FROM community_tags WHERE community_id = $1",
													[
														data.community_id
													],
													function(err){
														if(err){
															console.log(err);
															socket.emit('notification',{error: 'Could not remove old community tags'});
															return;
														}

														let tags_split = data.tags.split(',');

														let invalid_tag_lengths = []
														for(let i = 0; i < tags_split.length;i++){
															if(tags_split[i].length >  config.pg.varchar_limits.community_tags.tag){
																invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config.pg.varchar_limits.community_tags.tag + ' characters');
															}
														}
														if(invalid_tag_lengths.length){
															socket.emit('notification',{error: invalid_tag_lengths});
															return;
														}

														// This creates an array that is the same length as the split tags. Each element is filled with the community id.
														let community_ids_arr = Array(tags_split.length).fill(data.community_id);

														pg_conn.client.query(
															"INSERT INTO community_tags (community_id,tag) SELECT * FROM UNNEST ($1::integer[], $2::text[])",
															[
																community_ids_arr,
																tags_split
															],
															function(err){
																if(err){
																	console.log(err);
																	socket.emit('notification',{error: 'Could not insert tags for community'});
																	return;
																}

																socket.emit('notification',{success: 'Successfully edited the community'});
																socket.emit('edit_community_status',{status:true});
															}
														);
													}
												);
											}
										);
														
									}
								);

							}

						);
					}
				);
			});

		},

		/********************************************************************************/

		(socket) => {
			socket.on('edit_tournament',function(data){

				if(typeof data.tournament_id === 'undefined'){
					socket.emit('notification',{error:'Tournament id is required'});
					return;
				}

				data.tournament_id = Number(data.tournament_id);

				if(isNaN(data.tournament_id)){
					socket.emit('notification',{error: 'Tournament_id id must be a number'});
				}

				pg_conn.client.query(
					"SELECT community_id FROM tournaments WHERE id = $1 LIMIT 1",
					[
						data.tournament_id
					],
					function(err,tournament_community){
						if(err){
							console.log(err);
							socket.emit('notification',{error:"Couldn't check if tournament exists"});
							return;
						}

						if(typeof tournament_community === 'undefined' || tournament_community.rowCount === 0){
							socket.emit('error',{error:"Tournament with id of "+data.tournament_id+" doesn't exist"});
							return;
						}

						pg_conn.client.query(
							"SELECT privilege_level FROM tournament_attendees WHERE user_id = $1 AND tournament_id = $2",
							[
								socket.handshake.session.user_id,
								data.tournament_id
							],
							function(err,privilege_level){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not get privilege information from tournament'});
									return;
								}

								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
									socket.emit('notification',{error:'You must be a member to edit a tournament'});
									return;
								}

								if(privilege_level.rows[0].privilege_level > config.privileges['admin']){
									socket.emit('notification',{error:'Insufficient privleges to edit tournament'});
									return;
								}

								if(typeof data.name === 'undefined' || data.name.length === 0){
									socket.emit('notification',{error:'Tournament name is required'});
									return;
								}

								pg_conn.client.query(
									"SELECT id FROM tournaments WHERE name = $1 AND community_id = $2 LIMIT 1",
									[
										data.name,
										tournament_community.rows[0].community_id
									],
									function(err,tournament_exists){
										if(err){
											console.log(err);
											socket.emit('notification',{error:'Could not check if tournament name already exists'});
											return;
										}

										if(typeof tournament_exists !== 'undefined' && 
												tournament_exists.rowCount === 1 && Number(tournament_exists.rows[0].id) !== data.tournament_id
											){
											socket.emit('notification',{error: 'Tournament name already taken'});
											return;

										}

										// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
										let __invalid_lengths = function(table_name,lengths_obj){
											let inv_lens = [];
											for(let i in lengths_obj){
												if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
													inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
												}

											}
											return inv_lens;
										}

										let invalid_lengths = __invalid_lengths(
											'tournaments', // Table name
											[
												[
													data.name, // Input string #1
													'name' // Check input string #1's length against the VARCHAR limits for column 'name'
												],
												[
													data.location,
													'location'
												]
											]
										);
										if(invalid_lengths.length){
											let invalid_length_errors = [];
											for(var i in invalid_lengths){
												let table_name = invalid_lengths[i].table_name;
												invalid_length_errors.push(table_name.charAt(0).toUpperCase()+table_name.slice(1) + ' must be less than ' + invalid_lengths[i].limit + ' characters');
											}
											socket.emit('notification',{error:invalid_length_errors});
											return;
										}

										data.name = String(data.name);
										data.description = String(data.description);
										data.location = String(data.location);

										data.attendee_limit = Number(data.attendee_limit);
										if(isNaN(data.attendee_limit)){
											socket.emit('notification',{error:'Attendee limit must be a number'});
											return;
										}

										data.signup_deadline = String(data.signup_deadline);
										data.start_date = String(data.start_date);

										pg_conn.client.query(
											"UPDATE tournaments SET \
												name = $1, \
												description = $2, \
												location = $3, \
												attendee_limit = $4, \
												signup_deadline = $5, \
												start_date = $6 \
											WHERE id = $7 \
											",
											[
												data.name,
												data.description,
												data.location,
												data.attendee_limit,
												data.signup_deadline,
												data.start_date,
												data.tournament_id
											],
											function(err){
												if(err){
													console.log(err);
													socket.emit('notification',{error: 'Could not update tournament'});
													return;
												}

												pg_conn.client.query(
													"DELETE FROM tournament_tags WHERE tournament_id = $1",
													[
														data.tournament_id
													],
													function(err){
														if(err){
															console.log(err);
															socket.emit('notification',{error:'Could not delete old community tags'});
															return;
														}

														let unsanitize_tags_split = data.tags.split(',');

														let tags_split = [];
														for(let i = 0; i < unsanitize_tags_split.length;i++){
															if(typeof unsanitize_tags_split[i] === 'string' && unsanitize_tags_split[i].length !== 0){
																tags_split.push(unsanitize_tags_split[i]);
															}
														}

														let invalid_tag_lengths = []
														for(let i = 0; i < tags_split.length;i++){
															if(tags_split[i].length >  config.pg.varchar_limits.community_tags.tag){
																invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config.pg.varchar_limits.community_tags.tag + ' characters');
															}
														}
														if(invalid_tag_lengths.length){
															socket.emit('notification',{error: invalid_tag_lengths});
															return;
														}

														// This creates an array that is the same length as the split tags. Each element is filled with the tournament id.
														let tournament_ids_arr = Array(tags_split.length).fill(data.tournament_id);

														pg_conn.client.query(
															"INSERT INTO tournament_tags (tournament_id,tag) SELECT * FROM UNNEST ($1::integer[], $2::text[])",
															[
																tournament_ids_arr,
																tags_split
															],
															function(err){
																if(err){
																	console.log(err);
																	socket.emit('notification',{error: 'Could not insert tags for tournament'});
																	return;
																}

																socket.emit('notification',{success: 'Successfully updated tournament'});
																socket.emit('edit_tournament_status',{status:true});
															}
														);

													}
												);
											}
										);																
									}
								);
							}
						);
					}
				);
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener gets all the widgets for a particular community
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('widgets_req',function(community_id){
				pg_conn.client.query(
					"SELECT layout \
						FROM communities \
						WHERE id = $1 LIMIT 1 \
					",
					[
						community_id
					],
					function(err,results){
						if(err){
							console.log(err);
							return;
						}

						let layout = JSON.parse(results.rows[0].layout);
						if(layout){
							for(let i in layout){
								if(layout.hasOwnProperty(i)){
									if(typeof widget_definitions[layout[i].type] !== 'undefined'){
										widget_definitions[layout[i].type].get(layout[i].id,function(widgets,notification){
											if(widgets){
												for(let r = 0; r < widgets.length;r++){
													layout[i].data = widgets[r];
													socket.emit('widgets_res',layout[i]);								
												}									
											}
											if(notification){
												socket.emit('notification',notification);
											}	
										});
									}else{
										socket.emit('notification',{error:"Unknown widget type \'"+layout[i].type+"\'"})
									}
								}
							}
						}
					}
				);		
			});			

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener is used to allow a community to submit a layout for
		// their available widgets
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('layout_submit_req',function(data){
				pg_conn.client.query(
					"UPDATE communities \
						SET layout = $1 \
						WHERE id = $2 \
					",
					[
						JSON.stringify(data.layout),
						data.community_id
					],function(err,results){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Layout could not be saved'});
							return;
						}
						socket.emit('notification',{success:'Successfully saved layout'});
						socket.emit('layout_submit_status',{status:true});
					}
				);
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener sends all the widgets that a community is able to 
		// choose from to add to their community
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('available_widgets_req',function(community_id){
				for(let widget_type in widget_definitions){
					if(widget_definitions.hasOwnProperty(widget_type)){
						widget_definitions[widget_type].available(community_id,function(available_widgets,notification){
							if(available_widgets){
								for(let r = 0; r < available_widgets.length;r++){
									socket.emit('available_widgets_res',{type:widget_type,id:available_widgets[r].id,data:available_widgets[r]});	
								}						
							}
							if(notification){
								socket.emit('notification',notification);
							}
						});
					}else{
						socket.emit('notification',{error:"Unknown widget type \'"+widget_type+"\'"});
					}
				}
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener allows a community to submit a new widget with data
		// to be loaded into the database
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('widget_submit_req',function(data){
				if(typeof data.community_id === 'undefined'){
					socket.emit('notification',{error:'Could not find community id in widget'});
					return;
				}

				data.community_id = Number(data.community_id);

				if(isNaN(data.community_id)){
					socket.emit('notification',{error:'Widget community id must be a number'});
					return;
				}

				if(typeof widget_definitions[data.type] !== 'undefined'){
					widget_definitions[data.type].add(data.community_id,data.data,function(success,notification){
						notification.name = "widget_submit_res";
						socket.emit('notification',notification);
						if(success){
							socket.emit('widget_submit_status',{status:true});
						}
					});			
				}else{
					socket.emit('notification',{error:"Unknown widget type \'"+data.type+"\'"})
				}
			});

		},

		/********************************************************************************/


		//////////////////////////////////////////////////////////////////////
		// This listener allows user to toggle whether they are a member of 
		// a community
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('toggle_community_membership',function(community_id){
				pg_conn.client.query(
					"SELECT 1 FROM community_members \
						WHERE community_members.user_id = $1 AND community_members.community_id = $2 \
					",
					[
						socket.handshake.session.user_id,
						Number(community_id)
					],function(err,is_member){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not search community members'});
							return;
						}
						if(is_member && is_member.rowCount){
							pg_conn.client.query(
								"DELETE FROM community_members \
									WHERE community_members.user_id = $1 AND community_members.community_id = $2",
								[
									socket.handshake.session.user_id,
									Number(community_id)
								]
								,function(err){
									if(err){
										console.log(err);
										socket.emit('notification',{error:'Could not remove you from the community'});
										return;
									}
									socket.emit('notification',{success:'Successfully left community'});							
									socket.emit('toggle_community_status',{status:true});
								}
							);
						}else if(is_member && is_member.rowCount === 0){
							pg_conn.client.query(
								"INSERT INTO community_members (user_id,community_id,privilege_level) \
									VALUES ($1,$2,$3) \
								",
								[
									socket.handshake.session.user_id,
									Number(community_id),
									config.privileges['member']
								],
								function(err){
									if(err){
										console.log(err);
										socket.emit('notification',{error:'Could not join you to the community'});
										return;
									}
									socket.emit('notification',{success:'Successfully joined community'});							
									socket.emit('toggle_community_status',{status:true});
								}
							);
						}
					}
				);
			});

		},


		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener allows user to toggle whether they are a member of 
		// a community
		//////////////////////////////////////////////////////////////////////
		
		(socket) => {

			socket.on('toggle_tournament_membership',function(tournament_id){

				tournament_id = Number(tournament_id);

				if(isNaN(tournament_id)){
					socket.emit('notification',{error:"Tournament id must be a number"});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM tournaments WHERE id = $1 LIMIT 1",
					[
						tournament_id
					],
					function(err,tournament_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if tournament exists'});
							return;
						}

						if(typeof tournament_exists === 'undefined' || tournament_exists.rowCount === 0){
							socket.emit('notification',{error:'Tournament with id of '+tournament_id+' does not exist'});
							return;
						}

						pg_conn.client.query(
							"SELECT 1 FROM tournament_attendees \
								WHERE tournament_attendees.user_id = $1 AND tournament_attendees.tournament_id = $2 \
							",
							[
								socket.handshake.session.user_id,
								Number(tournament_id)
							],function(err,is_member){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not search tournament members'});
									return;
								}
								if(is_member && is_member.rowCount){
									pg_conn.client.query(
										"DELETE FROM tournament_attendees \
											WHERE tournament_attendees.user_id = $1 AND tournament_attendees.tournament_id = $2",
										[
											socket.handshake.session.user_id,
											Number(tournament_id)
										]
										,function(err){
											if(err){
												console.log(err);
												socket.emit('notification',{error:'Could not remove you from the tournament'});
												return;
											}
											socket.emit('notification',{success:'Successfully left tournament'});							
											socket.emit('toggle_tournament_status',{status:true});
										}
									);
								}else if(is_member && is_member.rowCount === 0){

									// Join tournament as member
									pg_conn.client.query(
										"INSERT INTO tournament_attendees (user_id,tournament_id,privilege_level) \
											VALUES ($1,$2,$3) \
										",
										[
											socket.handshake.session.user_id,
											Number(tournament_id),
											config.privileges['member']
										],
										function(err){
											if(err){
												console.log(err);
												socket.emit('notification',{error:'Could not join you to the tournament'});
												return;
											}
											socket.emit('notification',{success:'Successfully joined tournament'});							
											socket.emit('toggle_tournament_status',{status:true});
										}
									);
								}
							}
						);
					}

				);
			});

		},


		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener adds a node to a brachet tree for a tournament
		//////////////////////////////////////////////////////////////////////

		(socket) => {
			socket.on('add_bracket_node',function(node_data){
				pg_conn.client.query(
					"INSERT INTO tournament_brackets (tournament_id,parent_id,player_id) \
						VALUES ($1,$2,$3) \
					RETURNING id \
					",
					[
						node_data.tournament_id,
						node_data.parent_id,
						node_data.player_id
					],
					function(err,results){
						if(err){
							console.log(err)
							socket.emit('notification',{error:'Could not add bracket node'});
							return;
						}
						socket.emit('last_node_id',results.rows[0].id);
					}
				);
			});
		},

		/********************************************************************************/
		
		//////////////////////////////////////////////////////////////////////
		// This listener retrieves bracket nodes for a particular tournament
		//////////////////////////////////////////////////////////////////////

		(socket) => {
			socket.on('get_brackets',function(tournament_id){
				pg_conn.client.query(
					"SELECT * FROM tournament_brackets where tournament_id = $1",
					[
						tournament_id
					],
					function(err,results){
						if(err){
							console.log(err)
							socket.emit('notification',{error:'Could not get bracket nodes'});
							return;
						}
						socket.emit('bracket_nodes',results.rows);
					}
				);
			});
		},
		
		//////////////////////////////////////////////////////////////////////
		// This listener retrieves participants of a particular tournament
		//////////////////////////////////////////////////////////////////////

		(socket) => {
			socket.on('get_participants',function(tournament_id){
				pg_conn.client.query(
					"SELECT user_id FROM tournament_attendees where tournament_id = $1",
					[
						tournament_id
					],
					function(err,results){
						if(err){
							console.log(err)
							socket.emit('notification',{error:'Could not get participants'});
							return;
						}
						socket.emit('participants',results.rows);
					}
				);
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener updates a tournament bracket node 
		//////////////////////////////////////////////////////////////////////

		(socket) => {
			socket.on('update_bracket_node',function(node_data){
				pg_conn.client.query(
					"UPDATE tournament_brackets \
						SET player_id = $1 \
						WHERE id = $2 \
					",
					[
						node_data.player_id,
						node_data.node_id
					],function(err,results){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Bracket node could not be updated'});
							return;
						}
						socket.emit('notification',{success:'Successfully updated bracket node'});
					}
				);
			});
		}

		/********************************************************************************/

	];
}