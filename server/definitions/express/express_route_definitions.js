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

	let private_ns = socket_io_conn.private_ns;

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

		() => {
			app.get('/home',middleware['check_authorization'],middleware['membership_information'],function(req,res){
				res.render(
					'private/home',
					{
						/* Navbar,Sidebar data */
						user_data: {
							username: req.session.username,
							id: req.session.user_id,
							email: req.session.email,
							avatar: req.session.avatar,
							communities: req.membership_information.communities,
							tournaments: req.membership_information.tournaments,
							forums_url: config.nodebb.address
						},
						/* Navbar,Sidebar data */

						/* Data for nodebb forums */
						nodebb: {
							address: config.nodebb.address,
							// SSO token
							token: req.session.token
						},

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

			app.get('/search',middleware['check_authorization'],middleware['membership_information'],function(req,res){

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

						/* Navbar,Sidebar data */
						user_data: {
							username: req.session.username,
							id: req.session.user_id,
							email: req.session.email,
							avatar: req.session.avatar,
							communities: req.membership_information.communities,
							tournaments: req.membership_information.tournaments,
							forums_url: config.nodebb.address
						},
						/* Navbar,Sidebar data */

						/* Data for nodebb forums */
						nodebb: {
							address: config.nodebb.address,
							// SSO token
							token: req.session.token
						},

				 		results: results
				 	});

				}).catch( err =>{
					res.render('public/error',{error:err});
				});
			});

		},


		/********************************************************************************/

		() => {
			app.get('/community_creation',middleware['check_authorization'],middleware['membership_information'],function(req,res){
				res.render(
					'private/community_creation',
					{
						/* Navbar,Sidebar data */
						user_data: {
							username: req.session.username,
							id: req.session.user_id,
							email: req.session.email,
							avatar: req.session.avatar,
							communities: req.membership_information.communities,
							tournaments: req.membership_information.tournaments,
							forums_url: config.nodebb.address
						},
						/* Navbar,Sidebar data */

						/* Data for nodebb forums */
						nodebb: {
							address: config.nodebb.address,
							// SSO token
							token: req.session.token
						},

					}
				);
			});
		},
		
		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This route renders a users profile information based on the
		// requested user_id if supplied or else the session data's user_id
		//////////////////////////////////////////////////////////////////////

		() => {
			app.get('/profile', middleware['check_authorization'],middleware['membership_information'],function(req, res){

				if(typeof req.query['id'] === 'undefined'){
					req.query['id'] = req.session.user_id;
				}

				let profile_id = Number(req.query['id']);

				if(isNaN(req.query['id'])){
					res.render('public/error',{error:'Profile id must be a number'});
					return;
				}

				pg_conn.client.query(
					"SELECT id,username,name,email,avatar FROM users WHERE id = $1 LIMIT 1",
					[
						profile_id
					],
					function(err,profile){
						if(err){
							console.log(err);
							res.render('public/error',{error:'Could not get user avatar'});
							return;
						}
						if(typeof profile_id === 'undefined' || profile.rowCount === 0){
							res.render('public/error',{error:'No user with id of '+profile_id});
							return;
						}

						pg_conn.client.query(
							"SELECT f_c.num_members,f_c.id,f_c.name,f_c.description,f_c.creation_date,f_c.last_activity,f_c.icon,array_agg(community_tags.tag) as tags \
							FROM community_tags,\
								(SELECT communities.* FROM communities \
								INNER JOIN community_tags on communities.id = community_tags.community_id \
								INNER JOIN community_members ON community_members.community_id = communities.id \
								WHERE community_members.user_id = $1 \
								GROUP BY communities.id) as f_c WHERE f_c.id = community_tags.community_id \
							GROUP BY f_c.num_members,f_c.id,f_c.name,f_c.description,f_c.creation_date,f_c.last_activity,f_c.icon ",
							[
								profile_id
							],
							function(err,communities){
								if(err){
									console.log(err)
									res.render('public/error',{error:'Could not get community membership information'});
									return;
								}

								pg_conn.client.query(
									"SELECT tournaments.*,communities.id as community_id,communities.name as community_name,communities.icon as community_icon FROM tournaments \
									INNER JOIN tournament_attendees ON tournaments.id = tournament_attendees.tournament_id \
									INNER JOIN communities ON tournaments.community_id = communities.id \
									WHERE tournament_attendees.user_id = $1\
									",
									[
										profile_id
									],
									function(err,tournaments){
										if(err){
											console.log(err);
											res.render('public/error',{error:'Could not get tournament membership information'});
											return;
										}
										pg_conn.client.query(
											"SELECT 1 FROM friend_requests WHERE tx_user_id = $1 AND rx_user_id = $2 "+
											" LIMIT 1",
											[
												req.session.user_id,
												profile_id
											],
											function(err,is_friend){
												if(err){
													console.log(err);
													res.render('public/error',{error:'Could not check if user is friend'});
													return;
												}

												res.render('private/profile',{
													/* Navbar,Sidebar data */
													user_data: {
														username: req.session.username,
														id: req.session.user_id,
														email: req.session.email,
														avatar: req.session.avatar,
														communities: req.membership_information.communities,
														tournaments: req.membership_information.tournaments,
														forums_url: config.nodebb.address
													},
													/* Navbar,Sidebar data */

													/* Data for nodebb forums */
													nodebb: {
														address: config.nodebb.address,
														// SSO token
														token: req.session.token
													},

													profile_data: {
														id: profile.rows[0].id,
														username: profile.rows[0].username,
														name: profile.rows[0].name,
														email: profile.rows[0].email,
														avatar: profile.rows[0].avatar,
														communities: communities.rows,
														tournaments: tournaments.rows
													},

													modify_view: profile_id === req.session.user_id,

													sent_friend_request: typeof is_friend !== 'undefined' && is_friend.rowCount
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

		},

		/********************************************************************************/

		() => {

			app.get(
				'/tournaments', // This is the base url ('4bar.org/tournaments')
				middleware['check_authorization'],
				middleware['membership_information'],
				function(req,res){

					if(req.query['id'] === 'undefined'){
						res.render('public/error',{error:'Tournament id is required'});
						return;
					}

					req.query['id'] = Number(req.query['id']);

					if(isNaN(req.query['id'])){
						res.render('public/error',{error:'Tournament id must be a number'});
						return;
					}

					pg_conn.client.query(
						"SELECT * FROM tournaments where id = $1 LIMIT 1",
						[
					  		req.query['id'] // This is whatever '4bar.org/tournaments?id=' is set to
						],
						function(err,tournament){
							if(err){
								console.log(err);
								res.render('public/error',{error:'Could not get tournament information'});
								return;
							}

							if(typeof tournament.rows === 'undefined' || tournament.rowCount === 0){
								res.render('public/error',{error:'No tournament with id of '+req.query['id']});
								return;
							}

							pg_conn.client.query(
								"SELECT * FROM communities WHERE id = $1 LIMIT 1",
								[
									tournament.rows[0].community_id
								],
								function(err,community){
									if(err){
										console.log(err);
										res.render('public/error',{error:'Could not get community information'});
										return;
									}

									pg_conn.client.query(
										"SELECT privilege_level FROM tournament_attendees WHERE tournament_attendees.user_id = $1 AND tournament_attendees.tournament_id = $2 LIMIT 1",
										[
											req.session.user_id,
											req.query['id']
										],
										function(err,attendee){
											if(err){
												console.log(err);
												res.render('public/error',{error:'Could not get tournament membership information'});
												return;
											}
											pg_conn.client.query(
												"SELECT matches.id,array_agg(match_teams.name) as match_teams FROM match_teams INNER join matches on matches.id = match_teams.match_id WHERE matches.tournament_id = $1 GROUP BY matches.id",
												[
													req.query['id']
												],
												function(err,matches){
													if(err){
														console.log(err);
														res.render('public/error',{error:'Could not get teams'});
														return;
													}

													pg_conn.client.query(
															"SELECT users.id,users.username,users.name,users.avatar FROM tournament_attendees INNER JOIN users ON users.id = tournament_attendees.user_id WHERE tournament_attendees.tournament_id = $1",
															[
																req.query['id']
															],
															function(err,tournament_attendees){
																if(err){
																	console.log(err);
																	socket.emit('notification',{error:'Could not get tournament attendees'});
																	return;
																}

																res.render(
																	'private/tournaments',  //This is handlebars filename
																 	{
																		/* Navbar,Sidebar data */
																		user_data: {
																			username: req.session.username,
																			id: req.session.user_id,
																			email: req.session.email,
																			avatar: req.session.avatar,
																			communities: req.membership_information.communities,
																			tournaments: req.membership_information.tournaments,
																			forums_url: config.nodebb.address
																		},
																		/* Navbar,Sidebar data */

																		/* Data for nodebb forums */
																		nodebb: {
																			address: config.nodebb.address,
																			// SSO token
																			token: req.session.token
																		},

																		community_data: community.rows[0],

																 		tournament_data: tournament.rows[0],

																 		tournament_attendees: tournament_attendees.rows,

																 		matches: matches.rows,

																 		// This just determines whether the 'Edit' tournament link is shown and not whether they can access that page
																 		t_edit_privileges: (typeof attendee !== 'undefined' && attendee.rowCount !== 0 
																 								&& Number(attendee.rows[0].privilege_level) <= config.privileges['mod']),
																 		t_is_member: !(typeof attendee === 'undefined' || attendee.rowCount === 0)
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

		() => {

			app.get(
				'/communities', // This is the base url ('4bar.org/tournaments')
				middleware['check_authorization'],
				middleware['membership_information'],
				function(req,res){

					if(req.query['id'] === 'undefined'){
						res.render('public/error',{error:'No community id supplied'});
						return;
					}

					if(isNaN(req.query['id'])){
						res.render('public/error',{error:'Community id must be a number'});
						return;
					}

					pg_conn.client.query(
						"SELECT * FROM communities where id = $1 LIMIT 1",
						[
					  		req.query['id'] // This is whatever '4bar.org/tournaments?id=' is set to
						],
						function(err,community){
							if(err){
								console.log(err);
								return;
							}
							if(typeof community.rows === 'undefined' || community.rows.length === 0){
								res.render('public/error',{error:'No community with id of '+req.query['id']});
								return;
							}

							pg_conn.client.query(
								"SELECT tag FROM community_tags WHERE community_id = $1",
								[
									req.query['id']
								],function(err,community_tags){
									if(err){
										console.log(err);
										socket.emit('notification',{error:'Could not get community tags'});
										return;
									}

									community.rows[0].tags = community_tags.rows;

									pg_conn.client.query(
										"SELECT privilege_level FROM community_members WHERE community_members.user_id = $1 AND community_members.community_id = $2 LIMIT 1",
										[
											req.session.user_id,
											req.query['id']
										],
										function(err,member){
											if(err){
												console.log(err);
												res.render('public/error',{error:'Could not get community membership information'});
												return;
											}			

											res.render(
												'private/communities',  //This is handlebars filename
											 	{
													/* Navbar,Sidebar data */
													user_data: {
														username: req.session.username,
														id: req.session.user_id,
														email: req.session.email,
														avatar: req.session.avatar,
														communities: req.membership_information.communities,
														tournaments: req.membership_information.tournaments,
														forums_url: config.nodebb.address
													},
													/* Navbar,Sidebar data */

													/* Data for nodebb forums */
													nodebb: {
														address: config.nodebb.address,
														// SSO token
														token: req.session.token
													},

													community_data: community.rows[0],

											 		// This just determines whether the 'Edit' community link is shown and not whether they can access that page
											 		c_edit_privileges: (typeof member !== 'undefined' && member.rowCount !== 0 
											 								&& Number(member.rows[0].privilege_level) === config.privileges['admin']),
											 		c_is_member: !(typeof member === 'undefined' || member.rowCount === 0)
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
    
		() => {
			app.get('/edit_community',
				middleware['check_authorization'],
				middleware['membership_information'],
				function(req,res){
					if(req.query['id'] === 'undefined'){
						res.render('public/error',{error:'Community id is required'});
						return;
					}

					req.query['id'] = Number(req.query['id']);

					if(isNaN(req.query['id'])){
						res.render('public/error',{error:'Community id must be a number'});
						return;
					}

					pg_conn.client.query(
						"SELECT privilege_level FROM community_members WHERE user_id = $1 AND community_id = $2 LIMIT 1",
						[
							req.session.user_id,
							req.query['id']
						],function(err,privilege_level){
							if(err){
								console.log(err);
								res.render('public/error',{error:'Could not get privilege information for community'});
								return;
							}

							if(typeof privilege_level === 'undefined' || privilege_level.rowCount === 0){
								res.render('public/error',{error:'You must be a member of the community to edit it'});
								return
							}

							if(privilege_level.rows[0].privilege_level > config.privileges['admin']){
								res.render('public/error',{error:'Insufficient privileges to edit community'});
								return;
							}

							pg_conn.client.query(
								"SELECT * FROM communities WHERE id = $1 LIMIT 1",
								[
									req.query['id']
								],
								function(err,community){
									if(err){
										console.log(err);
										res.render('public/error',{error:'Unable to get community data'});
										return;
									}

									pg_conn.client.query(
										"SELECT tag FROM community_tags WHERE community_id = $1",
										[
											req.query['id']
										],
										function(err,community_tags){
											if(err){
												console.log(err);
												res.render('public/error',{error:'Unable to get community tags'});
												return;
											}

											community.rows[0].tags = community_tags.rows;

										 	res.render('private/edit_community',{
												/* Navbar,Sidebar data */
												user_data: {
													username: req.session.username,
													id: req.session.user_id,
													email: req.session.email,
													avatar: req.session.avatar,
													communities: req.membership_information.communities,
													tournaments: req.membership_information.tournaments,
													forums_url: config.nodebb.address
												},
												/* Navbar,Sidebar data */

												/* Data for nodebb forums */
												nodebb: {
													address: config.nodebb.address,
													// SSO token
													token: req.session.token
												},
									  	
												community_data: community.rows[0]
									  		});

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

		() => {
			app.get('/marketplace',
				middleware['check_authorization'],
				middleware['membership_information'],
				function(req,res){
				 	res.render('private/marketplace',{
						/* Navbar,Sidebar data */
						user_data: {
							username: req.session.username,
							id: req.session.user_id,
							email: req.session.email,
							avatar: req.session.avatar,
							communities: req.membership_information.communities,
							tournaments: req.membership_information.tournaments,
							forums_url: config.nodebb.address
						},
						/* Navbar,Sidebar data */

						/* Data for nodebb forums */
						nodebb: {
							address: config.nodebb.address,
							// SSO token
							token: req.session.token
						},

			  		});				
			});
		},

	    /********************************************************************************/ 

		() => {
			app.get('/geolocation',
				middleware['check_authorization'],
				middleware['membership_information'],
				function(req,res){
					pg_conn.client.query(
						"SELECT location FROM tournaments",
						function(err,locations){
							if(err){
								console.log(err);
								res.render('public/error',{error:'Could not get tournament locations'});
								return;
							}
							res.render('private/geolocation',{
								/* Navbar,Sidebar data */
								user_data: {
									username: req.session.username,
									id: req.session.user_id,
									email: req.session.email,
									avatar: req.session.avatar,
									communities: req.membership_information.communities,
									tournaments: req.membership_information.tournaments,
									forums_url: config.nodebb.address
								},
								/* Navbar,Sidebar data */

								/* Data for nodebb forums */
								nodebb: {
									address: config.nodebb.address,
									// SSO token
									token: req.session.token
								},

								locations: locations.rows
							});
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
			app.get('/calendar',
				middleware['check_authorization'],
				middleware['membership_information'],
				function(req,res){
				  res.render('private/calendar',{
					/* Navbar,Sidebar data */
					user_data: {
						username: req.session.username,
						id: req.session.user_id,
						email: req.session.email,
						avatar: req.session.avatar,
						communities: req.membership_information.communities,
						tournaments: req.membership_information.tournaments,
						forums_url: config.nodebb.address
					},
					/* Navbar,Sidebar data */

					/* Data for nodebb forums */
					nodebb: {
						address: config.nodebb.address,
						// SSO token
						token: req.session.token
					},

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
