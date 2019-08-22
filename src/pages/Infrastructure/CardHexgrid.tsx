import * as React from 'react';
import { InfraMetrics } from '../../types/Metrics';
import { GridGenerator, HexGrid, Layout, Hexagon } from 'react-hexgrid';
import '../../styles/App.css';
import ReactTooltip from 'react-tooltip';
import { style } from 'typestyle';
import { CancelablePromise, makeCancelablePromise } from '../../utils/CancelablePromises';
import { Response } from '../../services/Api';
import * as API from '../../services/Api';
import {
  Card,
  CardTitle,
  CardBody,
  Col
} from 'patternfly-react';
import { DashboardPropType } from '../../types/Dashboard';
import { mergeInfraMetricsResponses } from '../Dashboard/DashboardCommon';
import { InfraMetricsOptions } from '../../types/MetricsOptions';
import update from 'react-addons-update';
import { Link } from 'react-router-dom';

const titleStyle = style({
  fontSize: '20px',
  fontFamily: 'system-ui',
  lineHeight: '1em',
  padding: '20px'
});

const cardTitleStyle = style({
  fontSize: '20px',
  fontWeight: 600
});

type Container = {
  name: string;
  value: number;
};

type cpuInfo = {
  nodeName: string;
  containers: Container[];
};

type Node = {
  name: string;
  value: number;
  total: number;
  used: number;
};

type State = {
  loading: boolean;
  node: Node[];
  cpuInfo: cpuInfo[];
  cpuTotal: number[];
  mousePoint: string[];
};

/**
 * CardHexgrid: 인프라 CPU 사용량에 관한 정보를 불러온다. 다음은 해당 정보를 불러올 때 사용하는 쿼리를 나타낸 것이다.
 * - CPU Total: 'machine_cpu_cores' (인프라의 CPU의 양을 가져오기 위해 사용한다.)
 * - CPU Used: 'node_cpu_seconds_total' (인프라의 CPU 사용량을 가져오기 위해 사용한다.)
 * - Name: 'node_labels' (인프라의 호스트별 이름을 가져오기 위해 사용한다.)
 * - Container CPU Used: 'container_cpu_usage_seconds_total' (인프라의 호스트별 사용중인 컨테이너 CPU 사용량을 가져오기 위해 사용한다.)
 */

