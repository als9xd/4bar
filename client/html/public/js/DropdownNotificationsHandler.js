let DropdownNotificationsHandler = function(socket,dd_ntf_defs) {

	let msMinute = 60*1000;
	let msHour = 60*60*1000;
	let msDay = 60*60*24*1000;


	socket.emit('dropdown_notifications_req');
	let dropdown_menu = document.getElementById('notification-dropdown-menu');
	let dropdown_count = document.createElement('span');
	dropdown_count.id = "notifications-count";
	dropdown_count.innerHTML = 0;
	dropdown_count.style.display = 'none';
	document.getElementById('notification-dropdown').appendChild(dropdown_count);

	this.inc_dropdown_counter = function(number){
		if(typeof number !== 'undefined'){
			dropdown_count.innerHTML = Number(dropdown_count.innerHTML)+number;
		}else{
			dropdown_count.innerHTML = Number(dropdown_count.innerHTML)+1;
		}
		if(dropdown_count.innerHTML > 0){
			dropdown_count.style.display = 'block';
		}else{
			dropdown_count.style.display = 'none';
		}
	}

	this.dec_dropdown_counter = function(number){
		if(typeof number !== 'undefined'){
			dropdown_count.innerHTML = Number(dropdown_count.innerHTML)-number;
		}else{
			dropdown_count.innerHTML = Number(dropdown_count.innerHTML)-1;
		}
		if(dropdown_count.innerHTML > 0){
			dropdown_count.style.display = 'block';
		}else{
			dropdown_count.style.display = 'none';
		}		
	}

	socket.on('dropdown_notifications_res',function(notifications){
		let new_dropdown_count = 0;
		for(let type in notifications){
			if(notifications.hasOwnProperty(type)){
				for(let i = 0; i < notifications[type].length;i++){
					new_dropdown_count++;
					let notification_el = dd_ntf_defs[type](notifications[type][i]);

					let old_date = notifications[type][i].date;

					let notification_date = document.createElement('div');
					let set_time =function(){
			
						let new_date = Date.now();

			    		let elapsed_min = Math.floor(((new_date - old_date) % msDay) / msMinute);
			    		let elapsed_hours = Math.floor(((new_date - old_date) % msDay) / msHour);
			    		let elapsed_days = Math.floor((new_date - old_date) / msDay);

						if(elapsed_min === 0){
							notification_date.innerHTML = 'Received just now';				
						}else if(elapsed_hours === 0){
							notification_date.innerHTML = 'Received '+elapsed_min+' minute'+(elapsed_min > 1 ? 's':'')+' ago';
						}
						else if(elapsed_days === 0){
							notification_date.innerHTML = 'Received '+elapsed_hours+' hour'+(elapsed_hours > 1 ? 's':'')+' ago';
						}else{
							notification_date.innerHTML = 'Received '+elapsed_min+' days'+(elapsed_min > 1 ? 's':'')+' ago';				
						}

		    		};
		    		set_time();
					setTimeout(set_time,
		    		//refresh time every minute
		    		1000*60
		    		);

					notification_el.appendChild(notification_date);

					notification_el.classList.add('dropdown-item');
					dropdown_menu.insertBefore(notification_el,dropdown_menu.childNodes[2]);
				}
			}
		}
		inc_dropdown_counter(new_dropdown_count);	
	});

	return this;
}