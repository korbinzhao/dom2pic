import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Html2Img from '../src/index';

// import {Table, Menu} from 'antd';

import './index.less';

const App = () => {

  const [screenshot, setScreenshot] = useState('');
  const [svg, setSvg] = useState(null);

  const doScreenshot = async () => {
    const html2img = new Html2Img({
      root: document.querySelector('.content2screenshot'),
      width: 1000,
      height: 800
    });

    html2img.toPng()
      .then(png => {

        console.log('--- png ---', png);

        setScreenshot(png);

      });

    html2img.toSvg().then(svg => {
      document.body.appendChild(svg);
    });

  }

  useEffect(() => {

    console.log('componentDidMount')

    setTimeout(() => {

      doScreenshot();
      
    }, 1000)

   
  }, []);



  return (
    <div className="container">
      <div className="content2screenshot">

        {/* <Table />

        <Menu /> */}

        <img src="https://img.alicdn.com/tfs/TB1_ThFurj1gK0jSZFOXXc7GpXa-680-453.jpg" alt="" />

        hello world

        <span>123</span>
        <p>234</p>

      </div>

      <h2>--- screenshot ---</h2>

      <img src={screenshot} alt="" />

    </div>
  );
};

// export default App;

ReactDOM.render(<App />, document.getElementById("app"));
