import * as React from 'react';
import { style } from 'typestyle';
import { InfraMetricsOptions } from '../../types/MetricsOptions';
import * as API from '../../services/Api';
import { CancelablePromise, makeCancelablePromise } from '../../utils/CancelablePromises';
import { Response } from '../../services/Api';
import { InfraMetrics } from '../../types/Metrics';
import { mergeInfraMetricsResponses } from './DashboardCommon';
import { 
  Col,
  CardTitle,
  CardBody,
  UtilizationCard,
  UtilizationCardDetails,
  UtilizationCardDetailsCount,
  UtilizationCardDetailsDesc,
  UtilizationCardDetailsLine1,
  UtilizationCardDetailsLine2,
  DonutChart,
  patternfly
} from 'patternfly-react';
import update from 'react-addons-update';
import { DashboardPropType } from '../../types/Dashboard';

const cardTitleStyle = style({ 
  fontSize: '20px',
  fontWeight: 600
});

type State = {
  cpuTotal: number;
  cpuUsed: number;
  cpuUsage: number;
  memTotal: number;
  memUsed: number;
  memUsage: number;
  podTotal: number;
  podUsed: number;
  podUsage: number;
};
/**
 * CardCluster: 클러스터에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - CPU Total: 'machine_cpu_cores' (전체 클러스터의 CPU의 양을 가져오기 위해 사용한다.)
 * - CPU Used: 'container_cpu_usage_seconds_total' (현재 사용중인 CPU 사용량을 가져오기 위해 사용한다.)
 * - Memory Total: 'machine_memory_bytes' (전체 클러스터의 메모리의 크기를 가져오기 위해 사용한다.)
 * - Memory Used: 'container_memory_usage_bytes' (현재 사용중인 메모리 사용량을 가져오기 위해 사용한다.)
 * - Pods Total: 'kube_node_status_allocatable_pods' (전체 클러스터의 할당가는한 파드를 가져오기 위해 사용한다.)
 * - Pods Used: 'kube_pod_status_phase' (현재 사용중인 파드를 가져오기 위해 사용한다.)
 */
