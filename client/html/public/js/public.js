function format_date(unformated,settings){

  let date = new Date(unformated);
  let dd = date.getDate();
  let mm = date.getMonth()+1; //January is 0!
  let hh = date.getHours();
  let mn = date.getMinutes();
  let ampm = (hh >= 12) ? "PM":"AM";
  let yyyy = date.getFullYear();
  if(dd<10){
      dd='0'+dd;
  } 
  if(mm<10){
      mm='0'+mm;
  }
  if(hh===0){
    hh=12;
  }
  if(hh<10){
    hh='0'+hh;
  }
  if(mn<10){
    mn='0'+mn;
  }

  
  if(typeof settings !== 'undefined' && settings.includeTime === true){
    return mm+'/'+dd+'/'+yyyy+' '+hh+':'+mn+' '+ampm;          
  }else{
    return mm+'/'+dd+'/'+yyyy;
  }
}

function getUrlParameter(sParam) {
    let sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

var updateQueryStringParam = function (key, value) {

    var baseUrl = [location.protocol, '//', location.host, location.pathname].join(''),
        urlQueryString = document.location.search,
        newParam = key + '=' + value,
        params = '?' + newParam;

    // If the "search" string exists, then build params from it
    if (urlQueryString) {

        updateRegex = new RegExp('([\?&])' + key + '[^&]*');
        removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');

        if( typeof value == 'undefined' || value == null || value == '' ) { // Remove param if value is empty

            params = urlQueryString.replace(removeRegex, "$1");
            params = params.replace( /[&;]$/, "" );

        } else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it

            params = urlQueryString.replace(updateRegex, "$1" + newParam);

        } else { // Otherwise, add it to end of query string

            params = urlQueryString + '&' + newParam;

        }

    }
    window.history.replaceState({}, "", baseUrl + params);
};
