
//////////////////////////////////////////////////////////////////////
// This module is used for password encryption within the 'login' and
// 'register' socket listeners
//////////////////////////////////////////////////////////////////////
const crypto = require('crypto');


module.exports = function(config,pg_conn,nodebb_conn){

	return [
		//////////////////////////////////////////////////////////////////////
		// This listener allows a user to login
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('login_req',function(data){

				if(typeof data.username !== 'string' || data.username.length === 0){
					socket.emit('notification',{error:'Username is required'});
					return;					
				}

				if(typeof data.password !== 'string' || data.password.length === 0){
					socket.emit('notification',{error:'Please enter your password'});
					return;
				}

				pg_conn.client.query(
					"SELECT * FROM users \
						WHERE username = $1 \
						LIMIT 1 \
					",
					[
						data.username
					],
					function(err,user_info){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not get user'});
						}else if(user_info && user_info.rows.length){
							crypto.pbkdf2(
								data.password,
								user_info.rows[0].password_salt,
								Number(user_info.rows[0].password_iterations),
								user_info.rows[0].password.length,
								'sha256',
								function(err,str_hash){
									if(err){
										console.log(err);
									}else if(user_info.rows[0].password.equals(str_hash)){

										// This is used to check whether a user is logged in within the check_auth middleware
										socket.handshake.session.auth = true;

										socket.handshake.session.user_id = user_info.rows[0].id;
										socket.handshake.session.username = user_info.rows[0].username;
										socket.handshake.session.full_name = user_info.rows[0].name;
										socket.handshake.session.email = user_info.rows[0].email;
										socket.handshake.session.avatar = user_info.rows[0].avatar;

										let payload = {
											id: user_info.rows[0].id,
											username: user_info.rows[0].username,
											email: user_info.rows[0].email,
											firstName: user_info.rows[0].name											
										};

										if(user_info.rows[0].avatar !== null){
											payload.picture = config.server.hostname+'/avatars/'+user_info.rows[0].avatar;
										}

										nodebb_conn.create_jwt(
										config,
										payload,
										function(err,token){
											if(err){
												console.log(err);
											}
											socket.handshake.session.token = token;
											socket.handshake.session.save();
											socket.emit('notification',{success: 'Successfully Logged in!'});	
											socket.emit('login_status',{status:true});
										});

									}else{
										socket.emit('notification',{error: 'Invalid username or password'});
									}
								}
							);
						}else{
							socket.emit('notification',{error:'Invalid username or password'});
						}
					}
				);
			});

		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This listener allows a user to register
		//////////////////////////////////////////////////////////////////////

		(socket) => {

			socket.on('register_req',function(data){
				if(typeof data.username !== 'string' || data.username.length === 0){
					socket.emit('notification',{error:'Username is required'});
					return;
				}

				if(typeof data.password !== 'string' || data.password.length === 0){
					socket.emit('notification',{error:'Password is required'});
					return;
				}

				if(typeof data.password_confirmation !== 'string' || data.password_confirmation.length === 0){
					socket.emit('notification',{error:'Please confirm your password'});
					return;
				}

				if(data.password !== data.password_confirmation){
					socket.emit('notification',{error:'Passwords do not match'});
					return;		
				}

				// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
				let __invalid_lengths = function(table_name,lengths_obj){
					let inv_lens = [];
					for(let i in lengths_obj){
						if(lengths_obj[i][0].length > config.pg.varchar_limits[table_name][lengths_obj[i][1]]){
							inv_lens.push({table_name: lengths_obj[i][1],limit: config.pg.varchar_limits[table_name][lengths_obj[i][1]]})
						}
						
					}
					return inv_lens;
				}


				// This is a custom function I wrote that makes it easier to check whether the lengths of input strings are within the assigned VARCHAR limits
				let invalid_lengths = __invalid_lengths(
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

				let __check_password_validity = function(str){
					let reqs = config.registration.password;
					
					let invalid_msgs = [];
					
					if(str.length < reqs.min_length){
						invalid_msgs.push("at least "+reqs.min_length+" character"+(reqs.min_length==1?"":"s")+" long")
					}
					if(str.replace(/[^A-Z]/g, "").length < reqs.min_alpha){
						invalid_msgs.push("at least "+reqs.min_alpha+" capital letter"+(reqs.min_alpha==1?"":"s"));
					}
					if(str.replace(/[^a-z]/g, "").length < reqs.min_lowercase){
						invalid_msgs.push("at least "+reqs.min_lowercase+" lowercase letter"+(reqs.min_lowercase==1?"":"s"));
					}
					if(str.replace(/[^0-9]/g, "").length < reqs.min_numbers){
						invalid_msgs.push("at least "+reqs.min_numbers+" number"+(reqs.min_numbers==1?"":"s"));
					}
					if(str.replace(/[^!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g,"").length < reqs.min_specials){
						invalid_msgs.push("at least "+reqs.min_specials+" special characters");
					}

					return invalid_msgs;					
				}

				// This is custom method that checks the password against the rules defined in the config file
				let invalid_pwd_msgs = __check_password_validity(data.password);
				if(invalid_pwd_msgs.length){
					socket.emit('notification',{title:'Did not meet password requirements',error:invalid_pwd_msgs});
					return;	
				}

				pg_conn.client.query(
					"SELECT 1 FROM users \
						WHERE username = $1 \
						LIMIT 1 \
					",
					[
						data.username
					],
					function(err,username_taken){
						if(err){
							console.log(err);
							socket.emit('notification',{error:'Could not check if username is already used'});
							return;
						}

						if(typeof username_taken === 'undefined' || username_taken.rowCount === 1){
							socket.emit('notification',{error:'Username already taken'});
							return;
						}

						let salt = crypto.randomBytes(config.crypto.password.salt_bytes).toString('base64');
						crypto.pbkdf2(data.password, salt, config.crypto.password.iterations, config.crypto.password.hash_bytes,'sha256',
							function(err,hash){
								if(err){
									console.log(err);
									socket.emit('notification',{error:'Could not encrypt password'});
									return;
								}else{
									pg_conn.client.query(
										"INSERT INTO users (username,name,password,password_salt,password_iterations,email) \
											VALUES ($1,$2,$3,$4,$5,$6) \
										RETURNING id \
										",
										[
											data.username,
											data.full_name,
											hash,
											salt,
											config.crypto.password.iterations,
											data.email
										],
										function(err,user_id){
											if(err){
												console.log(err);
												socket.emit('notification',{error:'Could not create user'});
												return;
											}

											if(typeof user_id === 'undefined' || user_id.rowCount === 0){
												socket.emit('notification',{error:'Could not get new user id'});
												return;
											}

											// This is used to check whether a user is logged in within the check_auth middleware
											socket.handshake.session.auth = true;
											
											socket.handshake.session.user_id = user_id.rows[0].id;
											socket.handshake.session.username = data.username;
											socket.handshake.session.full_name = data.full_name;
											socket.handshake.session.email = data.email;

											let payload = {
												id: user_id.rows[0].id,
												username: data.username,
												email: data.email,
												firstName: data.full_name											
											};

											nodebb_conn.create_jwt(
											config,
											payload,
											function(err,token){
												if(err){
													console.log(err);
												}
												socket.handshake.session.token = token;
												socket.handshake.session.save();
												
												socket.emit('notification',{success:'Successfully registered!'});
												socket.emit('register_status',{status:true});
											});

										}
									);    			
								}

							}
						);
					}
				);
			});

		},		
	];

}