class CardHexgrid extends React.Component<DashboardPropType, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: DashboardPropType) {
    super(props);
    this.state = {
      loading: false,
      node: [],
      cpuInfo: [],
      cpuTotal: [],
      mousePoint: []
    };
  }

  componentWillMount() {
    this.load();
  }

  componentDidMount() {
    this.setState({
      loading: true,
    });
    window.setInterval(this.load, 15000);
  }

  load = () => {
    const optionsCPUTotal: InfraMetricsOptions = {
      filters: ['machine_cpu_cores'],
    };
    const promiseCPUTotal = API.getInfraMetrics(optionsCPUTotal);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseCPUTotal]));
    this.metricsPromise.promise
      .then(response => {
        const sum: number[] = [];
        const metrics = response.data.metrics;
        const cpuMetrics = metrics.machine_cpu_cores.matrix;
        for (let i = 0; i < cpuMetrics.length; i++) {
          sum.push(cpuMetrics[i].values.slice(-1)[0][1]);
        }
        this.setState({
          cpuTotal: update(
            this.state.cpuTotal,
            {
              $set: sum
            }
          )
        });
      });

    const nodeCPULists: Array<object> = [];
    const optionsNodeTotal: InfraMetricsOptions = {
      filters: ['node_cpu_seconds_total'],
      rateFunc: 'irate',
      mode: 'idle',
      avg: true,
      byLabels: ['instance']
    };
    const promiseNodeTotal = API.getInfraMetrics(optionsNodeTotal);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNodeTotal]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const nodes = metrics.node_cpu_seconds_total.matrix;

        nodeCPULists.sort((a, b) => b[1] - a[1]);
        for (let i = 0; i < nodes.length; i++) {
          if (nodeCPULists.length > 3) {
            break;
          }
          nodeCPULists.push({
            name: nodes[i].metric.instance,
            value: 100 - Number(nodes[i].values.slice(-1)[0][1]) * 100
          });
        }

        if (!this.state.loading) {
          this.setState({
            node: update(
              this.state.node,
              {
                $splice: [[0, 1]],
                $push: nodeCPULists
              }
            )
          });
        } else {
          this.setState({
            node: update(
              this.state.node,
              {
                $set: nodeCPULists
              }
            )
          });
        }
      });

    const nodeNameLists: Array<Object> = [];
    const optionsNodeName: InfraMetricsOptions = {
      filters: ['node_labels']
    };
    const promiseNodeName = API.getInfraMetrics(optionsNodeName);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseNodeName]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const nodeNameMetrics = metrics.node_labels.matrix;
        for (let i = 0; i < nodeNameMetrics.length; i++) {
          nodeNameLists.push([nodeNameMetrics[i].metric.label_kubernetes_io_hostname, []]);
        }
      });

    const optionsContainerCPU: InfraMetricsOptions = {
      filters: ['container_cpu_usage_seconds_total'],
      rateFunc: 'rate'
    };
    const promiseContainerCPU = API.getInfraMetrics(optionsContainerCPU);

    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([promiseContainerCPU]));
    this.metricsPromise.promise
      .then(response => {
        const metrics = response.data.metrics;
        const cpuMetrics = metrics.container_cpu_usage_seconds_total.matrix;
        for (let i = 0; i < cpuMetrics.length; i++) {
          if (cpuMetrics[i].metric.container_name && cpuMetrics[i].metric.container_name !== 'POD') {
            for (let j = 0; j < nodeNameLists.length; j++) {
              if (nodeNameLists[j][0] === cpuMetrics[i].metric.kubernetes_io_hostname) {
                nodeNameLists[j][1].push([cpuMetrics[i].metric.container_name, cpuMetrics[i].values.slice(-1)[0][1] * 100]);
                break;
              }
            }
          }
        }
        if (!this.state.loading) {
          this.setState({
            cpuInfo: update(
              this.state.cpuInfo,
              {
                $splice: [[0, 1]],
                $push: nodeNameLists
              }
            )
          });
        } else {
          this.setState({
            cpuInfo: update(
              this.state.cpuInfo,
              {
                $set: nodeNameLists
              }
            )
          });
        }
      });
  }

  render() {
    return (
      this.props.name.map(name => {
        if (name === 'Container Map') {
          return (
            <Col sm={12} md={9}>
              <div className={titleStyle}>
                {name}
              </div>
              {this.renderContainerStatuse()}
            </Col>
          );
        } else {
          return (
            <Col sm={12} md={3}>
              <div className={titleStyle}>
                {name}
              </div>
              <Card accented={true}>
                <CardBody>
                  {this.renderInfraStatuse()}
                </CardBody>
              </Card>
            </Col>
          );
        }
      })
    );
  }

  onMouseEnter(param: string, index: any, _event: any, source: any) {
    const mousePointLists: string[] = [];

    if (param === 'infra') {
      this.state.node.map((node, i) => {
        if (i === Number(source._reactInternalFiber.key)) {
          mousePointLists.push(node.name + ' : ' + node.value.toFixed(2) + '%');
        }
      });
    } else if (param === 'container') {
      this.state.cpuInfo[index][1].map((container, i) => {
        if (i === Number(source._reactInternalFiber.key)) {
          mousePointLists.push(container[0] + ' : ' + container[1].toFixed(2) + '%');
        }
      });
    }

    this.setState({
      mousePoint: update(
        this.state.mousePoint,
        {
          $push: mousePointLists
        }
      )
    });
  }

  onMouseLeave(_event: any, _source: any) {
    if (this.state.mousePoint.length > 0) {
      this.state.mousePoint.pop();
    }
    this.setState({
      mousePoint: update(
        this.state.mousePoint,
        {
          $splice: [[0, 1]]
        }
      )
    });
  }

  renderContainerStatuse() {
    return (
      this.state.cpuInfo.map((cpu, index) => {
        const length = cpu[1].length;
        const size = 90 / Math.sqrt(length);
        const boxSize = this.setHexagonSize(length) * Number(Math.sqrt((length - 1) / 3));
        const viewbox = '-' + boxSize * 1.5 + ' -' + boxSize * 1.5 + ' ' + boxSize * 3 + ' ' + boxSize * 3;
        const moreHexas = GridGenerator.hexagon_aladdin(length);
        const value: Array<number> = [];

        cpu[1].map(container => {
          value.push(Math.round(container[1]));
        });

        return (
          <>
            <Col sm={12} md={4}>
              <Card accented={true} aggregated={true}>
                <CardTitle className={cardTitleStyle}>
                  <Link to={`/kubernetes/pods`}>
                    {cpu[0]}
                  </Link>
                </CardTitle>
                <CardBody>
                  <div>
                    <HexGrid width={'100%'} height={285} viewBox={viewbox}>
                      <Link to={`/kubernetes/pods`}>
                        <Layout size={{ x: size, y: size }} flat={false} spacing={1.02} origin={{ x: 0, y: 0 }}>
                          {
                            moreHexas.map((hex, i) =>
                              <a data-tip={true} data-for={'container'} key={name}>
                                {value[i] <= 30 ?
                                  <Hexagon fill={'00' + (Number('0x8800') + value[i] * 0x200).toString(16)} key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter('container', index, e, h)} />
                                  : value[i] <= 60 ? <Hexagon fill={(Number('0xfff55a') - (value[i] - 30) * 0x300).toString(16)} key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter('container', index, e, h)} />
                                    : <Hexagon fill={(Number('0xee3700') - (value[i] - 60) * 0x010100).toString(16)} key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter('container', index, e, h)} />
                                }
                              </a>
                            )
                          }
                        </Layout>
                      </Link>
                    </HexGrid>
                  </div>
                  <ReactTooltip id={'container'} effect="solid" type="info">
                    {this.state.mousePoint[0]}
                  </ReactTooltip>
                </CardBody>
              </Card>
            </Col>
          </>
        );
      })
    );
  }

  renderInfraStatuse() {
    const length = this.state.node.length;
    const size = 90 / Math.sqrt(length);
    const boxSize = this.setHexagonSize(length) * Number(Math.sqrt((length - 1) / 3));
    const viewbox = '-' + boxSize * 1.5 + ' -' + boxSize * 1.5 + ' ' + boxSize * 3 + ' ' + boxSize * 3;
    const moreHexas = GridGenerator.hexagon_aladdin(length);
    const value: Array<number> = [];

    this.state.node.map(node => {
      value.push(Number(node.value.toFixed(0)));
    });

    return (
      <>
        <div>
          <HexGrid width={'100%'} height={295} viewBox={viewbox}>
            <Link to={`/kubernetes/nodes`}>
              <Layout size={{ x: size, y: size }} flat={false} spacing={1.02} origin={{ x: 0, y: 0 }}>
                {
                  moreHexas.map((hex, i) =>
                    <a data-tip={true} data-for="global" key={name}>
                      {value[i] <= 30 ?
                        <Hexagon fill={'00' + (Number('0x8800') + value[i] * 0x200).toString(16)} key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter('infra', i, e, h)} />
                        : value[i] <= 60 ? <Hexagon fill={(Number('0xfff55a') - (value[i] - 30) * 0x300).toString(16)} key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter('infra', i, e, h)} />
                          : <Hexagon fill={(Number('0xee3700') - (value[i] - 60) * 0x010100).toString(16)} key={i} q={hex.q} r={hex.r} s={hex.s} onMouseLeave={(e, h) => this.onMouseLeave(e, h)} onMouseEnter={(e, h) => this.onMouseEnter('infra', i, e, h)} />
                      }
                    </a>
                  )
                }
              </Layout>
            </Link>
          </HexGrid>
        </div>
        {this.state.mousePoint.length === 0 ? '' :
          <ReactTooltip id="global" effect="solid" type="info">
            {this.state.mousePoint[0]}
          </ReactTooltip>}
      </>
    );
  }

  private setHexagonSize = (length) => {
    let hexagonSize;

    if (length < 8) {
      hexagonSize = 200;
    } else if (length < 20) {
      hexagonSize = 50;
    } else if (length < 38) {
      hexagonSize = 30;
    } else if (length < 62) {
      hexagonSize = 70;
    } else if (length < 92) {
      hexagonSize = 80;
    } else if (length < 128) {
      hexagonSize = 90;
    } else if (length < 170) {
      hexagonSize = 100;
    } else if (length < 218) {
      hexagonSize = 110;
    } else if (length < 272) {
      hexagonSize = 120;
    }

    return hexagonSize;
  }
}
export default CardHexgrid;