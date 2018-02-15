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
// Web application data retrieval definitions
//////////////////////////////////////////////////////////////////////

const web_apps = {
	youtube: {
		get: function(app_id,callback){
			pg_conn.client.query(
				"SELECT id,url FROM youtube_app WHERE id = $1",
				[
					app_id
				],
				function(err,results){
					if(err){
						console.log(err);
						return;
					}
					callback(results.rows);
				}
			)
		},
		available: function(community_id,callback){
			pg_conn.client.query(
				"SELECT id,url FROM youtube_app WHERE community_id = $1",
				[
					community_id
				],
				function(err,results){
					if(err){
						console.log(err);
						return;
					}
					callback(results.rows);
				}
			)
		},
		add: function(community_id,data,callback){
			pg_conn.client.query(
				"INSERT INTO youtube_app (community_id,url) "+
				"VALUES ($1,$2)",
				[
					community_id,
					data.url
				],
				function(err){
					if(err){
						console.log(err);
						return;
					}
					callback(err);
				}
			)
		}

	},
	twitter: {
		get: function(app_id,callback){
			pg_conn.client.query(
				"SELECT id,url FROM twitter_app WHERE id = $1",
				[
					app_id
				],
				function(err,results){
					if(err){
						console.log(err);
						return;
					}
					callback(results.rows);
				}
			)
		},
		available: function(community_id,callback){
			pg_conn.client.query(
				"SELECT id,url FROM twitter_app WHERE community_id = $1",
				[
					community_id
				],
				function(err,results){
					if(err){
						console.log(err);
						return;
					}
					callback(results.rows);
				}
			)			
		},
		add: function(community_id,data,callback){
			pg_conn.client.query(
				"INSERT INTO twitter_app (community_id,url) "+
				"VALUES ($1,$2)",
				[
					community_id,
					data.url
				],
				function(err){
					if(err){
						console.log(err);
						return;
					}
					callback(err);
				}
			)
		}
	}	
}


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
				res.render(
					'private/cc_template',
					{
						username: req.session.username,
						c_name: community_info.rows[i].name,
						c_wallpaper: community_info.rows[i].wallpaper,
						c_id: community_info.rows[i].id,
						c_url: community_info.rows[i].url
					}
				);
			});
			app.get(community_info.rows[i].url+'/layout', check_auth, function(req, res){
				res.render(
					'private/cc_layout',
					{
						username: req.session.username,
						c_wallpaper: community_info.rows[i].wallpaper,
						c_id: community_info.rows[i].id
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
							is_member: is_member.rowCount
						}
					);
					io.sockets.emit('communities',community_info.rows);
				}
			);
		}
	);	
});

app.get('/profile', check_auth, function(req, res){
	pg_conn.client.query(
		"SELECT communities.name FROM community_members "+
		"INNER JOIN communities ON communities.id = community_members.community_id "+
		"INNER JOIN users ON community_members.user_id = users.id AND users.username = $1",
		[
			req.session.username
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
			res.render('private/profile',{
				username: req.session.username,
				full_name: req.session.full_name,
				email: req.session.email,
				c_names: c_names_arr
			});				
		}
	);	
});

app.get('/cc_wizard', check_auth, function(req, res){
  res.render('private/cc_wizard',{username: req.session.username});
});

