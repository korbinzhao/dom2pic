/**
 * transfer html dom to Canvas/PNG/JPEG 
 * 
 */

interface Options {
  root: HTMLElement; // html dom
  width?: number;
  height?: number;
}

export default class Html2Img {
  constructor(options: Options) {
    this.options = options;
  }

  options: Options;

  init(options) {
    let { root, width, height } = options;
    root = typeof root === 'string' ? document.querySelector(root) : root;

    width = width || root.offsetWidth;
    height = height || root.offsetHeight;
  }

  toCanvas(): Promise<HTMLCanvasElement> {
    const { root, width, height } = this.options;

    return cloneNodeWithStyle(root)
      .then(cloneDom => {

        const svgDataUri = generateSvgDataUri(cloneDom, width, height);

        return generateCanvas(svgDataUri, width, height);

      });
  }

  toPng(): Promise<string> {
    return this.toCanvas().then((canvas) => {
      return canvas.toDataURL('image/png');
    })
  }

  toJpeg(): Promise<string> {
    return this.toCanvas().then((canvas) => {
      return canvas.toDataURL('image/jpeg');
    })
  }

}

/**
 * 生成 inline SVG 内联 SVG (data:image/svg+xml 格式的 svg 图片)字符串
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
 * 将图片加入canvas，并输出canvas
 * @param url 
 * @param width 
 * @param height 
 */
function generateCanvas(url, width, height): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossorigin', 'anonymous');

    img.onload = () => {

      const canvas = document.createElement('canvas');

      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);


      resolve(canvas);
    }

    img.onerror = (err) => {
      reject(err);
    }

    img.src = url;

  });

}

/**
 * 根据传入 uri 生成Image对象
 * @param uri 
 */
function makeImage(uri) {
  return new Promise(function (resolve, reject) {
    var image = new Image();
    image.onload = function () {
      resolve(image);
    };
    image.onerror = reject;
    image.src = uri;
  });
}

/**
 * 深复制节点及节点上的样式
 * @param node 
 */
async function cloneNodeWithStyle(node) {

  const clone = node instanceof HTMLCanvasElement ? await makeImage(node.toDataURL()) : node.cloneNode(false);

  const children = node.childNodes;

  for await (const child of children) {
    await cloneNodeWithStyle(child).then((clonedChildWithStyle) => {
      clone.appendChild(clonedChildWithStyle);
    });
  }

  function copyStyle(node, clone) {
    const style = window.getComputedStyle(node);

    if (style.cssText) {
      clone.style.cssText = style.cssText;
    }

    return clone;

  }

  if (node instanceof HTMLElement) {

    if (node.tagName === 'IMG') {

      await new Promise((resolve, reject) => {
        node.onload = () => {

          generateCanvas(
            node.getAttribute('src'),
            node.offsetWidth,
            node.offsetHeight
          ).then(canvas => {
            return canvas.toDataURL();
          }).then((uri) => {
            clone.setAttribute('src', uri);
            copyStyle(node, clone);

            resolve(uri);

          });

        }

        node.onerror = () => {
          reject(clone);
        }
      });

    } else {
      copyStyle(node, clone);
    }

  }

  return clone;

}