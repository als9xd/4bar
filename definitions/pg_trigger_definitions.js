module.exports = function(config){
	return {
		num_members_inc:
			'CREATE OR REPLACE FUNCTION num_members_inc_func() RETURNS TRIGGER AS $$ '+
				'BEGIN '+
					'UPDATE communities SET num_members = num_members + 1 WHERE id = NEW.community_id; '+
					'RETURN NEW; '+
				'END; '+
			'$$ LANGUAGE plpgsql;'+
			' '+
			'DROP TRIGGER IF EXISTS num_members_inc ON community_members; '+
			'CREATE TRIGGER num_members_inc '+
				'AFTER INSERT ON community_members '+
				'FOR EACH ROW '+
				'EXECUTE PROCEDURE num_members_inc_func();',
		num_members_dec:
			'CREATE OR REPLACE FUNCTION num_members_dec_func() RETURNS TRIGGER AS $$ '+
				'BEGIN '+
					'UPDATE communities SET num_members = num_members - 1 WHERE id = OLD.community_id; '+
					'RETURN OLD; '+
				'END; '+
			'$$ LANGUAGE plpgsql;'+
			' '+
			'DROP TRIGGER IF EXISTS num_members_dec ON community_members; '+
			'CREATE TRIGGER num_members_dec '+
				'AFTER DELETE ON community_members '+
				'FOR EACH ROW '+
				'EXECUTE PROCEDURE num_members_dec_func();'
	}
};