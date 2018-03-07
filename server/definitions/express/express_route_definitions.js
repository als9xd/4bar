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
// The req variable passed to each middleware in the route is the data the 
// is sending to the server. The res variable is the data that the server
// responds with. There is also a third 'hidden'/optional variable called next
// that passes all the data onto the next middleware 
// (kind of like how 'return' functions)
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

		/******************************** Example ***************************************/

		/* 

		String route_url
		String some_other_route_url

		==================================================================================
		 
		Within this file:

		() => {
			app.get(>>route_url<<,function(req,res){
				// Do route stuff here
			});
		},
	
		() =>{
			app.get(>>some_other_route_url<<,function(req,res){
				// Do some other route stuff here
			});	
		},

		etc...
	
		*/
		
		/********************************************************************************/

		() => {
			app.all('*',middleware['http_redirect']);
		},

		/********************************************************************************/

		() => {
			app.get('/',function(req,res){
				res.redirect('/home');
			});
		},

		/********************************************************************************/

		() => {
			app.get('/login',function(req,res){
				res.sendFile(config.root_dir+'/client/html/public/login.html');
			});
		},

		/********************************************************************************/

		() => {
			app.get('/register',function(req,res){
 				res.sendFile(config.root_dir+'/client/html/public/register.html');
			});
		},

		/********************************************************************************/

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
							"SELECT 1 FROM community_members "+
							"INNER JOIN communities ON communities.id = community_members.community_id "+
							"INNER JOIN users ON community_members.user_id = users.id AND users.username = $1 "+
							"LIMIT 1",
							[
								req.session.username
							],
							function(err,is_member){
								if(err){
									console.log(err)
									res.render('public/error',{error:'Could not get community'});
									return;
								}
								res.render(
									'private/home',
									{
										username: req.session.username,
										user_id: req.session.user_id,
										is_member: is_member.rowCount
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

		() => {

			app.get('/profile', middleware['check_authorization'], function(req, res){
				pg_conn.client.query(
					"SELECT communities.name FROM community_members "+
					"INNER JOIN communities ON communities.id = community_members.community_id "+
					"INNER JOIN users ON community_members.user_id = users.id AND users.id = $1",
					[
						req.query['id']
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

						// Private View of Profile
						if(req.query['id'] === req.session.user_id){
							res.render('private/profile',{
								username: req.session.username,
								user_id: req.session.user_id,
								full_name: req.session.full_name,
								email: req.session.email,
								c_names: c_names_arr
							});	
						}
						// Public View of Profile
						else{
							res.render('private/profile',{
								username: req.session.username,
								user_id: req.session.user_id,
								full_name: req.session.full_name,
								email: req.session.email,
								c_names: c_names_arr
							});				
						}
						
					}
				);	
			});		

		},

		/********************************************************************************/

		() => {
			app.get('/cc_wizard',middleware['check_authorization'],function(req,res){
			  res.render('private/cc_wizard',{
			  	username: req.session.username,
			  	user_id: req.session.user_id
			  });				
			});
		},

		/********************************************************************************/

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
									icon_url = '/icons/'+unique_name+'.'+req.files.c_icon.name.split('.').pop();
									req.files.c_icon.mv('community_data/'+icon_url,function(err){
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
									wallpaper_url = '/wallpapers/'+unique_name+'.'+req.files.c_wallpaper.name.split('.').pop();
									req.files.c_wallpaper.mv('community_data/'+wallpaper_url,function(err){
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
								"INSERT INTO communities (name,unique_name,url,description,icon,wallpaper,layout,last_activity,num_members) "+
								"VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0) "+
								"RETURNING id",
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

		() => {
			app.get('/logout',function(req,res){
				req.session.destroy();	
				res.redirect('/home');	
			});
		}

		/********************************************************************************/

	];
}