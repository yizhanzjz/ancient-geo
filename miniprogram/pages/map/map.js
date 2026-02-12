const { openLocation } = require('../../utils/api')

Page({
  data: {
    results: [],
    markers: [],
    mapCenter: { latitude: 34.26, longitude: 108.94 },
    mapScale: 5,
    activeResult: null,
    activeMarkerIndex: -1,
    showList: false,
  },

  onLoad() {
    const app = getApp()
    const results = app.globalData.mapResults || []
    const activeIndex = app.globalData.mapActiveIndex || 0

    if (results.length === 0) {
      wx.navigateBack()
      return
    }

    const markers = results.map((r, i) => ({
      id: i,
      latitude: r.latitude,
      longitude: r.longitude,
      title: `${r.ancient_name}（${r.modern_name}）`,
      callout: {
        content: `${r.ancient_name} → ${r.modern_name}`,
        color: '#1a2640',
        bgColor: '#fffbeb',
        borderColor: '#c4a962',
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        display: 'ALWAYS',
        fontSize: 13,
      },
      width: 28,
      height: 36,
    }))

    const active = results[activeIndex] || results[0]

    this.setData({
      results,
      markers,
      activeResult: active,
      activeMarkerIndex: activeIndex,
      mapCenter: {
        latitude: active.latitude,
        longitude: active.longitude,
      },
      mapScale: results.length > 1 ? 5 : 10,
    })

    // If multiple markers, include all in view
    if (results.length > 1) {
      this.includeAllPoints()
    }
  },

  includeAllPoints() {
    const mapCtx = wx.createMapContext('fullMap')
    const points = this.data.results.map(r => ({
      latitude: r.latitude,
      longitude: r.longitude,
    }))
    mapCtx.includePoints({
      points,
      padding: [80, 40, 160, 40],
    })
  },

  onMarkerTap(e) {
    const markerId = e.markerId
    const result = this.data.results[markerId]
    if (result) {
      this.setData({
        activeResult: result,
        activeMarkerIndex: markerId,
        mapCenter: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      })
    }
  },

  onClosePanel() {
    this.setData({ activeResult: null, activeMarkerIndex: -1 })
  },

  onNavigate() {
    if (this.data.activeResult) {
      openLocation(this.data.activeResult)
    }
  },

  onToggleList() {
    this.setData({ showList: !this.data.showList })
  },

  onListItemTap(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    if (result) {
      this.setData({
        activeResult: result,
        activeMarkerIndex: index,
        showList: false,
        mapCenter: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
        mapScale: 12,
      })
    }
  },
})
