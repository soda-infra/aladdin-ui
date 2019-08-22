import * as React from 'react';
import { style } from 'typestyle';
import { CancelablePromise, makeCancelablePromise } from '../../utils/CancelablePromises';
import { Response } from '../../services/Api';
import * as API from '../../services/Api';
import {
  Card,
  CardBody,
  CardHeading,
  CardTitle,
  Col,
  UtilizationBar
} from 'patternfly-react';
import { Tooltip } from '@patternfly/react-core';
import { InfraMetrics } from '../../types/Metrics';
import { DashboardPropType } from '../../types/Dashboard';
import { mergeInfraMetricsResponses } from './DashboardCommon';
import { InfraMetricsOptions } from '../../types/MetricsOptions';
import update from 'react-addons-update';

const cardTitleStyle = style({
  fontSize: '25px',
  fontWeight: 600
});

type PodInfo = {
  pod: string;
  namespace: string;
  node: string;
  podIp: string;
};

type Pod = {
  name: string;
  value: number;
  total: number;
  used: number;
};

type State = {
  loading: boolean;
  podInfo: PodInfo[];
  cpu: Pod[];
  memory: Pod[];
};
/**
 * CardPod: 파드에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - Pod CPU: 'container_cpu_usage_seconds_total' (파드의 CPU 사용량을 가져오기 위해 사용한다.)
 * - Pod Memory Total: 'container_memory_usage_bytes' (현재 사용중인 파드의 메모리 사용량을 가져오기 위해 사용한다.)
 * - Pod Memory Used: 'machine_memory_bytes' (전체 클러스터의 메모리 크기를 가져오기 위해 사용한다.)
 * - Pod Information: 'kube_pod_info' (파드의 IP주소, 이름, 네임스페이스를 가져오기 위해 사용한다.)
 */
