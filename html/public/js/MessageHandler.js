function MessageHandler(toastr,socket,callbacks){
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-center",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    socket.on('message',function(message){
        if(message.error){
            toastr.options.closeButton = true;
            toastr.options.timeOut = 0;
            toastr.options.preventDuplicates = true;

            let error_msg = '';
            if(typeof(message.error) == 'object'){
                for(let i in message.error){
                    if(message.error.hasOwnProperty(i)){
                        error_msg+='- '+message.error[i]+'<br>';
                    }
                }
                message.error = error_msg;
            }


            if(callbacks && callbacks.on_error){
                callbacks.on_error(message);
            }else{
                if(message.title){
                    toastr.error(message.error,message.title);
                }else{
                    toastr.error(message.error);
                }
            }

            toastr.options.closeButton = false;
            toastr.options.timeOut = 5000;
            toastr.options.preventDuplicates = false;
        }

        if(message.success){
            let success_msg = '';
            if(typeof(message.success) == 'object'){
                for(let i in message.success){
                    if(message.success.hasOwnProperty(i)){
                        success_msg+='- '+message.success[i]+'<br>';
                    }
                }    
                message.success = success_msg;
            }


            if(callbacks && callbacks.on_success){
                callbacks.on_success(message);
            }else{
                if(message.title){
                    toastr.success(message.success,message.title);
                }else{
                    toastr.success(message.success);
                }
            }
        }

    });  
}
