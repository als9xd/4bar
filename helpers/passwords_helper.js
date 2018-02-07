module.exports = function(config){
	const crypto = require('crypto');

	this.is_invalid = function(str){

		let reqs = config.registration.password;
		
		let invalid_msgs = [];
		
		if(str.length < reqs.min_length){
			invalid_msgs.push("at least "+reqs.min_length+" character"+(reqs.min_length==1?"":"s")+" long")
		}
		if(str.replace(/[^A-Z]/g, "").length < reqs.min_alpha){
			invalid_msgs.push("at least "+reqs.min_alpha+" capital letter"+(reqs.min_alpha==1?"":"s"));
		}
		if(str.replace(/[^a-z]/g, "").length < reqs.min_lowercase){
			invalid_msgs.push("at least "+reqs.min_lowercase+" lowercase letter"+(reqs.min_lowercase==1?"":"s"));
		}
		if(str.replace(/[^0-9]/g, "").length < reqs.min_numbers){
			invalid_msgs.push("at least "+reqs.min_numbers+" number"+(reqs.min_numbers==1?"":"s"));
		}
		if(str.replace(/[^!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g,"").length < reqs.min_specials){
			invalid_msgs.push("at least "+reqs.min_specials+" special characters");
		}

		return invalid_msgs;
	}

	this.hash= function(str,callback){

  		let salt = crypto.randomBytes(config.crypto.password.salt_bytes).toString('base64');

	    crypto.pbkdf2(str, salt, config.crypto.password.iterations, config.crypto.password.hash_bytes,'sha256',
	    	function(err,hash){
	    		if(err){
	    			console.log(err);
	    		}else{
			    	callback(
					    {
					        salt: salt,
					        hash: hash,
					        iterations: config.crypto.password.iterations	    	
					    }
				    );	    			
	    		}

	    	}
	    );
	};

	this.validate = function(str,hash,salt,iterations,succ_cb,fail_cb){

		crypto.pbkdf2(str,salt,Number(iterations),hash.length,'sha256',
			function(err,str_hash){
				if(err){
					console.log(err);
				}else if(hash.equals(str_hash)){
					succ_cb(hash);
				}else{
					fail_cb();
				}
			}
		);
	}

	return this;
}