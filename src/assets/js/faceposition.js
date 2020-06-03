export default function fitCamera(id, cont, movement) {
  // center of the screen : 100
  // var v = document.getElementById(id);
  var vcont = document.getElementById(cont);
  let m = movement[1];
  vcont.scrollTo({
    top: 0,
    left: m,
    behavior: 'smooth'
  })
  //     let videocenter = v.videoWidth /2 //OK
  //     console.log(videocenter, 'video center')
  // let m = movement[1];
  //     //var vrect =v.getBoundingClientRect().width;  
  //     var vrect = v.getBoundingClientRect().width
  //     var vrectLeft = v.getBoundingClientRect().left

  //     console.log(vrectLeft, 'vrectleft')
  //     console.log(vrect, 'vrect')
  //     var vcontrect = vcont.getBoundingClientRect().width;
  //     console.log(vcontrect, 'vcontrect')
  //   // center of container
  // console.log(movement[1])
  // if(m > videocenter && vrectLeft <= 0){
  //   v.style.left =   videocenter - m + "px"
  //   console.log(v.style.left)
  // } else if(m < videocenter  && vrectLeft >= 0 ){
  //   v.style.left =  - m + videocenter + "px"
  //   console.log(v.style.left)
  // }

}
