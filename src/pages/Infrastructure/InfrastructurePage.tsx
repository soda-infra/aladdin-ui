import * as React from 'react';
import { style } from 'typestyle';
import { 
  CardGrid,
  Row,
} from 'patternfly-react';
import { KialiAppState } from '../../store/Store';
import { connect } from 'react-redux';
import { meshWideMTLSStatusSelector } from '../../store/Selectors';
import { InfrastructurePropType } from '../../types/Infrastructure';
import CardInfrastructure from './CardInfrastructure';
import CardHexgrid from './CardHexgrid';
import CardNode from './CardNode';
import d3 from 'd3';
import infraItems from './InfrastructureInfo';

const cardGridStyle = style({ width: '100%' });

const titleStyle = style({ 
  fontSize: '20px',
  fontFamily: 'system-ui',
  lineHeight: '1em',
  padding: '20px'
});

const backgroundStyle = style({ background: '#f5f5f5' });

const paddingStyle = style({ paddingTop: '50px' });

const legendTextStyle = style({ 
  textAlign: 'center',
  fontFamily: 'system-ui',
  lineHeight: '1em',
  paddingBottom: '10px'
});

const legendStyle = style({ 
  border: '1px',
  borderStyle: 'solid',
  borderColor: '#BDBDBD',
  float: 'right',
  height: '90px',
  paddingTop: '10px'
});

/**
 * InfrastructurePage: 'Infrastructure - Overview' 탭을 그린다.
 * - CardInfrastructure:  호스트, 도커 컨테이너 정보를 보여준다.
 * - CardHexgrid: 인프라 맵, 컨테이너 맵 정보를 보여준다.
 * - CardNode: 노드 별 CPU, 메모리 사용량을 많이 쓰는 순서대로 보여준다..
 */

class InfrastructurePage extends React.Component<InfrastructurePropType> {

  constructor(props: InfrastructurePropType) {
    super(props);
  }

  componentDidMount() {
    this.drawLegend();
  }

  render() {
    return (
      <div className={backgroundStyle}>
        <CardGrid matchHeight={true} className={cardGridStyle}>
          <Row>
            <div className={titleStyle}>
              Infrastructures
            </div>
            <CardInfrastructure name={infraItems.Infrastructure} />
          </Row>
          <Row>
            <CardHexgrid name={infraItems.Map} />
          </Row>
          <div className={legendStyle}>
            <div className={legendTextStyle}>CPU utilization<br/></div>
            <svg id="my_dataviz" height="40" width="260" />
          </div>
          <Row className={paddingStyle}>
            <div className={paddingStyle}>
              <CardNode name={infraItems.Node} />
            </div>
          </Row>
        </CardGrid>
      </div>
    );
  }

  private drawLegend() {
    const svg = d3.select('#my_dataviz');

    svg.append('rect').attr('x', 20).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#008800');
    svg.append('text').attr('x', 25).attr('y', 30).text('0').style('font-size', '15px').attr('alignment-baseline', 'middle');
    svg.append('line').attr('x1', 50).attr('y1', 10).attr('x2', 110).attr('y2', 10).style('stroke', '#BDBDBD');

    svg.append('rect').attr('x', 120).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#FF895A');
    svg.append('text').attr('x', 120).attr('y', 30).text('50').style('font-size', '15px').attr('alignment-baseline', 'middle');
    svg.append('line').attr('x1', 150).attr('y1', 10).attr('x2', 210).attr('y2', 10).style('stroke', '#BDBDBD');

    svg.append('rect').attr('x', 220).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#C60F00');
    svg.append('text').attr('x', 220).attr('y', 30).text('100').style('font-size', '15px').attr('alignment-baseline', 'middle');
  }
}

// overview 탭처럼 KialiAppState로 사용
const mapStateToProps = (state: KialiAppState) => ({
  meshStatus: meshWideMTLSStatusSelector(state)
});

const InfrastructurePageContainer = connect( mapStateToProps )(InfrastructurePage);
export default InfrastructurePageContainer;