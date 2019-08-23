import { MetricsQuery } from 's-charted-react';

export interface IstioMetricsOptions extends MetricsQuery {
  direction: Direction;
  filters?: string[];
  requestProtocol?: string;
  reporter: Reporter;
}

export interface InfraMetricsOptions {
  rateInterval?: string;
  rateFunc?: string;
  avg?: boolean;
  byLabels?: string[];
  filters?: string[];
  condition?: string;
  status?: string;
  phase?:	string;
  mode?: string;
  id?: string;
  containerName?: string;
  podName?:	string;
}
export type Reporter = 'source' | 'destination';
export type Direction = 'inbound' | 'outbound';
