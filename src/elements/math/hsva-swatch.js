import {html} from "../../io.js";
import {IoHsvaPicker} from "./hsva-picker.js";
import {IoLayerSingleton, IoGl, chunk} from "../../io-elements-core.js";

export class IoHsvaSwatch extends IoGl {
  static get Style() {
    return html`<style>
      :host {
        cursor: pointer;
        border-radius: var(--io-border-radius);
        min-width: 32px;
        min-height: 1.375em;
      }
      :host[aria-invalid] {
        outline: 1px solid var(--io-color-focus);
      }
      :host:focus {
        outline: 1px solid var(--io-color-focus);
      }
    </style>`;
  }
  static get Attributes() {
    return {
      role: 'slider',
      tabindex: 0,
    };
  }
  static get Properties() {
    return {
      value: [0.5, 0.5, 0.5, 0.5],
      horizontal: false,
    };
  }
  static get Frag() {
    return /* glsl */`
      varying vec2 vUv;

      ${chunk.hue2rgb}
      ${chunk.hsv2rgb}

      void main(void) {
        float tileSize = uSize.x / 32.0;
        tileSize = (tileSize - mod(tileSize, 1.0)) * 5.0;
        vec2 alphaPos = floor(vUv * vec2(tileSize, tileSize / uAspect));
        float alphaMask = mod(alphaPos.x + mod(alphaPos.y, 2.0), 2.0);
        vec3 alphaPattern = mix(vec3(0.5), vec3(1.0), alphaMask);

        float alpha = uValue.a;
        vec2 pxUv = vUv * uSize;
        float lineWidth = 4.0;
        if (pxUv.x < lineWidth) alpha = 1.0;
        if (pxUv.y < lineWidth) alpha = 1.0;
        if (pxUv.x > uSize.x - lineWidth) alpha = 1.0;
        if (pxUv.y > uSize.y - lineWidth) alpha = 1.0;

        gl_FragColor = vec4(mix(alphaPattern, hsv2rgb(uValue.xyz), saturate(alpha)), 1.0);
      }
    `;
  }
  static get Listeners() {
    return {
      'mousedown': '_onMousedown',
      'keydown': '_onKeydown',
    };
  }
  _onMousedown() {
    event.preventDefault();
    this.focus();
    this._expand();
  }
  _onKeydown() {
    this._expand();
  }
  _expand() {
    const hasAlpha = this.value[3] !== undefined || this.value.a !== undefined;
    IoHsvaPicker.singleton.value = this.value;
    IoHsvaPicker.singleton.style.width = hasAlpha ? '192px' : '160px';
    IoHsvaPicker.singleton.style.height = '128px';
    IoHsvaPicker.singleton.expanded = true;
    IoLayerSingleton.clickblock = true;
    IoLayerSingleton.srcElement = this;
    IoLayerSingleton.setElementPosition(IoHsvaPicker.singleton, 'bottom', this.getBoundingClientRect());
  }
}

IoHsvaSwatch.Register();
