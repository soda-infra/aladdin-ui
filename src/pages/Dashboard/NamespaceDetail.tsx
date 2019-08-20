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
  name: string[],
  label: string[],
  creationTimestamp: string[]
};

type State = {
  loading: boolean;
  namespaceInfo: TableElement[];
};
/**
 * NamespaceDetail: 쿠버네티스 네임스페이스에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리와 이에 대한 설명이다.
 * - Name: 'kube_namespace_labels' (네임스페이스의 이름을 가져오기 위해 사용한다.)
 * - Label: 'kube_namespace_labels' (네임스페이스의 라벨을 가져오기 위해 사용한다.)
 * - Create Timestamp: 'kube_namespace_created' (네임스페이스가 만들어진 시간을 가져오기 위해 사용한다.)
 */
class CardDetailNamespace extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;
  
  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      loading: false,
      namespaceInfo: [],
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
    const optionsNamespaces: InfraMetricsOptions = {
      filters: ['namespace_labels', 'namespace_created'],
    };
    const promiseNamespace = API.getInfraMetrics(optionsNamespaces);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNamespace]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;

      const namespace_labels = metrics.namespace_labels;
      const namespace_created = metrics.namespace_created;
      
      const namespaceNameLists = new Array();
      const namespaceLabelLists = new Array();
      const namespaceCreatedLists = new Array();
      const namespaceInfoLists = new Array();
      
      for (let i = 0; i < namespace_labels.matrix.length; i++) {
        namespaceNameLists.push(namespace_labels.matrix[i].metric.namespace);
        if (Object.keys(namespace_labels.matrix[i].metric).indexOf('label_app') > -1) {
          namespaceLabelLists.push(namespace_labels.matrix[i].metric.label_app);
        } else if (Object.keys(namespace_labels.matrix[i].metric).indexOf('label_k8s_app') > -1) {
          namespaceLabelLists.push(namespace_labels.matrix[i].metric.label_k8s_app);
        } else if (Object.keys(namespace_labels.matrix[i].metric).indexOf('k8s_app') > -1) {
          namespaceLabelLists.push(namespace_labels.matrix[i].metric.k8s_app);
        } else if (Object.keys(namespace_labels.matrix[i].metric).indexOf('label_tier') > -1) {
          namespaceLabelLists.push(namespace_labels.matrix[i].metric.label_tier);
        } else {
          namespaceLabelLists.push('-');
        }
      }

      for (let i = 0; i < namespace_created.matrix.length; i++) {
        const rawTimestamp = namespace_created.matrix[i].values.slice(-1)[0][1] * 1000;
        const date = new Date(rawTimestamp);
        const year = date.getFullYear(); 
        const month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
        const day = (date.getDate() < 10 ? '0' : '') + date.getDate();
        const hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
        const minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        const second = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        const timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
        namespaceCreatedLists.push(timestamp);
      }

      for (let i = 0; i < namespaceNameLists.length; i++) {
        namespaceInfoLists.push({
          name: namespaceNameLists[i],
          label: namespaceLabelLists[i],
          creationTimestamp: namespaceCreatedLists[i]
        });
      }

      this.setState({
        namespaceInfo: update(
          this.state.namespaceInfo,
          {
            $set: namespaceInfoLists
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
              {'Namespace Table'}
            </CardTitle>
          </CardHeading>
          <CardBody>
            <BootstrapTable data={this.state.namespaceInfo} version="4" search={true} pagination={true}>
              <TableHeaderColumn dataField="name" isKey={true} dataAlign="center" >Name</TableHeaderColumn>
              <TableHeaderColumn dataField="label" dataAlign="center">Label</TableHeaderColumn>
              <TableHeaderColumn dataField="creationTimestamp" dataAlign="center" dataSort={true}>Creation Timestamp</TableHeaderColumn>
            </BootstrapTable>
          </CardBody>
        </Card>
      </>
    );
  }
}

const mapStateToProps = (state: KialiAppState) => ({
  meshStatus: meshWideMTLSStatusSelector(state)
});

const NamespaceDetailContainer = connect(mapStateToProps)(CardDetailNamespace);
export default NamespaceDetailContainer;