import Axios from 'axios';
import urls from './urls';

export default async () => {
  try {
    const { data } = await Axios.get(`${urls.bcUrls}/orders/get-all-orders`);
    return data;
  } catch (error) {
    console.error(error);
    // handle error
  }
};

