module.exports = function(pg_conn){
	return{
		communities: function(input,settings){
			let conjunction = 'AND';
			if(settings && settings.intersection && settings.intersection === true){
				conjunction = 'AND';
			}else if(settings && settings.union && settings.union === true){
				conjunction = 'OR';
			}
			return new Promise(
				function(resolve,reject){
					pg_conn.client.query(
						"SELECT f_c.num_members,f_c.id,f_c.name,f_c.description,f_c.last_activity,f_c.url,f_c.icon,array_agg(community_tags.tag) as tags "+
						"FROM community_tags,"+
							"(SELECT communities.* FROM communities "+
							"INNER JOIN community_tags on communities.id = community_tags.community_id "+
							"WHERE "+
							"(to_tsvector(communities.name) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" "+
							"(to_tsvector(communities.description) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" "+
							"(to_tsvector(community_tags.tag) @@ plainto_tsquery($3) OR LENGTH($3) = 0) "+
							"GROUP BY communities.id) as f_c WHERE f_c.id = community_tags.community_id "+
						"GROUP BY f_c.num_members,f_c.id,f_c.name,f_c.description,f_c.last_activity,f_c.url,f_c.icon "+
						"ORDER BY f_c.num_members DESC",
						[
							(typeof input == 'string' || input instanceof String) ? input || '' : input.name || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.desc || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.tags || ''
						],
						function(err,communities){
							if(err){
								console.log(err);
								reject('Could not search for communities');
							}else{
								resolve({communities:communities.rows});
							}
						}
					);	
				}
			);		
		},

		tournaments: function(input){
			return new Promise(
				function(resolve,reject){
					resolve();
				}
			);
		},

		users: function(input,settings){
			let conjunction = 'AND';
			if(settings && settings.intersection && settings.intersection === true){
				conjunction = 'AND';
			}else if(settings && settings.union && settings.union === true){
				conjunction = 'OR';
			}

			return new Promise(
				function(resolve,reject){
					pg_conn.client.query(
						"SELECT username,name,email,id FROM users "+
						"WHERE "+
						"(to_tsvector(users.username) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" "+
						"(to_tsvector(users.name) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" "+
						"(to_tsvector(users.email) @@ plainto_tsquery($3) OR LENGTH($3) = 0) ",
						[
							(typeof input == 'string' || input instanceof String) ? input || '' : input.username || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.name || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.email || ''
						],
						function(err,users){
							if(err){
								console.log(err);
								reject('Could not search for users')
							}else{
								resolve({users:users.rows});
							}	
						}
					);	
				}	
			);	
		}
	}
}