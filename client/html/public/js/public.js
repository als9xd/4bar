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
