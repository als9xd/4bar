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
				pg_client.query(
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
					pg_client.query(
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

		/********************************************************************************/

		twitter: {
			get: function(widget_id,callback){
				pg_client.query(
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
				pg_client.query(
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
				pg_client.query(
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