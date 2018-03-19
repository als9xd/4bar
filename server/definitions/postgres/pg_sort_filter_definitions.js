//////////////////////////////////////////////////////////////////////
// 4bar/server/definitions/postgres/pg_sort_filter_definitions.js
//
// Overview: 
//	- Contains definitions for sort filters for database tables by
//    column
//
// More about the sort function in javascript:
//
//   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
//
//////////////////////////////////////////////////////////////////////


module.exports = {

	/******************************** Example ***************************************/

	/* 

	Key >>table_name<<
	Key >>column_name<<

	Key >>some_other_table_name<<
	Key >>some_other_column_name<<

	==================================================================================
	 
	Within this file:

	>>table_name<< : {
		
		>>column_name<< : (a,b) => {
			// If row a should come before row b in rows array
			return -1;
			// If row a should come after row b in rows array 
			return 1;
			// If the indices of row a and row b should remain the same
			return 0;
		},

		>>some_other_column_name<< : (a,b) => {
			...
		},


	},
	>>some_other_table_name<< : {
		
		>>column_name<< : (a,b) => {
			// If row a should come before row b in rows array
			return -1;
			// If row a should come after row b in rows array 
			return 1;
			// If the indices of row a and row b should remain the same
			return 0;
		},

		>>some_other_column_name<< : (a,b) => {
			...
		},

	}

	etc...

	----------------------------------------------------------------------------------

	Within handlebars/html file:

	// To search a specific field
	<form action="/search" method="GET">
		<input type="hidden" name="query_field" value=">>table_name<<">
		<input type="text" name=">>input.name<<">
		<input type="text" name=">>input.some_other_name<<">
		<input type="text" name="sort_by"> // This is where the user specifies the table column to sort by. In
										   // practice this should probably be a dropdown of some sort instead 
										   // of text input
		<button type="submit">Search</button>
	</form>

	*/
	
	/********************************************************************************/		

	//////////////////////////////////////////////////////////////////////
	// Community Sort Filters
	//////////////////////////////////////////////////////////////////////

	communities: {

		name: (a,b) => {
			if(a.name < b.name){
				return -1;
			}
			if(a.name > b.name){
				return 1;
			}
			return 0;
		},

		last_activity: (a,b) => {
			if(typeof a.last_activity !== 'undefined' && typeof b.last_activity !== 'undefined'){
				let a_d = a.last_activity.split('/');
				let b_d = b.last_activity.split('/');

				for(let time_unit = 2; time_unit >= 0; time_unit--){
					if(a_d[time_unit] > b_d[time_unit]){
						return -1;
					}
					if(a_d[time_unit] < b_d[time_unit]){
						return 1;
					}
				}
			}
			return 0;						
		},

		num_members: (a,b) =>{
			if(a.num_members > b.num_members){
				return -1;
			}
			if(a.num_members < b.num_members){
				return 1;
			}
			return 0;
		}
	},

	/********************************************************************************/

	//////////////////////////////////////////////////////////////////////
	// User Sort Filters
	//////////////////////////////////////////////////////////////////////

	users: {
		
		username: (a,b) => {
			if(a.username < b.username){
				return -1;
			}
			if(a.username > b.username){
				return 1;
			}
			return 0;
		},

		name: (a,b) => {
			if(a.name < b.name){
				return -1;
			}
			if(a.name > b.name){
				return 1;
			}
			return 0;
		},

		email: (a,b) => {
			if(a.email < b.name){
				return -1;
			}
			if(a.name > b.name){
				return 1;
			}
			return 0;
		}

	}

};