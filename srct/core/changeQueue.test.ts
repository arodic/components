import {ChangeQueue, Change} from './changeQueue.js';
import {Node, RegisterIoNode} from '../components/io-node.js'

class TestNode extends Node {
  prop1ChangeCounter = 0;
  changeCounter = 0;
  eventDispatchCounter = 0;
  eventName?: string;
  change?: Change;
  static get Properties(): any {
    return {
      prop1: 0,
    };
  }
  prop1Changed() {
    this.prop1ChangeCounter++;
  }
  dispatchEvent(eventName: string, change: Change) {
    this.eventDispatchCounter++;
    this.eventName = eventName;
    this.change = change;
  }
  changed() {
    this.changeCounter++;
  }
}
RegisterIoNode(TestNode);

export default class {
  run() {
    describe('ChangeQueue', () => {
      it('Should initialize with correct default values', () => {
        const node = new TestNode();
        const changeQueue = new ChangeQueue(node);
        chai.expect(typeof (changeQueue as any).__node).to.be.equal('object');
        chai.expect(typeof (changeQueue as any).__changes).to.be.equal('object');
        chai.expect((changeQueue as any).__changes.length).to.be.equal(0);
        chai.expect((changeQueue as any).__changes instanceof Array).to.be.equal(true);
        chai.expect((changeQueue as any).__dispatching).to.be.equal(false);
      });
      it('Should dispose correctly', () => {
        const node = new TestNode();
        const changeQueue = new ChangeQueue(node);
        changeQueue.dispose();
        chai.expect((changeQueue as any).__node).to.be.equal(undefined);
        chai.expect((changeQueue as any).__changes).to.be.equal(undefined);
        chai.expect((changeQueue as any).__dispatching).to.be.equal(undefined);
      });
      it('Should trigger change events', () => {
        const node = new TestNode().connect();
        const changeQueue = new ChangeQueue(node);
        changeQueue.queue('test', 1, 0);
        changeQueue.queue('test', 2, 1);
        chai.expect((changeQueue as any).__changes.length).to.be.equal(1);
        changeQueue.dispatch();
        chai.expect((changeQueue as any).__changes.length).to.be.equal(0);
        chai.expect(node.eventName).to.be.equal('test-changed');
        chai.expect(node.change?.property).to.be.equal('test');
        chai.expect(node.change?.value).to.be.equal(2);
        chai.expect(node.change?.oldValue).to.be.equal(0);
        chai.expect(node.eventDispatchCounter).to.be.equal(1);
        chai.expect(node.changeCounter).to.be.equal(1);
        changeQueue.queue('test2', 0, -1);
        changeQueue.queue('test3', 2, 1);
        chai.expect((changeQueue as any).__changes.length).to.be.equal(2);
        changeQueue.dispatch();
        chai.expect((changeQueue as any).__changes.length).to.be.equal(0);
        chai.expect(node.eventName).to.be.equal('test2-changed');
        chai.expect(node.change?.property).to.be.equal('test2');
        chai.expect(node.change?.value).to.be.equal(0);
        chai.expect(node.change?.oldValue).to.be.equal(-1);
        chai.expect(node.eventDispatchCounter).to.be.equal(3);
        chai.expect(node.prop1ChangeCounter).to.be.equal(0);
        chai.expect(node.changeCounter).to.be.equal(2);
      });
      it('should trigger handler functions', () => {
        const node = new TestNode().connect();
        const changeQueue = new ChangeQueue(node);
        changeQueue.queue('prop1', 1, 0);
        changeQueue.queue('prop1', 2, 1);
        changeQueue.dispatch();
        chai.expect(node.prop1ChangeCounter).to.be.equal(1);
        chai.expect(node.changeCounter).to.be.equal(1);
      });
    });
  }
}