import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

// use this one variable outside of react component hierarchy
// in order to set focus on text field after timer reset
let secondsTextField;

const TimerApp = React.createClass({
  getInitialState(){
    return {
      currentlyEnteredNumber: 0,
      isRunning: false,
      isPaused: false,
      hasRunOut: false,
      startTimestamp: null,
      endTimestamp: null,
      secondsLeft: null,
    }
  },

  componentDidMount(){
    const ENTER = 32;
    document.body.addEventListener('keydown', e => {
      if (e.which === ENTER) this.toggleTimer();
    });
  },

  toggleTimer(){
    if (this.state.isRunning) {
      if (this.state.isPaused) this.resumeTimer();
      else this.pauseTimer();
    }
  },

  changeCurrentlyEnteredNumber(newNumber){
    if (!(Number(newNumber) > 0)) this.setState({currentlyEnteredNumber: 0});
    else this.setState({currentlyEnteredNumber: Number(newNumber)});
  },

  startTimer(){
    if (this.state.currentlyEnteredNumber === 0) return;
    const currentTimestamp = Date.now();
    this.setState({
      isRunning: true,
      startTimestamp: currentTimestamp,
      endTimestamp: currentTimestamp + (this.state.currentlyEnteredNumber * 1000),
      secondsLeft: this.state.currentlyEnteredNumber
    });
    this.nextCycle();
  },

  resetTimer(){
    this.setState({
      currentlyEnteredNumber: null,
      isPaused: false,
      isRunning: false,
      hasRunOut: false,
      startTimestamp: null,
      endTimestamp: null,
      secondsLeft: null,
    }, _ => {
      secondsTextField.focus();
      secondsTextField.value = '';
    });
  },

  pauseTimer(){
    this.pauseStartTimestamp = Date.now();
    this.setState({ isPaused: true });
  },

  resumeTimer(){
    const currentTimestamp = Date.now();
    const difference = currentTimestamp - this.pauseStartTimestamp;
    this.setState({
      isPaused: false,
      startTimestamp: this.state.startTimestamp + difference,
      endTimestamp: this.state.endTimestamp + difference
    });
  },

  nextCycle(){
    setTimeout(_ => {
      if (this.state.isRunning && !this.state.isPaused) {
        const currentTimestamp = Date.now();
        if (currentTimestamp >= this.state.endTimestamp) {
          this.setState({
            secondsLeft: 0,
            hasRunOut: true
          });
          return; // avoids triggering another cycle
        } else {
          this.setState({
            secondsLeft: (this.state.endTimestamp - currentTimestamp) / 1000
          });
        }
      }

      this.nextCycle();
    }, 10);
  },

  render(){
    return (
      <div>

        <InputSecondsContainer
          isRunning={this.state.isRunning}
          startTimer={this.startTimer}
          changeCurrentlyEnteredNumber={this.changeCurrentlyEnteredNumber}
        />

        <p style={{'marginBottom': '10px'}}></p>

        <StartPauseBtn
         hasRunOut={this.state.hasRunOut}
         isRunning={this.state.isRunning}
         isPaused={this.state.isPaused}
         startTimer={this.startTimer}
         pauseTimer={this.pauseTimer}
         resumeTimer={this.resumeTimer}
        />

        <ResetBtn
         resetTimer={this.resetTimer}
        />

        <SVGContainer
         isRunning={this.state.isRunning}
         secondsLeft={this.state.secondsLeft}
         secondsTotal={(this.state.endTimestamp - this.state.startTimestamp) / 1000}
        />

      </div>
    );
  }
});

const InputSecondsContainer = React.createClass({
  render(){
    return (
      <div>
        <InputSecondsTextField
          startTimer={this.props.startTimer}
          isRunning={this.props.isRunning}
          changeCurrentlyEnteredNumber={this.props.changeCurrentlyEnteredNumber}
        />
        <InputSecondsLabel />
      </div>
    );
  }
});

const InputSecondsTextField = React.createClass({
  isEnter(e){
    return e.which === 13;
  },

  handleKeyUp(e){
    const curInputValue = e.target.value;
    if (this.isEnter(e)) {
      this.props.changeCurrentlyEnteredNumber(curInputValue)
      this.props.startTimer();
    }
    else {
      this.props.changeCurrentlyEnteredNumber(curInputValue);
    }
  },

  render(){
    return (
      <input
        onKeyUp={this.handleKeyUp}
        disabled={this.props.isRunning}
        clasName="input-seconds"
        type="text"
        ref={ref => secondsTextField = ref}
      />
      );
  }
});

const InputSecondsLabel = React.createClass({
  render(){
    return (
      <span>seconds</span>
    );
  }
});

const StartPauseBtn = React.createClass({
  render(){
    return (
      <button
        className="btn btn-default"
        disabled={this.props.hasRunOut}
        style={{marginRight: '10px'}}
        onClick={
          this.props.isRunning
          ?
          (this.props.isPaused ? this.props.resumeTimer : this.props.pauseTimer)
          :
          this.props.startTimer
        }
      >
        {
          this.props.isRunning
          ?
          (this.props.isPaused ? 'Resume' : 'Pause')
          :
          'Start'
        }
      </button>
    );
  }
});

const ResetBtn = React.createClass({
  render(){
    return (
      <button
        className="btn btn-default"
        onClick={this.props.resetTimer}
      >
        Reset
      </button>
    );
  }
});

const SecondsLeftLabel = React.createClass({
  render(){
    return (
      <div className="seconds-left">
        {this.props.isRunning ? Math.ceil(this.props.secondsLeft) + ' s' : ''}
      </div>
    );
  }
});

const SVGContainer = React.createClass({
  componentWillMount(){
    this.arc = d3.svg.arc();
    this.arc.startAngle(0);
    this.arc.endAngle(2*Math.PI);
    this.arc.outerRadius(200);
    this.arc.innerRadius(180);
    
    this.staticArcPath = this.arc();
  },

  render(){
    if (this.props.isRunning) {
      this.arc.startAngle((1 - (this.props.secondsLeft / this.props.secondsTotal)) * 2 * Math.PI);
    } else {
      this.arc.startAngle(0);
    }

    return(
      <div className="svg-container">
        <svg height="400" width="400">
          <g transform="translate(200, 200)">
            <path d={this.staticArcPath} fill="#faa" />
            <path d={this.arc()} fill="#fff" />
          </g>
        </svg>
        <SecondsLeftLabel
          isRunning={this.props.isRunning}
          secondsLeft={this.props.secondsLeft}
        />
      </div>
    );
  }
});

ReactDOM.render(<TimerApp />, d3.select('.app-container')[0][0]);
