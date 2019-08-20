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
  nodeInfo: TableElement[];
};

/**
 * NodeDetail: 쿠버네티스 노드에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리와 이에 대한 설명이다.
 * - Name: 'kube_node_labels' (노드의 이름을 가져오기 위해 사용한다.)
 * - Label: 'kube_node_labels' (노드의 라벨을 가져오기 위해 사용한다.)
 * - Create Timestamp: 'kube_node_created' (노드가 만들어진 시간을 가져오기 위해 사용한다.)
 */

class CardDetailNode extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      nodeInfo: [],
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
    const optionsNode: InfraMetricsOptions = {
      filters: ['node_labels', 'node_created'],
    };
    const promiseNode = API.getInfraMetrics(optionsNode);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNode]));
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;

      const node_labels = metrics.node_labels;
      const node_created = metrics.node_created;
      
      const nodeNameLists = new Array();
      const nodeLabelLists = new Array();
      const nodeCreatedLists = new Array();
      const nodeInfoLists = new Array();
      
      for (let i = 0; i < node_labels.matrix.length; i++) {
        nodeNameLists.push(node_labels.matrix[i].metric.node);
        if (Object.keys(node_labels.matrix[i].metric).indexOf('label_app') > -1) {
          nodeLabelLists.push(node_labels.matrix[i].metric.label_app);
        } else if (Object.keys(node_labels.matrix[i].metric).indexOf('label_k8s_app') > -1) {
          nodeLabelLists.push(node_labels.matrix[i].metric.label_k8s_app);
        } else if (Object.keys(node_labels.matrix[i].metric).indexOf('k8s_app') > -1) {
          nodeLabelLists.push(node_labels.matrix[i].metric.k8s_app);
        } else if (Object.keys(node_labels.matrix[i].metric).indexOf('label_tier') > -1) {
          nodeLabelLists.push(node_labels.matrix[i].metric.label_tier);
        } else {
          nodeLabelLists.push('-');
        }
      }

      for (let i = 0; i < node_created.matrix.length; i++) {
        const rawTimestamp = node_created.matrix[i].values.slice(-1)[0][1] * 1000;
        const date = new Date(rawTimestamp);
        const year = date.getFullYear();
        const month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
        const day = (date.getDate() < 10 ? '0' : '') + date.getDate();
        const hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
        const minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        const second = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        const timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
        nodeCreatedLists.push(timestamp);
      }

      for (let i = 0; i < nodeNameLists.length; i++) {
        nodeInfoLists.push({
          name: nodeNameLists[i],
          label: nodeLabelLists[i],
          creationTimestamp: nodeCreatedLists[i]
        });
      }

      this.setState({
        nodeInfo: update(
          this.state.nodeInfo,
          {
            $set: nodeInfoLists
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
              {'Node Table'}
            </CardTitle>
          </CardHeading>
          <CardBody>
            <BootstrapTable data={this.state.nodeInfo} version="4" search={true} pagination={true}>
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

const NodesDetailContainer = connect(mapStateToProps)(CardDetailNode);
export default NodesDetailContainer;