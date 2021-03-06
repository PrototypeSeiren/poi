import React, { Component } from 'react'
import { shell } from 'electron'
import Divider from './divider'
import { Grid, Col, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { sync as globSync } from 'glob'

const {ROOT, POI_VERSION, CONST, i18n} = window
const __ = i18n.setting.__.bind(i18n.setting)

const serverList = [
  "https://poi.io/fcd/",
  "https://raw.githubusercontent.com/poooi/poi/master/assets/data/fcd/",
  "http://7xj6zx.com1.z0.glb.clouddn.com/",
]

const fetchHeader = new Headers()
fetchHeader.set("Cache-Control", "max-age=0")

const fetchFromRemote = async (url, cacheMode = "default") => {
  const res = await fetch(url, {method: "GET", cache: cacheMode, headers: fetchHeader}).catch(e => e)
  if (res.status === 200) {
    try {
      return await res.json()
    } catch (e) {
      return
    }
  }
}

const initState = {}

const Others = connect(state => ({
  version: state.fcd.version || initState,
}))(class others extends Component {
  updateData = (cacheMode = 'default') => async () => {
    // Update from local
    const localFileList = globSync(`${ROOT}/assets/data/fcd/*`)
    for (const file of localFileList) {
      if (!file.includes('meta.json')) {
        const data = require(file)
        const version = get(data, 'meta.version')
        const name = get(data, 'meta.name')
        if (name && version) {
          const localVersion = get(this.props.version, name, '1970/01/01/01')
          if (version > localVersion) {
            this.props.dispatch({
              type: '@@updateFCD',
              value: data,
            })
          }
        }
      }
    }
    // Update from server
    let flag
    for (const server of serverList) {
      flag = true
      const fileList = await fetchFromRemote(`${server}meta.json`, cacheMode)
      if (fileList) {
        for (const file of fileList) {
          const localVersion = get(this.props.version, file.name, '1970/01/01/01')
          if (file.version > localVersion) {
            console.log(`Updating ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`)
            const data = await fetchFromRemote(`${server}${file.name}.json`, cacheMode)
            if (data) {
              this.props.dispatch({
                type: '@@updateFCD',
                value: data,
              })
            } else {
              flag = false
            }
          } else {
            console.log(`No newer version of ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`)
          }
        }
      } else {
        flag = false
      }
      if (flag) {
        console.log(`Update fcd from ${server} successfully in mode ${cacheMode}.`)
        break
      } else {
        console.warn(`Update fcd from ${server} failed in mode ${cacheMode}.`)
      }
    }
  }
  componentDidMount() {
    this.updateData()()
  }
  render() {
    const fcds = Object.keys(this.props.version || {}).map(key => [key, this.props.version[key]])
    return (
      <div id='poi-others'>
        <Grid>
          <Col xs={12}>
            <img src={`file://${ROOT}/assets/img/logo.png`} style={{width: '100%'}} />
            <p>{__("poi-description %s %s", POI_VERSION, process.versions.electron)}</p>
            {
              (window.language === "zh-CN" || window.language === "zh-TW") ?
                <div>
                  <p>微博: <a href='http://weibo.com/letspoi'>  今天 poi 出新版本了吗 </a></p>
                  <p>开发讨论与意见交流群: 378320628 </p>
                </div>
              :
              null
            }
            <p>{__("Database")}:<a href='http://db.kcwiki.moe'> http://db.kcwiki.moe </a></p>
            <p>{__("Wiki")}: <a href='https://github.com/poooi/poi/wiki'> https://github.com/poooi/poi/wiki </a></p>
            <p>GitHub：<a href='https://github.com/poooi/poi'> https://github.com/poooi/poi </a></p>
          </Col>
        </Grid>
        <Divider text={__("Data version")} />
        <Grid>
          <Col xs={12}>
            {
              fcds.map(fcd => (
                fcd ? <p key={fcd[0]}>{`${fcd[0]}: ${fcd[1]}`}</p> : null
              ))
            }
          </Col>
          <Col xs={12}>
            <Button onClick={this.updateData('reload')}>
              {__("Update data")}
            </Button>
          </Col>
        </Grid>
        <Divider text="Contributors" />
        <Grid>
        {
          CONST.contributors.map((e, i) => (
            <Col xs={2} key={i}>
              <img className="avatar-img" src={e.avatar} onClick={shell.openExternal.bind(this, e.link)} title={e.name} />
            </Col>
          ))
        }
        </Grid>
        <Divider text="Thanks To" />
        <Grid className='thanks-to'>
        {
          CONST.thanksTo.map((e, i) => (
            <div className="div-row thanks-to-item" key={i}>
              <div className='thanks-to-img-container'>
                <img className="thanks-to-img" src={e.avatar} style={e.extraCSS} onClick={shell.openExternal.bind(this, e.link)} title={e.name} />
              </div>
              <div className='thanks-to-container'>
                <b>{e.name}</b>
                <p>{e.description}</p>
              </div>
            </div>
          ))
        }
        </Grid>
      </div>
    )
  }
})

export default Others
