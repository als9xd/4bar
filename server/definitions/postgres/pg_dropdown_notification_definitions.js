//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/postgres/pg_dropdown_notifications.js
//
// Overview: 
//	- Contains definitions for retrieving dropdown notifications
//
//
//////////////////////////////////////////////////////////////////////

module.exports = function(pg_conn) {
	return {

		/******************************** Example ***************************************/

		/* 

		// This is an optional argument that allows you to pass custom data to the 
		// definition
	    : Object >>data<<

		: String >>notification_retreval_query<<

		: Array >>query_variables<<

		: String >>client_error_message<< 

		// This should be the same as in
		// '4bar/client/html/js/DropdownNotificationsDefinitions.js'
		: String >>dropdown_notification_type<< 

		==================================================================================
		 
		Within this file:

		function(socket,>>data<<){
			return new Promise(
				(resolve,reject){
					pg_conn.client.query(
						>>notification_data_retrieval_query<<,
						>>query_variables,
						function(err,results){
							if(err){
								console.log(err);
								socket.emit('notification',>>client_error_message<<);
								reject(); // Use reject on failures to signify that the promise failed
							}
							resolve({ type:>>dropdown_notification_type<< , data: results.rows});
						}						
					)
				}
			);
		},

		----------------------------------------------------------------------------------

		Within '4bar/client/html/js/DropdownNotificationsDefinitions.js':

		>>dropdown_notification_type<< : function(data){
			return document.createElement('div');
		}
		

		/********************************************************************************/

		// This dropdown notification gets all the friend requests for the current user
		function(socket,data){
			return new Promise(
				(resolve,reject) =>{
					pg_conn.client.query(
						"SELECT users.id,users.username,users.avatar,notifications.date,notifications.read,notifications.id as notification_id,'REQUEST' as type FROM users "+
						  "INNER JOIN friend_requests ON users.id = friend_requests.tx_user_id "+
						  "INNER JOIN notifications ON friend_requests.notification_id = notifications.id "+
						  "WHERE notifications.id IS NOT NULL AND "+
						  "notifications.active = TRUE AND "+
						  "friend_requests.rx_user_id = $1 AND "+
						  "NOT EXISTS (SELECT 1 FROM friend_requests WHERE rx_user_id = friend_requests.tx_user_id AND tx_user_id = $1)",
						[
							socket.handshake.session.user_id
						],
						function(err,results){
							if(err){
								console.log(err);
								socket.emit('notification',{error:'Could not get friend requests'})
								reject();
							}
							resolve({type:'friend_requests',data:results.rows});
						}
					);		
				}
			)
		},

	}
}