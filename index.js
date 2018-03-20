//////////////////////////////////////////////////////////////////////
// 4bar/index.js
//
// Overview: 
//   - Start 4bar server using settings from '4bar/config.js'
//  
// Objectives: 
//   1. Load configuration settings from '4bar/config.js'
//   2. Process and respond to command line arguments
//   3. Start the 4bar server
//
//////////////////////////////////////////////////////////////////////

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

const config_file = __dirname+'/config';

const config = require(config_file);

//////////////////////////////////////////////////////////////////////
<<<<<<< HEAD
// Set the operating environment to 'development' if the environment
// variable:
// 		$NODE_ENV (unix)
//		or 		
//		%NODE_ENV%  (windows)
// is not set
=======
// Express Sessions
//
// Sessions are used to save a client's information on the server side.
// For example when a user logs in we can set req.session.username. Then
// when he tries to access another page we can check if req.session.uername has
// been set. If it has then we allow him to proceed.
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
//
// The operating environment determines which config settings to use 
// within '4bar\config.js'
//////////////////////////////////////////////////////////////////////

const env = process.env.NODE_ENV || 'development';

if(typeof config === 'undefined' || typeof config[env] === 'undefined'){
	console.log(new Error("Could not find environment \""+env+"\" in \""+config_file+"\""));
	process.exit(1);
}

<<<<<<< HEAD
//////////////////////////////////////////////////////////////////////
// Set the applications root directory so that we don't have to use 
// relative path within modules that are within subdirectories
=======
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
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
//////////////////////////////////////////////////////////////////////

config[env].root_dir = __dirname;

//////////////////////////////////////////////////////////////////////
<<<<<<< HEAD
// Parse arguments passed to node from the command line
=======
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
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
//////////////////////////////////////////////////////////////////////

const argv = require('minimist')(
	process.argv.slice(2),
	{
		string: [
			'password',
			'environment'
		],
		boolean: [
			'help',
			'build',
			'destroy',
			'rebuild',
			'clean'
		],
		alias: {
			h: 'help',
			
			a: 'environment',
			p: 'password',
			
			b: 'build',
			d: 'destroy',
			r: 'rebuild',

			c: 'clean'
		}
	}
<<<<<<< HEAD
);
=======
}

//////////////////////////////////////////////////////////////////////
// This is a custom middleware that redirects all insecure traffic to
// the https server
//////////////////////////////////////////////////////////////////////
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3

if(argv['help']){
    console.log(
		"\n"+
		"usage: node index.js [--help] [--environment env] [--password pass] [--build] [--destroy] [--rebuild] [--clean]\n"+
		"\n"+
		"  -h, --help                   : display usage information\n"+		
		"  -e env, --environment env    : where env is the environment to use defined within '4bar/config.js'\n"+
		"  -p pass, --password pass     : where pass is the password to use when connecting to postgresql\n"+
		"  -b, --build                  : build the postgresql tables defined within '4bar/definitions/pg_table_definitions'\n"+
		"  -d, --destroy                : destroy the postgresql tables\n"+
		"  -r, --rebuild                : destroy and rebuild the postgresql tables defined within '4bar/definitions/pg_table_definitions'\n"+
		"  -c, --clean                  : delete all community data files (wallpapers and icons)\n"+		
		"\n"+
		"example: node index.js --environment development --password pass --rebuild\n"
    );
    process.exit(0);
}

//////////////////////////////////////////////////////////////////////
<<<<<<< HEAD
// Delete all user submitted media files if --clean,-c is passed as
// an argument
//////////////////////////////////////////////////////////////////////

