"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./my-component.less");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MyComponent = () => {
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "container"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "content"
  }, /*#__PURE__*/_react.default.createElement("p", null, "React here!!!")));
};

var _default = MyComponent;
exports.default = _default;