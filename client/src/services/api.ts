import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const getDebates = async () => {
  const response = await api.get('/debates');
  return response.data;
};

export const getDebateById = async (id: string) => {
  const response = await api.get(`/debates/${id}`);
  return response.data;
}; 