class CardPod extends React.Component<DashboardPropType, State> {

  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;
  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      loading: false,
      podInfo: [],
      cpu: [],
      memory: []
    };
  }

  componentWillMount() {
    this.load();
  }

  componentDidMount() {
    this.setState({
      loading: true,
    });
    window.setInterval(this.load, 15000);
  }

  load = () => {
    const allPodCPULists: Array<Array<any>> = [];
    const podCPULists: Array<object> = [];
    const optionsPodCPU: InfraMetricsOptions = {
      filters: ['container_cpu_usage_seconds_total'],
      rateFunc: 'rate',
      avg: true,
      byLabels: ['pod_name']
    };
    const promisePodCpu = API.getInfraMetrics(optionsPodCPU);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promisePodCpu]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const pods = metrics.container_cpu_usage_seconds_total.matrix;
        for (let i = 0; i < pods.length; i++) {
          if (pods[i].metric.pod_name && pods[i].metric.pod_name !== 'POD') {
            allPodCPULists.push([pods[i].metric.pod_name, Number(pods[i].values.slice(-1)[0][1]) * 100]);
          }
        }

        allPodCPULists.sort((a, b) => b[1] - a[1]);
        for (let i = 0; i < 5; ++i) {
          if (podCPULists.length > 2) {
            break;
          }
          podCPULists.push({
            name: allPodCPULists[i][0],
            value: allPodCPULists[i][1]
          });
        }

        if (!this.state.loading) {
          this.setState({
            cpu: update(
              this.state.cpu,
              {
                $splice: [[0, 1]],
                $push: podCPULists
              }
            )
          });
        } else {
          this.setState({
            cpu: update(
              this.state.cpu,
              {
                $set: podCPULists
              }
            )
          });
        }
      });

    const allPodMemLists: Array<Array<any>> = [];
    const podMemLists: Array<object> = [];

    const optionsMachineMemory: InfraMetricsOptions = {
      filters: ['machine_memory_bytes']
    };

    let clusterTotalMemory = 0;
    const promiseMachineMemUsage = API.getInfraMetrics(optionsMachineMemory);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseMachineMemUsage]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const pods = metrics.machine_memory_bytes.matrix;
        for (let i = 0; i < pods.length; i++) {
          clusterTotalMemory += Number(pods[i].values.slice(-1)[0][1]);
        }
      });

    const optionsContainerMemory: InfraMetricsOptions = {
      filters: ['container_memory_usage_bytes'],
      avg: true,
      byLabels: ['pod_name']
    };

    const PromiseContainerMemUsage = API.getInfraMetrics(optionsContainerMemory);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([PromiseContainerMemUsage]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const pods = metrics.container_memory_usage_bytes.matrix;
        for (let i = 0; i < pods.length; i++) {
          if (pods[i].metric.pod_name) {
            allPodMemLists.push([pods[i].metric.pod_name, Number(pods[i].values.slice(-1)[0][1]) * 100]);
          }
        }
        allPodMemLists.sort((a, b) => b[1] - a[1]);
        for (let i = 0; i < 5; ++i) {
          if (podMemLists.length > 2) {
            break;
          }
          if (clusterTotalMemory !== 0) {
            podMemLists.push({
              name: allPodMemLists[i][0],
              value: allPodMemLists[i][1] / clusterTotalMemory
            });
          } else {
            podMemLists.push({
              name: allPodMemLists[i][0],
              value: 0
            });
          }
        }

        if (!this.state.loading) {
          this.setState({
            memory: update(
              this.state.memory,
              {
                $splice: [[0, 1]],
                $push: podMemLists
              }
            )
          });
        } else {
          this.setState({
            memory: update(
              this.state.memory,
              {
                $set: podMemLists
              }
            )
          });
        }
      });

    const podNamespaceLists: Array<object> = [];
    const optionsPodNamesace: InfraMetricsOptions = {
      filters: ['pod_info']
    };
    const promisePodNamespace = API.getInfraMetrics(optionsPodNamesace);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promisePodNamespace]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const pods = metrics.pod_info.matrix;

        for (let i = 0; i < pods.length; i++) {
          podNamespaceLists.push({
            pod: pods[i].metric.pod,
            namespace: pods[i].metric.namespace,
            node: pods[i].metric.node,
            podIp: pods[i].metric.pod_ip
          });
        }

        if (!this.state.loading) {
          this.setState({
            podInfo: update(
              this.state.podInfo,
              {
                $splice: [[0, 1]],
                $push: podNamespaceLists
              }
            )
          });
        } else {
          this.setState({
            podInfo: update(
              this.state.podInfo,
              {
                $set: podNamespaceLists
              }
            )
          });
        }
      });
  }

  render() {
    return (
      this.props.name.map(name => {
        return (
          <Col sm={12} md={6} key={name}>
            <Card>
              <CardHeading>
                <CardTitle className={cardTitleStyle}>
                  {name}
                </CardTitle>
              </CardHeading>
              <CardBody>
                {this.renderStatuse(name)}
              </CardBody>
            </Card>
          </Col>
        );
      })
    );
  }

  renderStatuse(name: String) {
    const namespaceObject = {};
    const nodeObject = {};
    const ipObject = {};
    this.state.podInfo.map(pod => {
      namespaceObject[pod.pod] = pod.namespace;
      nodeObject[pod.pod] = pod.node;
      ipObject[pod.pod] = pod.podIp;
    });

    if (name === 'Pod Top CPU') {
      return (
        this.state.cpu.map(element => {
          return (
            <Tooltip
              key={element.name}
              position="bottom"
              entryDelay={10}
              exitDelay={10}
              content={
                <div>
                  Pod on {nodeObject[element.name]}<br />
                  Pod IP: {ipObject[element.name]}<br />
                  Pod Namespace: {namespaceObject[element.name]}<br />
                </div>
              }
            >
              <UtilizationBar
                min={0}
                max={100}
                now={element.value.toFixed(2)}
                thresholdWarning={40}
                thresholdError={70}
                descriptionPlacementTop={true}
                description={namespaceObject[element.name]}
                label={element.name}
                key={name}
              />
            </Tooltip>
          );
        })
      );
    } else if (name === 'Pod Top Memory') {
      return (
        this.state.memory.map(element => {
          return (
            <Tooltip
              key={element.name}
              position="bottom"
              entryDelay={10}
              exitDelay={10}
              content={
                <div>
                  Pod on {nodeObject[element.name]}<br />
                  Pod IP: {ipObject[element.name]}<br />
                  Pod Namespace: {namespaceObject[element.name]}<br />
                </div>
              }
            >
              <UtilizationBar
                min={0}
                max={100}
                now={element.value.toFixed(2)}
                thresholdWarning={40}
                thresholdError={70}
                descriptionPlacementTop={true}
                description={namespaceObject[element.name]}
                label={element.name}
                key={name}
              />
            </Tooltip>
          );
        })
      );
    }

    return;
  }
}

export default CardPod;