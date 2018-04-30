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

const path = require('path');

const fs = require('fs');

module.exports = function(config,pg_conn,uuidv1,nodebb_conn){	
	
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

		(socket) => {
			socket.on('friends_req',function(){
				
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

		(socket,private_ns) => {

			socket.on('friend_request_submit',function(data){

				if(typeof data.recipient_user_id === 'undefined'){
					socket.emit('notification',{error:'Recipient user id is required'});
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
								let ntf_date = Date.now();

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
														private_ns.in(data.recipient_user_id).emit('dropdown_notifications_res',
															{
																friend_requests: 
																[
																	{
																		id: socket.handshake.session.user_id,
																		username: socket.handshake.session.username,
																		avatar: socket.handshake.session.avatar,
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
																private_ns.in(data.recipient_user_id).emit('dropdown_notifications_res',
																	{
																		friend_requests: 
																		[
																			{
																				id: data.recipient_user_id,
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

											data.signup_deadline = Date.parse(String(data.signup_deadline));
											if(isNaN(data.signup_deadline)){
												socket.emit('notification',{error:'Invalid signup deadline date format'});
												return;
											}

											data.start_date = Date.parse(String(data.start_date));

											if(isNaN(data.start_date)){
												socket.emit('notification',{error:'Invalid start date format'});
												return;
											}

											pg_conn.client.query(
												"INSERT INTO tournaments (community_id,name,description,location,attendee_limit,signup_deadline,start_date,scores) \
												VALUES ($1,$2,$3,$4,$5,$6,$7,$8) \
												RETURNING id",
												[
													data.community_id,
													data.name,
													data.description,
													data.location,
													data.attendee_limit,
													data.signup_deadline,
													data.start_date,
													'[]'
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

																	let date = Date.now();

																	pg_conn.client.query(
																		"UPDATE communities SET last_activity = $1 WHERE id = $2",
																		[
																			date,
																			data.community_id
																		],function(err){
																			if(err){
																				console.log(err);
																				socket.emit('notification',{error:'Could not update last activity'});
																				return;
																			}
																			socket.emit('notification',{success: 'Successfully created and joined tournament'});
																			socket.emit('tournament_creation_status',{status:true,new_tournament_id:tournament_id.rows[0].id});																	
																		}
																	);
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
			socket.on('scores_submit',function(data){

				if(typeof data.tournament_id === 'undefined'){
					socket.emit('notification',{error:'Tournament id is required'});
					return;
				}

				data.tournament_id = Number(data.tournament_id);

				if(isNaN(data.tournament_id)){
					socket.emit('notification',{error:'Tournament id must be a number'});
					return;
				}

				function parseJSON(json){
					let parsed;
					try{
						parsed = JSON.parse(json);
					} catch(e){
					}
					return parsed;
				}

				let parseFailed = false;
				data.scores = parseJSON(data.scores,(key,value) =>{
					value = Number(value);
					if(isNaN(value)){
						parsedFailed = true;
						return;
					}else{
						return value;
					}
				});

				if(typeof data.scores === 'undefined' || parseFailed === true){
					socket.emit('notification',{error:'Invalid scores format'});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM tournaments WHERE id = $1",
					[
						data.tournament_id
					],
					function(err,tournament_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if tournament exists'});
							return;
						}

						if(typeof tournament_exists === 'undefined' || tournament_exists.rowCount === 0){
							socket.emit('notification',{error:'Tournament with id of '+data.tournament_id+' does not exist'});
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
									socket.emit('notification',{error:'Could not get privilege information for tournament'});
									return;
								}

								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0 ){
									socket.emit('notification',{error:'You must be a member of the tournament to edit scores'});
									return;
								}

								if(Number(privilege_level.rows[0].privilege_level) > config.privileges['mod']){
									socket.emit('notification',{error:'Insufficient privileges to edit scores'});
									return;							
								}

								pg_conn.client.query(
									"UPDATE tournaments SET scores = $1 WHERE id = $2",
									[
										JSON.stringify(data.scores),
										data.tournament_id
									],
									function(err){
										if(err){
											console.log(err);
											socket.emit('notification',{error:'Could not update scores'});
											return;
										}
										socket.emit('notification',{success:'Successfully updated scores'});
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
			socket.on('team_info_req',function(data){

				if(typeof data.tournament_id === 'undefined'){
					socket.emit('notification',{error:'Tournament id is required'});
					return;
				}

				data.tournament_id = Number(data.tournament_id);

				if(isNaN(data.tournament_id)){
					socket.emit('notification',{error:'Tournament id must be a number'});
					return;
				}

				pg_conn.client.query(
					"SELECT match_teams.name as team_name,users.id,users.username,users.name,users.avatar FROM match_team_members \
							INNER JOIN users ON users.id = match_team_members.user_id \
							INNER JOIN match_teams ON match_teams.id = match_team_members.team_id \
							INNER JOIN matches ON matches.id = match_teams.match_id	\
					 WHERE matches.tournament_id = $1 AND match_teams.name = $2",
					 [
					 	data.tournament_id,
					 	data.team_name
					 ],
					 function(err,results){
					 	if(err){
					 		console.log(err);
					 		socket.emit('notification',{error:'Could not get team information'});
					 		return;
					 	}
					 	socket.emit('team_info_res',results.rows);
					 }
				);
			})
		},

		/********************************************************************************/

		(socket) => {
			socket.on('match_submit',function(data){

				if(typeof data.tournament_id === 'undefined'){
					socket.emit('notification',{error:'Tournament id is required'});
					return;
				}

				data.tournament_id = Number(data.tournament_id);

				if(isNaN(data.tournament_id)){
					socket.emit('notification',{error:'Tournament id must be a number'});
					return;
				}

				data.name = String(data.name);
				data.description = String(data.description);

				data.time = Date.parse(String(data.time));

				if(isNaN(data.time)){
					socket.emit('notification',{error:'Invalid match time format'});
					return;
				}

				data.location = String(data.location);

				data.team_1_name = String(data.team_1_name);
				if(data.team_1_name.length === 0){
					socket.emit('notification',{error:'Both team names are required'});
					return;
				}

				data.team_2_name = String(data.team_2_name);
				if(data.team_2_name.length === 0){
					socket.emit('notification',{error:'Both team names are required'});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM tournaments WHERE id = $1",
					[
						data.tournament_id
					],
					function(err,tournament_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if tournament exists'});
							return;
						}

						if(typeof tournament_exists === 'undefined' || tournament_exists.rowCount === 0){
							socket.emit('notification',{error:'Tournament with id of '+data.tournament_id+' does not exist'});
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
									socket.emit('notification',{error:'Could not get privilege information for tournament'});
									return;
								}

								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0 ){
									socket.emit('notification',{error:'You must be a member of the tournament to create a match'});
									return;
								}

								if(Number(privilege_level.rows[0].privilege_level) > config.privileges['mod']){
									socket.emit('notification',{error:'Insufficient privileges to create a match'});
									return;							
								}


								if(typeof data.team_1 !== 'object'){
									socket.emit('notification',{error:'Invalid team 1 composition'});
									return;
								}

								if(data.team_1.length === 0){
									socket.emit('notification',{error:'Team 2 requires at least one member'});
									return;
								}


								if(typeof data.team_2 !== 'object'){
									socket.emit('notification',{error:'Invalid team 2 composition'});
									return;
								}

								if(data.team_2.length === 0){
									socket.emit('notification',{error:'Team 2 requires at least one member'});
									return;
								}


								function validate_team(team,callback){
									let team_promises = [];
									for(let i = 0; i < team.length;i++){
										team_promises.push(new Promise(function(resolve,reject){
											pg_conn.client.query(
												"SELECT 1 FROM users WHERE id = $1",
												[
													team[i]
												],
												function(err,user_exists){
													if(err){
														console.log(err);
														socket.emit('notification',{error:'Could not look for user'});
														reject();
														return;
													}

													if(typeof user_exists === 'undefined' || user_exists.rowCount === 0){
														socket.emit('notification',{error:'Could not find user with id of \"'+team[i]+'\"'});
														reject();
														return;
													}
													pg_conn.client.query(
														"SELECT 1 FROM tournament_attendees WHERE tournament_id = $1 AND user_id = $2",
														[
															data.tournament_id,
															team[i]
														],
														function(err,user_exists_in_t){
															if(err){
																console.log(err);
																socket.emit('notification',{error:'Could not check if user is a member of the tournament'});
																reject();
																return;
															}
															if(typeof user_exists_in_t === 'undefined' || user_exists_in_t.rowCount === 0){
																socket.emit('notification',{error:'User \"'+team[i]+'\" is not a member of the tournament'});
																reject();
																return;
															}
															resolve();
														}
													)
												}
											);
										}));
									}
									Promise.all(team_promises).then(function(values){callback(values)}).catch(()=>{socket.emit('notification',{error:'Could not validate team'})});
									return;
								}

								function add_members_to_team(team,team_id,callback){
									let team_promises = [];
									for(let i = 0; i < team.length;i++){
										team_promises.push(new Promise(function(resolve,reject){
											pg_conn.client.query(
												"INSERT INTO match_team_members(team_id,user_id) \
													VALUES($1,$2) \
												",
												[
													team_id,
													team[i]
												],
												function(err){
													if(err){
														console.log(err);
														reject('Could not add user with id of \"'+team[i]+'\" to team');
														return;
													}
													resolve();
												}
											);
										}));
									}
									Promise.all(team_promises).then(callback).catch(
										reason => {
											socket.emit('notification',{error:reason});
										}
									);
									return;
								}

								validate_team(data.team_1,function(){
									validate_team(data.team_2,function(){

										pg_conn.client.query(
											"SELECT 1 FROM match_teams INNER JOIN matches ON match_teams.match_id = matches.id INNER JOIN tournaments ON tournaments.id = matches.tournament_id WHERE tournaments.id = $1 AND match_teams.name = $2",
											[
												data.tournament_id,
												data.team_1_name
											],
											function(err,team_exists){
												if(err){
													console.log(err);
													socket.emit('notification',{error:'Could not check if team 1 name is already taken'});
													return;
												}

												if(typeof team_exists === 'undefined' || team_exists.rowCount !== 0){
													socket.emit('notification',{error:'A team named \"'+data.team_1_name+'\" already exits'});
													return;
												}

												pg_conn.client.query(
													"SELECT 1 FROM match_teams INNER JOIN matches ON match_teams.match_id = matches.id INNER JOIN tournaments ON tournaments.id = matches.tournament_id WHERE tournaments.id = $1 AND match_teams.name = $2",
													[
														data.tournament_id,
														data.team_1_name
													],
													function(err,team_exists){
														if(err){
															console.log(err);
															socket.emit('notification',{error:'Could not check if team 1 name is already taken'});
															return;
														}
														if(typeof team_exists === 'undefined' || team_exists.rowCount !== 0){
															socket.emit('notification',{error:'A team named \"'+data.team_1_name+'\" already exits'});
															return;
														}	
														pg_conn.client.query(
															"INSERT INTO matches(tournament_id,name,description,time,location) \
																VALUES($1,$2,$3,$4,$5) \
																RETURNING id \
															",
															[
																data.tournament_id,
																data.name,
																data.description,
																data.time,
																data.location
															],
															function(err,match_id){
																if(err){
																	console.log(err);
																	socket.emit('notification',{error:'Could not create match'});
																	return;
																}

																pg_conn.client.query(
																	"INSERT INTO match_teams(match_id,name) "+
																	"	VALUES($1,$2) "+
																	"	returning id ",
																	[
																		match_id.rows[0].id,
																		data.team_1_name
																	],
																	function(err,team_1_id){
																		if(err){
																			console.log(err);
																			socket.emit('notification',{error:'Could not create team 1'});
																			return;
																		}

																		add_members_to_team(data.team_1,team_1_id.rows[0].id,function(){
																			pg_conn.client.query(
																				"INSERT INTO match_teams(match_id,name) "+
																				"	VALUES($1,$2) "+
																				"	returning id ",
																				[
																					match_id.rows[0].id,
																					data.team_2_name
																				],
																				function(err,team_2_id){
																					if(err){
																						console.log(err);
																						socket.emit('notification',{error:'Could not create team 2'});
																						return;
																					}
																					add_members_to_team(data.team_2,team_2_id.rows[0].id,function(){
																						socket.emit('notification',{success:'Successfully created match'});
																						return;
																					})
																				}
																			);
																		});
																	}
																);

															}
														);													
													}
												);

											}
										);
									});
								});
							}
						);
					}
				);
			});

		},

		/********************************************************************************/

		(socket) => {
			socket.on('community_submit',function(data){

				if(typeof data.name !== 'string' || data.name.length === 0){
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

							let date = Date.now();

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
								"INSERT INTO communities (name,description,creation_date,last_activity,num_members) \
								VALUES ($1,$2,$3,$4,$5) \
								RETURNING id",
								[
									data.name,
									data.description,
									date,
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

													if(nodebb_conn.enabled === true){
														nodebb_conn.create_category(
															{
																_uid: 1,
																name: data.name,
																description: data.description
															},
															(err,response,body)=>{
																if(!err && response.statusCode == 200){
																	body = JSON.parse(body);
																	pg_conn.client.query(
																		"UPDATE communities SET nodebb_id = $1 WHERE id = $2",
																		[
																			body.payload.cid,
																			community_id.rows[0].id
																		],
																		function(err){
																			if(err){
																				console.log(err);
																				socket.emit('notification',{error:'Could not set commmunity nodebb id'});
																				return;
																			}
																			socket.emit('notification',{success: 'Successfully created and joined community'});
																			socket.emit('community_creation_status',{status: true,new_community_id: community_id.rows[0].id});
																		}
																	);
																}else{
																	console.log(err);
																	socket.emit('notification',{error: 'Could not create community forum'});
																}
															}
														);
													}else {
														socket.emit('notification',{success: 'Successfully created and joined community'});
														socket.emit('community_creation_status',{status: true,new_community_id: community_id.rows[0].id});
													}
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
									socket.emit('notification',{error:'Insufficient privileges to edit community'});
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


										let date = Date.now();

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
					socket.emit('notification',{error: 'Tournament id must be a number'});
					return;
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
									socket.emit('notification',{error:'Insufficient privileges to edit tournament'});
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

										data.signup_deadline = Date.parse(String(data.signup_deadline));
										if(isNaN(data.signup_deadline)){
											socket.emit('notification',{error:'Invalid signup deadline date format'});
											return;
										}

										data.start_date = Date.parse(String(data.start_date));

										if(isNaN(data.start_date)){
											socket.emit('notification',{error:'Invalid start date format'});
											return;
										}

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
				
				if(typeof community_id === 'undefined'){
					socket.emit('notification',{error:'Community id is required'});
					return;
				}

				community_id = Number(community_id);

				if(isNaN(community_id)){
					socket.emit('notification',{error:'Community id must be a number'});
					return;
				}

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

						if(typeof results === 'undefined' || results.rowCount === 0){
							socket.emit('notification',{error:'No community with id of '+community_id});
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
						socket.emit('widgets_req_status',{status:true});
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
					"SELECT 1 FROM communities WHERE id = $1 LIMIT 1",
					[
						data.community_id
					],
					function(err,community_exists){
						if(err){
							console.log(err);
							socket.emit('Could not check if community exists');
							return;
						}

						if(typeof community_exists === 'undefined' || community_exists.rowCount == 0){
							socket.emit('Not community with id of '+data.community_id);
							return;
						}

						pg_conn.client.query(
							"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2 LIMIT 1",
							[
								socket.handshake.session.user_id,
								data.community_id
							],
							function(err,privilege_level){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not get privilege information'});
									return;
								}

								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
									socket.emit('notification',{error:'You must be a member of the community to submit a layout'});
									return;
								}

								if(privilege_level.rows[0].privilege_level > config.privileges['admin']){
									socket.emit('notification',{error:'Insufficient privileges to submit community layout'});
									return;
								}

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
							}
						);
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

				if(typeof community_id === 'undefined'){
					socket.emit('notification',{error:'Community id is required'});
					return;
				}

				community_id = Number(community_id);

				if(isNaN(community_id)){
					socket.emit('notification',{error:'Community id must be a number'});
					return;
				}

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
							socket.emit('available_widgets_status',{status:true});
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
					socket.emit('notification',{error:'Community id is required'});
					return;
				}

				data.community_id = Number(data.community_id);

				if(isNaN(data.community_id)){
					socket.emit('notification',{error:'Widget community id must be a number'});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM communities WHERE id = $1",
					[
						data.community_id
					],function(err,community_exists){
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

								if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
									socket.emit('notification',{error:'You must be a member of this community to submit a widget'});
									return;
								}

								if(privilege_level.rows[0].privilege_level > config.privileges['admin']){
									socket.emit('notification',{error:'Insufficient privileges to submit widget'});
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
							}
						);						

					}
				);
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener allows a community to delete a widget
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('widget_delete_req',function(data){

				if(typeof data.widget_id === 'undefined'){
					socket.emit('notification',{error:'Widget id is required'});
					return;
				}

				data.widget_id = Number(data.widget_id);

				if(isNaN(data.widget_id)){
					socket.emit('notification',{error:'Widget id must be a number'});
					return;
				}
				
				if(typeof widget_definitions[data.type] !== 'undefined'){
					widget_definitions[data.type].get(data.widget_id,function(success,notification) {
						if(success !== false){
							if(typeof success !== 'undefined' && success.length === 1){
								pg_conn.client.query(
									"SELECT 1 FROM communities WHERE id = $1",
									[
										success[0].community_id
									],function(err,community_exists){
										if(err){
											console.log(err);
											socket.emit('notification',{error:'Could not check if community exists'});
											return;
										}

										if(typeof community_exists === 'undefined' || community_exists.rowCount === 0){
											socket.emit('notification',{error:'Community with id of '+success[0].community_id+' does not exist'});
											return;
										}

										pg_conn.client.query(
											"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2",
											[
												socket.handshake.session.user_id,
												success[0].community_id
											],
											function(err,privilege_level){
												if(err){
													console.log(err);
													socket.emit('notification',{error:'Could not get privilege information for community'});
													return;
												}

												if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
													socket.emit('notification',{error:'You must be a member of this community to delete a widget'});
													return;
												}

												if(privilege_level.rows[0].privilege_level > config.privileges['admin']){
													socket.emit('notification',{error:'Insufficient privileges to delete widget'});
													return;
												}

												if(typeof widget_definitions[data.type] !== 'undefined'){
													widget_definitions[data.type].delete(data.widget_id,function(success,notification){														
														socket.emit('notification',notification);
														if(success !== false){
															socket.emit('widget_delete_status',{status:true,id:data.widget_id});
														}
													});			
												}else{
													socket.emit('notification',{error:"Unknown widget type \'"+data.type+"\'"})
												}				
											}
										);						

									}
								);
							}
						}
						
					});		
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

				if(typeof community_id === 'undefined'){
					socket.emit('notification',{error:'Community id is required'});
					return;
				}

				community_id = Number(community_id);

				if(isNaN(community_id)){
					socket.emit('notification',{error:'Community id must be a number'});
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM communities WHERE id = $1",
					[
						community_id
					],
					function(err,community_exists){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if commmunity exists'});
							return;
						}

						if(typeof community_exists === 'undefined' || community_exists.rowCount === 0){
							socket.emit('notification',{error:'Community with id of '+community_id+' does not exist'});
							return;
						}

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

				if(typeof tournament_id === 'undefined'){
					socket.emit('notification',{error:'Tournament id is required'});
					return;
				}

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

	];
}
