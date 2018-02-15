module.exports = function(pg_conn){
	return{
		youtube: {
			get: function(app_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM youtube_app WHERE id = $1",
					[
						app_id
					],
					function(err,results){
						if(err){
							console.log(err);
							return;
						}
						callback(results.rows);
					}
				)
			},
			available: function(community_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM youtube_app WHERE community_id = $1",
					[
						community_id
					],
					function(err,results){
						if(err){
							console.log(err);
							return;
						}
						callback(results.rows);
					}
				)
			},
			add: function(community_id,data,callback){
				pg_conn.client.query(
					"INSERT INTO youtube_app (community_id,url) "+
					"VALUES ($1,$2)",
					[
						community_id,
						data.url
					],
					function(err){
						if(err){
							console.log(err);
							return;
						}
						callback(err);
					}
				)
			}

		},
		twitter: {
			get: function(app_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM twitter_app WHERE id = $1",
					[
						app_id
					],
					function(err,results){
						if(err){
							console.log(err);
							return;
						}
						callback(results.rows);
					}
				)
			},
			available: function(community_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM twitter_app WHERE community_id = $1",
					[
						community_id
					],
					function(err,results){
						if(err){
							console.log(err);
							return;
						}
						callback(results.rows);
					}
				)			
			},
			add: function(community_id,data,callback){
				pg_conn.client.query(
					"INSERT INTO twitter_app (community_id,url) "+
					"VALUES ($1,$2)",
					[
						community_id,
						data.url
					],
					function(err){
						if(err){
							console.log(err);
							return;
						}
						callback(err);
					}
				)
			}
		}
	}	
};