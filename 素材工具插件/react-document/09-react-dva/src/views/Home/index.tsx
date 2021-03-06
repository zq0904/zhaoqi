import React, { FC } from 'react'
// import { connect } from 'dva'
import { connect } from 'react-redux' // dva中使用react-redux@5.0.7版本
import type { ConnectedProps } from 'react-redux' // @types/react-redux@7.1.9
import { Link, routerRedux } from 'dva/router'
import { State, Action } from '../../types'

// ownProps 默认会透传 类型需要处理下
type OwnProps = {}

const mapStateToProps = (state: State, ownProps: OwnProps) => ({
  globalState: state.Global,
  homeState: state.Home,

})

const connector = connect(mapStateToProps)

type PropsFromRedux = ConnectedProps<typeof connector> & OwnProps

const Home: FC<PropsFromRedux> = ({ dispatch, globalState, homeState }) => {
  
  const handleJump = () => {
    // 由于dva使用的是 react-router-redux 强耦合导航跳转使用dispatch(action)
    dispatch<Action>(routerRedux.push({
      pathname: '/foo/456',
      search: 'a=2',
    }))
  }

  return (
    <>
      <h2>Home</h2>
      <Link to={{
        pathname: '/foo/123',
        search: 'a=1'
      }}>link 到 foo</Link>&nbsp;&nbsp;
      <button onClick={handleJump}>js 路由导航跳转到 foo</button>&nbsp;&nbsp;
      {/* 
        总结
          1. hash路由 可以使用qs 只不过该qs在hash后面（如果加到hash前页面会刷新）
          react-router@2.x push({ query: { a: 1 } })
          react-router@3.x push({ search: 'a=1' })
      */}
      <button onClick={() => {
        dispatch<Action>({
          type: 'Home/setState',
          payload: {
            list: [
              ...homeState.list,
              {
                text: '测试同步新增',
                id: 9999,
                complete: false,
              }
            ]
          }
        })
      }}>同步操作</button>&nbsp;&nbsp;
      <button onClick={() => {
        dispatch<Action>({ type: 'Home/getListInfo' })
      }}>异步操作</button>
      <pre>
        <p>globalState：{ JSON.stringify(globalState, null, 2) }</p>
        <p>homeState：{ JSON.stringify(homeState, null, 2) }</p>
      </pre>
    </>
  )
}

export default connector(Home)
