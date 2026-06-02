import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ecologymuebles-api-dxd2cdezeyfhasau.canadacentral-01.azurewebsites.net/api',
});

export const BASE_URL = 'https://ecologymuebles-api-dxd2cdezeyfhasau.canadacentral-01.azurewebsites.net';

export default API;