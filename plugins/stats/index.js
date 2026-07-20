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
      '.stats-empty-hint { font-size:var(--fs-xs); margin-top:4px; }',
      '.stats-var-badge { display:inline-block; font-size:10px; background:var(--accent-subtle); color:var(--accent); padding:0 5px; border-radius:var(--r-sm); margin-left:4px; vertical-align:middle; }',
      '.stats-mode-toggle { display:flex; gap:0; border:1px solid var(--border); border-radius:var(--r-sm); overflow:hidden; margin-bottom:8px; }',
      '.stats-mode-btn { flex:1; padding:4px 8px; font-size:var(--fs-xs); border:none; background:var(--bg); color:var(--text-secondary); cursor:pointer; }',
      '.stats-mode-btn.active { background:var(--accent); color:var(--accent-fg); }',
      '.stats-mode-btn:first-child { border-right:1px solid var(--border); }'
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
      var cache = ref(null)              // { varName: number } loaded from .index

      // ── Edit form state ──
      var editTitle = ref('')
      var editFilter = ref('')
      var editExtract = ref('')
      var editExpression = ref('')
      var editError = ref('')
      var editMode = ref('query')          // 'query' | 'compute'
      var editVarName = ref('')

      // ── Persistence (per-repo via .index/plugin-cache/stats.json) ──
      async function loadData() {
        try {
          var data = await ctx.readCache()
          if (data && data.configs && Array.isArray(data.configs)) {
            configs.value = data.configs
          }
          if (data && data.cache) {
            cache.value = data.cache
          }
        } catch (e) { /* ignore */ }
        // Migration: if nothing loaded from .index, try old localStorage
        if (configs.value.length === 0) {
          try {
            var raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
              configs.value = JSON.parse(raw)
              localStorage.removeItem(STORAGE_KEY)
            }
          } catch (e) { /* ignore */ }
        }
      }
      async function saveData(variables) {
        var data = { configs: configs.value }
        if (variables) {
          var clean = {}
          var keys = Object.keys(variables)
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i]
            var v = variables[k]
            if (v !== undefined && v !== null && isFinite(v)) {
              clean[k] = v
            }
          }
          data.cache = clean
          cache.value = clean
        }
        try { await ctx.writeCache(data) } catch (e) { /* ignore */ }
      }

      // ── Dependency graph ──
      function buildDepGraph(cfgs) {
        var graph = {}          // id -> { varName, deps: [varNames], config }
        var varNames = {}        // varName -> id (for duplicate + lookup)
        var varToId = {}         // varName -> id (for topo deps)

        // Pass 1: register varNames, detect duplicates
        for (var i = 0; i < cfgs.length; i++) {
          var c = cfgs[i]
          if (c.varName) {
            if (varNames[c.varName] && varNames[c.varName] !== c.id) {
              throw new Error('变量名 "' + c.varName + '" 重复，请修改其中一个')
            }
            varNames[c.varName] = c.id
          }
        }

        // Pass 2: extract $var dependencies
        for (var i = 0; i < cfgs.length; i++) {
          var c = cfgs[i]
          var deps = []
          var expr = c.expression || ''
          var matches = expr.match(/\$(\w+)/g)
          if (matches) {
            for (var j = 0; j < matches.length; j++) {
              var vn = matches[j].slice(1)
              if (!varNames[vn]) {
                throw new Error('变量 "$' + vn + '" 未定义（在配置 "' + (c.title || c.id) + '" 中）')
              }
              if (deps.indexOf(vn) === -1) deps.push(vn)
            }
          }
          graph[c.id] = { varName: c.varName || null, deps: deps, config: c }
        }

        return { graph: graph, varNames: varNames }
      }

      function topoSort(graph) {
        // Kahn's algorithm
        var ids = Object.keys(graph)
        var inDegree = {}
        var dependents = {}   // varName -> [dependent config ids]

        for (var i = 0; i < ids.length; i++) {
          inDegree[ids[i]] = 0
        }
        for (var i = 0; i < ids.length; i++) {
          var node = graph[ids[i]]
          for (var j = 0; j < node.deps.length; j++) {
            inDegree[ids[i]]++
            var depVar = node.deps[j]
            if (!dependents[depVar]) dependents[depVar] = []
            dependents[depVar].push(ids[i])
          }
        }

        var queue = []
        for (var i = 0; i < ids.length; i++) {
          if (inDegree[ids[i]] === 0) queue.push(ids[i])
        }

        var sorted = []
        while (queue.length > 0) {
          var id = queue.shift()
          sorted.push(id)
          var vn = graph[id].varName
          if (vn && dependents[vn]) {
            for (var j = 0; j < dependents[vn].length; j++) {
              var depId = dependents[vn][j]
              inDegree[depId]--
              if (inDegree[depId] === 0) queue.push(depId)
            }
          }
        }

        if (sorted.length !== ids.length) {
          throw new Error('检测到循环依赖，请检查变量引用')
        }
        return sorted
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

      function evalExpression(expr, stats, variables) {
        if (!expr || !expr.trim()) return null
        var s = expr.trim()
        // Replace built-in stats tokens
        s = s.replace(/\bcount\b/g, stats.count)
        s = s.replace(/\bsum\b/g, stats.sum)
        s = s.replace(/\bavg\b/g, stats.avg)
        s = s.replace(/\bmin\b/g, stats.min)
        s = s.replace(/\bmax\b/g, stats.max)
        // Replace $variable references
        s = s.replace(/\$(\w+)/g, function (_, name) {
          var v = variables ? variables[name] : undefined
          return (v !== undefined && v !== null && isFinite(v)) ? String(v) : 'NaN'
        })
        // Safety: only allow digits, operators, parens, dots, whitespace
        if (!/^[\d\s+\-*/().]+$/.test(s)) return null
        try {
          var result = Function('"use strict"; return (' + s + ')')()
          return Number.isFinite(result) ? Math.round(result * 100) / 100 : null
        } catch (e) {
          return null
        }
      }

      // ── Query & calculate (single config) ──
      async function refreshOne(cfg, variables) {
        try {
          var filterObj = cfg.filter
          if (typeof filterObj === 'string') {
            try { filterObj = JSON.parse(filterObj) } catch (e) { filterObj = null }
          }
          // Compute-only mode: skip query, evaluate expression with variables only
          if (cfg.mode === 'compute') {
            var stats = { count: 0, sum: 0, avg: 0, min: 0, max: 0, nums: [] }
            var exprResult = evalExpression(cfg.expression || '', stats, variables)
            if (cfg.varName && exprResult !== null) variables[cfg.varName] = exprResult
            results.value[cfg.id] = {
              count: 0, sum: 0, avg: 0, min: 0, max: 0, nums: [],
              exprResult: exprResult, error: null, total: 0
            }
            return
          }

          var params = {}
          var extractField = cfg.extract || ''
          if (filterObj) params.filter = filterObj
          if (extractField) params.extract = [extractField]
          else params.extract = []

          var res = await ctx.query(params)
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
          var exprResult = evalExpression(cfg.expression || '', stats, variables)
          if (cfg.varName && exprResult !== null) variables[cfg.varName] = exprResult
          results.value[cfg.id] = {
            count: stats.count, sum: stats.sum, avg: stats.avg,
            min: stats.min, max: stats.max, nums: stats.nums,
            exprResult: exprResult, error: null, total: res.total
          }
        } catch (e) {
          results.value[cfg.id] = { error: e.message || '查询失败' }
        }
      }

      async function refreshAll() {
        loading.value = true
        try {
          var cfgs = configs.value
          var dg = buildDepGraph(cfgs)
          var order = topoSort(dg.graph)
          var variables = cache.value ? Object.assign({}, cache.value) : {}

          for (var i = 0; i < order.length; i++) {
            await refreshOne(dg.graph[order[i]].config, variables)
          }
          // Persist variables to cache
          await saveData(variables)
        } catch (e) {
          console.error('Stats refresh error:', e)
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
        editVarName.value = ''
        editMode.value = 'query'
        editError.value = ''
      }
      function startEdit(id) {
        var cfg = configs.value.find(function (c) { return c.id === id })
        if (!cfg) return
        editingId.value = id
        editTitle.value = cfg.title || ''
        editFilter.value = cfg.filter ? (typeof cfg.filter === 'string' ? cfg.filter : JSON.stringify(cfg.filter, null, 2)) : ''
        editExtract.value = cfg.extract || ''
        editExpression.value = cfg.expression || ''
        editVarName.value = cfg.varName || ''
        editMode.value = cfg.mode || 'query'
        editError.value = ''
      }
      function cancelEdit() {
        editingId.value = null
        editError.value = ''
      }
      function saveEdit() {
        editError.value = ''
        if (!editTitle.value.trim()) { editError.value = '请输入标题'; return }
        var filterObj = null
        if (editFilter.value.trim()) {
          try {
            filterObj = JSON.parse(editFilter.value)
            // Normalize: empty object treated as no filter
            if (filterObj && typeof filterObj === 'object' && Object.keys(filterObj).length === 0) {
              filterObj = null
            }
          } catch (e) {
            editError.value = '筛选条件JSON格式错误: ' + e.message; return
          }
        }
        var newVarName = (editVarName.value || '').trim()

        // Validate varName: alphanumeric + underscore only
        if (newVarName && !/^[a-zA-Z_]\w*$/.test(newVarName)) {
          editError.value = '变量名只能包含字母、数字、下划线，且以字母或下划线开头'; return
        }
        // Check duplicate varName
        if (newVarName) {
          for (var i = 0; i < configs.value.length; i++) {
            var c = configs.value[i]
            if (c.id !== editingId.value && c.varName === newVarName) {
              editError.value = '变量名 "' + newVarName + '" 已被使用'; return
            }
          }
        }

        if (editingId.value === 'new') {
          var id = 's_' + Date.now()
          configs.value.push({
            id: id, title: editTitle.value.trim(), varName: newVarName || undefined,
            mode: editMode.value === 'compute' ? 'compute' : undefined,
            filter: filterObj, extract: editExtract.value.trim(),
            expression: editExpression.value.trim()
          })
          saveData()
          editingId.value = null
          refreshAll()
        } else {
          var cfg = configs.value.find(function (c) { return c.id === editingId.value })
          if (cfg) {
            cfg.title = editTitle.value.trim()
            cfg.varName = newVarName || undefined
            cfg.mode = editMode.value === 'compute' ? 'compute' : undefined
            cfg.filter = filterObj
            cfg.extract = editExtract.value.trim()
            cfg.expression = editExpression.value.trim()
            saveData()
            editingId.value = null
            refreshAll()
          }
        }
      }
      function deleteConfig(id) {
        configs.value = configs.value.filter(function (c) { return c.id !== id })
        delete results.value[id]
        saveData()
      }
      function toggleExpand(id) {
        var s = new Set(expandedIds.value)
        if (s.has(id)) s.delete(id); else s.add(id)
        expandedIds.value = s
      }

      // ── Lifecycle ──
      onMounted(async function () {
        await loadData()
        // Display cached values immediately for configs with varName
        if (cache.value) {
          var cfgs = configs.value
          for (var i = 0; i < cfgs.length; i++) {
            var c = cfgs[i]
            if (c.varName && cache.value[c.varName] !== undefined) {
              results.value[c.id] = {
                count: 0, sum: 0, avg: 0, min: 0, max: 0, nums: [],
                exprResult: cache.value[c.varName], error: null, total: 0,
                fromCache: true
              }
            }
          }
        }
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
              // Mode toggle
              h('div', { class: 'stats-mode-toggle' }, [
                h('button', { class: 'stats-mode-btn' + (editMode.value === 'query' ? ' active' : ''), onClick: function () { editMode.value = 'query' } }, '查询条目'),
                h('button', { class: 'stats-mode-btn' + (editMode.value === 'compute' ? ' active' : ''), onClick: function () { editMode.value = 'compute' } }, '仅计算'),
              ]),
              h('label', { class: 'stats-label' }, '标题'),
              h('input', { class: 'stats-input', value: editTitle.value, onInput: function (e) { editTitle.value = e.target.value }, placeholder: '统计标题' }),
              h('label', { class: 'stats-label' }, '变量名（选填）'),
              h('input', { class: 'stats-input', value: editVarName.value, onInput: function (e) { editVarName.value = e.target.value }, placeholder: '留空则不注册为变量，例：credit' }),
              editMode.value === 'query' ? h('label', { class: 'stats-label' }, '筛选条件（JSON）') : null,
              editMode.value === 'query' ? h('textarea', { class: 'stats-textarea', value: editFilter.value, onInput: function (e) { editFilter.value = e.target.value }, placeholder: '{\n  "and": [\n    {"field": "item_type", "op": "=", "value": "ledge"}\n  ]\n}', rows: 6 }) : null,
              editMode.value === 'query' ? h('label', { class: 'stats-label' }, '提取字段') : null,
              editMode.value === 'query' ? h('input', { class: 'stats-input', value: editExtract.value, onInput: function (e) { editExtract.value = e.target.value }, placeholder: 'rating' }) : null,
              h('label', { class: 'stats-label' }, [
                '计算表达式 ',
                h('span', { class: 'stats-label-hint' }, '可用: count sum avg min max $变量名 + 数字 + - * / ( ) 例: 2100 - sum')
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
                h('span', { class: 'stats-card-title' }, [
                  cfg.title,
                  cfg.varName ? h('span', { class: 'stats-var-badge' }, '$' + cfg.varName) : null
                ]),
                mainResult !== null && h('span', { class: 'stats-card-value' }, fmt(mainResult)),
                h('div', { class: 'stats-card-actions' }, [
                  h('button', { class: 'stats-btn-icon', onClick: function (e) { e.stopPropagation(); refreshAll() }, title: '刷新' }, '🔄'),
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
