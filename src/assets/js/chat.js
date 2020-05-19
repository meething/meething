var med = null;

export default class Chat {
  constructor(mediator) {
    this.mediator = mediator;
    med = this.mediator;
    return this;
  }
}
