# dom2pic
transfer a html dom to canvas/png/jpeg/svg element/multiple pictures

# usage

```
const Dom2pic = require('dom2pic');

const dom2pic = new Dom2pic({
  root: document.querySelector('.content2screenshot'),
  backgroundColor: '#e2e2e2'
});

dom2pic.toPng()
  .then(base64 => {

    console.log('--- png base64 ---', base64);

  });

dom2pic.toJpeg()
  .then(base64 => {

    console.log('--- jpeg base64 ---', base64);

  });

dom2pic.toSvg().then(svg => {
  document.body.appendChild(svg);
});


dom2pic.toCanvas()
  .then(canvas => {

    console.log('--- canvas ---', canvas);

  });


dom2pic2.toMultiPictures('.item', 'jpeg').then(results => {
  console.log('--- results ---', results);

  results.forEach(obj => {
    const img = document.createElement('img');
    img.src = obj.uri;
    img.style.width = '200px';
    document.body.appendChild(img);
  })
})

```

# API 
* new Dom2pic(config)
  * new a Dom2pic instance
  * options
    * root
      HTMLElement | string; // root html dom to screenshot, cannot be absolute position
    * backgroundColor 
      string; // optional, set root dom backgroundColor
* toCanvas
  * generate a canvas from a dom element
* toPng
  * generate a png base64 string from a dom element
* toJpeg
  * generate a jpeg base64 string from a dom element
* toSvg
  * generate a svg from a dom element
* toMultiPictures
  * generate multiple pictures according to child dom className
  * options
    * childNodeSelector 
      string; generate multiple pictures by childNodeSelector
    * type 
      png | jpeg

# demo && development
```
npm install

npm start
```