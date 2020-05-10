
import ui from './ui.js'
export default class tt {
  constructor (el,data){
    return new ui().pick(el,data)
    }
  }

  /*

  usage: 
  import tt from "./tt.js"
  for adding new type: 
  add new class to templates
  add new type into ui
// element create w / params : 'type' , {data}      

const saber = return new tt('button',{id:'saber',classList:['saber','sword'],text:'saber'}).create();

console.log(saber);
// <button id="saber" class="saber sword">saber</button>
*/












   
