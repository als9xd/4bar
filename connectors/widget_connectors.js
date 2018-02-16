module.exports = function(pg_conn){
	return{
		youtube: {
			get: function(widget_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM youtube_widget WHERE id = $1",
					[
						widget_id
					],
					function(err,results){
						callback(err,results.rows);
					}
				)
			},
			available: function(community_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM youtube_widget WHERE community_id = $1",
					[
						community_id
					],
					function(err,results){
						callback(err,results.rows);
					}
				)
			},
			add: function(community_id,data,callback){
				let name = 'v';
			    name = name.replace(/[\[\]]/g, "\\$&");
			    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			        results = regex.exec(data.url);
			    if (!results || !results[2]){
			    	callback(new Error("Could not find video id in \""+data.url+"\""));
			    }

			    let url = decodeURIComponent(results[2].replace(/\+/g, " "));
			    if(url){
					pg_conn.client.query(
						"INSERT INTO youtube_widget (community_id,url) "+
						"VALUES ($1,$2)",
						[
							community_id,
							"https://www.youtube.com/embed/"+url
						],
						function(err){
							callback(err);
						}
					);
			    }
			}

		},
		twitter: {
			get: function(widget_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM twitter_widget WHERE id = $1",
					[
						widget_id
					],
					function(err,results){
						callback(err,results.rows);
					}
				)
			},
			available: function(community_id,callback){
				pg_conn.client.query(
					"SELECT id,url FROM twitter_widget WHERE community_id = $1",
					[
						community_id
					],
					function(err,results){
						callback(err,results.rows);
					}
				)			
			},
			add: function(community_id,data,callback){
				let url = "https://twitter.com/intent/tweet?screen_name="+data.screen_name+"&ref_src=twsrc%5Etfw";
				pg_conn.client.query(
					"INSERT INTO twitter_widget (community_id,url) "+
					"VALUES ($1,$2)",
					[
						community_id,
						url
					],
					function(err){
						callback(err);
					}
				)
			}
		}
	}	
};