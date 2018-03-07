//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/postgres/pg_trigger_definitions.js
//
// Overview: 
//	- Contains definitions for postgreql database triggers
//
// More about database triggers in Posgresql:
//   
//		https://www.postgresql.org/docs/9.1/static/sql-createtrigger.html
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = function(config){
	return {

		/******************************** Example ***************************************/

		/* 

		Key >>trigger_name<<
		Value,String >>trigger_definition<<

		Key >>some_other_trigger_name<<
		Value,String >>some_other_trigger_definition<<

		==================================================================================
		 
		Within this file:

		>>trigger_name<< :
			>>trigger_definition,

		>>some_other_trigger_name<< :
			>>some_other_trigger_definition<<,

		etc...

		*/
		
		/********************************************************************************/
		
		num_members_inc:
			"CREATE OR REPLACE FUNCTION num_members_inc_func() RETURNS TRIGGER AS $$ \
				BEGIN \
					UPDATE communities SET num_members = num_members + 1 WHERE id = NEW.community_id; \
					RETURN NEW; \
				END; \
			$$ LANGUAGE plpgsql;\
			 \
			DROP TRIGGER IF EXISTS num_members_inc ON community_members; \
			CREATE TRIGGER num_members_inc \
				AFTER INSERT ON community_members \
				FOR EACH ROW \
				EXECUTE PROCEDURE num_members_inc_func();\
			",

		num_members_dec:
			"CREATE OR REPLACE FUNCTION num_members_dec_func() RETURNS TRIGGER AS $$ \
				BEGIN \
					UPDATE communities SET num_members = num_members - 1 WHERE id = OLD.community_id; \
					RETURN OLD; \
				END; \
			$$ LANGUAGE plpgsql;\
			 \
			DROP TRIGGER IF EXISTS num_members_dec ON community_members; \
			CREATE TRIGGER num_members_dec \
				AFTER DELETE ON community_members \
				FOR EACH ROW \
				EXECUTE PROCEDURE num_members_dec_func();\
			"
	}
};