module.exports = {
	check_authentication: (socket,next) =>{
      if (socket.handshake.session && socket.handshake.session.auth === true){
      	return next();
      }
      next(new Error('Authentication error'));
	}
};