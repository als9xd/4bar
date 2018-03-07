//////////////////////////////////////////////////////////////////////
// 4bar/index.js
//
// Overview: 
//   - Start 4bar server using settings from '4bar/config.js'
//  
// Function: 
//   1. Load configuration settings from '4bar/config.js'
//   2. Load command line arguments into configuation settings
//   3. Optionally either build,destroy, or rebuild the database
//   4. Start the 4bar server
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
// Set the operating environment to 'development' if the environment
// variable:
// 		$NODE_ENV (unix)
//		or 		
//		%NODE_ENV%  (windows)
// is not set
//
// The operating environment determines which config settings to use 
// within '4bar\config.js'
//////////////////////////////////////////////////////////////////////

const env = process.env.NODE_ENV || 'development';

if(typeof config === 'undefined' || typeof config[env] === 'undefined'){
	console.log(new Error("Could not find environment \""+env+"\" in \""+config_file+"\""));
	process.exit(1);
}

//////////////////////////////////////////////////////////////////////
// Set the applications root directory so that we don't have to use 
// relative path within modules that are within subdirectories
//////////////////////////////////////////////////////////////////////

config[env].root_dir = __dirname;

//////////////////////////////////////////////////////////////////////
// Parse arguments passed to node from the command line
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
			'rebuild'
		],
		alias: {
			h: 'help',
			
			a: 'environment',
			p: 'password',
			
			b: 'build',
			d: 'destroy',
			r: 'rebuild'
		}
	}
);

if(argv['help']){
    console.log(
		"\n"+
		"usage: node index.js [--help] [--environment env] [--password pass] [--build] [--destroy] [--rebuild]\n"+
		"\n"+
		"  -h, --help                   : display usage information\n"+		
		"  -e env, --environment env    : where env is the environment to use defined within '4bar/config.js'\n"+
		"  -p pass, --password pass     : where pass is the password to use when connecting to postgresql\n"+
		"  -b, --build                  : build the postgresql tables defined within '4bar/definitions/pg_table_definitions'\n"+
		"  -d, --destroy                : destroy the postgresql tables\n"+
		"  -r, --rebuild                : destroy and rebuild the postgresql tables defined within '4bar/definitions/pg_table_definitions'\n"+
		"\n"+
		"example: node index.js --environment development --password pass --rebuild\n"
    );
    process.exit(0);
}


//////////////////////////////////////////////////////////////////////
// Look for postgresql password on command line, then check 
// '4bar/config.js'. If no password is found exit because the server
// requires an active postgresql connection
//////////////////////////////////////////////////////////////////////

if(typeof argv['password'] !== 'undefined'){
	config[env].pg.password = argv['password'];
}

if(typeof config[env].pg.password === 'undefined'){
	console.log(new Error('Not postgresql password supplied'));
	process.exit(1);
}

//////////////////////////////////////////////////////////////////////
// Initialize and start the 4bar server
//////////////////////////////////////////////////////////////////////

let Server = require(config[env].root_dir+'/server/Server.js');
let server = new Server(config[env]);

switch (true){
	
	//////////////////////////////////////////////////////////////////////
	// Build the postgres database then start the server
	//////////////////////////////////////////////////////////////////////

	case argv['build']:
		server.pg_conn.build_database(
			err => {
				if(err){
					console.log(err);
					process.exit(1);
				}
				server.start();
			}
		);
	break;

	//////////////////////////////////////////////////////////////////////
	// Destroy the postgres database then exit
	//////////////////////////////////////////////////////////////////////

	case argv['destroy']:
		server.pg_conn.destroy_database(
			err => {
				if(err){
					console.log(err);
					process.exit(1);
				}

				// Terminate the process because the server won't start 
				// without the database having the proper tables and
				// triggers
				process.exit(0);
			}
		);
	break;

	//////////////////////////////////////////////////////////////////////
	// Destroy the postgres database, then build it, then start server
	//////////////////////////////////////////////////////////////////////

	case argv['rebuild']:
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
						server.start();
					}
				);
			}
		);
	break;

	//////////////////////////////////////////////////////////////////////
	// Start the server
	//////////////////////////////////////////////////////////////////////

	default:
		server.start();
}

