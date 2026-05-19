import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5223/api',
});

export const BASE_URL = 'http://localhost:5223';

export default API;