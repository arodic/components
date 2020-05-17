import {IoMdView} from '../../../iogui/build/io-extras.js';

export class TodoInfo extends IoMdView {
  changed() {
    this.parseMarkdown(`
Double-click to edit a todo

Created by [Aki Rodic](https://akirodic.com)

Part of [TodoMVC](http://todomvc.com/)
    `);
  }
}

TodoInfo.Register();
