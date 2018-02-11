module.exports = function(config){

	const tables_definitions = require('./pg_table_definitions')(config);

	const pg = require('pg');
	const readline = require('readline-sync');

	let pg_conn = this;

	if(config.pg.password == null){
		config.pg.password = readline.question("Please enter database password for user \""+config.pg.username+"\": ");
	}

	const conn_url = 'postgres://'+config.pg.username+':'+config.pg.password+'@'+config.pg.ip+':'+config.pg.port+'/'+config.pg.database_name;
	pg_conn.client = new pg.Client(conn_url);

	pg_conn.client.connect().catch(error=>{
		console.log(error.toString());
		console.log("Couldn't connect to database at \""+conn_url+"\" using these settings:");
		console.log(config.pg);
	});

	pg_conn.invalid_lengths = function(table_name,lengths_obj){
		let inv_lens = [];
		for(let i in lengths_obj){
			if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
				inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
			}
			
		}
		return inv_lens;
	}

	pg_conn.build = function(){

		let __build_promises = function(){
			let promises = [];
			for (let table_name in tables_definitions){
				if(tables_definitions.hasOwnProperty(table_name)){
					promises.push(new Promise((resolve,reject) => {
							pg_conn.client.query(tables_definitions[table_name],function(err){
								if(err){
									reject("Building table \""+table_name+"\" failed: "+err.message);
								}else{
									resolve();
								}
							})
						}
					));				
				}
			}
			return promises;
		}

		// Using promises allows us to check whether all the queries succeded without explicity chaining them together into a 'Callback christmas tree'
		//
		// Note: if one query fails the execution chain will stop.
		Promise.all(__build_promises()).catch(
			err => {
				console.log(err);
			}
		);
		
	};

	return pg_conn;
};
