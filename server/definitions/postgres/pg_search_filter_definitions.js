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
						"SELECT c.*,(SELECT array_agg(c_t.tag) FROM community_tags c_t WHERE c.id = c_t.community_id) AS tags \
							FROM communities c LEFT OUTER JOIN community_tags t ON t.community_id = c.id \
							WHERE \
							(to_tsvector(c.name) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" \
							(to_tsvector(c.description) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" \
							(to_tsvector(t.tag) @@ plainto_tsquery($3) OR LENGTH($3) = 0) \
							GROUP BY c.id\
						",
						[
							(typeof input == 'string' || input instanceof String) ? input || '' : input.name || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.desc || '',
							(typeof input == 'string' || input instanceof String) ? input || '' : input.tag || ''
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
						"SELECT c.id as community_id,c.name as community_name,t.*,(SELECT array_agg(t_t.tag) FROM tournament_tags t_t WHERE t.id = t_t.tournament_id) AS tags \
							FROM tournaments t INNER JOIN communities c ON t.community_id = c.id LEFT OUTER JOIN tournament_tags tags ON tags.tournament_id = t.id \
							WHERE \
							(to_tsvector(c.name) @@ plainto_tsquery($1) OR LENGTH($1) = 0) "+conjunction+" \
							(to_tsvector(t.name) @@ plainto_tsquery($2) OR LENGTH($2) = 0) "+conjunction+" \
							(to_tsvector(t.location) @@ plainto_tsquery($3) OR LENGTH($3) = 0) "+conjunction+" \
							(to_tsvector(tags.tag) @@ plainto_tsquery($4) OR LENGTH($4) = 0) \
							GROUP BY t.id,c.id \
						",
						[
							(typeof input == 'string' || input instanceof String) ? input || '' : input.host_community || '',
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