//////////////////////////////////////////////////////////////////////
// 4bar/server/connectors/PgConnector.js
//
// Overview: 
//	- Builds a connector for postgres related functionality 
//    and definitions
//  
// Constructor Objectives:
//  1. Import and initialize postgres module
//  2. Connect to postgres database using configuation settings within 
//     '4bar/config.js'
//
// Public Functions:
//   
//   build_database(Function callback)
//   destroy_database(Function callback)
//
// More about postgres with node:
//
//   https://node-postgres.com/
//
//////////////////////////////////////////////////////////////////////

'use strict';

//////////////////////////////////////////////////////////////////////
// This is used to get input from user to:
//   1. Enter postgres password
//   2. Prompt to build database
//////////////////////////////////////////////////////////////////////

const readlineSync = require('readline-sync');

module.exports = class PgConnector{
	
	constructor(config){

		//////////////////////////////////////////////////////////////////////
		// Store config inside class so that it can be accessed from member 
		// functions
		//////////////////////////////////////////////////////////////////////

		this.config = config;

		this.pg = require('pg');

		if(typeof config.pg.password === 'undefined'){
			config.pg.password = readlineSync.question("Postgres Password: ",{
				hideEchoBack: true
			});
		}

		//////////////////////////////////////////////////////////////////////
		// Try to connect to postgres database and exit if connection fails
		//////////////////////////////////////////////////////////////////////

		let pg_connection_url = 'postgres://'+config.pg.username+':'+config.pg.password+'@'+config.pg.ip+':'+config.pg.port+'/'+config.pg.database_name;
		this.client = new this.pg.Client(pg_connection_url);
		this.client.connect().catch(err=>{
			console.log(err);
			process.exit(1);
		});

		//////////////////////////////////////////////////////////////////////
		// Load postgres definitions from their respective files
		//////////////////////////////////////////////////////////////////////

		this.table_definitions = require(config.root_dir+'/server/definitions/postgres/pg_table_definitions')(config);
		this.trigger_definitions = require(config.root_dir+'/server/definitions/postgres/pg_trigger_definitions')(config);

		this.search_filter_definitions = require(config.root_dir+'/server/definitions/postgres/pg_search_filter_definitions')(this.client);
		this.widget_definitions = require(config.root_dir+'/server/definitions/postgres/pg_widget_definitions')(this.client);

		this.sort_filter_definitions = require(config.root_dir+'/server/definitions/postgres/pg_sort_filter_definitions');
	}

	//////////////////////////////////////////////////////////////////////
	// PgConnector.load_widgets(String definition_file) - Member function 
	// for loading the widget definitions
	//////////////////////////////////////////////////////////////////////	

	load_widgets(definition_file){
		this.widget_definitions = require(definition_file)(this);
	}

	//////////////////////////////////////////////////////////////////////
	// PgConnector.verify_database(Function callback) - Member function 
	// for checking if the database has been built
	//////////////////////////////////////////////////////////////////////	

	verify_database(callback){
		let self = this;
		self.client.query(
			"SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'",
			function(err,results){
				if(err){
					callback(err);
				}else if(results && results.rows && results.rows.length){
					callback();
				}else{
					if(
						readlineSync.keyInYN("Database '"+self.config.pg.database_name+"' has not been built.\nWould you like to build it?\n")
					){
						self.build_database(()=>{callback()});
						return;
					}else{
						callback();
					}
				}
				
			}
		);
	}


	//////////////////////////////////////////////////////////////////////
	// PgConnector.build_database(Function callback) - Member function 
	// for building the database 
	//
	// Objectives:
	// 	1. Build tables from their definitions
	//  2. Build triggers from their definitions
	// 
	//////////////////////////////////////////////////////////////////////	

	build_database(callback){
		let self = this;
		
		self.client.query(
			"CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION postgres;"+
			"GRANT ALL ON SCHEMA public TO postgres;"+
			"GRANT ALL ON SCHEMA public TO public;"
			,
			function(err){
				if(err){
					callback(err);
					return;
				}

				let __build_pg_promises = function(definitions){
					let promises = [];
					for (let defintion_name in definitions){
						if(definitions.hasOwnProperty(defintion_name)){
							promises.push(
								new Promise(
									function(resolve,reject){
										self.client.query(definitions[defintion_name],
											function(err){
												if(err){
													reject(err);
												}
												resolve();
											}
										);
									}
								)
							);				
						}
					}
					return promises;
				}

				let table_promises = __build_pg_promises(self.table_definitions);
				let trigger_promises = __build_pg_promises(self.trigger_definitions);

				let promises = table_promises.concat(trigger_promises);
				
				Promise.all(
					promises
				).then(
					function(){
						if(typeof callback !== 'undefined'){
							callback(null);
							return;
						}	
					}				
				).catch(
					err => {
						if(typeof callback !== 'undefined'){
							callback(err);
							return;
						}
					}
				);

			}
		);	
	}

	//////////////////////////////////////////////////////////////////////
	// PgConnector.destroy_database(Function callback) - Member function 
	// for destorying the database
	//
	// Objectives:
	// 	1. Destory database
	// 
	//////////////////////////////////////////////////////////////////////	

	destroy_database(callback){
		this.client.query(
			"DROP SCHEMA IF EXISTS public CASCADE",
			function(err){
				if(typeof callback !== 'undefined'){
					callback(err);
					return;
				}
			}
		);
	}
};
