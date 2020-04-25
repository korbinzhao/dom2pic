import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Html2Img from '../src/index';

import { Table, Menu } from 'antd';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';

const { SubMenu } = Menu;

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

  const dataSource = [
    {
      key: '1',
      name: '胡彦斌',
      age: 32,
      address: '西湖区湖底公园1号',
    },
    {
      key: '2',
      name: '胡彦祖',
      age: 42,
      address: '西湖区湖底公园1号',
    },
  ];

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '住址',
      dataIndex: 'address',
      key: 'address',
    },
  ];




  return (
    <div className="container">
      <div className="content2screenshot">

        <Table dataSource={dataSource} columns={columns} />


        hello world

        <p>123</p>
        <span className="text1">234</span>
        <span className="text2">567</span>

        <img src="https://img.alicdn.com/tfs/TB1_ThFurj1gK0jSZFOXXc7GpXa-680-453.jpg" alt="" />


      </div>

      <h2>--- screenshot ---</h2>

      <img src={screenshot} alt="" />

      <h2>--- svg ---</h2>

    </div>
    
  );
};

// export default App;

ReactDOM.render(<App />, document.getElementById("app"));
