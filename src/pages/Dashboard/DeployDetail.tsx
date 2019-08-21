import * as React from 'react';
import { style } from 'typestyle';
import { CancelablePromise, makeCancelablePromise } from '../../utils/CancelablePromises';
import { Response } from '../../services/Api';
import * as API from '../../services/Api';
import { InfraMetrics } from '../../types/Metrics';
import { DashboardPropType } from '../../types/Dashboard';
import { mergeInfraMetricsResponses } from './DashboardCommon';
import { InfraMetricsOptions } from '../../types/MetricsOptions';
import update from 'react-addons-update';
import { 
  Card,
  CardHeading,
  CardTitle,
} from 'patternfly-react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import 'react-bootstrap-table/css/react-bootstrap-table.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { CardBody } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { KialiAppState } from '../../store/Store';
import { meshWideMTLSStatusSelector } from '../../store/Selectors';

const cardTitleStyle = style({ 
  fontSize: '25px',
  fontWeight: 600
});

type TableElement = {
  namespace: string[],
  name: string[],
  label: string[],
  pod: string[],
  creationTimestamp: string[]
};

type State = {
  deploymentInfo: TableElement[];
};
/**
 * DeployDetail: 쿠버네티스 디플로이먼트에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리와 이에 대한 설명이다.
 * - Namespace: 'kube_deployment_labels' (전체 디플로이먼트를 가져오기 위해 사용한다.)
 * - Name: 'kube_deployment_labels' (디플로이먼트의 이름을 가져오기 위해 사용한다.)
 * - Label: 'kube_deployment_labels' (디플로이먼트의 라벨을 가져오기 위해 사용한다.)
 * - Available: 'kube_deployment_status_replicas', 'kube_deployment_status_replicas_available' (사용 가능한 디플로이먼트들을 가져오기 위해 사용한다.)
 * - Create Timestamp: 'kube_deployment_created' (디플로이먼트가 만들어진 시간을 가져오기 위해 사용한다.)
 */

class CardDetailDeployment extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      deploymentInfo: [],
    };
  }

  componentWillMount() {
    this.load();
  }

  componentDidMount() {
    window.setInterval(this.load, 15000);
  }

  componentWillUnmount() {
    if (this.metricsPromise) {
      this.metricsPromise.cancel();
    }
  }

  load = () => {
    const optionsDeployment: InfraMetricsOptions = {
      filters: [
        'deployment_labels', 
        'deployment_created', 
        'deployment_status_replicas',
        'deployment_status_replicas_available'
      ]
    };
    const pormiseDeployment = API.getInfraMetrics(optionsDeployment);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([pormiseDeployment]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.sortMetric(metrics);

      const deployment_labels = metrics.deployment_labels;
      const deployment_created = metrics.deployment_created;
      const deployment_status_replicas_available = metrics.deployment_status_replicas_available;
      const deployment_status_replicas = metrics.deployment_status_replicas;
      
      const deploymentNamespaceLists = new Array();
      const deploymentLists = new Array();
      const deploymentLabelLists = new Array();
      const deploymentPodLists = new Array();
      const deploymentCreatedLists = new Array();
      const deploymentInfoLists = new Array();

      for (let i = 0; i < deployment_labels.matrix.length; i++) {
        deploymentNamespaceLists.push(deployment_labels.matrix[i].metric.namespace);
        deploymentLists.push(deployment_labels.matrix[i].metric.deployment);
        if (Object.keys(deployment_labels.matrix[i].metric).indexOf('label_app') > -1) {
          deploymentLabelLists.push(deployment_labels.matrix[i].metric.label_app);
        } else if (Object.keys(deployment_labels.matrix[i].metric).indexOf('label_k8s_app') > -1) {
          deploymentLabelLists.push(deployment_labels.matrix[i].metric.label_k8s_app);
        } else if (Object.keys(deployment_labels.matrix[i].metric).indexOf('k8s_app') > -1) {
          deploymentLabelLists.push(deployment_labels.matrix[i].metric.k8s_app);
        } else if (Object.keys(deployment_labels.matrix[i].metric).indexOf('label_tier') > -1) {
          deploymentLabelLists.push(deployment_labels.matrix[i].metric.label_tier);
        } else {
          deploymentLabelLists.push('-');
        }
        deploymentPodLists.push(deployment_status_replicas_available.matrix[i].values.slice(-1)[0][1] 
                              + '/' + deployment_status_replicas.matrix[i].values.slice(-1)[0][1]);
      }

      for (let i = 0; i < deployment_created.matrix.length; i++) {
        const rawTimestamp = deployment_created.matrix[i].values.slice(-1)[0][1] * 1000;
        const date = new Date(rawTimestamp);
        const year = date.getFullYear(); 
        const month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
        const day = (date.getDate() < 10 ? '0' : '') + date.getDate();
        const hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
        const minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        const second = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        const timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
        deploymentCreatedLists.push(timestamp);
      }

      for (let i = 0; i < deploymentLists.length; i++) {
        deploymentInfoLists.push({
          namespace: deploymentNamespaceLists[i],
          name: deploymentLists[i],
          label: deploymentLabelLists[i],
          pod: deploymentPodLists[i],
          creationTimestamp: deploymentCreatedLists[i]
        });
      }

      this.setState({
        deploymentInfo: update(
          this.state.deploymentInfo,
          {
            $set: deploymentInfoLists
          }
        ),
      });
    });
  }

  render() {
    return (
      <>
        <Card>
          <CardHeading>
            <CardTitle className={cardTitleStyle}>
              {'Deployment Table'}
            </CardTitle>
          </CardHeading>
          <CardBody>
            <BootstrapTable data={this.state.deploymentInfo} version="4" search={true} pagination={true}>
              <TableHeaderColumn dataField="namespace" dataAlign="center" dataSort={true}>Namespace</TableHeaderColumn>
              <TableHeaderColumn dataField="name" isKey={true} dataAlign="center" >Name</TableHeaderColumn>
              <TableHeaderColumn dataField="label" dataAlign="center">Label</TableHeaderColumn>
              <TableHeaderColumn dataField="pod" searchable={false} dataAlign="center">Pod</TableHeaderColumn>
              <TableHeaderColumn dataField="creationTimestamp" dataAlign="center" dataSort={true}>Creation Timestamp</TableHeaderColumn>
            </BootstrapTable>
          </CardBody>
        </Card>
      </>
    );
  }

  private sortMetric = (metrics) => {
    metrics.deployment_labels.matrix.sort((a, b) => {
      return (a.metric.deployment < b.metric.deployment) ? -1 : (a.metric.deployment > b.metric.deployment) ? 1 : 0;
    });

    metrics.deployment_created.matrix.sort((a, b) => {
      return (a.metric.deployment < b.metric.deployment) ? -1 : (a.metric.deployment > b.metric.deployment) ? 1 : 0;
    });

    metrics.deployment_status_replicas_available.matrix.sort((a, b) => {
      return (a.metric.deployment < b.metric.deployment) ? -1 : (a.metric.deployment > b.metric.deployment) ? 1 : 0;
    });

    metrics.deployment_status_replicas.matrix.sort((a, b) => {
      return (a.metric.deployment < b.metric.pod) ? -1 : (a.metric.deployment > b.metric.deployment) ? 1 : 0;
    });
  }
}

const mapStateToProps = (state: KialiAppState) => ({
  meshStatus: meshWideMTLSStatusSelector(state)
});

const DeploymentDetailContainer = connect(mapStateToProps)(CardDetailDeployment);
export default DeploymentDetailContainer;