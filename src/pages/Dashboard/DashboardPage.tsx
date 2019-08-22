import * as React from 'react';
import { style } from 'typestyle';
import { 
  CardGrid,
  Row,
} from 'patternfly-react';
import { KialiAppState } from '../../store/Store';
import { connect } from 'react-redux';
import { meshWideMTLSStatusSelector } from '../../store/Selectors';
import { DashboardPropType } from '../../types/Dashboard';
import CardK8sCluster from './CardK8sCluster';
import CardK8sWorkloads from './CardK8sWorkloads';
import CardCluster from './CardCluster';
import CardPod from './CardPod';
import k8sItems from './DashboardInfo';

const cardGridStyle = style({ width: '100%' });

const titleStyle = style({ 
  fontSize: '20px',
  fontFamily: 'system-ui',
  lineHeight: '1em',
  padding: '20px'
});

const backgroundStyle = style({ background: '#f5f5f5' });

/**
 * DashboardPage: 'Kubernetes - Overview' 탭을 그린다.
 * - CardK8sCluster:  노드, 네임스페이스 정보를 보여준다.
 * - CardK8sWorkloads: 데몬 셋, 디플로이트먼트, 레플리카 셋, 파드 정보를 보여준다.
 * - CardCluster: 클러스터 내에서의 CPU, 메모리, 파드 사용량을 %로 보여준다.
 * - CardPod: 클러스터 내에서 CPU와 Memory를 가장 많이 사용하는 파드를 많이 쓰는 순서대로 보여준다.
 */

class DashboardPage extends React.Component<DashboardPropType> {

  constructor(props: DashboardPropType) {
    super(props);
  }

  render() {
    return (
      <div className={backgroundStyle}>
        <CardGrid matchHeight={true} className={cardGridStyle}>
          <Row sm={12} md={2}>
            <div className={titleStyle}>
              Kubernetes Cluster
            </div>
            <CardK8sCluster name={k8sItems.K8sCluster}/>
            <CardK8sWorkloads name={k8sItems.K8sWorkloads} />
          </Row>
          <Row>
            <CardCluster name={k8sItems.Cluster} />
          </Row>
          <Row>
            <CardPod name={k8sItems.Pod} />
          </Row>
        </CardGrid>
      </div>
    );
  }
}

// overview 탭처럼 KialiAppState로 사용
const mapStateToProps = (state: KialiAppState) => ({
  meshStatus: meshWideMTLSStatusSelector(state)
});

const DashboardPageContainer = connect( mapStateToProps )(DashboardPage);
export default DashboardPageContainer;