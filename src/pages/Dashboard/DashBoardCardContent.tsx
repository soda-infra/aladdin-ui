import * as React from 'react';
import { InfraMetricsOptions } from '../../../src/types/MetricsOptions';
import * as API from '../../services/Api';
import { CancelablePromise, makeCancelablePromise } from '../../utils/CancelablePromises';
import { Response } from '../../services/Api';
import { InfraMetrics } from '../../types/Metrics';
import { mergeInfraMetricsResponses } from './DashBoardCommon';
import Chart from 'react-google-charts';
import { style } from 'typestyle';
// aladdin
type Props = {
  name: string;
};

type State = {
  node: string[];
  data: any[];
};

const expandedStyle = style({
  fontSize: '50px', // TODO: Remove
  paddingTop: '1em',
  position: 'relative',
  width: '100%',
  color: '#2e2627'
});

class DashBoardCardContent extends React.Component<Props, State> {
  private metricsPromise?: CancelablePromise<Response<InfraMetrics>>;

  constructor(props: Props) {
    super(props);
    this.state = {
      node: [],
      data: []
    };
    let temp = [
      'Node',
      'CPU_Usage',
      { role: 'style' },
      {
        sourceColumn: 0,
        role: 'annotation',
        type: 'string',
        calc: 'stringify',
      },
    ]

    this.state.data.push(temp);
  }
  
  nodeTopCPU(){
    const options: InfraMetricsOptions = {
      filters: ['node_cpu_seconds_total'],
      rateFunc: 'irate',
      mode: 'idle',
      avg: true,
      byLabels: ['instance']
    };
    let nodeData = new Array();
    // console.log('options : %s',options)
    // console.log(options)
    const infraprom = API.getInfraMetrics(options);
    // console.log('infraprom : %s',infraprom)

    // console.log(infraprom)
    this.metricsPromise = makeCancelablePromise(mergeInfraMetricsResponses([infraprom]));
    // console.log('metricsPromise')
    // console.log(this.metricsPromise)
    this.metricsPromise.promise
    .then(response => {
      const metrics = response.data.metrics;
      const node = metrics.node_cpu_seconds_total.matrix
      // this.state.node.push(metrics.node_cpu_seconds_total.matrix.length.toString());
      for (let j = 0; j < node.length; j++) {
        nodeData.push(node[j].metric.instance)
        const number = 100 - node[j].values.slice(-1)[0][1]*100
        nodeData.push(number)
        nodeData.push('#40a0ff')
        nodeData.push(number.toFixed(3))
        if(this.state.data.length<4)
        this.state.data.push(nodeData)
        nodeData = []

        // this.state.node.push(metrics.node_labels.matrix[j].metric.node);
       }
    });
  }
  
  drawChart(){
    this.nodeTopCPU();
    console.log(this.state.data)


    return (
    <div className={expandedStyle}>
    <Chart
  width={'500px'}
  height={'200px'}
  chartType="BarChart"
  loader={<div>Loading Chart</div>}
  data={this.state.data}
  options={{
    width: 500,
    height: 200,
    bar: { groupWidth: '80%' },
    backgroundColor: '#1e1e1e',
    legend:{ position:'none'},
    tooltip: {isHtml:true}
  }}

/>
</div>

    )
  
}

  render() {
    // if ( this.props.name === 'Node Top CPU') {
    //   this.nodeTopCPU()
    // }
    return (
      <>
      {this.props.name === 'Node Top CPU'? this.drawChart(): <div>{this.state.node}</div>}
      </>
    );
  }
}

export default DashBoardCardContent;