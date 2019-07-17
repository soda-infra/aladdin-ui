import * as React from 'react';
import { OverviewType } from './OverviewToolbar';
import { NamespaceStatus } from './NamespaceInfo';
import { TimeSeries } from '../../types/Metrics';
import { DurationInSeconds } from '../../types/Common';
import { GridGenerator, HexGrid, Layout, Hexagon } from 'react-hexgrid';
import '../../styles/App.css';
import ReactTooltip from 'react-tooltip';
import { NamespaceInfo } from './NamespaceInfo';

type Props = {
  name: string;
  type: OverviewType;
  duration: DurationInSeconds;
  status: NamespaceStatus;
  metrics?: TimeSeries[];
  namespaceList: NamespaceInfo[];
};

class OverviewCardContentExpanded extends React.Component<Props> {
  state = {
    temp : ''
};
  onMouseEnter(_event: any, source: any) {
    let namespace;
    this.props.namespaceList.map(ns => {
      if (ns.name === source._reactInternalFiber._debugOwner.key)
        namespace = ns;
    });

    let errorCount = namespace.status.inError.length;
    let successCount = namespace.status.inSuccess.length;
    let warningCount = namespace.status.inWarning.length;
    let inError = namespace.status.inError[parseInt(source._reactInternalFiber.key)];
    let inSuccess = namespace.status.inSuccess[parseInt(source._reactInternalFiber.key) - errorCount];
    let inWarning = namespace.status.inWarning[parseInt(source._reactInternalFiber.key) - errorCount - successCount];
    let notAvailable = namespace.status.notAvailable[parseInt(source._reactInternalFiber.key) - errorCount - successCount - warningCount];

    this.setState(
      {
        temp : inError === undefined ? inSuccess === undefined ? inWarning === undefined ? notAvailable === undefined ? '' : notAvailable : inWarning : inSuccess : inError
      }
    );
  }

  onMouseLeave(_event: any, _source: any) {
    this.setState(
      {
        temp : ''
      }
    );
  }

  render() {
    const count = this.props.status.inError.length + this.props.status.inWarning.length + this.props.status.inSuccess.length + this.props.status.notAvailable.length;
    const moreHexas = GridGenerator.hexagon_aladdin(count);
    // const color = 'ff0000';

    return (
      <><div>
        <HexGrid width={400} height={200} viewBox="-10 -10 20 20">
          <Layout size={{ x: 2, y: 2 }} flat={false} spacing={1.05} origin={{ x: 0, y: 0 }}>
            {moreHexas.map((hex, i) => <a data-tip data-for="global"> <Hexagon key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter(e, h)} />
            </a>)}
          </Layout>
        </HexGrid> 
        </div>
      {this.state.temp === '' ? '' :
      <ReactTooltip id="global" effect="solid" type="info">
        <p>{this.state.temp}</p>
      </ReactTooltip>}
      </>
      
    );
  }
}

export default OverviewCardContentExpanded;
