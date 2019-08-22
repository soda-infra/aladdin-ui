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
  daemonsetInfo: TableElement[];
};

/**
 * DaemonsetDetail: 쿠버네티스 데몬 셋에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리와 이에 대한 설명이다.
 * - Namespace: 'kube_daemonset_labels' (전체 네임스페이스를 가져오기 위해 사용한다.)
 * - Name: 'kube_daemonset_labels' (데몬 셋의 이름을 가져오기 위해 사용한다.)
 * - Label: 'kube_daemonset_labels' (데몬 셋의 라벨을 가져오기 위해 사용한다.)
 * - Available: 'kube_daemonset_status_current_number_scheduled', 'kube_daemonset_status_desired_number_scheduled' (사용 가능한 데몬 셋들을 가져오기 위해 사용한다.)
 * - Create Timestamp: 'kube_daemonset_created' (데몬 셋이 만들어진 시간을 가져오기 위해 사용한다.)
 */

class CardDetailDaemonSet extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      daemonsetInfo: [],
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
    const optionsDaemonSet: InfraMetricsOptions = {
      filters: [
        'daemonset_labels', 
        'daemonset_created', 
        'daemonset_status_current_number_scheduled',
        'daemonset_status_desired_number_scheduled'
      ]
    };
    const promiseDaemonSet = API.getInfraMetrics(optionsDaemonSet);
    
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseDaemonSet]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      this.sortMetric(metrics);

      const daemonset_labels = metrics.daemonset_labels;
      const daemonset_created = metrics.daemonset_created;
      const daemonset_status_current_number_scheduled = metrics.daemonset_status_current_number_scheduled;
      const daemonset_status_desired_number_scheduled = metrics.daemonset_status_desired_number_scheduled;
      
      const daemonsetNamespaceLists = new Array();
      const daemonsetLists = new Array();
      const daemonsetLabelLists = new Array();
      const daemonsetPodLists = new Array();
      const daemonsetCreatedLists = new Array();
      const daemonsetInfoLists = new Array();

      for (let i = 0; i < daemonset_labels.matrix.length; i++) {
        daemonsetNamespaceLists.push(daemonset_labels.matrix[i].metric.namespace);
        daemonsetLists.push(daemonset_labels.matrix[i].metric.daemonset);
        if (Object.keys(daemonset_labels.matrix[i].metric).indexOf('label_app') > -1) {
          daemonsetLabelLists.push(daemonset_labels.matrix[i].metric.label_app);
        } else if (Object.keys(daemonset_labels.matrix[i].metric).indexOf('label_k8s_app') > -1) {
          daemonsetLabelLists.push(daemonset_labels.matrix[i].metric.label_k8s_app);
        } else if (Object.keys(daemonset_labels.matrix[i].metric).indexOf('k8s_app') > -1) {
          daemonsetLabelLists.push(daemonset_labels.matrix[i].metric.k8s_app);
        } else if (Object.keys(daemonset_labels.matrix[i].metric).indexOf('label_tier') > -1) {
          daemonsetLabelLists.push(daemonset_labels.matrix[i].metric.label_tier);
        } else {
          daemonsetLabelLists.push('-');
        }
        daemonsetPodLists.push(daemonset_status_current_number_scheduled.matrix[i].values.slice(-1)[0][1] 
                              + '/' + daemonset_status_desired_number_scheduled.matrix[i].values.slice(-1)[0][1]);
      }

      for (let i = 0; i < daemonset_created.matrix.length; i++) {
        const rawTimestamp = daemonset_created.matrix[i].values.slice(-1)[0][1] * 1000;
        const date = new Date(rawTimestamp);
        const year = date.getFullYear();
        const month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
        const day = (date.getDate() < 10 ? '0' : '') + date.getDate();
        const hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
        const minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        const second = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        const timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
        daemonsetCreatedLists.push(timestamp);
      }

      for (let i = 0; i < daemonsetLists.length; i++) {
        daemonsetInfoLists.push({
          namespace: daemonsetNamespaceLists[i],
          name: daemonsetLists[i],
          label: daemonsetLabelLists[i],
          pod: daemonsetPodLists[i],
          creationTimestamp: daemonsetCreatedLists[i]
        });
      }

      this.setState({
        daemonsetInfo: update(
          this.state.daemonsetInfo,
          {
            $set: daemonsetInfoLists
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
              {'Daemonset Table'}
            </CardTitle>
          </CardHeading>
          <CardBody>
            <BootstrapTable data={this.state.daemonsetInfo} version="4" search={true} pagination={true}>
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
    metrics.daemonset_labels.matrix.sort((a, b) => {
      return (a.metric.replicaset < b.metric.daemonset) ? -1 : (a.metric.daemonset > b.metric.daemonset) ? 1 : 0;
    });

    metrics.daemonset_created.matrix.sort((a, b) => {
      return (a.metric.daemonset < b.metric.daemonset) ? -1 : (a.metric.daemonset > b.metric.daemonset) ? 1 : 0;
    });

    metrics.daemonset_status_current_number_scheduled.matrix.sort((a, b) => {
      return (a.metric.daemonset < b.metric.daemonset) ? -1 : (a.metric.daemonset > b.metric.replicaset) ? 1 : 0;
    });

    metrics.daemonset_status_desired_number_scheduled.matrix.sort((a, b) => {
      return (a.metric.daemonset < b.metric.pod) ? -1 : (a.metric.replicaset > b.metric.daemonset) ? 1 : 0;
    });
  }
}

const mapStateToProps = (state: KialiAppState) => ({
  meshStatus: meshWideMTLSStatusSelector(state)
});

const DaemonsetDetailContainer = connect( mapStateToProps )(CardDetailDaemonSet);
export default DaemonsetDetailContainer;