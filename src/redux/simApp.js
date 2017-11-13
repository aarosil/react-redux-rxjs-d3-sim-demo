import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs'
import { timer } from 'd3-timer';
import { generatePath } from '../data'

const START_TIMER          = 'aarosil/simApp/START_TIMER';
const STOP_TIMER           = 'aarosil/simApp/STOP_TIMER';
const PAUSE_TIMER          = 'aarosil/simApp/PAUSE_TIMER';
const TICK_TIME            = 'aarosil/simApp/TICK_TIME';
const LOAD_DATA            = 'aarosil/simApp/LOAD_DATA';
const UPDATE_DATA          = 'aarosil/simApp/UPDATE_DATA';
const SET_ACTIVE_POINTS    = 'aarosil/simApp/SET_ACTIVE_POINTS';
const STEP                 = 'aarosil/simApp/STEP';
const SET_TIME_SCALE       = 'aarosil/simApp/SET_TIME_SCALE';
const SET_MIN_NUM_POINTS   = 'aarosil/simApp/SET_MIN_NUM_POINTS';

const initialState = {
  data: [],
  minNumPoints: 100,
  elapsed: 0,
  timeScale: 1
}

export default function (state = initialState, action) {
  switch (action.type) {
    case STOP_TIMER:
      return {
        ...state,
        running: false,
        data: [],
        points: []
      }

    case START_TIMER:
      return {
        ...state,
        running: true
      }

    case PAUSE_TIMER:
      return {
        ...state,
        running: false,
        timestamp: 0
      }

    case TICK_TIME:
      return {
        ...state,
        elapsed: state.elapsed + (action.timestamp - (state.timestamp||0)) * state.timeScale,
        timestamp: action.timestamp
      }

    case UPDATE_DATA:
      return {
        ...state,
        data: action.data
      };

    case SET_ACTIVE_POINTS:
      return {
        ...state,
        points: action.points
      }

    case STEP:
      const jump = (action.forward || -1)*(1000/60)*(state.timeScale)
      return {
        ...state,
        elapsed: state.elapsed + jump
      }

    case SET_TIME_SCALE:
      return {
        ...state,
        timeScale: action.timeScale
      }

    case SET_MIN_NUM_POINTS:
      return {
        ...state,
        minNumPoints: action.minNumPoints
      }

    default:
      return state;
  }
}

export const startTimer  = () => ({ type: START_TIMER })
export const stopTimer   = () => ({ type: STOP_TIMER })
export const pauseTimer  = () => ({ type: PAUSE_TIMER })
export const step            = forward      => ({type: STEP, forward})
export const setTimeScale    = timeScale    => ({type: SET_TIME_SCALE, timeScale})
export const setMinNumPoints = minNumPoints => ({ type: SET_MIN_NUM_POINTS, minNumPoints })
export const loadData        = (paths = 10) => ({
  type: LOAD_DATA,
  newData: Array(paths)
            .fill()
            .map(_ => generatePath())
})

const addPathsToData = (data, offset = 0) =>
  data.map(path =>
    path.reduce((memo, point, index, data) => {
      memo.points.push(point)
      const nextPoint = data[index+1];

      if (!nextPoint) return memo;

      memo.segments.push({
        startX: point.position.x,
        startY: point.position.y,
        endX: nextPoint.position.x,
        endY: nextPoint.position.y,
        startTime: memo.totalTime+1+offset,
        endTime: memo.totalTime + (nextPoint.time - point.time) + offset
      })

      memo.totalTime += (nextPoint.time - point.time)

      return memo;
    }, {
      points: [],
      segments: [],
      totalTime: 0
    })
  )

const loadDataEpic = (action$, {getState}) =>
  action$.ofType(LOAD_DATA)
    .map(({newData}) => {
      const state = getState()
      const offset = state.elapsed || 0
      const data = state.data || []
      return {
        type: UPDATE_DATA,
        data: [...data, ...addPathsToData(newData, offset)]
      }
    })

const tickTimeEpic = (action$, {getState}) =>
  action$.ofType(TICK_TIME, STEP)
    .flatMap(() => {
      const state = getState();
      const { elapsed, data = [], minNumPoints } = state;

      const newData = data
        .reduce((memo, path) => {
          const segment = path.segments.find(({endTime}) => elapsed <= endTime)
          const result = {...path}

          if (segment) {
            const { startX, startY, startTime, endX, endY, endTime } = segment;
            const time = (elapsed - startTime)/(endTime - startTime)

            const activePoint = {
              x: startX + (endX - startX) * time,
              y: startY + (endY - startY) * time
            }

            result.point = activePoint
            memo.push(result)
          }

          return memo;
        }, [])

      const points = newData.map(path => path.point)

      const actions = [
        {type: SET_ACTIVE_POINTS, points},
        {type: UPDATE_DATA, data: newData}
      ]

      const fill =  Math.max(0, minNumPoints - points.length)
      if (fill) actions.push(loadData(fill))

      return actions
    })

const rAFObservable = Observable.create(observer =>
  timer(timestamp => observer.next(timestamp))
)

const runningEpic = action$ =>
  action$.ofType(START_TIMER)
    .switchMap(() => rAFObservable
      .map(timestamp => ({type: TICK_TIME, timestamp}))
      .takeUntil(action$.ofType(STOP_TIMER, PAUSE_TIMER))
    )

export const simAppEpic = combineEpics(
  loadDataEpic,
  runningEpic,
  tickTimeEpic
)