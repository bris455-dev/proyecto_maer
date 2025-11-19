import { useState, useEffect } from 'react';
import * as reportesApi from '../api/reportes.js';

export const useReportes = (filters = {}) => {
  const [reportes, setReportes] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchReportes = async () => {
    setLoading(true);
    const data = await reportesApi.getReportes(filters);
    setReportes(data.report || []);
    setDashboard(data.dashboard || {});
    setLoading(false);
  };

  useEffect(() => { fetchReportes(); }, []);

  return { reportes, dashboard, loading, fetchReportes };
};
