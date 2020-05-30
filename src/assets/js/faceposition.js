 export default function fitCamera(id, cont, movement) {
      // center of the screen : 100
    var v = document.getElementById(id);
    var vcont = document.getElementById(cont);
    var vrect = Math.floor( v.getBoundingClientRect().width);
    var vcontrect = Math.floor(vcont.getBoundingClientRect().width);
    // get the left and the right of container 
    var vright =  Math.floor( v.getBoundingClientRect().right);
    var vcontright =  Math.floor( vcont.getBoundingClientRect().right);
    var vleft =  Math.floor( v.getBoundingClientRect().left);
    var vcontleft =  Math.floor( v.getBoundingClientRect().left);
    v.style.left = - vrect/2 + vcontrect/2 + 'px';  
    var diff = vcontrect / 2 - vrect /2;
    var m = movement;
    if (m > 100 && m < 200 && vright >= vcontright ){
        // move 
        v.style.left = (parseInt(v.style.left,10) - (m - 100)) + 'px';
        console.log("moving left: ",v.style.left)
        console.log("m ", m)
    } else if(m < 100 && m > 0 && vleft <= vcontleft){
        // move right
        v.style.left = (parseInt(v.style.left,10) + (100 - m)) + 'px';  
        console.log("moving right: ",v.style.left)
        console.log("m ", m)
    }
  }
