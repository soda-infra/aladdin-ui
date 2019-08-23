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
import { InfraMetrics, TimeSeries } from '../../types/Metrics';
import { DashboardPropType } from '../../types/Dashboard';
import { mergeInfraMetricsResponses } from '../Dashboard/DashboardCommon';
import { InfraMetricsOptions } from '../../types/MetricsOptions';
import update from 'react-addons-update';

const cardTitleStyle = style({
  fontSize: '25px',
  fontWeight: 600
});

type NodeInfo = {
  ip: string;
  name: string;
};

type Node = {
  ip: string;
  value: number;
  total: number;
  used: number;
};

type State = {
  loading: boolean
  nodeInfo: NodeInfo[];
  cpu: Node[];
  memory: Node[];
};
/**
 * CardNode: 노드에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - Node CPU: 'node_cpu_seconds_total' (노드의 CPU 사용량을 가져오기 위해 사용한다.)
 * - Node Memory: 'node_memory_MemFree_bytes', 'node_memory_Cached_bytes', 'node_memory_Buffers_bytes', 'node_memory_MemTotal_bytes' (노드의 메모리 사용량을 가져오기 위해 사용한다.)
 * - Node Information: 'kube_node_annotations' (노드의 IP정보, 이름을 가져오기 위해 사용한다.)
 */
class CardNode extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;
  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      loading: false,
      cpu: [],
      memory: [],
      nodeInfo: []
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
    const nodeCPULists: Array<object> = [];
    const optionsNode: InfraMetricsOptions = {
      filters: ['node_cpu_seconds_total'],
      rateFunc: 'irate',
      mode: 'idle',
      avg: true,
      byLabels: ['instance']
    };
    const promiseNodeCPU = API.getInfraMetrics(optionsNode);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNodeCPU]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const nodes = metrics.node_cpu_seconds_total.matrix;

        for (let i = 0; i < nodes.length; i++) {
          if (nodeCPULists.length > 3) {
            break;
          }
          nodeCPULists.push({
            ip: nodes[i].metric.instance.split(':')[0],
            value: 100 - Number(nodes[i].values.slice(-1)[0][1]) * 100
          });
        }
        this.sortMetric(nodeCPULists);

        if (!this.state.loading) {
          this.setState({
            cpu: update(
              this.state.cpu,
              {
                $splice: [[0, 1]],
                $push: nodeCPULists
              }
            )
          });
        } else {
          this.setState({
            cpu: update(
              this.state.cpu,
              {
                $set: nodeCPULists
              }
            )
          });
        }
      });

    const allNodeMemoryLists: Array<object> = [];
    const nodeMemoryLists: Array<object> = [];
    const optionsNodeMemory: InfraMetricsOptions = {
      filters: ['node_memory_MemFree_bytes', 'node_memory_Cached_bytes', 'node_memory_Buffers_bytes', 'node_memory_MemTotal_bytes'],
    };
    const promiseNodeMemory = API.getInfraMetrics(optionsNodeMemory);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNodeMemory]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const querys: Array<TimeSeries[]> = [
          metrics.node_memory_MemFree_bytes.matrix,
          metrics.node_memory_Cached_bytes.matrix,
          metrics.node_memory_Buffers_bytes.matrix,
          metrics.node_memory_MemTotal_bytes.matrix,
        ];
        const array: Array<object> = [];

        for (let i = 0; i < querys.length; ++i) {
          const tmpArray: Array<object> = [];
          querys[i].map((node) => {
            tmpArray.push({
              ip: node.metric.instance,
              value: Number(node.values.slice(-1)[0][1])
            });
          });
          array.push(tmpArray);
        }

        for (let i = 0; i < querys[0].length; i++) {
          const value = 100 - (Number(array[0][i].value) + Number(array[1][i].value) + Number(array[2][i].value)) / array[3][i].value * 100;
          allNodeMemoryLists.push({
            ip: array[0][i].ip,
            value: value
          });
        }

        this.sortMetric(allNodeMemoryLists);
        for (let i = 0; i < querys[0].length; ++i) {
          const ip = 'ip';
          const value = 'value';
          if (nodeMemoryLists.length > 3) {
            break;
          }
          nodeMemoryLists.push({
            ip: allNodeMemoryLists[i][ip].split(':')[0],
            value: allNodeMemoryLists[i][value]
          });
        }

        if (!this.state.loading) {
          this.setState({
            memory: update(
              this.state.memory,
              {
                $splice: [[0, 1]],
                $push: nodeMemoryLists
              }
            )
          });
        } else {
          this.setState({
            memory: update(
              this.state.memory,
              {
                $set: nodeMemoryLists
              }
            )
          });
        }
      });

    const nodeNameLists: Array<object> = [];
    const optionsNodeName: InfraMetricsOptions = {
      filters: ['node_annotations']
    };
    const promiseNodeName = API.getInfraMetrics(optionsNodeName);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNodeName]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const nodes = metrics.node_annotations.matrix;
        for (let i = 0; i < nodes.length; i++) {
          nodeNameLists.push({
            ip: nodes[i].metric.annotation_flannel_alpha_coreos_com_public_ip,
            name: nodes[i].metric.node
          });
        }

        if (!this.state.loading) {
          this.setState({
            nodeInfo: update(
              this.state.nodeInfo,
              {
                $splice: [[0, 1]],
                $push: nodeNameLists
              }
            )
          });
        } else {
          this.setState({
            nodeInfo: update(
              this.state.nodeInfo,
              {
                $set: nodeNameLists
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
    const nodeObject = {};
    this.state.nodeInfo.map(node => {
      nodeObject[node.ip] = node.name;
    });

    if (name === 'Node Top CPU') {
      return (
        this.state.cpu.map(element => {
          return (
            <UtilizationBar
              min={0}
              max={100}
              now={element.value.toFixed(2)}
              thresholdWarning={40}
              thresholdError={70}
              descriptionPlacementTop={true}
              description={nodeObject[element.ip]}
              label={element.ip}
              key={name}
            />
          );
        })
      );
    } else if (name === 'Node Top Memory') {
      return (
        this.state.memory.map(element => {
          return (
            <UtilizationBar
              min={0}
              max={100}
              now={element.value.toFixed(2)}
              thresholdWarning={40}
              thresholdError={70}
              descriptionPlacementTop={true}
              description={nodeObject[element.ip]}
              label={element.ip}
              key={name}
            />
          );
        })
      );
    }

    return;
  }

  private sortMetric = (metrics) => {
    metrics.sort((a, b) => {
      return (a.value > b.value) ? -1 : (a.value < b.value) ? 1 : 0;
    });
  }
}
export default CardNode;