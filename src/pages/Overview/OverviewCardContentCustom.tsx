import * as React from 'react';
import {
  AggregateStatusNotification,
  AggregateStatusNotifications,
  SparklineChart
} from 'patternfly-react';
import { Link } from 'react-router-dom';
import { OverviewType } from './OverviewToolbar';
import { NamespaceStatus } from './NamespaceInfo';
import { switchType } from './OverviewHelper';
import { Paths } from '../../config';
import { TimeSeries } from '../../types/Metrics';
import graphUtils from '../../utils/Graphing';
import { DurationInSeconds } from '../../types/Common';
import { getName } from '../../utils/RateIntervals';
import { GridGenerator, HexGrid, Layout, Hexagon } from 'react-hexgrid';
import '../../styles/App.css';

type Props = {
  name: string;
  type: OverviewType;
  duration: DurationInSeconds;
  status: NamespaceStatus;
  metrics?: TimeSeries[];
};

class OverviewCardContentExpanded extends React.Component<Props> {
  private moreHexas = GridGenerator.hexagon_aladdin(3);
  render() {
    this.moreHexas = GridGenerator.hexagon_aladdin(this.props.status.inSuccess.length);
    return (
      <><div>
        <HexGrid width={400} height={200} viewBox="-10 -10 20 20">
          <Layout size={{ x: 2, y: 2 }} flat={false} spacing={1.02} origin={{ x: 0, y: 0 }}>
            {this.moreHexas.map( (hex, i) => <Hexagon key={i} q={hex.q} r={hex.r} s={hex.s} /> )}
          </Layout>
        </HexGrid>
        </div>
        <div>{this.renderLeft()}</div>
        
      </>
    );
  }

  renderLeft(): JSX.Element {
    const targetPage = switchType(this.props.type, Paths.APPLICATIONS, Paths.SERVICES, Paths.WORKLOADS);
    const name = this.props.name;
    const status = this.props.status;
    const nbItems =
      status.inError.length + status.inWarning.length + status.inSuccess.length + status.notAvailable.length;
    console.log(nbItems);
    let text: string;
    if (nbItems === 1) {
      text = switchType(this.props.type, '1 Application', '1 Service', '1 Workload');
    } else {
      text = nbItems + switchType(this.props.type, ' Applications', ' Services', ' Workloads');
    }
    const mainLink = <Link to={`/${targetPage}?namespaces=${name}`}>{text}</Link>;
    if (nbItems === status.notAvailable.length) {
      return (
        <>
          {mainLink}
          <AggregateStatusNotifications>
            <AggregateStatusNotification>N/A</AggregateStatusNotification>
          </AggregateStatusNotifications>
        </>
      );
    }
    return (
      <>
        {nbItems}
      </>
    );
  }

  renderRight(): JSX.Element {
    if (this.props.metrics && this.props.metrics.length > 0) {
      return (
        <>
          {'Traffic, ' + getName(this.props.duration).toLowerCase()}
          <SparklineChart
            id={'card-sparkline-' + this.props.name}
            data={{ x: 'x', columns: graphUtils.toC3Columns(this.props.metrics, 'RPS'), type: 'area' }}
            tooltip={{}}
            axis={{
              x: { show: false, type: 'timeseries', tick: { format: '%H:%M:%S' } },
              y: { show: false }
            }}
          />
        </>
      );
    }
    return <div style={{ marginTop: 20 }}>No traffic</div>;
  }
}

export default OverviewCardContentExpanded;
