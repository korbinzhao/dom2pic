"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = require("./util");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncIterator(iterable) { var method; if (typeof Symbol !== "undefined") { if (Symbol.asyncIterator) { method = iterable[Symbol.asyncIterator]; if (method != null) return method.call(iterable); } if (Symbol.iterator) { method = iterable[Symbol.iterator]; if (method != null) return method.call(iterable); } } throw new TypeError("Object is not async iterable"); }

const SCALE = 2; // canvas context scale

class Dom2pic {
  constructor(config) {
    _defineProperty(this, "config", void 0);

    _defineProperty(this, "options", void 0);

    this.config = config;
    this.init();
  }

  async init() {
    await this.initOptions();
  }
  /**
   * wait all images loaded whthin root element
   * @param root HTMLElement
   */


  async waitImagesLoad(root) {
    const imgs = root instanceof HTMLImageElement ? [root] : root.querySelectorAll('img');
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
      root,
      backgroundColor
    } = this.config;
    const rootEle = typeof root === 'string' ? document.querySelector(root) : root;

    if (!rootEle.style.backgroundColor && !rootEle.style.background) {
      rootEle.style.backgroundColor = backgroundColor || '#fff';
    }

    await this.waitImagesLoad(rootEle);
    this.options = {
      root: rootEle,
      width: rootEle.offsetWidth,
      height: rootEle.offsetHeight
    };
  }
  /**
   * 
   * @param i 
   * @param childNodeSelector 
   */


  async toCanvas(i, childNodeSelector) {
    await this.initOptions();
    const {
      root,
      width,
      height
    } = this.options;
    const clone = await deepCloneNode(root);

    if (i > -1 && childNodeSelector) {
      const childNodes = clone.querySelectorAll(childNodeSelector);
      hideSiblings(i, childNodes);
      await (0, _util.sleep)(200);
    } // forbidden screenshot the margin of the root node


    clone.style.margin = '0 0 0 0';
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
    svg.setAttribute('width', "".concat(width, "px"));
    svg.setAttribute('height', "".concat(height, "px"));
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
  /**
   * @param childNodeSelector string; generate multiple pictures by childNodeSelector
   * @param type png | jpeg
   */


  async toMultiPictures(childNodeSelector) {
    let type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'png';
    await this.initOptions();
    const {
      root
    } = this.options;
    const childNodes = root.querySelectorAll(childNodeSelector);
    const output = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;

    var _iteratorError;

    try {
      for (var _iterator = _asyncIterator(childNodes.entries()), _step, _value; _step = await _iterator.next(), _iteratorNormalCompletion = _step.done, _value = await _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
        const [i, node] = _value;
        const {
          left,
          top,
          width,
          height
        } = getChildRectRelative2Parent(node, root);
        const canvas = await this.toCanvas(i, childNodeSelector);
        const totalPicUri = await canvas.toDataURL("image/".concat(type));
        const childCanvas = await generateCanvas(totalPicUri, width * SCALE, height * SCALE, 0, 0, width * SCALE, height * SCALE, left * SCALE, top * SCALE);
        output.push({
          left,
          top,
          width,
          height,
          uri: childCanvas.toDataURL("image/".concat(type))
        });
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

    return output;
  }

}
/**
 * hide siblings except self
 * @param i index in siblings wanna skip
 * @param siblings 
 */


exports.default = Dom2pic;

function hideSiblings(i, siblings) {
  siblings.forEach((sibling, index) => {
    if (index !== i) {
      sibling.style.visibility = 'hidden';

      if (sibling.style.position === 'absolute') {
        sibling.style.display = 'none';
      }
    }
  });
}
/**
 * get child element rect relative 2 parent element
 * @param child HTMLElement
 * @param parent HTMLElement
 */


function getChildRectRelative2Parent(child, parent) {
  const childRect = child.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  return {
    left: childRect.left - parentRect.left,
    top: childRect.top - parentRect.top,
    width: childRect.width,
    height: childRect.height
  };
}
/**
 * generate inline SVG (data:image/svg+xml formate image)
 * @param dom 
 * @param width 
 * @param height 
 */


function generateSvgDataUri(dom, width, height) {
  dom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const foreginObject = "<foreignObject x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" style=\"position: relative;\">\n  ".concat(new XMLSerializer().serializeToString(dom).replace(/#/g, '%23').replace(/\n/g, '%0A'), "\n  </foreignObject>");
  return "data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"".concat(width, "\" height=\"").concat(height, "\">").concat(foreginObject, "</svg>");
}
/**
 * output a canvas with image
 * https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage
 * @param url string
 * @param dwidth number
 * @param dheight number
 * @param dx number
 * @param dy number
 * @param swidth number
 * @param sheight number
 * @param sx number
 * @param sy number
 */


async function generateCanvas(url, dwidth, dheight) {
  let dx = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  let dy = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  let swidth = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : dwidth;
  let sheight = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : dheight;
  let sx = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
  let sy = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 0;
  const img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  img.setAttribute('width', dwidth);
  img.setAttribute('height', dheight);
  img.src = url;
  const canvas = await new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = dwidth * SCALE;
      canvas.height = dheight * SCALE;
      ctx.scale(SCALE, SCALE); // https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage

      ctx.drawImage(img, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
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
          console.warn(JSON.stringify(err));
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
 * copy attributes from origin node to cloned node
 * @param node 
 * @param clone 
 */


function copyAttributes(node, clone) {
  Array.from(node.attributes).forEach(attribute => {
    if (attribute.name === 'class' || attribute.name === 'id') {
      clone.setAttribute(attribute.nodeName, attribute.nodeValue);
    }
  });
}
/**
 * deep clone node width style
 * @param node 
 */


async function deepCloneNode(node) {
  const clone = await shallowCloneNode(node);

  if (clone instanceof HTMLElement) {
    copyAttributes(node, clone);
    copyStyle(node, clone);
  }

  const children = node.childNodes;

  if (children && children.length) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;

    var _iteratorError2;

    try {
      for (var _iterator2 = _asyncIterator(children), _step2, _value2; _step2 = await _iterator2.next(), _iteratorNormalCompletion2 = _step2.done, _value2 = await _step2.value, !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
        const child = _value2;
        const clonedChildWithStyle = await deepCloneNode(child);

        if (clonedChildWithStyle) {
          clone.appendChild(clonedChildWithStyle);
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          await _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }

  return clone;
}