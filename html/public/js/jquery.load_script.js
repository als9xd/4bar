jQuery.load_script = function (url, callback) {
  jQuery.ajax({
      url: url,
      dataType: 'script',
      success: callback,
      async: true
  });
} 