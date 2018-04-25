//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/postgres/pg_widget_definitions.js
//
// Overview: 
//	- Contains definitions that allow clients to access
//    widget data stored in postgresql. 
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = function(pg_conn){

	let sanitize_color = function(color_str){
		if(typeof color_str !== 'string' || color_str.length === 0){
			return true;
		}
		return /^[a-z0-9]+$/i.test(color_str);		
	}

	let pg_client = pg_conn.client;

	return{

		/******************************** Example ***************************************/

		/* 

		Key >>widget_name<<
		String >>community_id<<
		Bool >>add_successfull<<
		Key >>notification_type<< (success or error)
		String >>success_notification<<
		String >>error_notification<<
		Object >>widget_data<<

		Key >>some_other_widget_name<<
		String >>some_other_community_id<<
		Bool >>some_other_add_successfull<<
		Key >>notification_type<< (success or error)
		String >>some_other_success_notification<<
		String >>some_other_error_notification<<
		Object >>some_other_widget_data<<

		==================================================================================
		 
		Within this file:

		>>widget_name<< : {
			get: function(widget_id,callback){
				// Get the >>widget_data<< of a widget with an id of 'widget_id' (integer)
				callback(>>widget_data<<);
			},
			available: function(community_id,callback){
				// Get >>widget_data<< of a community with an id of >>community_id<< (integer)
				callback(>>widget_data<<);
			},
			add: function(community_id,data,callback){
				// Add a widget that has data of 'data';
				callback{>>add_successfull<<,{>>notification_type<< : >>notification_message<<}};
			}
		},

		>>some_other_widget_name<< : {
			get: function(widget_id,callback){
				// Get >>some_other_widget_data<< of a widget with an id of 'widget_id' (integer)
				callback(>>some_other_widget_data<<);
			},
			available: function(community_id,callback){
				// Get >>some_other_widget_data<< of a community with an id of >>some_other_community_id<< (integer)
				callback(>>some_other_widget_data<<);
			},
			add: function(community_id,data,callback){
				// Add a widget that has data of 'data';
				callback{>>some_other_add_successfull<<,{>>some_other_notification_type<< : >>some_other_notification_message<<}};
			}
		},

		etc...
	
		----------------------------------------------------------------------------------

		Within html/handlebars file:

		// Get all of an communities saved widgets
		socket.emit('widgets_req',>>community_id<<);

		// Submit a widget to be saved within a community
		socket.emit('widget_submit_req',{
			community_id : >>community_id<<,
			type : >>widget_name<<,
			data : >>widget_data<<
		);

		*/
		
		/********************************************************************************/

		youtube: {
			get: function(widget_id,callback){
				pg_client.query(
					"SELECT * FROM youtube_widget WHERE id = $1",
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
				pg_client.query(
					"SELECT * FROM youtube_widget WHERE community_id = $1",
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
				if(!sanitize_color(data.text_color)){
			    	callback(false,{error:'Inavlid text color'});
			    	return;									
				}
				if(!sanitize_color(data.background_color)){
			    	callback(false,{error:'Inavlid background color'});
			    	return;									
				}

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
					pg_client.query(
						"INSERT INTO youtube_widget (community_id,text_color,bg_color,url) "+
						"VALUES ($1,$2,$3,$4)",
						[
							community_id,
							data.text_color,
							data.bg_color,
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
			},
			delete: function(widget_id,callback){
				pg_conn.client.query("DELETE FROM youtube_widget WHERE id = $1",[widget_id],function(err){
					if(err){
						console.log(err);
						callback(false,{error:'Could not delete youtube widget'});
						return;
					}
					callback(true,{success:'Successfully deleted youtube widget'});
				})
			}

		},

		/********************************************************************************/

		twitter: {
			get: function(widget_id,callback){
				pg_client.query(
					"SELECT * FROM twitter_widget WHERE id = $1",
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
				);
			},
			available: function(community_id,callback){
				pg_client.query(
					"SELECT * FROM twitter_widget WHERE community_id = $1",
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
				);		
			},
			add: function(community_id,data,callback){
				if(!sanitize_color(data.text_color)){
			    	callback(false,{error:'Inavlid text color'});
			    	return;									
				}
				if(!sanitize_color(data.background_color)){
			    	callback(false,{error:'Inavlid background color'});
			    	return;									
				}

				if(!data.screen_name || data.screen_name.length==0){
					callback(false,{error:'Please supply a twitter account name'});
					return;
				}
				let url = "https://twitter.com/"+data.screen_name+"?ref_src=twsrc%5Etfw";
				pg_client.query(
					"INSERT INTO twitter_widget (community_id,text_color,bg_color,url) "+
					"VALUES ($1,$2,$3,$4)",
					[
						community_id,
						data.text_color,
						data.bg_color,
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
				);
			},
			delete: function(widget_id,callback){
				pg_conn.client.query("DELETE FROM twitter_widget WHERE id = $1",[widget_id],function(err){
					if(err){
						console.log(err);
						callback(false,{error:'Could not delete twitter widget'});
						return;
					}
					callback(true,{success:'Successfully deleted twitter widget'});
				})
			}
		},

		tournaments: {

			get: function(widget_id,callback){
				pg_client.query(
					"SELECT * FROM tournaments_widget WHERE id = $1",
					[
						widget_id
					],
					function(err,widgets){
						if(err){
							console.log(err);
							callback(false,{error:'Could not get tournament widget'});
							return;
						}
						pg_client.query(
							"SELECT id,name,description FROM tournaments WHERE community_id = $1",
							[
								widgets.rows[0].community_id
							],
							function(err,tournaments){
								if(err){
									console.log(err);
									callback(false,{error:'Could not get tournament widget'});
									return;
								}
								for(let i = 0; i < widgets.rows.length;i++){
									widgets.rows[i].tournaments = tournaments.rows;
								}
								callback(widgets.rows);					
							}					

						);	
					}					

				);	

			},

			available: function(community_id,callback){

				pg_client.query(
					"SELECT id,name,description FROM tournaments WHERE community_id = $1",
					[
						community_id
					],
					function(err,tournaments){
						if(err){
							console.log(err);
							callback(false,{error:'Could not get tournament widget'});
							return;
						}
						pg_client.query(
							"SELECT * FROM tournaments_widget WHERE community_id = $1",
							[
								community_id
							],
							function(err,widgets){
								if(err){
									console.log(err);
									callback(false,{error:'Could not get tournament widget'});
									return;
								}
								for(let i = 0; i < widgets.rows.length;i++){
									widgets.rows[i].tournaments = tournaments.rows;
								}
								callback(widgets.rows);
							}					

						);				
					}					

				);	
			},

			add: function(community_id,data,callback){
				if(!sanitize_color(data.text_color)){
			    	callback(false,{error:'Inavlid text color'});
			    	return;									
				}
				if(!sanitize_color(data.background_color)){
			    	callback(false,{error:'Inavlid background color'});
			    	return;									
				}

				pg_client.query(
					"INSERT INTO tournaments_widget (community_id,text_color,bg_color) \
					VALUES ($1,$2,$3)",
					[
						community_id,
						data.text_color,
						data.bg_color
					],
					function(err){
						if(err){
							console.log(err);
				    		callback(false,{error:'Could not create tournament widget'});
				    		return;
						}
						callback(true,{success:'Successfully created tournament widget!'});
					}
				);
			},
			delete: function(widget_id,callback){
				pg_conn.client.query("DELETE FROM tournaments_widget WHERE id = $1",[widget_id],function(err){
					if(err){
						console.log(err);
						callback(false,{error:'Could not delete tournaments widget'});
						return;
					}
					callback(true,{success:'Successfully deleted tournaments widget'});
				})
			}

		},

		markdown: {

			get: function(widget_id,callback){
				pg_client.query(
					"SELECT * FROM markdown_widget WHERE id = $1",
					[
						widget_id
					],
					function(err,widgets){
						if(err){
							console.log(err);
							callback(false,{error:'Could not get markdown widget'});
							return;
						}
						callback(widgets.rows);		
					}					
				);	

			},

			available: function(community_id,callback){
				pg_client.query(
					"SELECT * FROM markdown_widget WHERE community_id = $1",
					[
						community_id
					],
					function(err,results){
						if(err){
							console.log(err);
							callback(false,{error:'Could not get available markdown widgets'});
							return;
						}
						callback(results.rows);	
					}
				);	
			},

			add: function(community_id,data,callback){
				if(!sanitize_color(data.text_color)){
			    	callback(false,{error:'Inavlid text color'});
			    	return;									
				}
				if(!sanitize_color(data.background_color)){
			    	callback(false,{error:'Inavlid background color'});
			    	return;									
				}

				pg_client.query(
					"INSERT INTO markdown_widget (community_id,text_color,bg_color,markdown) \
					VALUES ($1,$2,$3,$4)",
					[
						community_id,
						data.text_color,
						data.bg_color,
						data.markdown
					],
					function(err){
						if(err){
							console.log(err);
				    		callback(false,{error:'Could not create markdown widget'});
				    		return;
						}
						callback(true,{success:'Successfully created markdown widget!'});
					}
				);
			},
			delete: function(widget_id,callback){
				pg_conn.client.query("DELETE FROM markdown_widget WHERE id = $1",[widget_id],function(err){
					if(err){
						console.log(err);
						callback(false,{error:'Could not delete markdown widget'});
						return;
					}
					callback(true,{success:'Successfully deleted markdown widget'});
				})
			}

		}
	}
};