const { queryPlace, openLocation } = require('../../utils/api')

Page({
  data: {
    query: '',
    loading: false,
    error: null,
    results: [],
    activeIndex: -1,
    mapCenter: { latitude: 34.26, longitude: 108.94 },
    mapScale: 5,
    markers: [],
    examplePlaces: [
      { name: '长安', emoji: '🏯' },
      { name: '临安', emoji: '🌊' },
      { name: '金陵', emoji: '🐉' },
      { name: '汴梁', emoji: '🎏' },
      { name: '洛阳', emoji: '🌸' },
      { name: '姑苏', emoji: '🎐' },
      { name: '襄阳', emoji: '⚔️' },
      { name: '邯郸', emoji: '🏹' },
    ]
  },

  onInput(e) {
    this.setData({ query: e.detail.value })
  },

  async onSearch() {
    const name = this.data.query.trim()
    if (!name || this.data.loading) return

    this.setData({ loading: true, error: null })

    try {
      const result = await queryPlace(name)

      const exists = this.data.results.some(
        r => r.ancient_name === result.ancient_name && r.modern_name === result.modern_name
      )

      let newResults = this.data.results
      let activeIdx = 0

      if (!exists) {
        newResults = [result, ...this.data.results]
      } else {
        activeIdx = this.data.results.findIndex(
          r => r.ancient_name === result.ancient_name && r.modern_name === result.modern_name
        )
      }

      // Update markers
      const markers = newResults.map((r, i) => ({
        id: i,
        latitude: r.latitude,
        longitude: r.longitude,
        title: `${r.ancient_name}（${r.modern_name}）`,
        callout: {
          content: `${r.ancient_name} → ${r.modern_name}`,
          color: '#1a2640',
          bgColor: '#fffbeb',
          borderColor: '#d97706',
          borderWidth: 1,
          borderRadius: 8,
          padding: 6,
          display: 'ALWAYS',
          fontSize: 12,
        },
        width: 28,
        height: 36,
      }))

      this.setData({
        results: newResults,
        activeIndex: activeIdx,
        query: '',
        markers,
        mapCenter: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
        mapScale: 10,
      })
    } catch (err) {
      this.setData({ error: err.message || '查询失败' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTagTap(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ query: name })
    this.onSearch()
  },

  onResultTap(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      activeIndex: this.data.activeIndex === index ? -1 : index
    })
  },

  onLocateOnMap(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    if (result) {
      this.setData({
        mapCenter: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
        mapScale: 12,
        activeIndex: index,
      })
      // Scroll to top to see map
      wx.pageScrollTo({ scrollTop: 0, duration: 300 })
    }
  },

  onNavigate(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    if (result) {
      openLocation(result)
    }
  },

  onOpenFullMap() {
    // Pass results to map page via global data or event channel
    const app = getApp()
    app.globalData.mapResults = this.data.results
    app.globalData.mapActiveIndex = this.data.activeIndex
    wx.navigateTo({ url: '/pages/map/map' })
  },
})
