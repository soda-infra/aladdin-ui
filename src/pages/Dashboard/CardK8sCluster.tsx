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
  Card,
  CardTitle,
  CardBody
} from 'patternfly-react';
import update from 'react-addons-update';
import { DashboardPropType } from '../../types/Dashboard';
import { Link } from 'react-router-dom';

const cardTitleStyle = style({ 
  fontSize: '25px',
  fontWeight: 1000
});

const cardBodyStyle = style({
  fontSize: '35px',
  fontWeight: 'bold'
});

type State = {
  node: string[];
  nodeTotal: number;
  nodeReady: number;
  namespaceTotal: number;
  namespaceActive: number;
};
/**
 * CardK8sCluster: 클러스터에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - Node Total: 'kube_node_labels' (클러스터의 전체 노드의 수를 가져오기 위해 사용한다.)
 * - Node Ready: 'kube_node_status_condition' (준비된 상태의 노드의 수를 가져오기 위해 사용한다.)
 * - Namespace Total: 'kube_namespace_labels' (클러스터의 전체 네임스페이스의 수를 가져오기 위해 사용한다.)
 * - Namespace Active: 'kube_namespace_status_phase' (사용중인 네임스페이스의 수를 가져오기 위해 사용한다.)
 */
class CardK8sCluster extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      node: [],
      nodeTotal: 0,
      nodeReady: 0,
      namespaceTotal: 0,
      namespaceActive: 0,
    };
  }
  componentWillMount() {
    this.load();
  }
  
  componentDidMount() {
    window.setInterval(this.load, 15000);
  }

  load = () => {
    const optionsNodeTotal: InfraMetricsOptions = {
      filters: ['node_labels'],
    };
    const promiseNodeTotal = API.getInfraMetrics(optionsNodeTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNodeTotal]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      for (let j = 0; j < metrics.node_labels.matrix.length; j++) {
        this.state.node.push(metrics.node_labels.matrix[j].metric.node);
      }
      this.setState({
        nodeTotal: update(
          this.state.nodeTotal,
          {
            $set: metrics.node_labels.matrix.length
          }
        )
      });
    });

    const optionsNode: InfraMetricsOptions = {
      filters: ['node_status_condition'],
      condition: 'Ready',
      status: 'true',
    };

    const promiseNode = API.getInfraMetrics(optionsNode);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNode]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let currentNode = 0;
      for (let j = 0; j < metrics.node_status_condition.matrix.length; j++) {
        if (metrics.node_status_condition.matrix[j].values.slice(-1)[0][1] * 1 === 1) {
          currentNode = currentNode + 1;
        }
      }
      this.setState({
        nodeReady: update(
          this.state.nodeReady,
          {
            $set: currentNode
          }
        )
      });
    });

    const optionsNamespace: InfraMetricsOptions = {
      filters: ['namespace_labels'],
    };
    const promiseNamespace = API.getInfraMetrics(optionsNamespace);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNamespace]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        namespaceTotal: update(
          this.state.namespaceTotal,
          {
            $set: metrics.namespace_labels.matrix.length
          }
        )
      });
    });

    const optionsNamespaceStatus: InfraMetricsOptions = {
      filters: ['namespace_status_phase'],
      phase: 'Active'
    };
    const promiseNamespaceStatus = API.getInfraMetrics(optionsNamespaceStatus);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNamespaceStatus]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let currentNamespace = 0;
      for (let j = 0; j < metrics.namespace_status_phase.matrix.length; j++) {
        if (metrics.namespace_status_phase.matrix[j].values.slice(-1)[0][1] * 1 === 1) {
          currentNamespace = currentNamespace + 1;
        }
      }
      this.setState({
        namespaceActive: update(
          this.state.namespaceActive,
          {
            $set: currentNamespace
          }
        )
      });
    });
  }
  
  render() {
    const [sm, md] = [12, 6];
    return (
      this.props.name.map(name => {
        return (
          <Col sm={sm} md={md} key={name}>
            <Card matchHeight={true} accented={true} aggregated={true}>
              <CardTitle className={cardTitleStyle}>
                <Link to={`/kubernetes/${encodeURIComponent(name.replace(/ +/g, '').toLowerCase())}`}>
                  {name}
                </Link>
              </CardTitle>
              <CardBody className={cardBodyStyle}>
                <Link to={`/kubernetes/${encodeURIComponent(name.replace(/ +/g, '').toLowerCase())}`}>
                  {this.renderStatuse(name)}
                </Link>
              </CardBody>
            </Card>
          </Col>
        );
      })
    );
  }

  renderStatuse(name: String) {
    if ( name === 'Nodes') {
      return this.state.nodeReady + '/' + this.state.nodeTotal;
    } 
    if ( name === 'Namespaces') {
       return this.state.namespaceActive + '/' + this.state.namespaceTotal;
    }
    return ;
  }
}

export default CardK8sCluster;