import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Dom2pic from '../src/index';

import { Table } from 'antd';

import './index.less';

const App = () => {

  const doScreenshot = () => {
    const dom2pic = new Dom2pic({
      root: document.querySelector('.content2screenshot') as HTMLElement,
    });

    dom2pic.toPng()
      .then(png => {

        console.log('--- png ---', png);

        // const img = document.createElement('img');
        // img.src = png;
        // img.style.width = '100%';
        // document.body.appendChild(img);

      });

    dom2pic.toJpeg().then(jpeg => {

      console.log('--- jpeg ---', jpeg);

      // const img = document.createElement('img');
      // img.src = jpeg;
      // img.style.width = '100%';
      // document.body.appendChild(img);

    })

    dom2pic.toSvg().then(svg => {

      console.log('--- svg ---', svg);

      // document.body.appendChild(svg);
    });


    const dom2pic2 = new Dom2pic({root: document.querySelector('.content2screenshot') as HTMLElement});

    dom2pic2.toMultiPictures('.item').then(results => {
      console.log('--- results ---', results);

      results.forEach(obj => {
        const img = document.createElement('img');
        img.src = obj.uri;
        img.style.width = '200px';
        document.body.appendChild(img);
      })
    })

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

        <svg className="item" width="100px" height="100px">
          <rect x="50" y="20" width="150" height="150" style={{ fill: 'blue', stroke: 'pink', strokeWidth: 5, opacity: 0.5 }} />
        </svg>

        <Table className="item" dataSource={dataSource} columns={columns} pagination={false} />


        hello world

        <p  className="item">123</p>
        <span className="text1 item">234</span>
        <span className="text2 item">567</span>

        {/* <img className="demo-img item" src="https://img.alicdn.com/tfs/TB1_ThFurj1gK0jSZFOXXc7GpXa-680-453.jpg" alt="" /> */}

        <svg className="item" width="500px" height="500px">
          <foreignObject x="0" y="0" width="100%" height="100%">
            <img className="demo-img" src="https://img.alicdn.com/tfs/TB1_ThFurj1gK0jSZFOXXc7GpXa-680-453.jpg" alt="" />
          </foreignObject>
        </svg>

      </div>

      <span className="divider">--------------- output ---------------</span>

    </div>

  );
};

// export default App;

ReactDOM.render(<App />, document.getElementById("app"));
