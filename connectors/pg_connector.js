module.exports = function(config){
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

	pg_conn.table_exists = function(table_name,callback){
		if(pg_conn.client){
			pg_conn.client.query('SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = \'public\' AND tablename = $1)',[table_name],function(err,results){
				callback(err,results.rows[0].exists);
			});
		}
	}

	pg_conn.build = function(){
		let salt_length = config.crypto.password.salt_bytes*(4/3);
		let base_64_salt_legth = Math.ceil(salt_length/4) * 4;
		pg_conn.client.query(
			'CREATE TABLE users('+
				'id SERIAL PRIMARY KEY,'+
				'username VARCHAR(20) UNIQUE not null,'+
				'name VARCHAR(50),'+
				'password BYTEA not null,'+
				'password_salt VARCHAR('+base_64_salt_legth+') not null,'+
				'password_iterations NUMERIC not null,'+
				'email VARCHAR(50)'+
			')'
			,function(err){
			if(err){
				console.log(err);
			}
		});
	};

	return pg_conn;
};
