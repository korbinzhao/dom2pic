/**
 * transfer html dom to Canvas/PNG/JPEG/SVG Element 
 * 
 */

 import {sleep} from './util';

interface Config {
  root: HTMLElement | string; // root html dom to screenshot, cannot be absolute position
  backgroundColor?: string; // root dom backgroundColor
}

interface Options {
  root: HTMLElement;
  childNodeSelector?: string;
  width: number; // dom offsetWidth
  height: number; // dom offsetHeight
}

interface ChildPicInfo {
  left: number;
  top: number;
  width: number;
  height: number;
  uri: string;
}

const SCALE = 2; // canvas context scale

export default class Dom2pic {
  constructor(config: Config) {
    this.config = config;
    this.init();

  }

  config: Config;
  options: Options;

  private async init() {
    await this.initOptions();
  }

  /**
   * wait all images loaded whthin root element
   * @param root HTMLElement
   */
  private async waitImagesLoad(root) {
    const imgs = root instanceof HTMLImageElement ? [root] : root.querySelectorAll('img');

    const promises = [];

    imgs.forEach(img => {
      if (!img.complete) {
        promises.push(new Promise((resolve, reject) => {
          img.addEventListener('load', () => {
            resolve(img);
          });
        }))
      }
    });

    return await Promise.all(promises);

  }

  private async initOptions() {
    const { root, backgroundColor } = this.config;
    const rootEle: HTMLElement = typeof root === 'string' ? document.querySelector(root) : root;

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
  async toCanvas(i?, childNodeSelector?): Promise<HTMLCanvasElement> {
    await this.initOptions();

    const { root, width, height } = this.options;

    const clone = await deepCloneNode(root);


    if (i > -1 && childNodeSelector) {
      const childNodes = clone.querySelectorAll(childNodeSelector);

      hideSiblings(i, childNodes);

      await sleep(200);
    }

    // test
    document.body.appendChild(clone);

    // forbidden screenshot the margin of the root node
    clone.style.margin = '0 0 0 0';

    const svgDataUri = generateSvgDataUri(clone, width, height);

    const canvas = await generateCanvas(svgDataUri, width, height);

    return canvas;
  }

  async toSvg(): Promise<HTMLElement | SVGElement> {
    await this.initOptions();

    const { root, width, height } = this.options;

    const clone = await deepCloneNode(root)

    const foreginObject = document.createElement('foreginObject');
    foreginObject.setAttribute('x', '0');
    foreginObject.setAttribute('y', '0');
    foreginObject.setAttribute('width', '100%')
    foreginObject.setAttribute('height', '100%');

    const svg = document.createElement('svg');

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', `${width}px`);
    svg.setAttribute('height', `${height}px`);

    foreginObject.appendChild(clone);
    svg.appendChild(foreginObject);

    return svg;

  }

  async toPng(): Promise<string> {
    const canvas = await this.toCanvas();
    return await canvas.toDataURL('image/png');
  }

  async toJpeg(): Promise<string> {
    const canvas = await this.toCanvas();
    return await canvas.toDataURL('image/jpeg');
  }

  /**
   * @param childNodeSelector string; generate multiple pictures by childNodeSelector
   * @param type png | jpeg
   */
  async toMultiPictures(childNodeSelector, type = 'png'): Promise<ChildPicInfo[]> {

    await this.initOptions();

    const { root } = this.options;

    const childNodes = root.querySelectorAll(childNodeSelector);

    const output = [];

    for await (const [i, node] of childNodes.entries()) {

      const { left, top, width, height } = getChildRectRelative2Parent(node, root);

      const canvas = await this.toCanvas(i, childNodeSelector);
      const totalPicUri = await canvas.toDataURL(`image/${type}`);

      const childCanvas = await generateCanvas(totalPicUri, width * SCALE, height * SCALE, 0, 0, width * SCALE, height * SCALE, left * SCALE, top * SCALE);

      output.push({
        left,
        top,
        width,
        height,
        uri: childCanvas.toDataURL(`image/${type}`)
      });
    }

    return output;

  }

}

/**
 * hide siblings except self
 * @param i index in siblings wanna skip
 * @param siblings 
 */
function hideSiblings(i, siblings) {

  siblings.forEach((sibling, index) => {

    if(index !== i){
      sibling.style.visibility = 'hidden';
      if(sibling.style.position === 'absolute'){
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
function generateSvgDataUri(dom: HTMLElement, width: number, height: number): string {
  dom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  const foreginObject = `<foreignObject x="0" y="0" width="100%" height="100%" style="position: relative;">
  ${new XMLSerializer().serializeToString(dom).replace(/#/g, '%23').replace(/\n/g, '%0A')}
  </foreignObject>`;

  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${foreginObject}</svg>`;
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
async function generateCanvas(url, dwidth, dheight, dx = 0, dy = 0, swidth = dwidth, sheight = dheight, sx = 0, sy = 0): Promise<HTMLCanvasElement> {

  const img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  img.setAttribute('width', dwidth);
  img.setAttribute('height', dheight);

  img.src = url;

  const canvas: HTMLCanvasElement = await new Promise((resolve, reject) => {
    img.onload = () => {

      const canvas = <HTMLCanvasElement>document.createElement('canvas');

      const ctx = canvas.getContext('2d');
      canvas.width = dwidth * SCALE;
      canvas.height = dheight * SCALE;

      ctx.scale(SCALE, SCALE);

      // https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage
      ctx.drawImage(img, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);

      resolve(canvas);
    }

    img.onerror = (err) => {
      reject(err);
    }


  });


  return canvas;

}

/**
 * generate a image from uri
 * @param uri 
 */
async function generateImage(uri, width, height): Promise<HTMLElement> {

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

    image.addEventListener('error', (err) => {
      console.warn(JSON.stringify(err));
      reject(err);
    });

    image.src = uri;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
  });
}

/**
 * shallow clone a dom node, and async await a img/canvas dom loaded
 * @param node 
 */
async function shallowCloneNode(node): Promise<HTMLElement> {
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

        node.addEventListener('error', async (err) => {
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
function copyAttributes(node, clone){
  Array.from(node.attributes).forEach((attribute: any) => {
    if(attribute.name === 'class' || attribute.name === 'id'){
      clone.setAttribute(attribute.nodeName, attribute.nodeValue);
    }
  })
}

/**
 * deep clone node width style
 * @param node 
 */
async function deepCloneNode(node): Promise<HTMLElement> {

  const clone = await shallowCloneNode(node);

  if (clone instanceof HTMLElement) {
    copyAttributes(node, clone);
    copyStyle(node, clone);
  }

  const children = node.childNodes;

  if (children && children.length) {
    for await (const child of children) {
      const clonedChildWithStyle = await deepCloneNode(child);

      if (clonedChildWithStyle) {
        clone.appendChild(clonedChildWithStyle);
      }
    }
  }

  return clone;

}