"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncIterator(iterable) { var method; if (typeof Symbol !== "undefined") { if (Symbol.asyncIterator) { method = iterable[Symbol.asyncIterator]; if (method != null) return method.call(iterable); } if (Symbol.iterator) { method = iterable[Symbol.iterator]; if (method != null) return method.call(iterable); } } throw new TypeError("Object is not async iterable"); }

const SCALE = 2; // canvas context scale

class Html2Img {
  constructor(config) {
    _defineProperty(this, "config", void 0);

    _defineProperty(this, "options", void 0);

    this.config = config;
    this.init();
  }

  async init() {
    await this.initOptions();
  }

  async waitImagesLoad() {
    const {
      root
    } = this.config;
    const imgs = root.querySelectorAll('img');
    const promises = [];
    imgs.forEach(img => {
      if (!img.complete) {
        promises.push(new Promise((resolve, reject) => {
          img.addEventListener('load', () => {
            resolve(img);
          });
        }));
      }
    });
    return await Promise.all(promises);
  }

  async initOptions() {
    const {
      root
    } = this.config;
    await this.waitImagesLoad();
    const rootEle = typeof root === 'string' ? document.querySelector(root) : root;
    this.options = {
      root: rootEle,
      width: rootEle.offsetWidth,
      height: rootEle.offsetHeight
    };
  }

  async toCanvas() {
    await this.initOptions();
    const {
      root,
      width,
      height
    } = this.options;
    const clone = await deepCloneNode(root);
    const svgDataUri = generateSvgDataUri(clone, width, height);
    const canvas = await generateCanvas(svgDataUri, width, height);
    return canvas;
  }

  async toSvg() {
    await this.initOptions();
    const {
      root,
      width,
      height
    } = this.options;
    const clone = await deepCloneNode(root);
    const foreginObject = document.createElement('foreginObject');
    foreginObject.setAttribute('x', '0');
    foreginObject.setAttribute('y', '0');
    foreginObject.setAttribute('width', '100%');
    foreginObject.setAttribute('height', '100%');
    const svg = document.createElement('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '' + width);
    svg.setAttribute('height', '' + height);
    foreginObject.appendChild(clone);
    svg.appendChild(foreginObject);
    return svg;
  }

  async toPng() {
    const canvas = await this.toCanvas();
    return await canvas.toDataURL('image/png');
  }

  async toJpeg() {
    const canvas = await this.toCanvas();
    return await canvas.toDataURL('image/jpeg');
  }

}
/**
 * generate inline SVG (data:image/svg+xml formate image)
 * @param dom 
 * @param width 
 * @param height 
 */


exports.default = Html2Img;

function generateSvgDataUri(dom, width, height) {
  dom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const foreginObject = "<foreignObject x=\"0\" y=\"0\" width=\"100%\" height=\"100%\">\n  ".concat(new XMLSerializer().serializeToString(dom).replace(/#/g, '%23').replace(/\n/g, '%0A'), "\n  </foreignObject>");
  return "data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"".concat(width, "\" height=\"").concat(height, "\">").concat(foreginObject, "</svg>");
}
/**
 * output a canvas with image
 * @param url 
 * @param width 
 * @param height 
 */


async function generateCanvas(url, width, height) {
  let isSvg = false; // url is svg uri format, such as 'data:image/svg+xml;charset=utf-8,<svg ...'

  if (url.indexOf(',<svg ') !== -1) {
    isSvg = true;
  }

  const img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  img.setAttribute('width', width);
  img.setAttribute('height', height);
  img.src = url;
  const canvas = await new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width * SCALE;
      canvas.height = height * SCALE; // canvas.width = width;
      // canvas.height = height;
      // if (isSvg) {
      //   ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      // }

      ctx.scale(SCALE, SCALE); // ctx.drawImage(img, 0, 0, width * SCALE, height * SCALE);

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas);
    };

    img.onerror = err => {
      reject(err);
    };
  });
  return canvas;
}
/**
 * generate a image from uri
 * @param uri 
 */


async function generateImage(uri, width, height) {
  return await new Promise(function (resolve, reject) {
    const image = new Image();
    image.addEventListener('load', async () => {
      if (image.src.indexOf('data:image/') !== 0) {
        const canvas = await generateCanvas(uri, width, height);
        const dataUri = canvas.toDataURL();
        image.src = dataUri;
      } else {
        resolve(image);
      }
    });
    image.addEventListener('error', err => {
      console.warn(JSON.stringify(err));
      reject(err);
    });
    image.src = uri;
    image.style.width = "".concat(width, "px");
    image.style.height = "".concat(height, "px");
  });
}
/**
 * shallow clone a dom node, and async await a img/canvas dom loaded
 * @param node 
 */


async function shallowCloneNode(node) {
  if (node instanceof HTMLCanvasElement) {
    return await generateImage(node.toDataURL(), node.offsetWidth, node.offsetHeight);
  } else if (node instanceof HTMLImageElement) {
    if (node.complete) {
      return await generateImage(node.getAttribute('src'), node.offsetWidth, node.offsetHeight);
    } else {
      return await new Promise((resolve, reject) => {
        node.addEventListener('load', async () => {
          const img = await generateImage(node.getAttribute('src'), node.offsetWidth, node.offsetHeight);
          resolve(img);
        });
        node.addEventListener('error', async err => {
          console.warn(err);
          reject(err);
        });
      });
    }
  } else {
    const clone = node.cloneNode(false);
    return clone;
  }
}
/**
 * copy style from a dom to another dom
 * @param node 
 * @param clone 
 */


function copyStyle(node, clone) {
  const style = window.getComputedStyle(node);

  if (style.cssText) {
    clone.style.cssText = style.cssText;
  }

  return clone;
}
/**
 * deep clone node width style
 * @param node 
 */


async function deepCloneNode(node) {
  const clone = await shallowCloneNode(node);
  const children = node.childNodes;

  if (children && children.length) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;

    var _iteratorError;

    try {
      for (var _iterator = _asyncIterator(children), _step, _value; _step = await _iterator.next(), _iteratorNormalCompletion = _step.done, _value = await _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
        const child = _value;
        const clonedChildWithStyle = await deepCloneNode(child);

        if (clonedChildWithStyle) {
          clone.appendChild(clonedChildWithStyle);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          await _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return clone;
}