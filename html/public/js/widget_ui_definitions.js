const WidgetUIDefinitions = {
 youtube: function(data,widget_container){
    let widget = document.createElement('iframe');

    widget.setAttribute('width','450');
    widget.setAttribute('height','300');

    widget.setAttribute('frameborder','0');
    widget.setAttribute('allow','encrypted-media');

    widget.src = data.url;
    widget_container.style.width = "500px";
    widget_container.style.height = "350px";
    return widget; 
  },

  twitter: function(data,widget_container){
    let widget = document.createElement('a');
    widget.classList.add("twitter-follow-button");
    widget.href = data.url;
    widget.innerHTML = "Tweets by TwitterDev";
    $.load_script("https://platform.twitter.com/widgets.js",function(){
      $(widget_container).width($(widget).width()+60);
    });
    return widget;
  }  
}