const config = {
	development: {
		ssl: {
			key: './ssl/dev/key.pem',
			cert: './ssl/dev/cert.pem'
		},
		server: {
			http: {
				port: 80
			},
			https:{
				port: 443
			}
		},
		pg: {
			username: 'postgres',
			password: 'pass',
			ip: 'localhost',
			port: 5432,
			database_name: '4bar'
		},
		crypto: {
			password: {
				hash_bytes: 32,
				salt_bytes: 16,
				iterations: 872791
			}
		},
		registration: {
			password: {
				min_length: 8,
				min_alphas: 1,
				min_lowercase: 1,
				min_numbers: 1,
				min_specials: 1
			}
		}
	},

	production: {
		ssl: {
			key: '../ssl/privkey.pem',
			cert: '../ssl/fullchain.pem'
		},
		server: {
			http: {
				port: 80
			},
			https:{
				port: 443
			}
		},
		pg: {
			username: 'postgres',
			//password: '', // Disabling this enables a prompt for the password
			ip: 'localhost',
			port: 5432,
			database_name: '4bar'	
		},
		crypto: {
			password: {
				hash_bytes: 32,
				salt_bytes: 16,
				iterations: 872791
			}
		},
		registration: {
			password: {
				min_length: 8,
				min_alphas: 1,
				min_lowercase: 1,
				min_numbers: 1,
				min_specials: 1
			}
		}
	}
};

module.exports = config;