import React, { Component } from 'react';
import { connect } from 'react-redux';
import { scaleLinear } from 'd3-scale';
import * as simAppActions from './redux/simApp';
import './SpeedSimApp.css';

const PATH_BOUNDING_SIZE = {
  WIDTH: 1000000,
  HEIGHT: 1000000
}

class SpeedSimApp extends Component {
  constructor(props) {
    super(props);
    this.state = {width: 0, height: 0};
    this.measure = this.measure.bind(this);
  }

  componentDidMount() {
    this.measure()
    window.addEventListener('resize', this.measure)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.measure)
  }

  measure() {
    const width = this.containerEl.offsetWidth;
    const height = window.innerHeight - 10
    this.xScale = scaleLinear().domain([0, PATH_BOUNDING_SIZE.WIDTH]).range([0, width])
    this.yScale = scaleLinear().domain([0, PATH_BOUNDING_SIZE.HEIGHT]).range([0, height])
    this.setState({width, height})
  }

  render() {
    const { points, running, startTimer, stopTimer, pauseTimer, loadData, timeScale, setTimeScale, step, setMinNumPoints, minNumPoints } = this.props;
    const { width, height } = this.state;

    return (
      <div className='container'>
        <div ref={el => this.containerEl = el}>
          <svg width={width} height={height}>
            {
              points.map(({x, y}) =>
                <circle
                  key={`${x}${y}`}
                  cx={this.xScale(x)}
                  cy={this.yScale(y)}
                  fill='black'
                  stroke='black' r='5' />
              )
            }
            <rect fill='magenta' x={width-5} y={height-5} width='5' height='5' />
          </svg>
        </div>
        <div className='control_container'>
          <div className='button_row'>
            <button onClick={running ? pauseTimer : startTimer}>{running ? 'pause' : 'start'}</button>
            <button onClick={stopTimer}>stop</button>
            {
              !running && !!points.length &&
                <div>
                <button key={'1'} onClick={() => step()} disabled={running}>step back</button>
                <button key={'2'} onClick={() => step(true)} disabled={running}>step ahead</button>
                </div>
            }
            <div>
              <label className='label'> speed:
              <select onChange={e => setTimeScale(Number(e.target.value))} value={timeScale}>
                <option value={2}>2x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.25}>1.25x</option>
                <option value={1}>1x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.25}>0.25x</option>
                <option value={0.1}>0.1x</option>
              </select>
              </label>
            </div>
          </div>
          <div className='right_controls'>
            <div>
              <label className='label'> min # auto-generated:
                <input value={minNumPoints} onChange={e => setMinNumPoints(Number(e.target.value))} type='text'/>
              </label>
            </div>
            <div>
              <label className='label'> button loads how many:
                <input ref={el => this.input=el} type='text' defaultValue={5} />
              </label>
            </div>
            <div>
              <button onClick={() => loadData(Number(this.input.value))}>{`load ${this.input ? this.input.value : '' } ${points.length ?  `more ` : '' }points`}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { running, points = [], timeScale, minNumPoints } = state;

  return {
    running,
    points,
    timeScale,
    minNumPoints
  }
}

export default connect(mapStateToProps, simAppActions)(SpeedSimApp);
