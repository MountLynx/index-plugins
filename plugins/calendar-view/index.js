// calendar-view plugin
// Host injects Vue APIs via the factory function pattern:
//   exports.default = function(Vue) { ... }
// where Vue provides { h, ref, computed, watch, onMounted }.
exports.default = function (Vue) {
  var h = Vue.h;
  var ref = Vue.ref;
  var computed = Vue.computed;
  var watch = Vue.watch;

  return {
    props: ['context'],

    setup: function (props) {
      var items = props.context.items;
      var selectItem = props.context.selectItem;
      var config = props.context.config;
      var filteredOut = props.context.filteredOut;

      // ── Helper: extract first YYYY-MM-DD date from item properties ──
      function getDateField(item) {
        var props = item.properties || {};
        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var val = props[keys[i]];
          if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            return val.slice(0, 10);
          }
        }
        return null;
      }

      // ── Reactive state ──
      var viewDate = ref(new Date());

      // Group items by date string (YYYY-MM-DD)
      var byDate = computed(function () {
        var map = new Map();
        var arr = (items && items.value) || [];
        for (var i = 0; i < arr.length; i++) {
          var d = getDateField(arr[i]);
          if (d) {
            if (!map.has(d)) map.set(d, []);
            map.get(d).push(arr[i]);
          }
        }
        return map;
      });

      var title = computed(function () {
        var d = viewDate.value;
        return d.getFullYear() + '年 ' + (d.getMonth() + 1) + '月';
      });

      // ── Render month grid with h() ──
      function renderGrid() {
        var year = viewDate.value.getFullYear();
        var month = viewDate.value.getMonth();
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrev = new Date(year, month, 0).getDate();
        var now = new Date();
        var todayStr = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0');

        var cells = [];

        // Previous month trailing days
        for (var i = firstDay - 1; i >= 0; i--) {
          var pd = daysInPrev - i;
          var pds = year + '-' + String(month).padStart(2, '0') + '-' + String(pd).padStart(2, '0');
          cells.push(h('div', { class: 'cal-cell other-month' }, [
            h('span', { class: 'cell-num' }, pd)
          ]));
        }

        // Current month days
        for (var d = 1; d <= daysInMonth; d++) {
          var ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          var dayItems = byDate.value.get(ds) || [];
          var cellClass = 'cal-cell' + (ds === todayStr ? ' today' : '');
          var children = [
            h('span', { class: 'cell-num' + (ds === todayStr ? ' today-dot' : '') }, d)
          ];
          for (var j = 0; j < dayItems.length; j++) {
            (function (itemId, itemName) {
              children.push(
                h('div', {
                  class: 'cell-item',
                  onClick: function (e) {
                    e.stopPropagation();
                    selectItem(itemId);
                  }
                }, itemName)
              );
            })(dayItems[j].id, dayItems[j].name);
          }
          cells.push(h('div', { class: cellClass, onClick: function () { /* future: quick-create */ } }, children));
        }

        return cells;
      }

      // ── Render function ──
      return function () {
        var year = viewDate.value.getFullYear();
        var month = viewDate.value.getMonth();
        var fo = (filteredOut && filteredOut.value) || { count: 0, reason: '' };

        return h('div', { class: 'cal' }, [
          // Header
          h('div', { class: 'cal-header' }, [
            h('button', {
              onClick: function () { viewDate.value = new Date(year, month - 1); }
            }, '‹'),
            h('span', { class: 'cal-title' }, title.value),
            h('button', {
              onClick: function () { viewDate.value = new Date(year, month + 1); }
            }, '›'),
          ]),
          // Grid
          h('div', { class: 'cal-grid' }, renderGrid()),
          // Filtered-out notice
          fo.count > 0 && h('div', { class: 'filter-notice' },
            'ℹ️ ' + fo.count + ' 个条目未显示：' + fo.reason + '。在列表视图中查看'
          )
        ]);
      };
    }
  };
};
