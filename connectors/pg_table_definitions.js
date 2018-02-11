module.exports = function(config){
	return {
		users:
			'CREATE TABLE IF NOT EXISTS users('+
				'id SERIAL PRIMARY KEY,'+
				'username VARCHAR('+config.pg.varchar_limits.users.username+') UNIQUE NOT NULL,'+
				'name VARCHAR('+config.pg.varchar_limits.users.name+'),'+
				'password BYTEA NOT NULL,'+
				'password_salt VARCHAR('+Math.ceil(config.crypto.password.salt_bytes*(4/3)/4) * 4+') NOT NULL,'+
				'password_iterations NUMERIC NOT NULL,'+
				'email VARCHAR('+config.pg.varchar_limits.users.email+')'+
			')'		
		,
		communities: 
			'CREATE TABLE IF NOT EXISTS communities('+
				'id SERIAL PRIMARY KEY,'+
				'name VARCHAR('+config.pg.varchar_limits.communities.name+') UNIQUE NOT NULL,'+
				'unique_name VARCHAR('+config.pg.varchar_limits.communities.unique_name+') UNIQUE NOT NULL,'+				
				'url TEXT UNIQUE NOT NULL,'+
				'description TEXT,'+
				'icon TEXT,'+
				'wallpaper TEXT,'+
				'layout TEXT,'+
				'last_activity VARCHAR('+config.pg.varchar_limits.communities.last_activity+')'+
			')'
		,
		community_tags:
			'CREATE TABLE IF NOT EXISTS community_tags('+
				'community_id NUMERIC NOT NULL,'+
				'tag VARCHAR('+config.pg.varchar_limits.community_tags.tag+') NOT NULL,'+
				'UNIQUE (community_id,tag)'+
			')'
		,
		community_members: 
			'CREATE TABLE IF NOT EXISTS community_members('+
				'user_id NUMERIC NOT NULL,'+
				'community_id NUMERIC NOT NULL,'+
				'privilege_level NUMERIC NOT NULL,'+
				'UNIQUE (user_id,community_id)'+
			')'	
		,
		community_stats:
			'CREATE TABLE IF NOT EXISTS community_stats('+
				'user_id NUMERIC NOT NULL,'+
				'community_id NUMERIC NOT NULL,'+
				'stat_name VARCHAR('+config.pg.varchar_limits.community_stats.stat_name+') NOT NULL,'+
				'stat_value VARCHAR('+config.pg.varchar_limits.community_stats.stat_value+') NOT NULL'+
			')'
	}
};