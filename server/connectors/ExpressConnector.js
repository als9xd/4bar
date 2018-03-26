//////////////////////////////////////////////////////////////////////
// 4bar/server/connectors/ExpressConnector.js
//
// Overview: 
//	- Builds a connector between express related functionality 
//    and definitions
//  
// Constructor Objectives:
//  1. Import and initialize all express related modules
//  2. Set express and express-handlebars views directory to 
//     '4bar/client/views'
//  3. Load all custom express routing middleware from 
//     '4bar/server/definitions/express/express_middleware_definitions.js'
//  4. Load all public directories that don't require authentication
//
// Public Functions:
//   
//   ExpressConnector.build_routes(
//     String definitions_file,
//     PgConnector pg_conn,
//     SocketIOConnector socket_io_conn
//   );
//
// More about express routing:
//
//   https://expressjs.com/en/guide/routing.html
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = class ExpressConnector{
	constructor(config,pg_conn){

		//////////////////////////////////////////////////////////////////////
		// Store config inside class so that it can be accessed from member 
		// functions
		//////////////////////////////////////////////////////////////////////

		this.config = config;

		//////////////////////////////////////////////////////////////////////
		// Initialize express
		//////////////////////////////////////////////////////////////////////		

		this.express = require('express');

		this.app = this.express();

		//////////////////////////////////////////////////////////////////////
		// Set express views directory to '4bar/client/views'
		//////////////////////////////////////////////////////////////////////

		this.app.set('views',config.root_dir+'/client/views');

		//////////////////////////////////////////////////////////////////////
		// Load custom routing middeware
		//
		// Node.js Middleware:
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

		this.middleware = require(config.root_dir+'/server/definitions/express/express_middleware_definitions')(pg_conn);

		//////////////////////////////////////////////////////////////////////
		// This middleware is used to parse forms (same as body-parser)
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

		const express_fileupload = require('express-fileupload');
		this.app.use(express_fileupload());

		//////////////////////////////////////////////////////////////////////
		// Initialize express-session
		//
		// Express Sessions:
		//
		// Sessions are used to save a client's information on the server side.
		// For example when a user logs in we can set req.session.username. Then 
		// when he tries to access another page we can check if req.session.uername has
		// been set. If it has then we allow him to proceed.
		//
		//////////////////////////////////////////////////////////////////////

		this.session = require('express-session')({
		    secret: 'secret',
		    resave: true,
		    saveUninitialized: true
		});

		this.app.use(this.session);

		//////////////////////////////////////////////////////////////////////
		// This middlware is used to parse form data
		//////////////////////////////////////////////////////////////////////

		const body_parser = require('body-parser');
		this.app.use(body_parser.urlencoded({
			extended: true
		}));
		this.app.use(body_parser.json());

		//////////////////////////////////////////////////////////////////////
		// These middleware allow client-side access to all files in each of
		// their respective directories without authentication or explicity
		// sending the file within a route
		//////////////////////////////////////////////////////////////////////

		let path = require('path');

		this.public_directories = [			

				// This contains all public html and css files
				path.join(config.root_dir,'/client/html/public'),

				// This contains all the public handlebars templates
				path.join(config.root_dir,'/client/views/public'),

				// This contains all the public media files
				// Right now this includes: 
				// 		community icons,
				//		community wallpapers,
				//		user avatars,
				//		site default images
				path.join(config.root_dir,'/client/media')
		];

		for(let i = 0; i < this.public_directories.length;i++){
			this.app.use(
				this.express.static(this.public_directories[i])
			);
		}

		//////////////////////////////////////////////////////////////////////
		// Load templating engine 
		//
		// Handlebars Templating Engine:
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
		this.app.engine('handlebars', exphbs({
			layoutsDir: config.root_dir+"/client/views/",
			partialsDir: config.root_dir+"/client/views/"
		})); 
		this.app.set('view engine', 'handlebars');

	}

	//////////////////////////////////////////////////////////////////////
	// ExpressConnector.build_routes(
	//     String definition_file,
	//     PgConnector pg_conn,
	//     SocketIOConnector socket_io_conn
	// );
	//
	// - Member function for building the static routes from their definitions
	// 
	//////////////////////////////////////////////////////////////////////	

	build_routes(definition_file,pg_conn,socket_io_conn){
		
		//////////////////////////////////////////////////////////////////////
		// Load route definitions from the file located at definition_file
		//////////////////////////////////////////////////////////////////////

		this.routes = require(definition_file)(
			this,
			pg_conn,
			socket_io_conn
		);

		for(let i = 0; i < this.routes.length;i++){
			this.routes[i]();
		}
	}

}