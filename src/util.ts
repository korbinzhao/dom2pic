/**
 * wait a time, ms
 * @param time number // ms
 */
export async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, time)
  })
}
