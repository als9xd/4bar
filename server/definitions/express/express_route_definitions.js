//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/express/express_route_definitions.js
//
// Overview:
//	- Contains definitions for express routes
//
// Express Routes:
//
// These are the 'paths' users can take
//
// For example, when a user types http://localhost/home into their url
// they will be sent through this route:
//
// app.get('/home',function(req,res){
//
// });
//
// The req variable passed to each middleware in the route is the data
// the client is sending to the server. The res variable is the data
// that the server responds with. There is also a third 'hidden'/optional
// variable called next that passes all the data onto the next middleware
// (kind of like how 'return' functions in most programming languages)
//
// More about express routing:
//
//   https://expressjs.com/en/guide/routing.html
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = function(express_conn,pg_conn,socket_io_conn) {

	let config = express_conn.config;

	let app = express_conn.app;
	let middleware = express_conn.middleware;

	let io = socket_io_conn.io;

	return [

		/****************************** Example ******************************************/

		/*

		String route_url
		String path_to_file
		String handlebars_filename
		Object handlebars_data
		String route_name

		String some_other_route_url
		String some_other_path_to_file
		String some_other_handlebars_filename
		Object some_other_handlebars_data
		String some_other_route_name

		==================================================================================

		Within this file:

		() => {
			app.get(>>route_url<<,function(req,res){

				// Send a regular html file back to the client (without any backend data)
				res.sendFile(config.root_dir + >>path_to_file<< );

				// Or

				// Send a handlebars template file to the client (with backend data)
				res.render('private/'+ >>handlebars_filename<<, >>handlebars_data<< );

				// Or

				// Redirect the client to another route
				res.redirect(>>route_name<<);

			});
		},

		() =>{
			app.get(>>some_other_route_url<<,function(req,res){

				// Send a regular html file back to the client (without any backend data)
				res.sendFile(config.root_dir + >>some_other_path_to_file<< );

				// Or

				// Send a handlebars template file to the client (with backend data)
				res.render('private/'+ >>some_other_handlebars_filename<<, >>some_other_handlebars_data<< );

				// Or

				// Redirect the client to another route
				res.redirect(>>some_other_route_name<<);

			});
		},

		etc...

		*/

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route redirects all routes through the http redirect middlware
		// which redirects http urls to their https equivalent
		//////////////////////////////////////////////////////////////////////

		() => {
			app.all('*',middleware['http_redirect']);
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route sets the default url ('4bar.org/') to redirect to home
		//
		// Note: If a user isn't logged in they will be redirected to
		//       '4bar.org/login' since '4bar.org/home' checks for
		//       authentication
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/',function(req,res){
				res.redirect('/home');
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route allows the user to login
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/login',function(req,res){
				res.sendFile(config.root_dir+'/client/html/public/login.html');
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route allows a client to register a new user
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/register',function(req,res){
 				res.sendFile(config.root_dir+'/client/html/public/register.html');
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route renders the home page along with all the communities
		// that user is a member of
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/home',middleware['check_authorization'],function(req,res){
				pg_conn.client.query(
					"SELECT name,description,icon,last_activity,url FROM communities",
					function(err,community_info){
						if(err){
							console.log(err);
							res.render('public/error',{error:'Could not get community'});
							return;
						}
						pg_conn.client.query(
							"SELECT 1 FROM community_members \
							INNER JOIN communities ON communities.id = community_members.community_id \
							INNER JOIN users ON community_members.user_id = users.id AND users.username = $1 \
							LIMIT 1",
							[
								req.session.username
							],
							function(err,is_member){
								if(err){
									console.log(err)
									res.render('public/error',{error:'Could not get community'});
									return;
								}
								pg_conn.client.query(
									"SELECT * FROM tournaments",
									function(err, tournaments){
										if(err){
											console.log(err);
											res.render('public/error',{error:'Could not get tournament locations'});
											return;
										}

										res.render(
											'private/home',
											{
												username: req.session.username,
												user_id: req.session.user_id,
												is_member: is_member.rowCount,
												tournaments: tournaments.rows
											}
										);
								});
							}
						);
					}
				);
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route allows a user to search the site for a site object (user
		// ,community,etc..)
		//////////////////////////////////////////////////////////////////////

		() => {

			app.get('/search',middleware['check_authorization'],function(req,res){

				let search_filter_promises = [];

				if(typeof req.query['query_field'] !== 'undefined'){
					let search_field = req.query['query_field'];
					if(typeof pg_conn.search_filter_definitions[search_field] !== 'undefined'){
						let search_input = req.query;
						delete search_input[search_field];
						search_filter_promises.push(
							pg_conn.search_filter_definitions[search_field](
								search_input,
								{
									intersection: true // Find the intersection of each column within the field (For example: users.email = 'example@example.org' AND users.name = 'Jonn Smith')
								}
							)
						);
					}
				}else if(typeof req.query['query'] !== 'undefined'){
					for(let i in pg_conn.search_filter_definitions){
						if(typeof pg_conn.search_filter_definitions.hasOwnProperty(i)){
							search_filter_promises.push(
								pg_conn.search_filter_definitions[i](
									req.query['query'],
									{
										union: true  // Find the union of each column within the field (For example: users.email = 'example@example.org' OR users.name = 'Jonn Smith')
									}
								)
							);
						}
					}
				}

				Promise.all(search_filter_promises).then(results =>{

					// Each results are returned as an array of key/value pairs [ {communities : results_of_communities} , {users : results_of_users} ]
					// In order to make it easier to handle on the front end this converts the results to this form {communities: results_of_communities, users: results_of_users}
					results = results.reduce(function(r,a){
						return Object.assign(r,a);
					},{});

					if(typeof req.query['sort_by'] !== 'undefined' && typeof results[req.query['query_field']] !== 'undefined'){

						let sort_filter_field = pg_conn.sort_filter_definitions[req.query['query_field']];
						if(typeof sort_filter_field === 'undefined'){
							res.render('public/error',{error:'Unknown sort field "'+req.query['query_field']+'"'});
							return;
						}
						let sort_filter = sort_filter_field[req.query['sort_by']];
						if(typeof sort_filter === 'undefined'){
							res.render('public/error',{error:'Unknown sort filter "'+req.query['sort_by']+'" in "'+req.query['query_field']+'"'});
							return;
						}
						results[req.query['query_field']].sort(sort_filter);
					}

				 	res.render('private/search',{
				 		results: results,
				 		username: req.session.username,
						user_id: req.session.user_id
				 	});

				}).catch( err =>{
					res.render('public/error',{error:err});
				});
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route renders a users profile information based on the
		// requested user_id if supplied or else the session data's user_id
		//////////////////////////////////////////////////////////////////////

		() => {

			app.get('/profile', middleware['check_authorization'], function(req, res){


				pg_conn.client.query(
					"SELECT communities.name FROM community_members \
					INNER JOIN communities ON communities.id = community_members.community_id \
					INNER JOIN users ON community_members.user_id = users.id AND users.id = $1",
					[
						req.query['id'] || req.session.user_id
					],
					function(err,community_names){
						if(err){
							console.log(err)
							res.render('public/error',{error:'Could not get community membership information'});
							return;
						}

						// Convert the community names rows object to an array so it is iterable by handlebars on the front end.
						let c_names_arr = [];
						for(let i in community_names.rows){
							c_names_arr.push(community_names.rows[i].name);
						}

						pg_conn.client.query(
							"SELECT avatar,username,name as full_name,email FROM users WHERE id = $1 LIMIT 1",
							[
								req.query['id'] || req.session.user_id
							],
							function(err,profile){
								if(err){
									console.log(err);
									res.render('public/error',{error:'Could not get user avatar'});
									return;
								}

								res.render('private/profile',{
									username: req.session.username,
									user_id: req.session.user_id,
									profile_data: profile.rows[0],
									c_names: c_names_arr,
									modify_priveleges: typeof req.query['id'] === 'undefined' ||(Number(req.query['id']) === req.session.user_id)
								});

							}

						);
					}
				);
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route allows a user to upload a file to use as their profile's
		// avatar
		//////////////////////////////////////////////////////////////////////

		() => {

			app.post('/upload_avatar', middleware['check_authorization'], function(req, res){

				if(typeof req.files !== 'undefined'){
					if(typeof req.files.u_avatar !== 'undefined'){
						let avatar_url = '/user/avatars/'+req.session.user_id+'.'+req.files.u_avatar.name.split('.').pop();
						req.files.u_avatar.mv(config.root_dir+'/client/media'+avatar_url,function(err){
							if(err){
								console.log(err);
								res.render('public/error',{error:'Could not upload avatar'});
								return;
							}
							pg_conn.client.query(
								"UPDATE users "+
								"SET avatar = $1 "+
								"WHERE id = $2"
								,
								[
									avatar_url,
									req.session.user_id
								],
								function(err){
									if(err){
										console.log(err);
										res.render('public/error',{error:'Could not save avatar url to profile'});
										return;
									}
									res.redirect('/profile?message=Successfully Uploaded Avatar');
									return;
								}
							);
						});
					}else{
						res.redirect('profile');
					}
				}

			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// (Community Creation Wizard)
		//
		// This route renders a page that allows a user to create a new
		// community
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/cc_wizard',middleware['check_authorization'],function(req,res){
			  res.render('private/cc_wizard',{
			  	username: req.session.username,
			  	user_id: req.session.user_id
			  });
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// (Community Creation Submit)
		//
		// This route allows a user to submit a new community.
		// 	* Right now this is linked from within '4bar.org/cc_wizard'
		//
		// Should probably be converted to socket.io in the future however the
		// file uploading functionality will require a redesign since it
		// currently uses form data
		//
		//////////////////////////////////////////////////////////////////////

		() => {
			app.post('/cc_submit',middleware['check_authorization'],function(req,res){

				// This unique name is used for a number of things including:
				//   - url path
				//   - icon filename
				//   - wallaper filename
				//
				//  How this unique is generated is all white spaces are replaced with underscores and then all non alphanumeric characters are removed. Then that string is converted to lowercase.
				let unique_name = req.body.c_name.replace(/\s/g,'_').replace(/[^a-zA-Z0-9 ]/g,'').toLowerCase();
				if(!unique_name.length){
					res.redirect('/cc_wizard?error=Invalid Name');
					return;
				}

				pg_conn.client.query(
					"SELECT 1 FROM communities where unique_name = $1 LIMIT 1",
					[
						unique_name
					],
					function(err,community_exists){
						if(err){
							console.log(err);
							res.render('public/error',{error:'Could not check if community already exists'});
							return;
						}else if(community_exists && community_exists.rows.length === 0){

							let icon_url;
							let wallpaper_url;

							// Upload files
							if(req.files){
								if(req.files.c_icon){
									icon_url = '/community/icons/'+unique_name+'.'+req.files.c_icon.name.split('.').pop();
									req.files.c_icon.mv(config.root_dir+'/client/media'+icon_url,function(err){
										if(err){
											console.log(err);
											res.render('public/error',{error:'Could not upload icon'});
											return;
										}
										// The communities have to be emitted once the icon has finished being upload because usually the community will finish being inserted into the database and then emmited before the icon finishes uploading.
										// This results in the community being displayed on /home without an icon
										pg_conn.client.query(
											"SELECT name,description,icon,wallpaper,last_activity,url FROM communities",
											function(err,community_info){
												if(err){
													console.log(err)
													res.render('public/error',{error:'Could not get community information'});
													return;
												}else{
													io.sockets.emit('communities',community_info.rows);
												}
											}
										);
									});
								}
								if(req.files.c_wallpaper){
									wallpaper_url = '/community/wallpapers/'+unique_name+'.'+req.files.c_wallpaper.name.split('.').pop();
									req.files.c_wallpaper.mv(config.root_dir+'/client/media'+wallpaper_url,function(err){
										if(err){
											console.log(err);
											res.render('public/error',{error:'Could not upload wallpaper'});
											return;
										}
									});
								}
							}

							let d = new Date;
							let date = (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();

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
										req.body.c_name, // Input string #1
										'name' // Check input string #1's length against the VARCHAR limits for column 'name'
									],
									[
										unique_name,
										'unique_name'
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
								res.redirect('/cc_wizard?error='+invalid_length_errors.join(','));
								return;
							}

							let community_url = '/b/'+unique_name;

							pg_conn.client.query(
								"INSERT INTO communities (name,unique_name,url,description,icon,wallpaper,layout,last_activity,num_members) \
								VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0) \
								RETURNING id",
								[
									req.body.c_name,
									unique_name,
									community_url,
									req.body.c_description,
									icon_url,
									wallpaper_url,
									req.body.c_layout,
									date,
								],
								function(err,community_id){

									if(err){
										console.log(err);
										res.render('public/error',{error:'Could not insert into communities'});
										return;
									}

									let tags_split = req.body.tags.split(',');

									let invalid_tag_lengths = []
									for(let i = 0; i < tags_split.length;i++){
										if(tags_split[i].length >  config.pg.varchar_limits.community_tags.tag){
											invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config.pg.varchar_limits.community_tags.tag + ' characters');
										}
									}
									if(invalid_tag_lengths.length){
										res.redirect('/cc_wizard?error='+invalid_tag_lengths.join(','));
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
												res.render('public/error',{error:'Could not insert tags for community'});
												return;
											}

									        // This builds a new route for the community page
											app.get(community_url, middleware['check_authorization'], function(com_req, com_res){
												pg_conn.client.query(
													'SELECT 1 FROM community_members WHERE community_members.user_id = $1 AND community_members.community_id = $2',
													[
														com_req.session.user_id,
														community_id.rows[0].id
													],
													function(err,is_member){
														if(err){
															console.log(err);
															res.render('public/error',{error:'Could not get community membership information'});
															return;
														}
														com_res.render(
															'private/cc_template',
															{
																username: com_req.session.username,
																user_id: req.session.user_id,
																c_name: req.body.c_name,
																c_wallpaper: wallpaper_url,
																c_id: community_id.rows[0].id,
																c_url: community_url,
																is_member: (is_member && is_member.rowCount)
															}
														);
													}
												);
											});

											// Build that communities layout customization route
											app.get(community_url+'/layout', middleware['check_authorization'], function(com_req, com_res){
											  com_res.render(
											  	'private/cc_layout',
											  	{
											  		username: com_req.session.username,
													user_id: req.session.user_id,
											  		c_name: req.body.c_name,
											  		c_wallpaper: wallpaper_url,
											  		c_id: community_id.rows[0].id,
											  		c_url: community_url
											  	});
											});

											// Build that communities tournament creation wizard route
											app.get(community_url+'/tc_wizard', middleware['check_authorization'], function(com_req, com_res){
												com_res.render('private/tc_wizard',{
													username: com_req.session.username,
													user_id: com_req.session.user_id,
											  		c_name: req.body.c_name,
											  		c_id: community_id.rows[0].id,
											  		c_url: community_url
												});
											});

											pg_conn.client.query(
												"SELECT name,description,icon,wallpaper,last_activity,url FROM communities",
												function(err,community_info){
													if(err){
														console.log(err)
														res.render('public/error',{error:'Could not load communities'});
														return;
													}
													io.sockets.emit('communities',community_info.rows);
												}
											);
											res.redirect(community_url);
										}
									);
								}
							);
						}else{
							res.redirect('/cc_wizard?error=Community already exists');
							return;
						}
					}
				);

			});
		},


		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route displays a tournaments information 
		//////////////////////////////////////////////////////////////////////

		() => {

			app.get(
				'/tournaments', // This is the base url ('4bar.org/tournaments')
				middleware['check_authorization'],
				function(req,res){
					if(typeof req.query['id'] === 'undefined'){
						res.render('public/error',{error:'No tournament id supplied'});
						return;
					}

					pg_conn.client.query(
						"SELECT * FROM tournaments where id = $1 LIMIT 1",
						[
					  		req.query['id'] // This is whatever '4bar.org/tournaments?id=' is set to
						],
						function(err,results){
							if(err){
								console.log(err);
								return;
							}
							if(typeof results.rows === 'undefined' || results.rows.length === 0){
								res.render('public/error',{error:'No tournament with id of '+req.query['id']});
								return;
							}
							pg_conn.client.query(
								"SELECT 1 FROM tournament_attendees WHERE tournament_attendees.user_id = $1 AND tournament_attendees.tournament_id = $2 LIMIT 1",
								[
									req.session.user_id,
									req.query['id']
								],
								function(err,is_member){
									if(err){
										console.log(err);
										res.render('public/error',{error:'Could not get tournament membership information'});
										return;
									}									
									res.render(
										'private/tournaments',  //This is handlebars filename
									 	{
											username: req.session.username,
											user_id: req.session.user_id,
									 		tournament_data: results.rows[0],
									 		is_member: (is_member && is_member.rowCount)
										}
									);
								}
							);
						}
					);
				}
			);
		},
    
	    /********************************************************************************/ 

			//////////////////////////////////////////////////////////////////////
			// This route allows tournament administrators to edit tournament data 
			//////////////////////////////////////////////////////////////////////

			() => {

				app.get(
					'/tc_edit', // This is the base url ('4bar.org/tournaments')
					middleware['check_authorization'],
					function(req,res){
						if(typeof req.query['id'] === 'undefined'){
							res.render('public/error',{error:'No tournament id supplied'});
							return;
						}

						pg_conn.client.query(
							"SELECT * FROM tournaments where id = $1 LIMIT 1",
							[
						  		req.query['id'] // This is whatever '4bar.org/tournaments?id=' is set to
							],
							function(err,tournament_data){
								if(err){
									console.log(err);
									return;
								}
								if(typeof tournament_data.rows === 'undefined' || tournament_data.rows.length === 0){
									res.render('public/error',{error:'No tournament with id of '+req.query['id']});
									return;
								}
								pg_conn.client.query(
									"SELECT 1 FROM tournament_attendees WHERE tournament_attendees.user_id = $1 AND tournament_attendees.tournament_id = $2 LIMIT 1",
									[
										req.session.user_id,
										req.query['id']
									],
									function(err,is_member){
										if(err){
											console.log(err);
											res.render('public/error',{error:'Could not get tournament membership information'});
											return;
										}
										pg_conn.client.query(
											"SELECT tag FROM tournament_tags WHERE tournament_id = $1",
											[
												req.query['id']
											],
											function(err,tags){
												if(err){
													console.log(err);
													socket.emit('notifcation',{error: 'Could not get tournament tags'});
													return;
												}

												tournament_data.rows[0].tags = tags.rows;

												// Get tournament admins
												pg_conn.client.query(
													"SELECT users.username,users.id FROM users \
														INNER JOIN tournament_attendees ON users.id = tournament_attendees.user_id \
														WHERE tournament_attendees.tournament_id = $1 AND tournament_attendees.privilege_level = $2 \
													",
													[
														req.query['id'],
														config.privileges['admin']
													],
													function(err,t_admin){
														if(err){
															console.log(err);
															socket.emit('notification',{error: 'Could not get tournament admins'});
															return;
														}

														tournament_data.rows[0].admins = t_admin.rows;

														pg_conn.client.query(
															"SELECT users.username,users.id FROM users \
																INNER JOIN tournament_attendees ON users.id = tournament_attendees.user_id \
																WHERE tournament_attendees.tournament_id = $1 AND tournament_attendees.privilege_level = $2 \
															",
															[
																req.query['id'],
																config.privileges['mods']															
															],
															function(err,t_mods){
																if(err){
																	console.log(err);
																	socket.emit('notification',{error: 'Could not get tournament mods'});
																	return;
																}

																tournament_data.rows[0].mods = t_mods.rows;

																pg_conn.client.query(
																	"SELECT users.username,users.id FROM users \
																		INNER JOIN tournament_attendees ON users.id = tournament_attendees.user_id \
																		WHERE tournament_attendees.tournament_id = $1 AND tournament_attendees.privilege_level = $2 \
																	",
																	[
																		req.query['id'],
																		config.privileges['members']															
																	],
																	function(err,t_members){
																		if(err){
																			console.log(err);
																			socket.emit('notification',{error: 'Could not get tournament mods'});
																			return;
																		}

																		tournament_data.rows[0].members = t_members.rows;

																		res.render(
																				'private/tc_edit',  //This is handlebars filename
																			 	{
																					username: req.session.username,
																					user_id: req.session.user_id,
																			 		tournament_data: tournament_data.rows[0],
																			 		is_member: (is_member && is_member.rowCount)
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
							}
						);
					}
				);
			},
	    
	    /********************************************************************************/ 

		//////////////////////////////////////////////////////////////////////
		// (Calendar)
		//
		// This route renders a page with calendar of events 
		// 
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/calendar',middleware['check_authorization'],function(req,res){
			  res.render('private/calendar',{
			  	username: req.session.username,
			  	user_id: req.session.user_id
			  });				
			});
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route allows a user to logout by destroying their session data
		// It then redirects them to '4bar.org/home' which should in turn
		// redirect them to '4bar.org/login' since the user no longer has
		// session data and thus can't authenticate with their credentials
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/logout',function(req,res){
				req.session.destroy();
				res.redirect('/home');
			});
		}

		/********************************************************************************/

	];
}
