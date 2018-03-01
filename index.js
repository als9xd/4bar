'use strict';

//////////////////////////////////////////////////////////////////////
// Load configuration settings for an envirnoment 
//
// The two currently available environments are:
//
// 1. development (default)
//		- Use unsigned ssl certificate within '4BAR/ssl/dev' directory
// 		- Saved postgresql credentials
//
// 2. production
//		- Use signed ssl certifcate within '4BAR/../ssl' directory
// 		- Enter postgresql credentials on startup
//
// These can be set using 
// - 'SET NODE_ENV=production' or 'SET NODE_ENV=development' on windows  
// - 'export NODE_ENV=production' or 'export NODE_ENV=development' on osx/linux 
//
//////////////////////////////////////////////////////////////////////

const config_file = './config';
const config = require(config_file);

const env = process.env.NODE_ENV || 'development';

if(config[env] == null){
	console.log("Error: could not find environment \""+env+"\" in \""+config_file+"\"");
	process.exit(1);
}

//////////////////////////////////////////////////////////////////////
// Parse arguments passed to node from the command line
//////////////////////////////////////////////////////////////////////

const argv = require('minimist')(process.argv.slice(2));

if(argv.help){
    console.log(
		"\n"+
		"usage: node index.js [--help] [--password p]\n"+
		"   --password p : p is the password to use when connecting to postgresql\n"+
		"\n"+
		"example: node index.js --password pass\n"
    );
    process.exit(0);
}

if(argv.password){
	config[env].pg.password = argv.password;
}

//////////////////////////////////////////////////////////////////////
// Has some helper functions for working with passwords
//////////////////////////////////////////////////////////////////////

const pwd_h = require('./helpers/passwords_helper')(config[env]);

//////////////////////////////////////////////////////////////////////
// Postgresql connector
//////////////////////////////////////////////////////////////////////

const pg_conn = require('./connectors/pg_connector')(config[env]);
pg_conn.build();

//////////////////////////////////////////////////////////////////////
// Express handles all the routing. This is discussed in more detail further
// down
//////////////////////////////////////////////////////////////////////

const express = require('express');
const app = express();

//////////////////////////////////////////////////////////////////////
// Express Sessions
//
// Sessions are used to save a client's information on the server side.
// For example when a user logs in we can set req.session.username. Then 
// when he tries to access another page we can check if req.session.uername has
// been set. If it has then we allow him to proceed.
//
//////////////////////////////////////////////////////////////////////

const session = require('express-session')({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
});

let shared_session = require('express-socket.io-session');

//////////////////////////////////////////////////////////////////////
// This creates the actual https server that sends the html to client
//////////////////////////////////////////////////////////////////////

const fs = require('fs');
const https = require('https');
let options;
if(config[env].ssl){
	options = {
		key: fs.readFileSync(config[env].ssl.key,'utf8'),
		cert: fs.readFileSync(config[env].ssl.cert,'utf8')
	};
}else{
	console.log("Error: could not find ssl config in\""+config_file+"\"");
	process.exit(1);
}

const server = https.createServer(options,app);

//////////////////////////////////////////////////////////////////////
// This creates an http server. Right now this is only being used to 
// redirect traffic to the https server.
//////////////////////////////////////////////////////////////////////

const http = require('http');

http.createServer(app).listen(config[env].server.http.port);

//////////////////////////////////////////////////////////////////////
// Socket.io
//
// Suppose we have two users A and B. Imagine A is creating a new community and
// B is looking at a list of communities. Once A creates a new community B's
// web-browser has no idea it was created. Normally it wouldn't show up in his
// communities list until he refreshes the page. Socket.io, however, allows for 
// a constant connection to B. This means as soon as A creates a community, node
// can give B's web-browser the new community without him having to refresh.
//
// A real world example can be found on 'home.handlebars'
//////////////////////////////////////////////////////////////////////

const io = require('socket.io')(server);
io.use(shared_session(session));

//////////////////////////////////////////////////////////////////////
// This helps when you are working with strings that are directory paths
//////////////////////////////////////////////////////////////////////

const path = require('path');

//////////////////////////////////////////////////////////////////////
// This is a middleware that is used to parse an html file's form data when node
// receives a post request. For example:
//
// - On the server ---------------------------------------------------
//
// app.post('/some_Route_name',function(req,res){
//  console.log(req.body.some_DOM_name);
// }); 
// 
// - On the client ---------------------------------------------------
//
// <form action="/some_Route_name" method="post">
//   <input type="text" name="some_DOM_name">
// </form>
//
//////////////////////////////////////////////////////////////////////

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({
    extended: true
});

