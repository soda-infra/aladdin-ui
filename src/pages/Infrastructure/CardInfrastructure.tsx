import * as React from 'react';
import { style } from 'typestyle';
import { InfraMetricsOptions } from '../../types/MetricsOptions';
import * as API from '../../services/Api';
import { CancelablePromise, makeCancelablePromise } from '../../utils/CancelablePromises';
import { Response } from '../../services/Api';
import { InfraMetrics } from '../../types/Metrics';
import { mergeInfraMetricsResponses } from '../Dashboard/DashboardCommon';
import {
  Col,
  Card,
  CardTitle,
  CardBody
} from 'patternfly-react';
import update from 'react-addons-update';
import { DashboardPropType } from '../../types/Dashboard';

const cardTitleStyle = style({ 
  fontSize: '25px',
  fontWeight: 600
});

const cardBodyStyle = style({
  fontSize: '35px',
  fontWeight: 'bold'
});

type State = {
  host: string[];
  hostTotal: number;
  hostReady: number;
  container: number;
};
/**
 * CardInfrastructure: 인프라스트럭쳐의 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - Host Total: 'kube_node_labels' (전체 호스트를 가져오기 위해 사용한다.)
 * - Host Used: 'kube_node_status_condition' (사용중인 호스트를 가져오기 위해 사용한다.)
 * - Container: 'kube_pod_container_status_running' (사용중인 컨테이너를 가져오기 위해 사용한다.)
 */
class CardInfrastructure extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      host: [],
      hostTotal: 0,
      hostReady: 0,
      container: 0,
    };
  }

  componentWillMount() {
    this.load();
  }

  componentDidMount() {
    window.setInterval(this.load, 15000);
  }

  load = () => {
    const optionsHostTotal: InfraMetricsOptions = {
      filters: ['node_labels'],
    };

    const promiseHostTotal = API.getInfraMetrics(optionsHostTotal);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseHostTotal]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.setState({
        hostTotal: update(
          this.state.hostTotal,
          {
            $set: metrics.node_labels.matrix.length
          }
        )
      });
    });

    const optionsHost: InfraMetricsOptions = {
      filters: ['node_status_condition'],
      condition: 'Ready',
      status: 'true',
    };

    const promiseHostState = API.getInfraMetrics(optionsHost);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseHostState]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      let currentHost = 0;

      for (let j = 0; j < metrics.node_status_condition.matrix.length; j++) {
        if (metrics.node_status_condition.matrix[j].values.slice(-1)[0][1] * 1 === 1) {
          currentHost = currentHost + 1;
        }
      }

      this.setState({
        hostReady: update(
          this.state.hostReady,
          {
            $set: currentHost
          }
        )
      });
    });

    const optionsContainer: InfraMetricsOptions = {
      filters: ['pod_container_status_running'],
    };
    const promiseContainer = API.getInfraMetrics(optionsContainer);
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseContainer]));
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
        container: update(
          this.state.container,
          {
            $set: runningContainer
          }
        )
      });
    });
  }

  render() {
    let [sm, md] = [12, 3];
    return (
      this.props.name.map(name => {
        if (name === 'DockerContainer') { 
          md = 9; 
        }
        return (
          <Col sm={sm} md={md} key={name}>
            <Card matchHeight={true} accented={true} aggregated={true}>
              <CardTitle className={cardTitleStyle}>
                {name}
              </CardTitle>
              <CardBody className={cardBodyStyle}>
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
      return this.state.hostReady + '/' + this.state.hostTotal;
    } else if (name === 'DockerContainer') {
      return this.state.container;
    }
    return ;
  }
}

export default CardInfrastructure;