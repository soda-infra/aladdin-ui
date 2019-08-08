import * as React from 'react';
import { InfraMetricsOptions } from '../../../src/types/MetricsOptions';
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

type Props = {
  name: string[];
};

type State = {
  node: string[];
  nodeTotal: number;
  nodeReady: number;
  containerRunning: number;
};

class CardInfrastructure extends React.Component<Props, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: Props) {
    super(props);
    this.state = {
      node: [],
      nodeTotal: 0,
      nodeReady: 0,
      containerRunning: 0,
    };
  }

  componentWillMount() {
    this.load();
    
  }

  load = () => {
    const optionsNodeTotal: InfraMetricsOptions = {
      filters: ['node_labels'],
    };

    const nodeTotalProm = API.getInfraMetrics(optionsNodeTotal);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([nodeTotalProm]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        nodeTotal: update(
          this.state.nodeTotal,
          {
            $set: metrics.node_labels.matrix.length
          }
        )
      });
    });

    const optionsNodesState: InfraMetricsOptions = {
      filters: ['node_status_condition'],
      condition: 'Ready',
      status: 'true',
    };

    const nodeState = API.getInfraMetrics(optionsNodesState);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([nodeState]));
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

    // kch : 기존 문서와 다른 방법으로 쿼리를 보냄(위에선 2번 쿼리를 보내지만 아래의 코드는 1번만 보냄)
    // const optionsNodesState: InfraMetricsOptions = {
    //   filters: ['node_status_condition'],
    //   condition: 'Ready',
    //   status: 'true',
    // };

    // const nodeState = API.getInfraMetrics(optionsNodesState);
    // this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([nodeState]));
    // this.metricsPromise.promise
    // .then(response => {
    //   const metrics = response.data.metrics;
    //   let currentNode = 0;
    //   for (let j = 0; j < metrics.node_status_condition.matrix.length; j++) {
    //     if( metrics.node_status_condition.matrix[j].values.slice(-1)[0][1] == 1)
    //       currentNode = currentNode + 1;
    //   }
    //   this.setState({
    //     nodeReady: update(
    //       this.state.nodeReady,
    //       {
    //         $set: currentNode
    //       }
    //     )
    //   })
    //   this.setState({
    //     nodeTotal: update(
    //       this.state.nodeTotal,
    //       {
    //         $set: metrics.node_status_condition.matrix.length
    //       }
    //     )
    //   })
    // });

    const optionsContainerRunning: InfraMetricsOptions = {
      filters: ['pod_container_status_running'],
    };
    const containerRunning = API.getInfraMetrics(optionsContainerRunning);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([containerRunning]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let runningContainer = 0;
      for (let j = 0; j < metrics.pod_container_status_running.matrix.length; j++) {
        if (metrics.pod_container_status_running.matrix[j].values.slice(-1)[0][1] * 1 === 1) {
          runningContainer = runningContainer + 1;
        }
      }
      this.setState({
        containerRunning: update(
          this.state.containerRunning,
          {
            $set: runningContainer
          }
        )
      });
    });
  }

  render() {
    const [xs, sm, md] = [12, 6, 3];
    return (
      this.props.name.map(name => {
        return (
          <Col xs={xs} sm={sm} md={md} key={name}>
            <Card matchHeight={true} accented={true} aggregated={true}>
              <CardTitle>
                {name}
              </CardTitle>
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
    if (name === 'Host') {
      return this.state.nodeReady + '/' + this.state.nodeTotal;
    } else if (name === 'DockerContainer') {
      return this.state.containerRunning;
    }
    return ;
  }
}

export default CardInfrastructure;