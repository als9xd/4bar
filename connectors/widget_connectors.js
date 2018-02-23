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
						if(err){
							console.log(err);
							callback(false,{error: 'Could not get youtube widget'});
							return;
						}
						callback(results.rows);
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
						if(err){
							console.log(err);
							callback(false,{error: 'Could not get available youtube widgets'});
							return;
						}
						callback(results.rows);
					}
				)
			},
			add: function(community_id,data,callback){

				if(!data.url || data.url.length == 0){
			    	callback(false,{error:'Please supply a youtube url'});
			    	return;					
				}
				let name = 'v';
			    name = name.replace(/[\[\]]/g, "\\$&");
			    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			        results = regex.exec(data.url);
			    if (!results){
			    	callback(false,{error:'Invalid youtube url'});
			    	return;
			    }

			    if(!results[2]){
			    	callback(false,{error:'Invalid youtube url'});
			    	return;	    	
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
							if(err){
								console.log(err);
								callback(false,{error:'Could not create youtube widget'});
								return;
							}
							callback(true,{success:'Successfully created a youtube widget!'});
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
						if(err){
							console.log(err);
							callback(false,{error:'Error loading twitter widget'});
							return;
						}
						callback(results.rows);
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
						if(err){
							console.log(err);
							callback(false,{error:'Could not get available twitter widgets'});
							return;
						}
						callback(results.rows);	
					}
				)			
			},
			add: function(community_id,data,callback){
				if(!data.screen_name || data.screen_name.length==0){
					callback(false,{error:'Please supply a twitter account name'});
					return;
				}
				let url = "https://twitter.com/intent/tweet?screen_name="+data.screen_name+"&ref_src=twsrc%5Etfw";
				pg_conn.client.query(
					"INSERT INTO twitter_widget (community_id,url) "+
					"VALUES ($1,$2)",
					[
						community_id,
						url
					],
					function(err){
						if(err){
							console.log(err);
				    		callback(false,{error:'Could not create Twitter widget'});
				    		return;
						}
						callback(true,{success:'Successfully created Twitter widget!'});
					}
				)
			}
		}
	}	
};