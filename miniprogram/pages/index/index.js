const { queryPlace, openLocation } = require('../../utils/api')

Page({
  data: {
    query: '',
    loading: false,
    error: null,
    results: [],
    activeIndex: -1,
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

      // 去重检查
      const exists = this.data.results.some(
        r => r.ancient_name === result.ancient_name && r.modern_name === result.modern_name
      )

      if (!exists) {
        this.setData({
          results: [result, ...this.data.results],
          activeIndex: 0,
        })
      } else {
        // 找到已存在的 index
        const idx = this.data.results.findIndex(
          r => r.ancient_name === result.ancient_name && r.modern_name === result.modern_name
        )
        this.setData({ activeIndex: idx })
      }

      this.setData({ query: '' })
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

  onNavigate(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    if (result) {
      openLocation(result)
    }
  }
})
