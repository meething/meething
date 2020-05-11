import * as t from './templates.js';
export default class ui  {

constructor(){
    this.type = {
        button : t.Button, //
        video : t.Video,
        bubble: t.Bubble,
        chat: t.Chat,
        menu: t.Menu,
        widget: t.Widget,
        link: t.Link,
        text: t.Text, // 
        input: t.Input, //
        textarea: t.Textarea
    }
}
    pick = (t, data) => {
        if(t){
            return new this.type[t]({data})
        }
    }
}



