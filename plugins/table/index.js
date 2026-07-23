// table plugin — right-panel editable table per item
// Stores data as JSON in plugin cache: { [itemId]: { columns: [...], rows: [[...]] } }
exports.default = function (Vue) {
  var h = Vue.h
  var ref = Vue.ref
  var computed = Vue.computed
  var watch = Vue.watch
  var onMounted = Vue.onMounted
  var nextTick = Vue.nextTick

  // ── Inject CSS ──
  if (!document.getElementById('index-table-css')) {
    var style = document.createElement('style')
    style.id = 'index-table-css'
    style.textContent = [
      '.tbl-wrap { padding: 8px; font-size: var(--fs-xs); }',
      '.tbl-header { font-weight: var(--fw-semibold); margin-bottom: 8px; color: var(--text); font-size: var(--fs-sm); padding: 0 4px; }',
      '.tbl-table { width: 100%; border-collapse: collapse; table-layout: fixed; }',
      '.tbl-table th { background: var(--surface-hover); padding: 4px 6px; border: 1px solid var(--border); text-align: left; font-weight: var(--fw-semibold); color: var(--text); font-size: var(--fs-xs); position: relative; }',
      '.tbl-table td { padding: 3px 6px; border: 1px solid var(--border); color: var(--text); font-size: var(--fs-xs); cursor: pointer; min-height: 22px; }',
      '.tbl-table td:hover { background: var(--surface-hover); }',
      '.tbl-cell-input { width: 100%; border: none; background: var(--bg); color: var(--text); font-size: var(--fs-xs); padding: 1px 0; outline: none; font-family: inherit; }',
      '.tbl-col-del { position: absolute; top: 1px; right: 2px; cursor: pointer; font-size: 10px; color: var(--text-muted); line-height: 1; opacity: 0; }',
      '.tbl-table th:hover .tbl-col-del { opacity: 0.6; }',
      '.tbl-col-del:hover { color: var(--danger); opacity: 1 !important; }',
      '.tbl-row-del { cursor: pointer; text-align: center; color: var(--text-muted); font-size: 12px; }',
      '.tbl-row-del:hover { color: var(--danger); }',
      '.tbl-actions { display: flex; gap: 8px; margin-top: 8px; align-items: center; }',
      '.tbl-btn { font-size: var(--fs-xs); border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); color: var(--text-secondary); cursor: pointer; padding: 3px 10px; }',
      '.tbl-btn:hover { background: var(--surface-hover); color: var(--accent); }',
      '.tbl-empty { text-align: center; color: var(--text-muted); padding: 32px 16px; font-size: var(--fs-sm); }',
      '.tbl-saving { font-size: var(--fs-xs); color: var(--text-muted); }',
    ].join('')
    document.head.appendChild(style)
  }

  return {
    props: ['context'],

    setup: function (props) {
      var ctx = props.context

      // ── State ──
      var cacheData = ref({})
      var editingCell = ref(null)
      var editValue = ref('')
      var saveTimer = null
      var saving = ref(false)
      var loaded = ref(false)

      // ── Derive current item ID directly from context ──
      var curId = computed(function () {
        var sel = ctx.selectedItem
        if (!sel) return null
        var v = sel
        // support both ref-like and plain value
        if (typeof v.value !== 'undefined') v = v.value
        return (v && v.item) ? v.item.id : null
      })

      // ── Watch for ID changes: load cache ──
      watch(curId, function (newId) {
        if (newId) {
          loadData()
        }
      }, { immediate: true })

      function loadData() {
        ctx.readCache().then(function (data) {
          cacheData.value = data || {}
          loaded.value = true
        }).catch(function () {
          cacheData.value = {}
          loaded.value = true
        })
      }

      // ── Computed: current table ──
      var tableData = computed(function () {
        var id = curId.value
        if (!id) return null
        var data = cacheData.value[id]
        if (data && data.columns && data.rows) return data
        return { columns: ['列1'], rows: [] }
      })

      var columns = computed(function () {
        var t = tableData.value
        return t ? t.columns : []
      })

      var rows = computed(function () {
        var t = tableData.value
        return t ? t.rows : []
      })

      // ── Auto-save ──
      function scheduleSave() {
        if (saveTimer) clearTimeout(saveTimer)
        saving.value = true
        saveTimer = setTimeout(doSave, 500)
      }

      function doSave() {
        var id = curId.value
        if (!id) return
        var t = tableData.value
        if (!t) return
        var updated = JSON.parse(JSON.stringify(cacheData.value))
        updated[id] = { columns: t.columns.slice(), rows: t.rows.map(function (r) { return r.slice() }) }
        saving.value = true
        ctx.writeCache(updated).then(function () {
          cacheData.value = updated
          saving.value = false
        }).catch(function () {
          saving.value = false
        })
      }

      function saveNow() {
        if (saveTimer) clearTimeout(saveTimer)
        doSave()
      }

      // ── Edit cell ──
      function startEdit(row, col, value) {
        editingCell.value = { row: row, col: col }
        editValue.value = value
      }

      function commitEdit() {
        var cell = editingCell.value
        if (!cell) return
        var id = curId.value
        if (!id) return
        var data = cacheData.value[id] || { columns: ['列1'], rows: [] }
        if (!data.rows) data.rows = []
        if (!data.rows[cell.row]) data.rows[cell.row] = []
        data.rows[cell.row][cell.col] = editValue.value
        var snapshot = JSON.parse(JSON.stringify(cacheData.value))
        cacheData.value = snapshot
        editingCell.value = null
        scheduleSave()
      }

      function cancelEdit() {
        editingCell.value = null
      }

      // ── Row operations ──
      function addRow() {
        var id = curId.value
        if (!id) return
        var data = cacheData.value[id] || { columns: ['列1'], rows: [] }
        if (!data.rows) data.rows = []
        var colCount = (data.columns || ['列1']).length
        var newRow = []
        for (var i = 0; i < colCount; i++) newRow.push('')
        data.rows.push(newRow)
        var snapshot = JSON.parse(JSON.stringify(cacheData.value))
        cacheData.value = snapshot
        scheduleSave()
      }

      function deleteRow(index) {
        var id = curId.value
        if (!id) return
        var data = cacheData.value[id]
        if (!data || !data.rows) return
        data.rows.splice(index, 1)
        var snapshot = JSON.parse(JSON.stringify(cacheData.value))
        cacheData.value = snapshot
        scheduleSave()
      }

      // ── Column operations ──
      function addColumn() {
        var id = curId.value
        if (!id) return
        var data = cacheData.value[id] || { columns: ['列1'], rows: [] }
        if (!data.columns) data.columns = ['列1']
        data.columns.push('列' + (data.columns.length + 1))
        if (data.rows) {
          for (var i = 0; i < data.rows.length; i++) data.rows[i].push('')
        }
        var snapshot = JSON.parse(JSON.stringify(cacheData.value))
        cacheData.value = snapshot
        scheduleSave()
      }

      function deleteColumn() {
        var id = curId.value
        if (!id) return
        var data = cacheData.value[id]
        if (!data || !data.columns || data.columns.length <= 1) return
        data.columns.pop()
        if (data.rows) {
          for (var i = 0; i < data.rows.length; i++) data.rows[i].pop()
        }
        var snapshot = JSON.parse(JSON.stringify(cacheData.value))
        cacheData.value = snapshot
        scheduleSave()
      }

      // ── Render ──
      return function () {
        var id = curId.value

        if (!id) {
          return h('div', { class: 'tbl-wrap' }, [
            h('div', { class: 'tbl-empty' }, '请选择一个条目')
          ])
        }

        var detail = ctx.selectedItem
        if (detail && typeof detail.value !== 'undefined') detail = detail.value
        var itemName = (detail && detail.item) ? detail.item.name : ''

        var cells = []

        // Header
        var headerRow = []
        var cols = columns.value
        for (var ci = 0; ci < cols.length; ci++) {
          var colChildren = [cols[ci]]
          if (cols.length > 1) {
            colChildren.push(h('span', { class: 'tbl-col-del',
              on: { click: function () { deleteColumn() } } }, '×'))
          }
          headerRow.push(h('th', {}, colChildren))
        }
        headerRow.push(h('th', { style: { width: '28px' } }, ''))
        cells.push(h('thead', {}, [h('tr', {}, headerRow)]))

        // Body
        var bodyRows = []
        var r = rows.value
        for (var ri = 0; ri < r.length; ri++) {
          var rowCells = []
          for (var cj = 0; cj < cols.length; cj++) {
            var val = r[ri][cj] !== undefined ? String(r[ri][cj]) : ''
            var isEditing = editingCell.value && editingCell.value.row === ri && editingCell.value.col === cj
            if (isEditing) {
              rowCells.push(h('td', {}, [
                h('input', {
                  attrs: { type: 'text' }, class: 'tbl-cell-input',
                  domProps: { value: editValue.value },
                  on: {
                    input: function (e) { editValue.value = e.target.value },
                    blur: function () { commitEdit() },
                    keydown: function (e) {
                      if (e.keyCode === 13) { e.preventDefault(); commitEdit() }
                      if (e.keyCode === 27) { cancelEdit() }
                    }
                  }
                })
              ]))
            } else {
              rowCells.push(h('td', {
                on: { dblclick: function (row, col, v) { return function () { startEdit(row, col, v) } }(ri, cj, val) }
              }, val || '\u00A0'))
            }
          }
          rowCells.push(h('td', { class: 'tbl-row-del',
            on: { click: function (r) { return function () { deleteRow(r) } }(ri) } }, '🗑'))
          bodyRows.push(h('tr', {}, rowCells))
        }
        cells.push(h('tbody', {}, bodyRows))

        var tableEl = h('table', { class: 'tbl-table' }, cells)

        // Actions
        var actions = h('div', { class: 'tbl-actions' }, [
          h('button', { class: 'tbl-btn', on: { click: addRow } }, '+ 添加行'),
          h('div', { style: { flex: '1' } }),
          h('div', { class: 'tbl-saving' }, saving.value ? '保存中…' : ''),
          h('button', { class: 'tbl-btn', on: { click: addColumn } }, '+ 列'),
          h('button', { class: 'tbl-btn', on: { click: saveNow } }, '保存'),
        ])

        return h('div', { class: 'tbl-wrap' }, [
          h('div', { class: 'tbl-header' }, '条目: ' + itemName),
          tableEl,
          actions
        ])
      }
    }
  }
}