// This route is special because the id of the community that the user wants to join is passed by the user within the url. 
// For example: '4bar.org/c_join:5' will join the user the community with the id of 5. 
//
// The reason for designing it this way is that this way the user_id can be stored within the community page's and doesn't have to be entered manually by the user.
app.post('/c_join:*',check_auth,function(req,res){

	pg_conn.client.query(
		"SELECT communities.url,users.id FROM communities,users "+
		"WHERE communities.id = $1 AND users.username = $2 "+
		"LIMIT 1"
		,[
			Number(req.params[0]),
			req.session.username
		],
		function(err,community_and_user_info){
			if(err){
				console.log(err);
				res.render('public/error',{error:'Could not get community/user information'});
				return;
			}else if(community_and_user_info.rows && community_and_user_info.rows[0] != null  && community_and_user_info.rows[0].url && community_and_user_info.rows[0].id){
				pg_conn.client.query(
					"INSERT INTO community_members (user_id,community_id,privilege_level) "+
					"VALUES ($1,$2,1)",
					[
						community_and_user_info.rows[0].id,
						Number([req.params[0]]) // Gets the first variable within the url (community id)
					],
					function(err){
						// Error 23505 means the users insert breaks the UNIQUE requirement of a column. Another way to do this would be to check before hand using a SELECT.
						//
						// The reason that this method can be is because there are only two columns that are UNIQUE so there is no situation in which the UNIQUE error code would be thrown for another UNIQUE column that isn't user_id or community_id.
						// The reason I decided to use this method is because I believe is should be faster as the database only needs to be accessed once.
						if(err && err.code == '23505'){
							res.redirect(community_and_user_info.rows[0].url+'?error=You are already a member of this community');
							return;
						}
						if(err){
							console.log(err);
							res.redirect(community_and_user_info.rows[0].url+'?error=Could not add to community');
							return;
						}
						res.redirect(community_and_user_info.rows[0].url+'?message=Successfully joined community');
					}
				);	
			}else{
				res.render('public/error',{error:'Could not find community with id or username'});
			}
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
					"INSERT INTO communities (name,unique_name,url,description,icon,wallpaper,layout,last_activity) "+
					"VALUES ($1,$2,$3,$4,$5,$6,$7,$8) "+
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
								invalid_tag_lengths.push('Tags must be less than ' + config[env].pg.varchar_limits.community_tags.tag + ' characters');
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
								  com_res.render(
								  	'private/cc_template',
								  	{
								  		username: com_req.session.username,
								  		c_name: req.body.c_name,
								  		c_wallpaper: wallpaper_url, 
								  		c_id: community_id.rows[0].id,
								  		c_url: community_url
								  	});
								});

								// Build that communities layout customization route
								app.get(community_url+'/layout', check_auth, function(com_req, com_res){
								  com_res.render(
								  	'private/cc_layout',
								  	{
								  		username: com_req.session.username,
								  		c_wallpaper: wallpaper_url, 
								  		c_id: community_id.rows[0].id
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

app.post('/login',function(req,res){

	if(!req.body.username){
		res.redirect('/login?error=Username is required');
		return;
	}

	if(!req.body.password){
		res.redirect('/login?error=Password is required');
		return;
	}

	pg_conn.client.query(
		"SELECT * FROM users WHERE username = $1 LIMIT 1",
		[
			req.body.username
		],
		function(err,user_info){
			if(err){
				console.log(err);
				res.render('public/error',{error:'Could not get user'});
			}else if(user_info && user_info.rows.length){
				pwd_h.validate(
						req.body.password,
						user_info.rows[0].password,
						user_info.rows[0].password_salt,
						user_info.rows[0].password_iterations,
						// Success_callback
						function(){									
							req.session.user_id = user_info.rows[0].id;
							req.session.username = user_info.rows[0].username;
							req.session.full_name = user_info.rows[0].name;
							req.session.email = user_info.rows[0].email;								
							res.redirect('/home');	
						},
						// Fail callback
						function(){
							res.redirect('/login?error=Invalid username or password');
						}
				);
			}else{
				res.redirect('/login?error=Invalid username or password');
			}
		}
	);
});


app.post('/register',function(req,res){

	if(!req.body.username){
		res.redirect('/register?error=Username is required');
		return;
	}

	if(!req.body.password){
		res.redirect('/register?error=Password is required');
		return;
	}

	if(!req.body.password_confirmation){
		res.redirect('/register?error=Please confirm your password');
		return;
	}

	if(req.body.password != req.body.password_confirmation){
		res.redirect('/register?error=Passwords do not match');
		return;		
	}

	// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
	let invalid_lengths = pg_conn.invalid_lengths(
		'users',
		[
			[
				req.body.full_name, // Input string #1
				'name' // Check input string #1's length against the VARCHAR limits for column 'name'
			],
			[
				req.body.username,
				'username'
			],
			[
				req.body.email,
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
		res.redirect('/register?error='+invalid_length_errors.join(','));
		return;
	}	

	// This is custom method that checks the password against the rules defined in the config file
	let invalid_pwd_msgs = pwd_h.is_invalid(req.body.password);
	if(invalid_pwd_msgs.length){
		res.redirect('/register?req_errors='+invalid_pwd_msgs.join(','));
		return;	
	}

	pg_conn.client.query(
		"SELECT username FROM users "+
		"WHERE username = $1 "+
		"LIMIT 1",
		[
			req.body.username
		],
		function(err,results){
			if(err){
				console.log(err);
				res.render('public/error',{error:'Could not check if username is already used'});
				return;
			}else if(results && results.rows.length == 0){
				pwd_h.hash(req.body.password,function(password){
					pg_conn.client.query(
						"INSERT INTO users (username,name,password,password_salt,password_iterations,email) "+
						"VALUES ($1,$2,$3,$4,$5,$6)",
						[
							req.body.username,
							req.body.full_name,
							password.hash,
							password.salt,
							password.iterations,
							req.body.email
						],
						function(err){
							if(err){
								console.log(err);
								res.render('public/error',{error:'Could not create user'});
								return;
							}
							res.redirect('/login?message=Successfully registered!');
						}
					);						
				});
			}else{
				res.redirect('/register?error=User already exists');
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
	
	socket.on('communities_req',function(){
		pg_conn.client.query(
			"SELECT name,description,icon,wallpaper,last_activity,url FROM communities",
			function(err,community_info){
				if(err){
					console.log(err)
					res.render('public/error',{error:'Could not get communities'});
					return;
				}
				socket.emit('communities_res',community_info.rows);
			}
		);
	});

	socket.on('apps_req',function(community_id){
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
					//socket.emit('apps_layout_res',layout);
					for(let i in layout){
						if(layout.hasOwnProperty(i)){
							web_apps[layout[i].type].get(layout[i].id,function(apps){
								for(let r = 0; r < apps.length;r++){
									layout[i].data = apps[r];
									socket.emit('apps_res',layout[i]);								
								}
							});
						}
					}
				}
			}
		);		
	});

	socket.on('apps_layout_submit',function(data){
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
				}
			}
		);
	});

	socket.on('available_apps_req',function(community_id){
		for(let i in web_apps){
			if(web_apps.hasOwnProperty(i)){
				web_apps[i].available(community_id,function(results){
					for(let r = 0; r < results.length;r++){
						socket.emit('available_apps_res',{type:i,id:results[r].id,data:results[r]});	
					}
				});
			}
		}
	});

	socket.on('app_submit',function(app){
		web_apps[app.type].add(app.community_id,app.data,function(err){
			if(err){
				socket.emit('app_submit_status',{error:'Application creation failed'});
			}else{
				socket.emit('app_submit_status',{message:'Successfully created application'});
			}
		});
	});

});
