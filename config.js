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
			database_name: '4bar',
			varchar_limits: {
				users: {
					username: 20,
					name: 226,
					email: 254
				},
				communities: {
					name: 30,
					unique_name: 255,
					last_activity: 10
				},
				community_tags: {
					tag: 20
				},
				community_members: {
				},
				community_stats: {
					stat_name: 30,
					stat_value: 255
				},
				platforms: {
					name: 20
				}, 
				games: {
					title: 200
				},
				market_items: {
					name: 200
				}
			}
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
			database_name: '4bar',
			varchar_limits: {
				users: {
					username: 20,
					name: 226,
					email: 254
				},
				communities: {
					name: 30,
					unique_name: 255,
					last_activity: 10
				},
				community_tags: {
					tag: 20
				},
				community_members: {
				},
				community_stats: {
					stat_name: 30,
					stat_value: 255
				},
				platforms: {
					name: 20
				}, 
				games: {
					title: 200
				},
				market_items: {
					name: 200
				}
			}
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