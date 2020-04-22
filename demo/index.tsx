import React, { Component, useEffect } from "react";
import ReactDOM from "react-dom";
import Html2Img from '../src/index';

import './index.less';

const App = () => {

  useEffect(() => {
    const html2Img = new Html2Img({
      root: document.querySelector('.container')
    });
  }, []);

  return (
    <div className="container">
      hello world
    </div>
  );
};

// export default App;

ReactDOM.render(<App />, document.getElementById("app"));
