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
// Set the operating environment to 'development' if the environment
// variable:
// 		$NODE_ENV (unix)
//		or 		
//		%NODE_ENV%  (windows)
// is not set
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
);

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
// Delete all user submitted media files if --clean,-c is passed as
// an argument
//////////////////////////////////////////////////////////////////////

if(argv['clean'] === true){
	const fs = require('fs');
	const path = require('path');

	let dirs = [
		path.join(config[env].root_dir,'/client/media/icons'),
		path.join(config[env].root_dir,'/client/media/wallpapers'),
		path.join(config[env].root_dir,'/client/media/avatar')
	];

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
							}

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
				}
				server.start();
			}
		);
}

