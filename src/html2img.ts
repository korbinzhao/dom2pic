interface Options {
  root: HTMLElement;
}

export default class Html2Img {

  constructor(options) {
    this.init(options);
  }

  init(options) {
    const { root } = options;
    const container = typeof root === 'string' ? document.querySelector(root) : root;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const cloneDom = container.cloneNode(true);
    cloneDom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

    const foreginObject = `<foreignObject x="0" y="0" width="100%" height="100%">
      ${new XMLSerializer().serializeToString(cloneDom).replace(/#/g, '%23').replace(/\n/g, '%0A')}
      </foreignObject>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${foreginObject}</svg>`;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');

      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUri = canvas.toDataURL('image/png');

      console.log(dataUri);

    }

    img.onerror = (err) => {
      console.error(err);
    }

    img.src = `data:image/svg+xml;charset=utf-8,${svg}`;

    document.body.appendChild(img);


  }

}

