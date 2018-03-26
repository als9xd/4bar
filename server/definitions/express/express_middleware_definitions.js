//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/express/express_middleware_definitions.js
//
// Overview: 
//	- Contains definitions for express middleware
//
// More about express middleware:
//
//   https://expressjs.com/en/guide/using-middleware.html
//
//////////////////////////////////////////////////////////////////////

'use strict';

module.exports = function(pg_conn){

	return {

		/******************************** Example ***************************************/

		/* 

		String middleware_name

		==================================================================================
		 
		Within this file:

		>>middleware_name<<: function(req,res,next) {
			console.log('Im inside a middleware!');
			next();
		},

		----------------------------------------------------------------------------------

		Within an express route definined in '4bar/server/definitions/express/express_route_definitions.js':

		app.get('login',middleware[>>middleware_name<<],function(req,res){
			console.log('Middleware has been run and now I am inside the route!');
		});

		*/

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This middleware is added to all routes that require
		// authentication. All this does is check whether a session has a 
		// username assigned to it. If it does, it proceeds to the next 
		// middleware. Otherwise it sends the client back to the login page. 
		//////////////////////////////////////////////////////////////////////

		check_authorization: function(req,res,next) {
			if(req.session && req.session.auth === true){
				next();
			}else{
				res.redirect('/login');
			}		
		},

		/********************************************************************************/

		//////////////////////////////////////////////////////////////////////
		// This middleware redirects all insecure traffic to 
		// the https server
		//////////////////////////////////////////////////////////////////////
		
		http_redirect: function(req,res,next) {
			if(req.secure){
				return next();
			}
			res.redirect('https://'+req.hostname+req.url);		
		},

		/********************************************************************************/

		membership_information: function(req,res,next){

			req.membership_information = {};

			pg_conn.client.query(
				"SELECT communities.* FROM communities \
					INNER JOIN community_members ON communities.id = community_members.community_id \
					WHERE community_members.user_id = $1",
				[
					req.session.user_id
				],
				function(err,communities){
					if(err){
						console.log(err);
						res.render('public/error',{error:'Could not get community'});
						return;
					}

					req.membership_information.communities = communities.rows;

					pg_conn.client.query(
						"SELECT tournaments.* FROM tournaments \
						INNER JOIN tournament_attendees ON tournaments.id = tournament_attendees.tournament_id \
						WHERE tournament_attendees.user_id = $1\
						",
						[
							req.session.user_id
						],
						function(err, tournaments){
							if(err){
								console.log(err);
								res.render('public/error',{error:'Could not get tournament locations'});
								return;
							}

							req.membership_information.tournaments = tournaments.rows;

							next();
						}
					);
				}
			);
		}

		/********************************************************************************/
	}
}