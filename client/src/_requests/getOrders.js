import Axios from 'axios';
import urls from './urls';

export default () => {
  new Promise(async (resolve, reject) => {
    try {
      const { data } = await Axios.get(`${urls.bcUrls}/get-all-orders`);
      resolve(data);
    } catch (err) {
      console.error(err);
      reject(err);
      // error hanlder
    }
  });
};
