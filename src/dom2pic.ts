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

    // 根节点margin设为0，避免生成图片时包含margin
    clone.style.margin = '0px';

    if (i > -1 && childNodeSelector) {
      const childNodes = clone.querySelectorAll(childNodeSelector);

      hideSiblings(i, childNodes);

      await sleep(200);
    }

    const svgDataUri = generateSvgDataUri(clone, width, height);

    console.log('svgDataUri', svgDataUri)

    const canvas = await generateCanvas(svgDataUri);

    return canvas;
  }

  async toSvg(): Promise<HTMLElement | SVGElement> {
    await this.initOptions();

    const { root, width, height } = this.options;

    const clone = await deepCloneNode(root);

     // 根节点margin设为0，避免生成图片时包含margin
     clone.style.margin = '0px';

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

      const childRectReleative2Parent = getChildRectRelative2Parent(node, root);

      const canvas = await this.toCanvas(i, childNodeSelector);
      const totalPicUri = await canvas.toDataURL(`image/${type}`);

      const childCanvas = await generateCanvas(totalPicUri, childRectReleative2Parent);

      output.push({
        ...childRectReleative2Parent,
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

  console.log('childRect', childRect);
  console.log('parentRect', parentRect);

  return {
    l: (childRect.left - parentRect.left) / parentRect.width,
    t: (childRect.top - parentRect.top) / parentRect.height,
    w: childRect.width / parentRect.width,
    h: childRect.height / parentRect.height,
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
async function generateCanvas(url, childRectReleative2Parent?): Promise<HTMLCanvasElement> {

  const img = new Image();
  img.setAttribute('crossorigin', 'anonymous');

  const canvas: HTMLCanvasElement = await new Promise((resolve, reject) => {
    img.onload = () => {

      const canvas = <HTMLCanvasElement>document.createElement('canvas');

      const ctx = canvas.getContext('2d');

      const width = img.naturalWidth * SCALE;
      const height = img.naturalHeight * SCALE

      canvas.width = width;
      canvas.height = height;

      let sx = 0, sy = 0, swidth = img.naturalWidth, sheight = img.naturalHeight;

      if(childRectReleative2Parent){
        const {l, t, w, h} = childRectReleative2Parent;
        sx = l * img.naturalWidth;
        sy = t * img.naturalHeight;
        swidth = w * img.naturalWidth;
        sheight = h * img.naturalHeight;
      }

      // https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage
      ctx.drawImage(img, sx, sy, swidth, sheight, 0, 0, width, height);

      ctx.scale(SCALE, SCALE);

      resolve(canvas);
    }

    img.onerror = (err) => {
      reject(err);
    }

    img.src = url;

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
        const canvas = await generateCanvas(uri);
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