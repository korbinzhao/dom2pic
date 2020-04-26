import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Html2Img from '../src/index';

import { Table } from 'antd';

import './index.less';

const App = () => {

  const [screenshot, setScreenshot] = useState('');
  const [svg, setSvg] = useState(null);

  const doScreenshot = async () => {
    const html2img = new Html2Img({
      root: document.querySelector('.content2screenshot'),
      width: 3000,
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

    doScreenshot();

  }, []);

  const dataSource = [
    {
      key: '1',
      name: 'JACK',
      age: 32,
      address: 'street 1',
    },
    {
      key: '2',
      name: 'TOM',
      age: 42,
      address: 'street 2',
    },
  ];

  const columns = [
    {
      title: 'name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'address',
      dataIndex: 'address',
      key: 'address',
    },
  ];

  return (
    <div className="container">

      <h1 className="divider">ORIGIN</h1>

      <div className="content2screenshot">

        <Table dataSource={dataSource} columns={columns} pagination={false} />


        hello world

        <p>123</p>
        <span className="text1">234</span>
        <span className="text2">567</span>

        <img src="https://img.alicdn.com/tfs/TB1_ThFurj1gK0jSZFOXXc7GpXa-680-453.jpg" alt="" />


      </div>

      <h1 className="divider">SCREENSHOT</h1>

      <img src={screenshot} alt="" />

      <h1 className="divider">SVG</h1>

    </div>

  );
};

// export default App;

ReactDOM.render(<App />, document.getElementById("app"));
