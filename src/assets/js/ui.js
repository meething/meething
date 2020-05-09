export default class UI {
 /*
 UI elements: 
 window
 document
 template
 widget
 element (common)
 toolbox
 button
 chat
 video
 input
 chatbubble
 chatbubblecontent
 icons
 emoticons ?
 text elements
 images
 */
 template = {}
 widget = {}
 chat = {}
uiGrid = {
    mobile: '',
    desktop: ''
}
status = ['active','inactive']
element = ({el,attr,content}) => {
    let element = document.createElement(el)
    attr.forEach(attribute => {
        element.setAttribute(attribute,attr['attribute']);
    })
    element.innerHtml = content
    addEvent = (evt,fn) => this.addEventListener(evt,fn)
    rmEvent = (evt,fn) => this.removeEventListener(evt,fn)
    return element
}
    btn = ({className,id,text,icon}) => {
         let btn =   document.createElement('button')
         btn.className = className;
         btn.id = id;
         btn.textContent = text;
         if(icon){
             let i = document.createElement(i)
             i.className = icon;
             btn.appChild(i);
         }
            return btn
        }
     toolbox = ({className,id,btnList}) => {
            let toolbox = document.createElement('div')
                toolbox.className = className;
                toolbox.id = id;
                btnList.forEach(btn => toolbox.appendChild(btn));
            return toolbox;
        }
     vid = ({src,className,id,muted,}) => {

        }
    } 

