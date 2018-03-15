# Table of Contents

[Developer Guide](#developer-guide)
- [Add a new webpage](#add-a-new-webpage)
- [Send Data from Client to Server](#send-data-from-client-to-server)
- [Send Data from Server to Client](#send-data-from-server-to-client)
- [Query the Postgresql Database](#query-the-postgresql-database)

# Developer Guide

## Add a New Webpage

1. Create a new handlebars file (or create a new copy of an existing one) and place it within `4bar/client/views/private` or `4bar/client/views/public` depending on whether users should be required to login to view it.
	
	* Handlebars files essentially allow users to pass server data to an html file in a template format

2. Create a new route in `4bar/server/definitions/express/express_route_definitions.js`
	
	* This will setup the url (route) so when a client tries to access that url the server knows how to respond
	
The most basic route that you can setup would look like this

```javascript
/* 
String route_url
String handlebars_filename
Object handlebars_data
*/

() => {
	app.get(>>route_url<<,function(req,res){
		// Send a handlebars template file to the client (with backend data)
		res.render('private/'+ >>handlebars_filename<<, >>handlebars_data<< );
	});
},
```

## Send Data From Client to Server

There are two basic ways this can be accomplished:

- [Send Client Data to the Server using Socket IO](#send-client-data-to-the-server-using-socket-io) (Prefered)
	* This method should be used when you want data to be updated live (i.e. without page refresh)
- [Send Client Data to the Server using Form Post Requests](#send-client-data-to-the-server-using-form-post-requests)
	* This method should be used if either you don't care whether the user has to refresh the page or if the user needs to upload a file
	
### Send Client Data to the Server using Socket IO

1. Setup a new Socket IO listener in `4bar/server/definitions/socket_io/socket_io_listener_definitions`
      * This will listen for a message from all the clients and will run whatever back-end code you implement when that message is received

The simplest example of a socket listener would be as follows:

```javascript
	/*
	String >>client_message<<
	Object >>client_data<<
	*/
	(socket) => {
		socket.on(>>client_message<<,function(>>client_data<<){
			// Run backend code here
		});
	},
```

2. Setup Socket IO message emitter on the client (within handlebars/html file)

First make sure Socket IO is setup on the client by using this:

```html
<script src="/socket.io/socket.io.js"></script> 
<script type="text/javascript">let socket = io();</script> <!-- This initializes and connects socket.io to the server -->
```

Then you can send a message to the server using socket.emit:

```javascript
/* 
String message_from_client_name
Object client_data
*/

socket.emit(>>message_from_client_name<<,>>client_data<<);
```

Example:
```html
<script src="/socket.io/socket.io.js"></script> 
<script type="text/javascript">let socket = io();</script>

<javascript>socket.emit('some_message_name',{some_message_key_name:'Hello from the client-side!'});</javascript>
```

### Send Client Data to the Server using Form Post Requests

1. Create a new 'post' route within `4bar/server/definitions/express/express_route_definitions.js`

```javascript
/* 
String route_url
String handlebars_filename
Object handlebars_data
String form_input_name
*/

() => {
	// Note how we use 'app.post' instead of 'app.get' since it is a post request
	app.post(>>route_url<<,function(req,res){
		// Data passed by the front end will be stored in req.query
		console.log(req.query[>>form_input_name<<));
		// Send a handlebars template file to the client (with backend data)
		res.render('private/'+ >>handlebars_filename<<, >>handlebars_data<< );
	});
},
```

2. Create a new form within the handlebars/html file

```html
<form action=>>route_url<< method="post" role="form" encType="multipart/form-data">
	<input type="text" name=>>form_input_name<</> 
	<button type="submit>
</form>
```

## Send Data from Server to Client

There are three main ways you can achieve this:

- [Send Data From Server to Client Using Socket IO](#send-data-from-server-to-client-using-socket-io) (Prefered)
	* This method should be used when you want data to be updated live (without page refresh)
- [Send Data From Server to Client Using Handlebars](#send-data-from-server-to-client-using-handlebars)
	* This method should be used if you don't care whether the user has to refresh the page or if the user needs to upload a file
- [Send Data From Server to Client Using URL Queries](#send-data-from-server-to-client-using-url-queries)
	* This method is not recommended and should only be used if you have an html file (not handlebars) and don't want to use Socket IO. There is code that currently uses this approach but it should be modified to use another approach in the future.
	
### Send Data From Server to Client Using Socket IO

1. To achieve this simply do the inverse of [Send Client Data to the Server using Socket IO](#send-client-data-to-the-server-using-socket-io) (i.e. just emit the message from server and listen for it on the client)

### Send Data From Server to Client Using Handlebars

1. Within you handlebars file located in `4bar/client/views/private` or `4bar/client/views/public`, specify the key of the value in handlebars_data that you wish to render on the client 

```html
<div>{{{some_key_within_handlebars_data}}}</div>
```

2. Within your intended route in `4bar/server/definitions/express/express_route_definitions.js`, render a handlebars file with back-end data

```javascript
/* 
String route_url
String handlebars_filename
Object handlebars_data
*/

() => {
	app.get(>>route_url<<,function(req,res){
		// Send a handlebars template file to the client (with backend data)
		res.render('private/'+ >>handlebars_filename<<, >>handlebars_data<< );
	});
},
```

Example:

```javascript
//Within route
res.render('private/example_handlebars_filename',{example_key: 'Hello World',some_other_example_key: some_other_example_data});
```

```html
<!-- Within front-end handlebars file -->
<div>{{{example_key}}}</div> <!-- Will show 'Hello World' to client when they access 4bar.org/example_handlebars_filename -->
```

### Send Data From Server to Client Using URL Queries

1. Within the route simply redirect the client to its intended url and add the data as a query (i.e `4bar.org/some_route?some_query_data=Hello World`)

```javascript
/* 
String route_url
String destination_route_url
String server_data
*/

() => {
	app.get(>>route_url<<,function(req,res){
		res.redirect('/>>destination_route_url<<?>>server_data<<')
	});
},
```

Note:

There is no standard way of parsing the data from the url on the front-end. Here is an example:

```javascript
function get_url_parameter(name,url){
    if (!url){
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results){
      return null;
    }
    if (!results[2]){ 
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

console.log(get_url_parameter('some_query_data')); // Will output 'Hello World'
```

# Query the Postgresql Database

For PostgreSQL in particular it is very important that you have at least a basic understanding of callbacks since PostgreSQL extensively leverages node's asynchronous capabilities

Here is the most simple example of a PostgreSQL query on the back-end:

```javascript
/* 
String postgres_query
Array postgres_query_data
*/

pg_conn.client.query(
	>>postgres_query<<,
	>>postgres_query_data<<,
	function(err,query_results){
		if(err){
			console.log(err);
			return;
		}
		// Do whatever with query_results here
	}
);
```

If you have multiple queries you need to chain them together using callbacks (or in rare cases promises):

```javascript
/* 
String postgres_query
Array postgres_query_data

String some_other_postgres_query
Array some_other_postgres_query_data
*/

pg_conn.client.query(
	>>postgres_query<<,
	>>postgres_query_data<<,
	function(err,query_results){
		if(err){
			console.log(err);
			return;
		}
		// Do whatever with query_results here

		pg_conn.client.query(
			>>some_other_postgres_query<<,
			>>some_other_postgres_query_data<<,
			function(err,some_other_query_results){
				if(err){
					console.log(err);
					return;
				}
				// Do whatever with some_other_query_results here
			}
		);

	}
);
```

Example:

```javascript
// This example assuming a user named 'John Smith' that has a user_id of 3 and whose password is 'My_Secret_Password exists in the database.

pg_conn.client.query(
	"SELECT * FROM users where user_id=$1 AND password=$2",
	[
		3,
		'My_Secret_Password'
	],
	function(err,query_results){
		if(err){
			console.log(err);
			return;
		}
		console.log(query_results.rows[0].name); // Outputs John Smith
	}
);
```
