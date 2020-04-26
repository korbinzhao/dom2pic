# dom2pic
transfer a html dom to canvas/png/jpeg

# usage

```
const dom2pic = new Dom2pic({
  root: document.querySelector('.content2screenshot'),
  width: 1000,
  height: 800
});

dom2pic.toPng()
  .then(png => {

    console.log('--- png ---', png);

    setScreenshot(png);

  });

dom2pic.toSvg().then(svg => {
  document.body.appendChild(svg);
});
```

# demo && development
```
npm install

npm start
```