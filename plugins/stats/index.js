// stats plugin — right-panel statistics panel
// Stores configs in localStorage, queries items via context.query(),
// evaluates custom expressions, renders collapsible result cards.
exports.default = function (Vue) {
  var h = Vue.h
  var ref = Vue.ref
  var onMounted = Vue.onMounted

  var STORAGE_KEY = 'index-plugin-stats-configs'

  // ── Inject CSS ──
  if (!document.getElementById('index-stats-css')) {
    var style = document.createElement('style')
    style.id = 'index-stats-css'
    style.textContent = [
      '.stats { padding: 12px 0; font-size: var(--fs-sm); }',
      '.stats-header { display:flex; align-items:center; justify-content:space-between; padding:0 16px 8px; }',
      '.stats-title { font-weight:var(--fw-semibold); font-size:var(--fs-md); }',
      '.stats-header-actions { display:flex; align-items:center; gap:6px; }',
      '.stats-loading { font-size:12px; }',
      '.stats-btn-refresh,.stats-btn-add { font-size:var(--fs-xs); border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface); color:var(--text-secondary); cursor:pointer; padding:2px 8px; }',
      '.stats-btn-refresh:hover,.stats-btn-add:hover { background:var(--surface-hover); color:var(--accent); }',
      '.stats-btn-icon { border:none; background:none; cursor:pointer; font-size:13px; padding:0 2px; opacity:0.5; }',
      '.stats-btn-icon:hover { opacity:1; }',
      '.stats-card { margin:0 8px 6px; border:1px solid var(--border); border-radius:var(--r-md); overflow:hidden; }',
      '.stats-card-hd { display:flex; align-items:center; gap:6px; padding:6px 10px; cursor:pointer; user-select:none; transition:background var(--fast); }',
      '.stats-card-hd:hover { background:var(--surface-hover); }',
      '.stats-card-toggle { font-size:10px; color:var(--text-muted); width:14px; text-align:center; }',
      '.stats-card-title { font-weight:var(--fw-medium); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.stats-card-value { font-weight:var(--fw-semibold); color:var(--accent); font-size:var(--fs-md); margin-right:4px; }',
      '.stats-card-actions { display:flex; gap:0; }',
      '.stats-card-error { color:var(--danger); font-size:var(--fs-xs); padding:4px 10px 8px; }',
      '.stats-card-body { padding:4px 10px 10px; border-top:1px solid var(--border); }',
      '.stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(70px,1fr)); gap:6px; }',
      '.stats-item { background:var(--bg); border-radius:var(--r-sm); padding:6px; text-align:center; }',
      '.stats-num { display:block; font-weight:var(--fw-semibold); font-size:var(--fs-md); color:var(--text); }',
      '.stats-lbl { display:block; font-size:10px; color:var(--text-muted); margin-top:2px; }',
      '.stats-expr-result { padding:4px 0 8px; text-align:center; }',
      '.stats-expr-label { color:var(--text-muted); font-size:var(--fs-xs); }',
      '.stats-expr-value { font-weight:var(--fw-bold); font-size:var(--fs-lg); color:var(--accent); }',
      '.stats-matched { color:var(--text-muted); font-size:var(--fs-xs); text-align:center; padding-top:6px; }',
      '.stats-edit { padding:0 16px 12px; }',
      '.stats-edit-back { color:var(--accent); cursor:pointer; font-size:var(--fs-xs); margin-bottom:8px; display:inline-block; }',
      '.stats-edit-back:hover { text-decoration:underline; }',
      '.stats-label { display:block; font-size:var(--fs-xs); font-weight:var(--fw-semibold); color:var(--text-muted); margin:8px 0 4px; }',
      '.stats-label-hint { font-weight:var(--fw-normal); color:var(--text-muted); font-size:10px; }',
      '.stats-input { width:100%; font-size:var(--fs-xs); padding:4px 8px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg); color:var(--text); box-sizing:border-box; }',
      '.stats-input:focus { border-color:var(--accent); outline:none; }',
      '.stats-textarea { width:100%; font-size:var(--fs-xs); padding:4px 8px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg); color:var(--text); resize:vertical; box-sizing:border-box; font-family:monospace; }',
      '.stats-textarea:focus { border-color:var(--accent); outline:none; }',
      '.stats-error { color:var(--danger); font-size:var(--fs-xs); margin-top:6px; }',
      '.stats-edit-actions { display:flex; gap:6px; margin-top:10px; }',
      '.stats-btn-save { font-size:var(--fs-xs); padding:4px 16px; border:none; border-radius:var(--r-sm); background:var(--accent); color:var(--accent-fg); cursor:pointer; }',
      '.stats-btn-save:hover { opacity:0.9; }',
      '.stats-btn-cancel { font-size:var(--fs-xs); padding:4px 16px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface); color:var(--text-secondary); cursor:pointer; }',
      '.stats-btn-cancel:hover { background:var(--surface-hover); }',
      '.stats-empty { text-align:center; padding:24px 16px; color:var(--text-muted); }',
      '.stats-empty-hint { font-size:var(--fs-xs); margin-top:4px; }'
    ].join('\n')
    document.head.appendChild(style)
  }

  return {
    props: ['context'],

    setup: function (props) {
      var ctx = props.context

      // ── State ──
      var configs = ref([])              // [{id, title, filter, extract, expression}]
      var results = ref({})              // {id: {count, sum, avg, min, max, values, error}}
      var editingId = ref(null)          // 'new' or config id
      var expandedIds = ref(new Set())   // expanded card ids
      var loading = ref(false)

      // ── Edit form state ──
      var editTitle = ref('')
      var editFilter = ref('')
      var editExtract = ref('')
      var editExpression = ref('')
      var editError = ref('')

      // ── Persistence ──
      function loadConfigs() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY)
          if (raw) { configs.value = JSON.parse(raw) }
        } catch (e) { /* ignore */ }
      }
      function saveConfigs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configs.value))
      }

      // ── Expression evaluator ──
      function computeStats(values) {
        var nums = []
        for (var i = 0; i < values.length; i++) {
          var v = values[i]
          if (v !== null && v !== undefined && v !== '') {
            var n = Number(v)
            if (!isNaN(n)) nums.push(n)
          }
        }
        var count = values.length
        var sum = 0; for (var j = 0; j < nums.length; j++) sum += nums[j]
        var avg = nums.length > 0 ? sum / nums.length : 0
        var min = nums.length > 0 ? Math.min.apply(null, nums) : 0
        var max = nums.length > 0 ? Math.max.apply(null, nums) : 0
        return { count: count, sum: sum, avg: avg, min: min, max: max, nums: nums }
      }

      function evalExpression(expr, stats) {
        if (!expr || !expr.trim()) return null
        var s = expr.trim()
        // Replace tokens with values
        s = s.replace(/count/g, stats.count)
        s = s.replace(/sum/g, stats.sum)
        s = s.replace(/avg/g, stats.avg)
        s = s.replace(/min/g, stats.min)
        s = s.replace(/max/g, stats.max)
        // Safety: only allow digits, operators, parens, dots, whitespace
        if (!/^[\d\s+\-*/().]+$/.test(s)) return null
        try {
          var result = Function('"use strict"; return (' + s + ')')()
          return Number.isFinite(result) ? Math.round(result * 100) / 100 : null
        } catch (e) {
          return null
        }
      }

      // ── Query & calculate ──
      async function refreshConfig(id) {
        var cfg = configs.value.find(function (c) { return c.id === id })
        if (!cfg) return
        try {
          var filterObj = cfg.filter
          if (typeof filterObj === 'string') {
            try { filterObj = JSON.parse(filterObj) } catch (e) { filterObj = null }
          }
          if (!filterObj) {
            results.value[id] = { error: '筛选条件格式错误' }; return
          }
          var extractField = cfg.extract || ''
          var params = { filter: filterObj }
          if (extractField) params.extract = [extractField]
          var res = await ctx.query(params)
          // Extract values
          var values = []
          if (extractField && res.extracted) {
            var ids = Object.keys(res.extracted)
            for (var i = 0; i < ids.length; i++) {
              var v = res.extracted[ids[i]]
              if (v && v[extractField] !== undefined) {
                values.push(v[extractField])
              }
            }
          }
          var stats = computeStats(values)
          var exprResult = evalExpression(cfg.expression || '', stats)
          results.value[id] = {
            count: stats.count, sum: stats.sum, avg: stats.avg,
            min: stats.min, max: stats.max, nums: stats.nums,
            exprResult: exprResult, error: null, total: res.total
          }
        } catch (e) {
          results.value[id] = { error: e.message || '查询失败' }
        }
      }

      async function refreshAll() {
        loading.value = true
        try {
          for (var i = 0; i < configs.value.length; i++) {
            await refreshConfig(configs.value[i].id)
          }
        } finally {
          loading.value = false
        }
      }

      // ── CRUD ──
      function startAdd() {
        editingId.value = 'new'
        editTitle.value = ''
        editFilter.value = ''
        editExtract.value = ''
        editExpression.value = ''
        editError.value = ''
      }
      function startEdit(id) {
        var cfg = configs.value.find(function (c) { return c.id === id })
        if (!cfg) return
        editingId.value = id
        editTitle.value = cfg.title || ''
        editFilter.value = typeof cfg.filter === 'string' ? cfg.filter : JSON.stringify(cfg.filter || {}, null, 2)
        editExtract.value = cfg.extract || ''
        editExpression.value = cfg.expression || ''
        editError.value = ''
      }
      function cancelEdit() {
        editingId.value = null
        editError.value = ''
      }
      function saveEdit() {
        editError.value = ''
        if (!editTitle.value.trim()) { editError.value = '请输入标题'; return }
        var filterObj
        try {
          filterObj = JSON.parse(editFilter.value || '{}')
        } catch (e) {
          editError.value = '筛选条件JSON格式错误: ' + e.message; return
        }
        if (editingId.value === 'new') {
          var id = 's_' + Date.now()
          configs.value.push({
            id: id, title: editTitle.value.trim(), filter: filterObj,
            extract: editExtract.value.trim(), expression: editExpression.value.trim()
          })
          saveConfigs()
          editingId.value = null
          refreshConfig(id)
        } else {
          var cfg = configs.value.find(function (c) { return c.id === editingId.value })
          if (cfg) {
            cfg.title = editTitle.value.trim()
            cfg.filter = filterObj
            cfg.extract = editExtract.value.trim()
            cfg.expression = editExpression.value.trim()
            saveConfigs()
            editingId.value = null
            refreshConfig(cfg.id)
          }
        }
      }
      function deleteConfig(id) {
        configs.value = configs.value.filter(function (c) { return c.id !== id })
        delete results.value[id]
        saveConfigs()
      }
      function toggleExpand(id) {
        var s = new Set(expandedIds.value)
        if (s.has(id)) s.delete(id); else s.add(id)
        expandedIds.value = s
      }

      // ── Lifecycle ──
      onMounted(function () {
        loadConfigs()
        if (configs.value.length > 0) refreshAll()
      })

      // ── Format helpers ──
      function fmt(n) { return Number.isFinite(n) ? Math.round(n * 100) / 100 : '-' }
      function hasCustomExpr(cfg) { return cfg && cfg.expression && cfg.expression.trim() }

      // ── Render ──
      return function () {
        var children = []

        // Header
        children.push(
          h('div', { class: 'stats-header' }, [
            h('span', { class: 'stats-title' }, '📊 统计'),
            h('div', { class: 'stats-header-actions' }, [
              loading.value && h('span', { class: 'stats-loading' }, '⏳'),
              h('button', { class: 'stats-btn-refresh', onClick: refreshAll, title: '刷新全部' }, '🔄'),
              h('button', { class: 'stats-btn-add', onClick: startAdd }, '+ 新建')
            ])
          ])
        )

        // Edit form
        if (editingId.value) {
          children.push(
            h('div', { class: 'stats-edit' }, [
              h('div', { class: 'stats-edit-back', onClick: cancelEdit }, '← 返回'),
              h('label', { class: 'stats-label' }, '标题'),
              h('input', { class: 'stats-input', value: editTitle.value, onInput: function (e) { editTitle.value = e.target.value }, placeholder: '统计标题' }),
              h('label', { class: 'stats-label' }, '筛选条件（JSON）'),
              h('textarea', { class: 'stats-textarea', value: editFilter.value, onInput: function (e) { editFilter.value = e.target.value }, placeholder: '{\n  "and": [\n    {"field": "type", "op": "=", "value": "ledge"}\n  ]\n}', rows: 6 }),
              h('label', { class: 'stats-label' }, '提取字段'),
              h('input', { class: 'stats-input', value: editExtract.value, onInput: function (e) { editExtract.value = e.target.value }, placeholder: 'rating' }),
              h('label', { class: 'stats-label' }, [
                '计算表达式 ',
                h('span', { class: 'stats-label-hint' }, '可用: count sum avg min max + 数字 + - * / ( ) 例: 2100 - sum')
              ]),
              h('input', { class: 'stats-input', value: editExpression.value, onInput: function (e) { editExpression.value = e.target.value }, placeholder: 'avg（留空则显示全部统计）' }),
              editError.value && h('div', { class: 'stats-error' }, editError.value),
              h('div', { class: 'stats-edit-actions' }, [
                h('button', { class: 'stats-btn-save', onClick: saveEdit }, '保存'),
                h('button', { class: 'stats-btn-cancel', onClick: cancelEdit }, '取消')
              ])
            ])
          )
        }

        // Config cards
        for (var i = 0; i < configs.value.length; i++) {
          var cfg = configs.value[i]
          var res = results.value[cfg.id]
          var isExpanded = expandedIds.value.has(cfg.id)
          var mainResult = null
          if (res && !res.error) {
            mainResult = hasCustomExpr(cfg) ? res.exprResult : res.avg
          }

          children.push(
            h('div', { class: 'stats-card', key: cfg.id }, [
              // Card header (always visible)
              h('div', { class: 'stats-card-hd', onClick: function () { toggleExpand(cfg.id) } }, [
                h('span', { class: 'stats-card-toggle' }, isExpanded ? '▼' : '▶'),
                h('span', { class: 'stats-card-title' }, cfg.title),
                mainResult !== null && h('span', { class: 'stats-card-value' }, fmt(mainResult)),
                h('div', { class: 'stats-card-actions' }, [
                  h('button', { class: 'stats-btn-icon', onClick: function (e) { e.stopPropagation(); refreshConfig(cfg.id) }, title: '刷新' }, '🔄'),
                  h('button', { class: 'stats-btn-icon', onClick: function (e) { e.stopPropagation(); startEdit(cfg.id) }, title: '设置' }, '⚙️'),
                  h('button', { class: 'stats-btn-icon', onClick: function (e) { e.stopPropagation(); deleteConfig(cfg.id) }, title: '删除' }, '🗑️')
                ])
              ]),

              // Error
              res && res.error && h('div', { class: 'stats-card-error' }, '❌ ' + res.error),

              // Expanded body
              isExpanded && res && !res.error && h('div', { class: 'stats-card-body' }, [
                // Custom expression result
                hasCustomExpr(cfg) && h('div', { class: 'stats-expr-result' }, [
                  h('span', { class: 'stats-expr-label' }, cfg.expression + ' = '),
                  h('span', { class: 'stats-expr-value' }, res.exprResult !== null ? fmt(res.exprResult) : '计算失败')
                ]),
                // Stat cards
                h('div', { class: 'stats-grid' }, [
                  h('div', { class: 'stats-item' }, [h('span', { class: 'stats-num' }, res.count), h('span', { class: 'stats-lbl' }, '条目数')]),
                  h('div', { class: 'stats-item' }, [h('span', { class: 'stats-num' }, fmt(res.sum)), h('span', { class: 'stats-lbl' }, '总和')]),
                  h('div', { class: 'stats-item' }, [h('span', { class: 'stats-num' }, fmt(res.avg)), h('span', { class: 'stats-lbl' }, '平均')]),
                  h('div', { class: 'stats-item' }, [h('span', { class: 'stats-num' }, fmt(res.max)), h('span', { class: 'stats-lbl' }, '最大')]),
                  h('div', { class: 'stats-item' }, [h('span', { class: 'stats-num' }, fmt(res.min)), h('span', { class: 'stats-lbl' }, '最小')])
                ]),
                // Matched count
                h('div', { class: 'stats-matched' }, '匹配：' + (res.total !== undefined ? res.total : res.count) + ' 个条目')
              ])
            ])
          )
        }

        // Empty state
        if (configs.value.length === 0 && !editingId.value) {
          children.push(
            h('div', { class: 'stats-empty' }, [
              h('p', null, '暂无统计配置'),
              h('p', { class: 'stats-empty-hint' }, '点击 "+ 新建" 创建第一个统计')
            ])
          )
        }

        return h('div', { class: 'stats' }, children)
      }
    }
  }
}
