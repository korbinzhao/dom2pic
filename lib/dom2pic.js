"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncIterator(iterable) { var method; if (typeof Symbol !== "undefined") { if (Symbol.asyncIterator) { method = iterable[Symbol.asyncIterator]; if (method != null) return method.call(iterable); } if (Symbol.iterator) { method = iterable[Symbol.iterator]; if (method != null) return method.call(iterable); } } throw new TypeError("Object is not async iterable"); }

class Html2Img {
  constructor(options) {
    _defineProperty(this, "options", void 0);

    this.options = options;
    this.initOptions(options);
  }

  initOptions(options) {
    const {
      root,
      width,
      height
    } = options;
    this.options = {
      root: typeof root === 'string' ? document.querySelector(root) : root,
      width: width || root.offsetWidth,
      height: height || root.offsetHeight
    };
  }

  async toCanvas() {
    const {
      root,
      width,
      height
    } = this.options;
    const clone = await cloneNodeWithStyle(root);
    const svgDataUri = generateSvgDataUri(clone, width, height);
    const canvas = await generateCanvas(svgDataUri, width, height);
    return canvas;
  }

  async toSvg() {
    const {
      root,
      width,
      height
    } = this.options;
    const clone = await cloneNodeWithStyle(root);
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
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossorigin', 'anonymous');

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas);
    };

    img.onerror = err => {
      reject(err);
    };

    img.src = url;
  });
}
/**
 * generate a image from uri
 * @param uri 
 */


async function generateImage(uri) {
  return await new Promise(function (resolve, reject) {
    var image = new Image();

    image.onload = function () {
      resolve(image);
    };

    image.onerror = reject;
    image.src = uri;
  });
}
/**
 * deep clone node width style
 * @param node 
 */


async function cloneNodeWithStyle(node) {
  const clone = node instanceof HTMLCanvasElement ? await generateImage(node.toDataURL()) : node.cloneNode(false);
  const children = node.childNodes;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;

  var _iteratorError;

  try {
    for (var _iterator = _asyncIterator(children), _step, _value; _step = await _iterator.next(), _iteratorNormalCompletion = _step.done, _value = await _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
      const child = _value;
      const clonedChildWithStyle = await cloneNodeWithStyle(child);
      clone.appendChild(clonedChildWithStyle);
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

  function copyStyle(node, clone) {
    const style = window.getComputedStyle(node);

    if (style.cssText) {
      clone.style.cssText = style.cssText;
    }

    return clone;
  }

  if (clone instanceof HTMLElement) {
    if (clone.tagName === 'IMG') {
      await new Promise((resolve, reject) => {
        clone.onload = async () => {
          copyStyle(node, clone);
          const canvas = await generateCanvas(node.getAttribute('src'), node.offsetWidth, node.offsetHeight);
          const uri = canvas.toDataURL();
          clone.setAttribute('src', uri);
          resolve(uri);
        };

        clone.onerror = () => {
          reject(clone);
        };
      });
    } else {
      copyStyle(node, clone);
    }
  }

  return clone;
}