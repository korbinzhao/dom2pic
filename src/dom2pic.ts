/**
 * transfer html dom to Canvas/PNG/JPEG 
 * 
 */

interface Options {
  root: HTMLElement; // html dom
  width?: number;
  height?: number;
}

const SCALE = 2; // canvas context scale

export default class Html2Img {
  constructor(options: Options) {
    this.options = options;
    this.initOptions(options);
  }

  options: Options;

  private initOptions(options) {
    const { root, width, height } = options;

    this.options = {
      root: typeof root === 'string' ? document.querySelector(root) : root,
      width: width || root.offsetWidth,
      height: height || root.offsetHeight
    };

  }

  async toCanvas(): Promise<HTMLCanvasElement> {
    const { root, width, height } = this.options;

    const clone = await cloneNodeWithStyle(root);

    const svgDataUri = generateSvgDataUri(clone, width, height);

    const canvas = await generateCanvas(svgDataUri, width, height);

    return canvas;
  }

  async toSvg(): Promise<HTMLElement | SVGElement> {
    const { root, width, height } = this.options;
    const clone = await cloneNodeWithStyle(root)

    const foreginObject = document.createElement('foreginObject');
    foreginObject.setAttribute('x', '0');
    foreginObject.setAttribute('y', '0');
    foreginObject.setAttribute('width', '100%')
    foreginObject.setAttribute('height', '100%');

    const svg = document.createElement('svg');

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '' + width);
    svg.setAttribute('height', '' + height);

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

}

/**
 * generate inline SVG (data:image/svg+xml formate image)
 * @param dom 
 * @param width 
 * @param height 
 */
function generateSvgDataUri(dom: HTMLElement, width: number, height: number): string {
  dom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  const foreginObject = `<foreignObject x="0" y="0" width="100%" height="100%">
  ${new XMLSerializer().serializeToString(dom).replace(/#/g, '%23').replace(/\n/g, '%0A')}
  </foreignObject>`;

  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${foreginObject}</svg>`;
}

/**
 * output a canvas with image
 * @param url 
 * @param width 
 * @param height 
 */
async function generateCanvas(url, width, height): Promise<HTMLCanvasElement> {

  let isSvg = false; // url is svg uri format, such as 'data:image/svg+xml;charset=utf-8,<svg ...'
  if(url.indexOf(',<svg ') !== -1){ 
    isSvg = true;
  }

  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossorigin', 'anonymous');
    img.setAttribute('width', width);
    img.setAttribute('height', height);

    img.onload = () => {

      const canvas = <HTMLCanvasElement>document.createElement('canvas');

      const ctx = canvas.getContext('2d');
      canvas.width = width * SCALE;
      canvas.height = height * SCALE;

      if(isSvg){
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      ctx.drawImage(img, 0, 0, width * SCALE, height * SCALE);

      resolve(canvas);
    }

    img.onerror = (err) => {
      reject(err);
    }

    img.src = url;

  });

}

/**
 * generate a image from uri
 * @param uri 
 */
async function generateImage(uri): Promise<HTMLElement> {
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
async function cloneNodeWithStyle(node): Promise<HTMLElement> {

  const clone = node instanceof HTMLCanvasElement ? await generateImage(node.toDataURL()) : node.cloneNode(false);

  const children = node.childNodes;

  if (children && children.length) {
    for await (const child of children) {
      const clonedChildWithStyle = await cloneNodeWithStyle(child);
      if (clonedChildWithStyle) {
        clone.appendChild(clonedChildWithStyle);
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

          // forbidden drop-dead halt cloned img onload
          if(clone.getAttribute('data-is-loaded')){
            return false;
          }
          clone.setAttribute('data-is-loaded', 'true');

          copyStyle(node, clone);

          const canvas = await generateCanvas(
            node.getAttribute('src'),
            node.offsetWidth,
            node.offsetHeight
          );

          const uri = canvas.toDataURL();

          clone.setAttribute('src', uri);

          resolve(uri);

        }

        clone.onerror = () => {
          reject(clone);
        }
      });

    } else {
      copyStyle(node, clone);
    }

  }

  return clone;

}