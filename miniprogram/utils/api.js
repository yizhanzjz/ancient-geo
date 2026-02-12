const app = getApp()

/**
 * 查询古代地名
 * @param {string} ancientName 古代地名
 * @returns {Promise<object>} 查询结果
 */
function queryPlace(ancientName) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/query`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { ancient_name: ancientName },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          const msg = res.data?.detail || `查询失败 (${res.statusCode})`
          reject(new Error(msg))
        }
      },
      fail(err) {
        reject(new Error('网络错误，请检查网络连接'))
      }
    })
  })
}

/**
 * 打开地图导航
 * @param {object} result 查询结果
 */
function openLocation(result) {
  wx.openLocation({
    latitude: result.latitude,
    longitude: result.longitude,
    name: `${result.ancient_name}（${result.modern_name}）`,
    address: `${result.province} ${result.modern_name}`,
    scale: 12
  })
}

module.exports = {
  queryPlace,
  openLocation
}