if(argv['clean'] === true){
	const fs = require('fs');
	const path = require('path');
=======
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
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3

	let dirs = [
		path.join(config[env].root_dir,'/client/media/community/icons'),
		path.join(config[env].root_dir,'/client/media/community/wallpapers'),
		path.join(config[env].root_dir,'/client/media/user/avatars')
	];

<<<<<<< HEAD
	let dir_promises = [];

	for(let i = 0;i < dirs.length;i++){
		dir_promises.push(
			new Promise(
				(resolve,reject) => {
					console.log("Cleaning files in directory: \""+dirs[i]+"\"");
					fs.readdir(dirs[i], 
						(err,files) => {
						
							if(err) {
								throw err;
=======
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
								invalid_tag_lengths.push('Tag "'+tags_split[i]+'" must be less than ' + config[env].pg.varchar_limits.community_tags.tag + ' characters');
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
							}

<<<<<<< HEAD
							let file_promises = [];

							for(let file of files){
								if(file !== '_gitignore.txt'){
									file_promises.push(
										new Promise (
											(resolve,reject) => {
												fs.unlink(path.join(dirs[i], file), 
													(err) => {
														if(err) {
															throw err;
														}else{
															console.log("Deleted \""+file+"\"");
															resolve();
														}
													}
												);	
											}
										)
									);

								}
							}

							Promise.all(file_promises).then(()=>{resolve()});
						}
					);
				}
			)
		);
	}
	
	Promise.all(dir_promises).then(
		() =>{
			console.log("Done");
			process.exit(0);
		}
	);
}

//////////////////////////////////////////////////////////////////////
// Initialize the 4bar server
//////////////////////////////////////////////////////////////////////

let Server = require(config[env].root_dir+'/server/Server.js');
let server = new Server(config[env]);

