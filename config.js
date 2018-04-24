//////////////////////////////////////////////////////////////////////
// 4bar/config.js
//
// Overview: 
//	- contains the default configuration settings to be used to start
//    the 4bar server
//  
//////////////////////////////////////////////////////////////////////

'use strict';

const config = {
	development: {
		ssl: {
			key: './ssl/dev/key.pem',
			cert: './ssl/dev/cert.pem',
			secret: 'secret'
		},
		server: {
			http: {
				port: 80
			},
			https:{
				port: 443
			},
			secret: 'secret',
			hostname: 'https://localhost'
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
				market_items: {
					name: 200
				},
				communities: {
					name: 30
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
				tournaments: {
					name: 255,
					location: 255
				},
				tournament_tags: {
					tag: 20
				},
       			events: {
					event_name: 40,
					street_address: 255,
					city: 40,
					state: 13,
				},
				widgets: {
					text_color: 6,
					bg_color: 6
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
		},
		privileges: {
			admin: 1,
			mod: 2,
			member: 3
		},
		nodebb: {
			address: 'https://forums.localhost',
			secret: 'secret',
			api_key: 'none' // Disabling this enables a prompt for nodebb api key
		}
	},

	production: {
		ssl: {
			key: '../ssl/privkey.pem',
			cert: '../ssl/fullchain.pem',
		},
		server: {
			http: {
				port: 80
			},
			https:{
				port: 443
			},
			// secret: '', //Disabling this enables a prompt for express session secrets
			hostname: 'https://4bar.org'
		},
		pg: {
			username: 'postgres',
			// password: '', // Disabling this enables a prompt for the password
			ip: 'localhost',
			port: 5432,
			database_name: '4bar',
			varchar_limits: {
				users: {
					username: 20,
					name: 226,
					email: 254
				},
				market_items: {
					name: 200
				},
				communities: {
					name: 30
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
				tournaments: {
					name: 255,
					location: 255
				},
				tournament_tags: {
					tag: 20
				},
				events: {
					event_name: 40,
					street_address: 255,
					city: 40,
					state: 13,
				},
				widgets: {
					text_color: 6,
					bg_color: 6
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
		},
		privileges: {
			admin: 1,
			mod: 2,
			member: 3
		},
		nodebb: {
			address: 'https://forums.4bar.org',
			//secret: '', // Disabling this enables a prompt for nodebb secret
			// api_key: '' // Disabling this enables a prompt for nodebb api key
		}
	}
};

module.exports = config;