class CardCluster extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      cpuTotal: 0,
      cpuUsed: 0,
      cpuUsage: 0,
      memTotal: 0,
      memUsed: 0,
      memUsage: 0,
      podTotal: 0,
      podUsed: 0,
      podUsage: 0
    };
  }
  componentWillMount() {
    this.load();
  }

  componentDidMount() {
    window.setInterval(this.load, 15000);
  }

  load = () => {
    const optionsCPUTotal: InfraMetricsOptions = {
      filters: ['machine_cpu_cores'],
    };
    const promiseCPUTotal = API.getInfraMetrics(optionsCPUTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseCPUTotal]));
    this.metricsPromise.promise
    .then(response => {
      let sum = 0;
      const metrics = response.data.metrics;
      const cpuMetrics = metrics.machine_cpu_cores.matrix;
      for (let i = 0; i < cpuMetrics.length; i++) {
        sum += Number(cpuMetrics[i].values.slice(-1)[0][1]);
      }
      this.setState({
        cpuTotal: update(
          this.state.cpuTotal,
          {
            $set: sum
          }
        )
      });
    });

    const optionsCPUUsed: InfraMetricsOptions = {
      filters: ['container_cpu_usage_seconds_total'],
      id: '/',
      rateFunc: 'rate'
    };
    const promiseCPUUsed = API.getInfraMetrics(optionsCPUUsed);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseCPUUsed]));
    this.metricsPromise.promise
    .then(response => {
      let sum = 0;
      const metrics = response.data.metrics;
      const cpuMetrics = metrics.container_cpu_usage_seconds_total.matrix;
      for (let i = 0; i < cpuMetrics.length; i++) {
        sum += Number(cpuMetrics[i].values.slice(-1)[0][1]);
      }
      this.setState({
        cpuUsed: update(
          this.state.cpuUsed,
          {
            $set: sum
          }
        )
      });
    });

    const optionsMemTotal: InfraMetricsOptions = {
      filters: ['machine_memory_bytes'],
    };
    const promiseMemTotal = API.getInfraMetrics(optionsMemTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseMemTotal]));
    this.metricsPromise.promise
    .then(response => {
      let sum = 0;
      const metrics = response.data.metrics;
      const memMetrics = metrics.machine_memory_bytes.matrix;
      for (let i = 0; i < memMetrics.length; i++) {
        sum += Number(memMetrics[i].values.slice(-1)[0][1]);
      }
      this.setState({
        memTotal: update(
          this.state.memTotal,
          {
            $set: sum
          }
        )
      });
    });

    const optionsMemUsed: InfraMetricsOptions = {
      filters: ['container_memory_usage_bytes'],
      rateFunc: 'rate'
    };
    const promiseMemUsed = API.getInfraMetrics(optionsMemUsed);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseMemUsed]));
    this.metricsPromise.promise
    .then(response => {
      let sum = 0;
      const metrics = response.data.metrics;
      const memMetrics = metrics.container_memory_usage_bytes.matrix;
      for (let i = 0; i < memMetrics.length; i++) {
        sum += Number(memMetrics[i].values.slice(-1)[0][1]);
      }
      this.setState({
        memUsed: update(
          this.state.memUsed,
          {
            $set: sum
          }
        )
      });
    });

    const optionsPodTotal: InfraMetricsOptions = {
      filters: ['node_status_allocatable_pods'],
    };
    const promisePodTotal = API.getInfraMetrics(optionsPodTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promisePodTotal]));
    this.metricsPromise.promise
    .then(response => {
      let sum = 0;
      const metrics = response.data.metrics;
      const podMetrics = metrics.node_status_allocatable_pods.matrix;
      for (let i = 0; i < podMetrics.length; i++) {
        sum += Number(podMetrics[i].values.slice(-1)[0][1]);
      }
      this.setState({
        podTotal: update(
          this.state.podTotal,
          {
            $set: sum
          }
        )
      });
    });

    const optionsPodUsed: InfraMetricsOptions = {
      filters: ['pod_status_phase'],
      phase: 'Running'
    };
    const promisePodUsed = API.getInfraMetrics(optionsPodUsed);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promisePodUsed]));
    this.metricsPromise.promise
    .then(response => {
      let sum = 0;
      const metrics = response.data.metrics;
      const podMetrics = metrics.pod_status_phase.matrix;
      for (let i = 0; i < podMetrics.length; i++) {
        sum += Number(podMetrics[i].values.slice(-1)[0][1]);
      }
      this.setState({
        podUsed: update(
          this.state.podUsed,
          {
            $set: sum
          }
        )
      });
    });
  }

  render() {
    const [sm, md] = [12, 4];
    let available, total, used;
    return (
      this.props.name.map(name => {
        total = this.renderTotal(name);
        used = this.renderUsed(name);
        available = this.renderAvailable(name);
        return (
          <Col sm={sm} md={md} key={name}>
            <UtilizationCard>
              <CardTitle className={cardTitleStyle}>
                {name}
              </CardTitle>
              <CardBody>
                <UtilizationCardDetails>
                  <UtilizationCardDetailsCount>{available}</UtilizationCardDetailsCount>
                  <UtilizationCardDetailsDesc>
                    <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
                    <UtilizationCardDetailsLine2>of {total}</UtilizationCardDetailsLine2>
                  </UtilizationCardDetailsDesc>
                </UtilizationCardDetails>
                <DonutChart
                  title={{
                    primary: used,
                    secondary: 'Used'
                  }}
                  size={{ height: 150 }}
                  data={{
                    colors: {
                      Used: patternfly.pfPaletteColors.green400,
                      Available: patternfly.pfPaletteColors.black200,
                    },
                    columns: [
                      [
                        'Used',
                        used
                      ],
                      [
                        'Available',
                        available
                      ]
                    ],
                    groups: [
                      ['used', 'available']
                    ],
                    order: null,
                    type: 'donut'
                  }}
                  tooltip={{
                    contents: patternfly.pfDonutTooltipContents,
                    show: true,
                  }}
                />
              </CardBody>
            </UtilizationCard>
          </Col>
        );
      })
    );
  }

  renderTotal(name: String) {
    if ( name === 'Cluster CPU Utilization') {
      return (this.state.cpuTotal).toFixed(0);
    } else if ( name === 'Cluster Memory Utilization') {
      return (this.state.memTotal / Math.pow(10, 9)).toFixed(2);
    } else if (name === 'Cluster Pod Utilization') {
      return (this.state.podTotal).toFixed(0);
    }
    return ;
  }

  renderAvailable(name: String) {
    if ( name === 'Cluster CPU Utilization') {
      return (this.state.cpuTotal - this.state.cpuUsed).toFixed(0);
    } else if ( name === 'Cluster Memory Utilization') {
      return (this.state.memTotal / Math.pow(10, 9) - this.state.memUsed / Math.pow(10, 9)).toFixed(2);
    } else if (name === 'Cluster Pod Utilization') {
      return (this.state.podTotal - this.state.podUsed).toFixed(0);
    }
    return ;
  }

  renderUsed(name: String) {
    if ( name === 'Cluster CPU Utilization') {
      return (this.state.cpuUsed).toFixed(0);
    } else if ( name === 'Cluster Memory Utilization') {
      return (this.state.memUsed / Math.pow(10, 9)).toFixed(2);
    } else if (name === 'Cluster Pod Utilization') {
      return (this.state.podUsed).toFixed(0);
    }
    return ;
  }
}

export default CardCluster;