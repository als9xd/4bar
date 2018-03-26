//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/postgres/pg_search_filter_definitions.js
//
// Overview: 
//	- Contains definitions for search filters
//
// More about full text search using Posgresql:
//   
//		https://www.postgresql.org/docs/9.5/static/textsearch-intro.html
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = function(pg_client){
	return{

		/******************************** Example ***************************************/

		/* 

		Key >>filter_name<<
		ArrayOfObjects >>input<<
		String >>error_message<<
		Object >>search_results<<

		Key >>some_other_filter_name<<
		ArrayOfObjects >>input<<
		String >>error_message<<
		Object >>some_other_search_results<<

		==================================================================================
		 
		Within this file:

		>>filter_name<< : function(input,settings){
			return new Promise(
				function(resolve,reject){
					// Do sql search query here with >>input<<
						// If sql query error
							reject(>>error_message<<);
						// Else
							resolve({>>filter_name<< : >>search_results<<});
				}
			);
		},

		>>some_other_filter_name<< : function(input,settings){
			return new Promise(
				function(resolve,reject){
					// Do sql search query here with >>input<<
						// If sql query error
							reject(>>error_message<<);
						// Else
							resolve({>>some_other_filter_name<< : >>some_other_search_results<<});
				}
			);
		},

		etc...

		----------------------------------------------------------------------------------

		Within handlebars/html file:

		// To search a specific field
		<form action="/search" method="GET">
			<input type="hidden" name="query_field" value=">>filter_name<<">
			<input type="text" name=">>input.name<<">
			<input type="text" name=">>input.some_other_name<<">
			<button type="submit">Search</button>
		</form>

		// To search all fields
		<form action="/search" method="GET">
			<input name="query">
			<button type="submit">Search</button>
		</form>

		*/
		
		/********************************************************************************/		

		communities: function(input,settings){
			let conjunction = 'AND';
			if(settings && settings.intersection === true){
				conjunction = 'AND';
			}else if(settings && settings.union === true){
				conjunction = 'OR';
			}
			return new Promise(
				function(resolve,reject){
					pg_client.query(
						"SELECT f_c.num_members,f_c.id,f_c.name,f_c.description,f_c.last_activity,f_c.icon,array_agg(community_tags.tag) as tags \
						FROM community_tags,\
							(SELECT communities.* FROM communities \
							INNER JOIN community_tags on communities.id = community_tags.community_id \
							WHERE \
							(to_tsvector(communities.name) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" \
							(to_tsvector(communities.description) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" \
							(to_tsvector(community_tags.tag) @@ plainto_tsquery($3) OR LENGTH($3) = 0) \
							GROUP BY communities.id) as f_c WHERE f_c.id = community_tags.community_id \
						GROUP BY f_c.num_members,f_c.id,f_c.name,f_c.description,f_c.last_activity,f_c.icon \
						ORDER BY f_c.num_members DESC",
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

		/********************************************************************************/

		tournaments: function(input){
			return new Promise(
				function(resolve,reject){
					resolve();
				}
			);
		},

		/********************************************************************************/

		users: function(input,settings){
			let conjunction = 'AND';
			if(settings && settings.intersection === true){
				conjunction = 'AND';
			}else if(settings && settings.union === true){
				conjunction = 'OR';
			}

			return new Promise(
				function(resolve,reject){
					pg_client.query(
						"SELECT username,name,email,id,avatar FROM users \
						WHERE \
						(to_tsvector(users.username) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" \
						(to_tsvector(users.name) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" \
						(to_tsvector(users.email) @@ plainto_tsquery($3) OR LENGTH($3) = 0) ",
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
		},
	
		/********************************************************************************/

		tournaments: function(input,settings){
			let conjunction = 'AND';
			if(settings && settings.intersection === true){
				conjunction = 'AND';
			}else if(settings && settings.union === true){
				conjunction = 'OR';
			}

			return new Promise(
				function(resolve,reject){
					pg_client.query(
						"SELECT t.name,t.start_date,t.location,t.description,t.id,t.community_id,communities.name as community_name,array_agg(tournament_tags.tag) as tags \
						FROM tournament_tags,\
							(SELECT tournaments.* FROM tournaments \
							INNER JOIN tournament_tags on tournaments.id = tournament_tags.tournament_id \
							WHERE \
							(to_tsvector(tournaments.name) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" \
							(to_tsvector(tournaments.location) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" \
							(to_tsvector(tournament_tags.tag) @@ plainto_tsquery($3) OR LENGTH($3) = 0) \
							GROUP BY tournaments.id) as t INNER JOIN communities ON communities.id = t.community_id WHERE t.id = tournament_tags.tournament_id \
						GROUP BY t.name,t.start_date,t.location,t.description,t.id,t.community_id,communities.name \
						",
						[
							(typeof input == 'string' || input instanceof String) ? input || '' : input.name || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.location || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.tag || ''
						],
						function(err,tournaments){
							if(err){
								console.log(err);
								reject('Could not search for tournaments');
							}else{
								resolve({tournaments:tournaments.rows});
							}	
						}
					);	
				}	
			);	
		},


		/********************************************************************************/

	}
}