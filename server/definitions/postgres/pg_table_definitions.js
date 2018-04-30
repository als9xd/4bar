////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/postgres/pg_table_definitions.js
//
// Overview: 
//	- Contains definitions for postgresql tables creation
//
// More about postgresql table creation:
//
// 		https://www.postgresql.org/docs/9.1/static/sql-createtable.html
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = function(config){
	return {

		/******************************** Example ***************************************/

		/* 

		Key >>table_name<<
		Value,String >>table_creation_query<<

		Key >>some_other_table_name<<
		Value,String >>some_other_table_creation_query<<

		==================================================================================
		 
		Within this file:

		>>some_other_table_name<< :
			>>table_creation_query,

		>>some_other_table_name<< :
			>>some_other_table_creation_query<<,

		etc...

		*/
		
		/********************************************************************************/

		users:
			"CREATE TABLE IF NOT EXISTS users( \
				id SERIAL PRIMARY KEY, \
				username VARCHAR("+config.pg.varchar_limits.users.username+") UNIQUE NOT NULL, \
				name VARCHAR("+config.pg.varchar_limits.users.name+"),\
				password BYTEA NOT NULL,\
				password_salt VARCHAR("+Math.ceil(config.crypto.password.salt_bytes*(4/3)/4) * 4+") NOT NULL,\
				password_iterations NUMERIC NOT NULL,\
				email VARCHAR("+config.pg.varchar_limits.users.email+"),\
				avatar TEXT\
			)"		
		,

		/********************************************************************************/

		market_items:
			"CREATE TABLE IF NOT EXISTS market_items(\
				id SERIAL PRIMARY KEY,\
				name VARCHAR("+config.pg.varchar_limits.market_items.name+") NOT NULL,\
				description TEXT,\
				price DECIMAL NOT NULL,\
				user_id NUMERIC NOT NULL\
			)"
		,

		/********************************************************************************/

		communities: 
			"CREATE TABLE IF NOT EXISTS communities(\
				id SERIAL PRIMARY KEY,\
				nodebb_id NUMERIC UNIQUE, \
				name VARCHAR("+config.pg.varchar_limits.communities.name+") UNIQUE NOT NULL,\
				description TEXT,\
				icon TEXT,\
				wallpaper TEXT,\
				layout TEXT,\
				creation_date NUMERIC NOT NULL,\
				last_activity NUMERIC,\
				num_members NUMERIC NOT NULL\
			)"
		,

		/********************************************************************************/

		community_tags:
			"CREATE TABLE IF NOT EXISTS community_tags( \
				community_id NUMERIC NOT NULL,\
				tag VARCHAR("+config.pg.varchar_limits.community_tags.tag+") NOT NULL,\
				UNIQUE (community_id,tag)\
			)"
		,

		/********************************************************************************/

		community_members: 
			"CREATE TABLE IF NOT EXISTS community_members(\
				user_id NUMERIC NOT NULL,\
				community_id NUMERIC NOT NULL,\
				privilege_level NUMERIC NOT NULL,\
				UNIQUE (user_id,community_id)\
			)"
		,

		/********************************************************************************/

		stats_widget:
			"CREATE TABLE IF NOT EXISTS stats_widget(\
				user_id NUMERIC NOT NULL,\
				community_id NUMERIC NOT NULL,\
				stat_name VARCHAR("+config.pg.varchar_limits.community_stats.stat_name+") NOT NULL,\
				stat_value VARCHAR("+config.pg.varchar_limits.community_stats.stat_value+") NOT NULL\
			)"
		,

		/********************************************************************************/

		youtube_widget:
			"CREATE TABLE IF NOT EXISTS youtube_widget(\
				id SERIAL PRIMARY KEY,\
				community_id NUMERIC NOT NULL,\
				bg_color VARCHAR("+config.pg.varchar_limits.widgets.bg_color+"), \
				url TEXT NOT NULL\
			)"
		,

		/********************************************************************************/

		twitter_widget:
			"CREATE TABLE IF NOT EXISTS twitter_widget(\
				id SERIAL PRIMARY KEY,\
				community_id NUMERIC NOT NULL,\
				text_color VARCHAR("+config.pg.varchar_limits.widgets.text_color+"), \
				bg_color VARCHAR("+config.pg.varchar_limits.widgets.bg_color+"), \
				url TEXT NOT NULL\
			)"
		,

		/********************************************************************************/

		tournaments_widget:
			"CREATE TABLE IF NOT EXISTS tournaments_widget(\
				id SERIAL PRIMARY KEY,\
				community_id NUMERIC NOT NULL, \
				text_color VARCHAR("+config.pg.varchar_limits.widgets.text_color+"), \
				bg_color VARCHAR("+config.pg.varchar_limits.widgets.bg_color+") \
			)"
		,

		/********************************************************************************/

		markdown_widget:
			"CREATE TABLE IF NOT EXISTS markdown_widget(\
				id SERIAL PRIMARY KEY,\
				community_id NUMERIC NOT NULL, \
				text_color VARCHAR("+config.pg.varchar_limits.widgets.text_color+"), \
				bg_color VARCHAR("+config.pg.varchar_limits.widgets.bg_color+"), \
				markdown TEXT \
			)"
		,

		/********************************************************************************/

		tournaments:
			"CREATE TABLE IF NOT EXISTS tournaments( \
				id SERIAL PRIMARY KEY, \
				community_id NUMERIC NOT NULL, \
				name VARCHAR("+config.pg.varchar_limits.tournaments.name+") NOT NULL, \
				description TEXT, \
				location VARCHAR ("+config.pg.varchar_limits.tournaments.location+") NOT NULL, \
				attendee_limit INTEGER NOT NULL, \
				signup_deadline NUMERIC, \
				start_date NUMERIC NOT NULL, \
				scores TEXT, \
				UNIQUE (community_id,name) \
			)"
		,
		
		/********************************************************************************/

		tournament_tags:
			"CREATE TABLE IF NOT EXISTS tournament_tags( \
				tournament_id NUMERIC NOT NULL,\
				tag VARCHAR("+config.pg.varchar_limits.tournament_tags.tag+") NOT NULL, \
				UNIQUE (tournament_id,tag) \
			)"
		,

		/********************************************************************************/

		tournament_attendees:
			"CREATE TABLE IF NOT EXISTS tournament_attendees( \
				tournament_id NUMERIC NOT NULL, \
				user_id NUMERIC NOT NULL,\
				privilege_level NUMERIC NOT NULL,\
				UNIQUE (tournament_id,user_id) \
			)"
		,

		/********************************************************************************/

		events:
			"CREATE TABLE IF NOT EXISTS events(\
				event_name VARCHAR("+config.pg.varchar_limits.events.event_name+") NOT NULL, \
				event_date DATE NOT NULL, \
				start_time NUMERIC NOT NULL, \
				end_time NUMERIC, \
				street_address VARCHAR("+config.pg.varchar_limits.events.street_address+") NOT NULL, \
				city VARCHAR("+config.pg.varchar_limits.events.city+") NOT NULL, \
				state VARCHAR("+config.pg.varchar_limits.events.state+") NOT NULL \
			)"
		,    
		
		/********************************************************************************/

		notifications:
			"CREATE TABLE IF NOT EXISTS notifications( \
				id SERIAL PRIMARY KEY, \
				date NUMERIC NOT NULL, \
				read BOOL NOT NULL, \
				active BOOL NOT NULL \
			)"
		,

		/********************************************************************************/

		friend_requests:
			"CREATE TABLE IF NOT EXISTS friend_requests( \
				notification_id NUMERIC, \
				tx_user_id NUMERIC NOT NULL, \
				rx_user_id NUMERIC NOT NULL, \
				UNIQUE (tx_user_id,rx_user_id) \
			)"
		,
		
		/********************************************************************************/

		matches:
			"CREATE TABLE IF NOT EXISTS matches( \
				id SERIAL PRIMARY KEY, \
				tournament_id NUMERIC NOT NULL, \
				name TEXT, \
				description TEXT, \
				time NUMERIC, \
				location TEXT \
			)"
		,

		/********************************************************************************/
		
		match_teams: 
			"CREATE TABLE IF NOT EXISTS match_teams( \
				id SERIAL PRIMARY KEY, \
				match_id NUMERIC NOT NULL, \
				name TEXT \
			)"
		,

		/********************************************************************************/

		match_team_members:
			"CREATE TABLE IF NOT EXISTS match_team_members( \
				team_id NUMERIC NOT NULL, \
				user_id NUMERIC NOT NULL \
			)"
		,

	}
};