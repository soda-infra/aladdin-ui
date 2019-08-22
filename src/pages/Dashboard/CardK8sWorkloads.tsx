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
  fontWeight: 600
});

const cardBodyStyle = style({
  fontSize: '35px',
  fontWeight: 'bold'
});

type State = {
  node: string[];
  daemonSetTotal: number;
  daemonSetReady: number;
  deploymentTotal: number;
  deploymentReady: number; 
  replicaSetTotal: number;
  replicaSetReady: number;
  podTotal: number;
  podReady: number;
};
/**
 * CardK8sWorkloads: 워크로드에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - Daemon Set Total: 'kube_daemonset_labels' (전체 데몬 셋을 가져오기 위해 사용한다.)
 * - Daemon Set Ready: 'kube_daemonset_labels', 'kube_deployment_status_replicas', 'kube_deployment_status_replicas_available' (현재 사용중인 데몬 셋을 가져오기 위해 사용한다.)
 * - Deployment Total: 'kube_deployment_labels' (전체 디플로이먼트를 가져오기 위해 사용한다.)
 * - Deployment Ready: 'kube_deployment_labels', 'kube_deployment_status_replicas', 'kube_deployment_status_replicas_available' (현재 사용중인 디플로이먼트를 가져오기 위해 사용한다.)
 * - Replica Set Total: 'kube_replicaset_labels' (전체 레플리카 셋을 가져오기 위해 사용한다.)
 * - Replica Set Ready: 'kube_replicaset_labels', 'kube_replicaset_status_replicas', 'kube_deployment_status_replicas_available' (현재 사용중인 레플리카 셋을 가져오기 위해 사용한다.)
 */
class CardK8sWorkloads extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      node: [],
      daemonSetTotal: 0,
      daemonSetReady: 0,
      deploymentTotal: 0,
      deploymentReady: 0,
      replicaSetTotal: 0,
      replicaSetReady: 0,
      podTotal: 0,
      podReady: 0
    };
  }
  componentWillMount() {
    this.load();
  }

  load = () => {
    const optionsDaemonSetTotal: InfraMetricsOptions = {
      filters: ['daemonset_labels'],
    };
    const promiseDaemonSetTotal = API.getInfraMetrics(optionsDaemonSetTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseDaemonSetTotal]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        daemonSetTotal: update(
          this.state.daemonSetTotal,
          {
            $set: metrics.daemonset_labels.matrix.length
          }
        )
      });
    });

    const optionsDaemonSetReady: InfraMetricsOptions = {
      filters: ['daemonset_unavailable']
    };
    const promiseDaemonSetReady = API.getInfraMetrics(optionsDaemonSetReady);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseDaemonSetReady]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let currentDaemonSet = 0;
      for (let j = 0; j < metrics.daemonset_unavailable.matrix.length; j++) {
        if (metrics.daemonset_unavailable.matrix[j].values.slice(-1)[0][1] * 1 === 0) {
          currentDaemonSet = currentDaemonSet + 1;
        }
      }
      this.setState({
        daemonSetReady: update(
          this.state.daemonSetReady,
          {
            $set: currentDaemonSet
          }
        )
      });
    });

    const optionsDeploymentTotal: InfraMetricsOptions = {
      filters: ['deployment_labels'],
    };
    const promiseDeploymentTotal = API.getInfraMetrics(optionsDeploymentTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseDeploymentTotal]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        deploymentTotal: update(
          this.state.deploymentTotal,
          {
            $set: metrics.deployment_labels.matrix.length
          }
        )
      });
    });

    const optionsDeploymentReady: InfraMetricsOptions = {
      filters: ['deployment_labels', 'deployment_status_replicas', 'deployment_status_replicas_available']
    };
    const promiseDeploymentReady = API.getInfraMetrics(optionsDeploymentReady);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseDeploymentReady]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let currentDeployment = 0;
      
      for (let j = 0; j < metrics.deployment_labels.matrix.length; j++) {
        if (metrics.deployment_status_replicas.matrix[j].values.slice(-1)[0][1]
        === metrics.deployment_status_replicas_available.matrix[j].values.slice(-1)[0][1]) {
          currentDeployment = currentDeployment + 1;
        }
      }
      this.setState({
        deploymentReady: update(
          this.state.deploymentReady,
          {
            $set: currentDeployment
          }
        )
      });
    });

    const optionsReplicaSetTotal: InfraMetricsOptions = {
      filters: ['replicaset_labels'],
    };
    const promiseReplicaSetTotal = API.getInfraMetrics(optionsReplicaSetTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseReplicaSetTotal]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        replicaSetTotal: update(
          this.state.replicaSetTotal,
          {
            $set: metrics.replicaset_labels.matrix.length
          }
        )
      });
    });

    const optionsReplicaSetReady: InfraMetricsOptions = {
      filters: ['replicaset_labels', 'replicaset_status_replicas', 'deployment_status_replicas_available'],
    };
    const promiseReplicaSetReady = API.getInfraMetrics(optionsReplicaSetReady);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseReplicaSetReady]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let currentReplicaSet = 0;

      metrics.replicaset_status_replicas.matrix.sort((a, b) => {
        return (a.metric.replicaset < b.metric.replicaset) ? -1 : (a.metric.replicaset > b.metric.replicaset) ? 1 : 0;
      });

      metrics.deployment_status_replicas_available.matrix.sort((a, b) => {
        return (a.metric.replicaset < b.metric.replicaset) ? -1 : (a.metric.replicaset > b.metric.replicaset) ? 1 : 0;
      });
      
      for (let j = 0; j < metrics.replicaset_labels.matrix.length; j++) {
        if (metrics.replicaset_status_replicas.matrix[j].values.slice(-1)[0][1] * 1 === 0 
        || metrics.replicaset_status_replicas.matrix[j].values.slice(-1)[0][1] 
            === metrics.deployment_status_replicas_available.matrix[j].values.slice(-1)[0][1]) {
          currentReplicaSet = currentReplicaSet + 1;
        }
      }
      this.setState({
        replicaSetReady: update(
          this.state.replicaSetReady,
          {
            $set: currentReplicaSet
          }
        )
      });
    });

    const optionsPodTotal: InfraMetricsOptions = {
      filters: ['pod_labels'],
    };
    const promisePodTotal = API.getInfraMetrics(optionsPodTotal);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promisePodTotal]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        podTotal: update(
          this.state.podTotal,
          {
            $set: metrics.pod_labels.matrix.length
          }
        )
      });
    });

    const optionsPodReady: InfraMetricsOptions = {
      filters: ['pod_status_phase'],
      phase: 'Running',
    };
    const promisePodReady = API.getInfraMetrics(optionsPodReady);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promisePodReady]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        podReady: update(
          this.state.podReady,
          {
            $set: metrics.pod_status_phase.matrix.length
          }
        )
      });
    });
  }

  render() {
    const [sm, md] = [12, 3];
    return (
      this.props.name.map(name => {
        return (
          // aTODO: Card 스타일 바꾸기
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
    if ( name === 'Daemon Sets') {
      return this.state.daemonSetTotal - this.state.daemonSetReady + '/' + this.state.daemonSetTotal;
    } else if ( name === 'Deployments') {
       return this.state.deploymentReady + '/' + this.state.deploymentTotal;
    } else if (name === 'Replica Sets') {
      return this.state.replicaSetReady + '/' + this.state.replicaSetTotal;
    } else if (name === 'Pods') {
      return this.state.podReady + '/' + this.state.podTotal;
    }
    return ;
  }
}

export default CardK8sWorkloads;