switch (true){
	
	//////////////////////////////////////////////////////////////////////
	// Build the postgres database and then exit
	//////////////////////////////////////////////////////////////////////

	case argv['build']:
		console.log("Building database");
		server.pg_conn.build_database(
			err => {
=======
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

app.get(
    '/tournaments', // This is the base url ('4bar.org/tournaments')
    function(req,res){
         pg_conn.client.query(
            "SELECT * FROM tournaments where id = $1",
            [
                 req.query['id'] // This is whatever '4bar.org/tournaments/id=' is set to
            ],
            function(err,results){
                if(err){
                   consle.log(err);
                }
                res.render(
                  '/tournaments',  //This is handlebars filename
                    {
                        tournament_name: results.rows[0].name,
                        tournament_loc: results.rows[0].location,
												tournament_limit: results.rows[0].limit,
												tournament_deadline: results.rows[0].deadline,
												tournament_date: results.rows[0].date
                    }
                );
            }
        );
    }
);

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
			return;
		}

		if(!data.password){
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

	socket.on('community_join_req',function(data){
		pg_conn.client.query(
			"SELECT communities.url,users.id FROM communities,users "+
			"WHERE communities.id = $1 AND users.username = $2 "+
			"LIMIT 1"
			,[
				Number(data.c_id),
				socket.handshake.session.username
			],
			function(err,community_and_user_info){
				if(err){
					console.log(err);
					socket.emit('notification',{error:'Could not get community/user information'});
					return;
				}else if(community_and_user_info.rows && community_and_user_info.rows[0] != null  && community_and_user_info.rows[0].url && community_and_user_info.rows[0].id){
					pg_conn.client.query(
						"INSERT INTO community_members (user_id,community_id,privilege_level) "+
						"VALUES ($1,$2,1)",
						[
							community_and_user_info.rows[0].id,
							Number(data.c_id) // Gets the first variable within the url (community id)
						],
						function(err){
							// Error 23505 means the users insert breaks the UNIQUE requirement of a column. Another way to do this would be to check before hand using a SELECT.
							//
							// The reason that this method can be is because there are only two columns that are UNIQUE so there is no situation in which the UNIQUE error code would be thrown for another UNIQUE column that isn't user_id or community_id.
							// The reason I decided to use this method is because I believe is should be faster as the database only needs to be accessed once.
							if(err && err.code == '23505'){
								socket.emit('notification',{error:'You are already a member of this community'});
								return;
							}
							if(err){
								console.log(err);
								socket.emit('notification',{error:'Error joining the community'});
								return;
							}
							socket.emit('notification',{success:'Successfully joined community'});
						}
					);
				}else{
					socket.emit('notification',{error:'Could not find community with id or username'});
				}
			}
		);
	});

	socket.on('communities_req',function(){
		pg_conn.client.query(
			"SELECT name,description,icon,wallpaper,last_activity,url FROM communities",
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
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
				if(err){
					console.log(err);
					process.exit(1);
				}
<<<<<<< HEAD
				server.pg_conn.verify_database(err => {
					if(err){
						console.log(err);
						process.exit(1);
=======

				let layout = JSON.parse(results.rows[0].layout);
				if(layout){
					for(let i in layout){
						if(layout.hasOwnProperty(i)){
							if(widgets_conn.hasOwnProperty(layout[i].type)){
								widgets_conn[layout[i].type].get(layout[i].id,function(widgets,notification){
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
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
					}
					console.log("Done");
					process.exit(0);
				});
			}
		);
<<<<<<< HEAD
	break;

	//////////////////////////////////////////////////////////////////////
	// Destroy the postgres database and then exit
	//////////////////////////////////////////////////////////////////////

	case argv['destroy']:
		console.log("Destroying Database");
		server.pg_conn.destroy_database(
			err => {
				if(err){
					console.log(err);
					process.exit(1);
				}
				console.log("Done");
				process.exit(0);
			}
		);
	break;

	//////////////////////////////////////////////////////////////////////
	// Destroy the postgres database, then build it, then verify it exists
	// , and finally exit
	//////////////////////////////////////////////////////////////////////

	case argv['rebuild']:
		console.log("Rebuilding Database");
		server.pg_conn.destroy_database(
			err => {
				if(err){
					console.log(err);
					process.exit(1);
				}
				server.pg_conn.build_database( 
					err => {
						if(err){
							console.log(err);
							process.exit(1);
						}

						server.pg_conn.verify_database(err => {
							if(err){
								console.log(err);
								process.exit(1);
							}
							console.log("Done");
							process.exit(0);
						});
					}
				);
			}
		);
	break;

	//////////////////////////////////////////////////////////////////////
	// Verify the database exists then start the server
	//////////////////////////////////////////////////////////////////////

	default:
		server.pg_conn.verify_database(
			err => {
				if(err){
					console.log(err);
					process.exit(1);
=======
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
		for(let widget_type in widgets_conn){
			if(widgets_conn.hasOwnProperty(widget_type)){
				widgets_conn[widget_type].available(community_id,function(available_widgets,notification){
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
		if(widgets_conn.hasOwnProperty(widget.type)){
			widgets_conn[widget.type].add(widget.community_id,widget.data,function(success,notification){
				notification.name = "widget_submit_res";
				socket.emit('notification',notification);
			});
		}else{
			socket.emit('notification',{error:"Unknown widget type \'"+widget.type+"\'"})
		}
	});

	socket.on('join_community_req',function(community_id){
		pg_conn.client.query(
			"SELECT id FROM users WHERE "+
			"username = $1 "+
			"LIMIT 1"
			,[
				socket.handshake.session.username
			],
			function(err,user_id){
				if(err){
					console.log(err);
					socket.emit('notification',{error:'Could not get community/user information'});
					return;
				}else if(user_id.rows && user_id.rows[0] != null && user_id.rows[0].id){
					pg_conn.client.query(
						"INSERT INTO community_members (user_id,community_id,privilege_level) "+
						"VALUES ($1,$2,1)",
						[
							Number(user_id.rows[0].id),
							Number(community_id)
						],
						function(err){
							// Error 23505 means the users insert breaks the UNIQUE requirement of a column. Another way to do this would be to check before hand using a SELECT.
							//
							// The reason that this method can be is because there are only two columns that are UNIQUE so there is no situation in which the UNIQUE error code would be thrown for another UNIQUE column that isn't user_id or community_id.
							// The reason I decided to use this method is because I believe is should be faster as the database only needs to be accessed once.
							if(err && err.code == '23505'){
								socket.emit('notification',{error:'You are already a member of this community'});
								return;
							}
							if(err){
								console.log(err);
								socket.emit('notification',{error:'Could not join you to the community'});
								return;
							}
							socket.emit('notification',{success:'Successfully joined community!'});
						}
					);
				}else{
					socket.emit('notification',{error:'Could not find community with id or username'});
>>>>>>> 32a2e689adf44b3240cff321555b48e08d78d0c3
				}
				server.start();
			}
		);
}