//////////////////////////////////////////////////////////////////////
// This is another middleware that is used to parse forms (same as body-parser)
// that have multipart/form-data which is required for file uploads
//
// - On the server ---------------------------------------------------
//
// app.post('/some_Route_name',function(req,res){
//  console.log(req.body.files.some_DOM_name);
// }); 
//
// - On the client ---------------------------------------------------
// 
// <form action="/some_Route_name" method="post">
//   <input type="file" name="some_DOM_name">
// </form>
//
//////////////////////////////////////////////////////////////////////

const fileUpload = require("express-fileupload");

//////////////////////////////////////////////////////////////////////
// Handlebars Templating Engine
//
// Templating engines are used to send clients html files with server-side
// letiable within them. 
// 
// For example:
// 
// -On the server-----------------------------------------------------
//
// let some_message = 'Hello World';
// app.get('/some_Route_name',function(req,res){
//  res.render('some_handlebars_file',{message: some_message});
// }); 
//
// -In the 'some_Route_name.handlebars' file ------------------------
//
// <div>
//   {{{message}}}
// </div>
//
// - On the client when they try to access http://localhost/some_Route_name 
// they will receive-------------------------------------------------- 
// 
// <div>
//   Hello World
// </div>
//
//////////////////////////////////////////////////////////////////////

const exphbs = require('express-handlebars'); 
app.engine('handlebars', exphbs({})); 
app.set('view engine', 'handlebars');

//////////////////////////////////////////////////////////////////////
// Node.js Middleware
//
// Whenever you app.use(middleware()) it adds it to all the routes automatically
//
// i.e all app.get() and app.post() calls will now internally function like 
// this:
//
// app.get('/some_Route_name',middleware(req,res,next),function(req,res){
// 
// });
//
// even though in index.js they would look like this
//
// app.get('/some_Route_name',function(req,res){
// 
// });
//
//////////////////////////////////////////////////////////////////////

app.use(fileUpload());

app.use(session);

app.use(urlencodedParser);
app.use(bodyParser.json());

//////////////////////////////////////////////////////////////////////
// These allow clients to access files in each respective directory
//////////////////////////////////////////////////////////////////////

app.use(express.static(path.join(__dirname, '/html/public')));
app.use(express.static(path.join(__dirname, '/views/public')));

app.use(express.static(path.join(__dirname, '/community_data')));

//////////////////////////////////////////////////////////////////////
// This is a custom middleware that is added to all routes that require
// authentication. All this does is check whether a session has a username
// assigned to it. If it does, it proceeds to the next middleware. Otherwise it
// sends the client back to the login page. 
//////////////////////////////////////////////////////////////////////

function check_auth(req,res,next){
	if(req.session && req.session.username){
		next();
	}else{
		res.redirect('/login');
	}
}

//////////////////////////////////////////////////////////////////////
// This is a custom middleware that redirects all insecure traffic to 
// the https server
//////////////////////////////////////////////////////////////////////

function http_redirect(req,res,next){
	if(req.secure){
		return next();
	}
	res.redirect('https://'+req.hostname+req.url);
}


//////////////////////////////////////////////////////////////////////
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
//////////////////////////////////////////////////////////////////////

app.all('*',http_redirect); // Add http to https redirect middlware to all routes

