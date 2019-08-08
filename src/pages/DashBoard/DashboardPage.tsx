import * as React from 'react';
import { style } from 'typestyle';
import { 
  CardGrid,
  Row,
  Col
} from 'patternfly-react';
import { PromisesRegistry } from '../../utils/CancelablePromises';
import { KialiAppState } from '../../store/Store';
import { connect } from 'react-redux';
import { meshWideMTLSStatusSelector } from '../../store/Selectors';
import { shouldRefreshData } from './DashboardCommon';
import { DashboardPropType } from '../../types/Dashboard';
import CardK8sCluster from './CardK8sCluster';
import CardInfrastructure from './CardInfrastructure';
import CardK8sWorkloads from './CardK8sWorkloads';

const cardGridStyle = style({ width: '100%' });

type DashboardState = {
};

class DashboardPage extends React.Component<DashboardPropType, DashboardState> {
  private promises = new PromisesRegistry();

  constructor(props: DashboardPropType) {
    super(props);
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    this.promises.cancelAll();
  }

  load = () => {
    this.promises.cancelAll();
  }

  componentDidUpdate(prevProps: DashboardPropType) {
    console.log('KCH');
    console.log(prevProps.graphTimestamp);
    console.log(this.props.graphTimestamp);
    if (shouldRefreshData(prevProps, this.props)) {
      this.load();
      // if (this.shouldShowMyTable()) {
      //   this.updateMyTable(this.props);
      // }
    }
  }

  render() {
    // const [xs, sm, md] = [12, 6, 2];
    return (
      <CardGrid matchHeight={true} className={cardGridStyle}>
        <Row>
          <Col>
          {/* name을 dashboardinfo로 하기 */}
            <Row>
              <CardK8sCluster name={['Nodes', 'Namespace']}/>
            </Row>
            <Row>
              <CardK8sWorkloads name={['Daemon Sets', 'Deployments', 'Replica Sets', 'Pods']} />
            </Row>
            {/* <CardCluster name= {['Cluster CPU Utilization', 'Cluster Memory Utilization', 'Cluster Pod Utilization']} /> */}
          </Col>
          <Col>
            <CardInfrastructure name={['Host', 'DockerContainer']} />
          </Col>
        </Row>
      </CardGrid>
    );
  }
}

// overview 탭처럼 KialiAppState로 사용
const mapStateToProps = (state: KialiAppState) => ({
  meshStatus: meshWideMTLSStatusSelector(state),
  graphTimestamp: state.graph.graphDataTimestamp
});

const DashboardPageContainer = connect(mapStateToProps)(DashboardPage);
export default DashboardPageContainer;