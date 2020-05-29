 export default function fitCamera(id, cont, movement) {
      // center of the screen : 100
    var v = document.getElementById(id);
    var vcont = document.getElementById(cont);
    var vrect = Math.floor( v.getBoundingClientRect().width);
    var vcontrect = Math.floor(vcont.getBoundingClientRect().width);
    v.style.left = - vrect/2 + vcontrect/2 + 'px';  
    var m = movement;
    if (m > 100){
        // move left
        v.style.left = (parseInt(v.style.left,10) - (m - 100)) + 'px';
        console.log("moving left: ",v.style.left)
    } else {
        // move right
        v.style.left = (parseInt(v.style.left,10) + (100 - m)) + 'px';
        console.log("moving right: ",v.style.left)
    }
  }