// Load all community routes from database
pg_conn.client.query(
	"SELECT name,url,wallpaper,id FROM communities",
	function(err,community_info){
		if(err){
			console.log(err);
		}
		for(let i in community_info.rows){
			app.get(community_info.rows[i].url, check_auth, function(req, res){
				pg_conn.client.query(
					"SELECT 1 FROM community_members WHERE user_id = $1 AND community_id = $2",
					[
						req.session.user_id,
						community_info.rows[i].id
					],
					function (err1,is_member) {
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

			app.get(community_info.rows[i].url+'/layout', check_auth, function(req, res){
				res.render(
					'private/cc_layout',
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
		}
	}
);

app.get('/',function(req,res){
	res.redirect('/home');
});

app.get('/login',function(req, res){
  res.sendFile(__dirname + '/html/public/login.html');
});


app.get('/register',function(req, res){
  res.sendFile(__dirname + '/html/public/register.html');
});

app.get('/past_matches',function(req, res){
	res.render('private/match_history',{
		username: req.session.username,
	});
});

app.get('/mc_wizard',function(req, res){
	res.render('private/mc_wizard',{
		username: req.session.username,
	});
});

app.get('/home', check_auth, function(req, res){

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
					io.sockets.emit('communities',community_info.rows);
				}
			);
		}
	);	
});

app.get('/search',check_auth,function(req, res){

	let search_filter_promises = [];

	if(typeof req.query['query_field'] !== 'undefined'){
		let search_field = req.query['query_field'];
		if(pg_conn.search.hasOwnProperty(search_field)){
			let search_input = req.query;
			delete search_input[search_field];
			search_filter_promises.push(
				pg_conn.search[search_field](
					search_input,
					{
						intersection: true // Find the intersection of each column within the field (For example: users.email = 'example@example.org' AND users.name = 'Jonn Smith')
					}
				)
			);
		}
	}else if(typeof req.query['query'] !== 'undefined'){
		for(let i in pg_conn.search){
			if(pg_conn.search.hasOwnProperty(i)){
				search_filter_promises.push(
					pg_conn.search[i](
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

app.get('/profile', check_auth, function(req, res){

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

app.get('/cc_wizard', check_auth, function(req, res){
  res.render('private/cc_wizard',{
  	username: req.session.username,
  	user_id: req.session.user_id
  });
});

app.post('/mc_submit', check_auth, function(req,res){
	
	let today_date = new Date();
	let dd = today_date.getDate();
	let mm = today_date.getMonth()+1; //January is 0!
	let yyyy = today_date.getFullYear();
	if(dd<10){
		dd='0'+dd;
	} 
	if(mm<10){
		mm='0'+mm;
	} 
	today_date = dd+'/'+mm+'/'+yyyy;

	if (req.body.winning_team == "team1") {
		var result = 1;
	}else{
		var result = 2;
	}
	
	let csv_players = req.body.c_team_one + ',' + req.body.c_team_two;
    let participants = csv_players.split(',');
    
	console.log(typeof req.body.c_com_name)
    pg_conn.client.query(
        "INSERT INTO matches(community_name,result,date) "+
        "VALUES ($1,$2,$3) "+
        "RETURNING id",
        [
            req.body.c_com_name,
            result,
            today_date,
        ],
        function(err, last_id){
            if(err){
                console.log(err);
                res.render('public/error',{error:'Could not create match entry'});
                return;
            }
            for (let i = 0; i < participants.length; i++){
                pg_conn.client.query(
					"INSERT INTO match_participants(match_id,username) "+
					"VALUES ($1,$2) ",
					[
						last_id.rows[0].id,
						participants[i].trim(),    
					],
					function(err){
						if(err){
							console.log(err);
							res.render('public/error',{error:'Could not insert match participants'});
							return;
						}
					}
				);
            }
            res.redirect('/home');
        }

    );
});

app.post('/cc_submit',check_auth,function(req,res){

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
			}else if(community_exists && community_exists.rows.length == 0){

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
				let invalid_lengths = pg_conn.invalid_lengths(
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
							if(tags_split[i].length >  config[env].pg.varchar_limits.community_tags.tag){
								invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config[env].pg.varchar_limits.community_tags.tag + ' characters');
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
								app.get(community_url, check_auth, function(com_req, com_res){
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
								app.get(community_url+'/layout', check_auth, function(com_req, com_res){
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

app.get('/logout',function(req,res){

	req.session.username = null;

	res.redirect('/home');	
});

//////////////////////////////////////////////////////////////////////
// Here is where we start https server
//////////////////////////////////////////////////////////////////////

server.listen(config[env].server.https.port,function(){
	console.log('listening on *:'+config[env].server.https.port);
});

//////////////////////////////////////////////////////////////////////
// Here is where we start the socket.io server
//////////////////////////////////////////////////////////////////////

io.on('connection',function(socket){

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
			"SELECT * FROM users WHERE username = $1 LIMIT 1",
			[
				data.username
			],
			function(err,user_info){
				if(err){
					console.log(err);
					socket.emit('notification',{error:'Could not get user'});
				}else if(user_info && user_info.rows.length){
					pwd_h.validate(
							data.password,
							user_info.rows[0].password,
							user_info.rows[0].password_salt,
							user_info.rows[0].password_iterations,
							// Success_callback
							function(){									
								socket.handshake.session.user_id = user_info.rows[0].id;
								socket.handshake.session.username = user_info.rows[0].username;
								socket.handshake.session.full_name = user_info.rows[0].name;
								socket.handshake.session.email = user_info.rows[0].email;
								socket.handshake.session.save();

								socket.emit('notification',{success: 'Successfully Logged in!'});								
							},
							// Fail callback
							function(){
								socket.emit('notification',{error: 'Invalid username or password'});								
							}
					);
				}else{
					socket.emit('notification',{error:'Invalid username or password'});
				}
			}
		);
	});

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

		if(data.password != data.password_confirmation){
			socket.emit('notification',{error:'Passwords do not match'});
			return;		
		}

		// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
		let invalid_lengths = pg_conn.invalid_lengths(
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

		// This is custom method that checks the password against the rules defined in the config file
		let invalid_pwd_msgs = pwd_h.is_invalid(data.password);
		if(invalid_pwd_msgs.length){
			socket.emit('notification',{title:'Did not meet password requirements',error:invalid_pwd_msgs});
			return;	
		}

		pg_conn.client.query(
			"SELECT username FROM users "+
			"WHERE username = $1 "+
			"LIMIT 1",
			[
				data.username
			],
			function(err,results){
				if(err){
					console.log(err);
					socket.emit('notification',{error:'Could not check if username is already used'});
					return;
				}else if(results && results.rows.length == 0){
					pwd_h.hash(data.password,function(password){
						pg_conn.client.query(
							"INSERT INTO users (username,name,password,password_salt,password_iterations,email) "+
							"VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
							[
								data.username,
								data.full_name,
								password.hash,
								password.salt,
								password.iterations,
								data.email
							],
							function(err,results){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not create user'});
									return;
								}

								socket.handshake.session.user_id = results.rows[0].id;
								socket.handshake.session.username = data.username;
								socket.handshake.session.full_name = data.full_name;
								socket.handshake.session.email = data.email;
								socket.handshake.session.save();

								socket.emit('notification',{success:'Successfully registered!'});
							}
						);						
					});
				}else{
					socket.emit('notification',{error:'User already exists'});
					return;
				}
			}
		);
	});
	
	socket.on('communities_req',function(){
		pg_conn.client.query(
			"SELECT name,description,icon,wallpaper,last_activity,url FROM communities INNER JOIN community_members on communities.id = community_members.community_id WHERE community_members.user_id = $1",
			[
				socket.handshake.session.user_id
			],
			function(err,community_info){
				if(err){
					console.log(err)
					socket.emit('notification',{error:'Could not get communities'});
					return;
				}
				socket.emit('communities_res',community_info.rows);
			}
		);
	});

	socket.on('widgets_req',function(community_id){
		pg_conn.client.query(
			"SELECT layout FROM communities WHERE id = $1 LIMIT 1",
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
							if(pg_conn.widgets.hasOwnProperty(layout[i].type)){
								pg_conn.widgets[layout[i].type].get(layout[i].id,function(widgets,notification){
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

	socket.on('layout_submit_req',function(data){
		pg_conn.client.query(
			"UPDATE communities "+
			"SET layout = $1 "+
			"WHERE id = $2",
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
			}
		);
	});

	socket.on('available_widgets_req',function(community_id){
		for(let widget_type in pg_conn.widgets){
			if(pg_conn.widgets.hasOwnProperty(widget_type)){
				pg_conn.widgets[widget_type].available(community_id,function(available_widgets,notification){
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

	socket.on('widget_submit_req',function(widget){
		if(pg_conn.widgets.hasOwnProperty(widget.type)){
			pg_conn.widgets[widget.type].add(widget.community_id,widget.data,function(success,notification){
				notification.name = "widget_submit_res";
				socket.emit('notification',notification);
			});			
		}else{
			socket.emit('notification',{error:"Unknown widget type \'"+widget.type+"\'"})
		}
	});

	socket.on('toggle_community_membership',function(community_id){
		pg_conn.client.query(
			'SELECT 1 FROM community_members WHERE community_members.user_id = $1 AND community_members.community_id = $2',
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
						'DELETE FROM community_members WHERE community_members.user_id = $1 AND community_members.community_id = $2',
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
						}
					);
				}else if(is_member && is_member.rowCount==0){
					pg_conn.client.query(
						'INSERT INTO community_members (user_id,community_id,privilege_level) '+
						'VALUES ($1,$2,1)',
						[
							socket.handshake.session.user_id,
							Number(community_id)
						],
						function(err){
							if(err){
								console.log(err);
								socket.emit('notification',{error:'Could not join you to the community'});
								return;
							}
							socket.emit('notification',{success:'Successfully joined community'});							
						}
					);
				}
			}
		);
	});

});
