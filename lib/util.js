"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sleep = sleep;

/**
 * wait a time, ms
 * @param time number // ms
 */
async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}