import * as M from '../../types/Metrics';
import { Response } from '../../services/Api';
import { DashboardPropType } from '../../types/Dashboard';

// jungeun
export const mergeInfraMetricsResponses = (promises: Promise<Response<M.InfraMetrics>>[]): Promise<Response<M.InfraMetrics>> => {
  return Promise.all(promises).then(responses => {
    const metrics: M.InfraMetrics = {
      metrics: {}
    };
    responses.forEach(r => {
      Object.keys(r.data.metrics).forEach(k => {
        metrics.metrics[k] = r.data.metrics[k];
      });
    });
    return {
      data: metrics
    };
  });
};

export const shouldRefreshData = (prevProps: DashboardPropType, nextProps: DashboardPropType) => {
  return (
    // Verify the time of the last request
    prevProps.graphTimestamp !== nextProps.graphTimestamp
  );
};