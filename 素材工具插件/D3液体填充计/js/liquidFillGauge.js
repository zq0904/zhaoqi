
function liquidFillGaugeDefaultSettings() { // 液体填满计默认的设置
  return {
    minValue: 0, // 测量最小值
    maxValue: 100, // 测量最大值
    circleThickness: 0.05, // 外圆的厚度是半径的百分数
    circleFillGap: 0.05, // 外圈和波圈之间的间隙大小是外圆半径的百分比
    circleColor: '#178BCA', // 外圆的颜色
    waveHeight: 0.05, // 波高是波圆半径的百分数
    waveCount: 1, // 波圈每宽度的全波数
    waveRiseTime: 1000, // 波从0上升到它的最终高度的毫秒数
    waveAnimateTime: 18000, // 整个波进入波圈的毫秒数
    waveRise: true, // 控制如果波从0上升到它的高度，或者从它的高度开始
    waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
    waveAnimate: true, // 控制波浪滚动或静止
    waveColor: '#178BCA', // 填充波的颜色
    waveOffset: 0, // 初始偏移量。0 =没有抵消。1 =一个全波的偏移。
    textVertPosition: 0.5, // 在这个高度上显示百分比文本的波形。0 =底部，1 =顶部
    textSize: 1, // 在波圈中显示的文本的相对高度。1 = 50%
    valueCountUp: true, // 如果是true，则显示的值将从0计数到加载后的最终值。如果是false，则显示最终值。
    displayPercent: true, // 如果是true，则在值之后显示%符号
    textColor: '#045681', // 当波不重叠时，值文本的颜色
    waveTextColor: '#A4DBf8', // 当波重叠时，数值文本的颜色
    // 自定义 扩展部分
    isShowLine: true, // 是否显示警戒线
    lineValue: 100, // 警戒线考核值
    lineWidth: 2, // 线的宽度
    lineInterval: 5, // 虚线间隔
    lineColor: '#D31949', // 线颜色
    lineText: '警戒线文本', // 警戒线文本
    lineTextSize: 16, // 警戒线文本大小
    lineTextColor: '#F000FF' // 警戒线文本颜色
  }
}

function loadLiquidFillGauge(elementId, value, config) {
  if (!config) config = liquidFillGaugeDefaultSettings()

  var gauge = d3.select('#' + elementId)
  var radius = Math.min(parseInt(gauge.style('width')), parseInt(gauge.style('height'))) / 2 // 元素的宽高 取最小值 / 2
  var locationX = parseInt(gauge.style('width')) / 2 - radius // 中心点 xy 坐标
  var locationY = parseInt(gauge.style('height')) / 2 - radius
  var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue // 当前值限制在 最大值 和 最小值之前 / 最大值 计算比例

  var waveHeightScale
  if (config.waveHeightScaling) {
    waveHeightScale = d3.scale.linear().range([0, config.waveHeight, 0]).domain([0, 50, 100])
  } else {
    waveHeightScale = d3.scale.linear().range([config.waveHeight, config.waveHeight]).domain([0, 100])
  }

  var textPixels = config.textSize * radius / 2
  var textFinalValue = parseFloat(value).toFixed(2)
  var textStartValue = config.valueCountUp ? config.minValue : textFinalValue
  var percentText = config.displayPercent ? '%' : ''
  var circleThickness = config.circleThickness * radius
  var circleFillGap = config.circleFillGap * radius
  var fillCircleMargin = circleThickness + circleFillGap
  var fillCircleRadius = radius - fillCircleMargin
  var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100)

  var waveLength = fillCircleRadius * 2 / config.waveCount
  var waveClipCount = 1 + config.waveCount
  var waveClipWidth = waveLength * waveClipCount

  // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
  var textRounder = function textRounder(value) {
    return Math.round(value)
  }
  if (parseFloat(textFinalValue) !== parseFloat(textRounder(textFinalValue))) {
    textRounder = function textRounder(value) {
      return parseFloat(value).toFixed(1)
    }
  }
  if (parseFloat(textFinalValue) !== parseFloat(textRounder(textFinalValue))) {
    textRounder = function textRounder(value) {
      return parseFloat(value).toFixed(2)
    }
  }

  // Data for building the clip wave area.
  var data = []
  for (var i = 0; i <= 40 * waveClipCount; i++) {
    data.push({ x: i / (40 * waveClipCount), y: i / 40 });
  }

  // Scales for drawing the outer circle.
  var gaugeCircleX = d3.scale.linear().range([0, 2 * Math.PI]).domain([0, 1])
  var gaugeCircleY = d3.scale.linear().range([0, radius]).domain([0, radius])

  // Scales for controlling the size of the clipping path.
  var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1])
  var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1])

  // Scales for controlling the position of the clipping path.
  var waveRiseScale = d3.scale.linear()
  // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
  // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
  // circle at 100%.
  .range([fillCircleMargin + fillCircleRadius * 2 + waveHeight, fillCircleMargin - waveHeight]).domain([0, 1])
  var waveAnimateScale = d3.scale.linear().range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
  .domain([0, 1])

  // Scale for controlling the position of the text within the gauge.
  var textRiseScaleY = d3.scale.linear().range([fillCircleMargin + fillCircleRadius * 2, fillCircleMargin + textPixels * 0.7]).domain([0, 1])

  // Center the gauge within the parent SVG.
  var gaugeGroup = gauge.append('g').attr('transform', 'translate(' + locationX + ',' + locationY + ')')

  // Draw the outer circle.
  var gaugeCircleArc = d3.svg.arc().startAngle(gaugeCircleX(0)).endAngle(gaugeCircleX(1)).outerRadius(gaugeCircleY(radius)).innerRadius(gaugeCircleY(radius - circleThickness))
  gaugeGroup.append('path').attr('d', gaugeCircleArc).style('fill', config.circleColor).attr('transform', 'translate(' + radius + ',' + radius + ')')

  // Text where the wave does not overlap.
  var text1 = gaugeGroup.append('text').text(textRounder(textStartValue) + percentText).attr('class', 'liquidFillGaugeText').attr('text-anchor', 'middle').attr('font-size', textPixels + 'px').style('fill', config.textColor).attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')')

  // The clipping wave area.
  var clipArea = d3.svg.area().x(function (d) {
    return waveScaleX(d.x)
  }).y0(function (d) {
    return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI))
  }).y1(function (d) {
    return fillCircleRadius * 2 + waveHeight
  })
  var waveGroup = gaugeGroup.append('defs').append('clipPath').attr('id', 'clipWave' + elementId)
  var wave = waveGroup.append('path').datum(data).attr('d', clipArea).attr('T', 0)

  // The inner circle with the clipping wave attached.
  var fillCircleGroup = gaugeGroup.append('g').attr('clip-path', 'url(#clipWave' + elementId + ')')
  fillCircleGroup.append('circle').attr('cx', radius).attr('cy', radius).attr('r', fillCircleRadius).style('fill', config.waveColor)

  // 数值警戒线
  if (config.isShowLine) {
    var checkfillPercent = Math.max(config.minValue, Math.min(config.maxValue, config.lineValue)) / config.maxValue
    var r = fillCircleRadius // 圆半径
    var w2 = Math.sqrt(Math.pow(r, 2) - Math.pow(r - 2 * r * checkfillPercent, 2)) // 警戒线长 一半
    // 警戒线
    gaugeGroup.append('line').datum(data).attr('class', 'warnLine').attr('x1', radius - w2).attr('x2', radius + w2).attr('y1', waveRiseScale(checkfillPercent)).attr('y2', waveRiseScale(checkfillPercent)).style('stroke-width', config.lineWidth).style('stroke-dasharray', config.lineInterval).style('stroke', config.lineColor)

    // 警戒线文字
    gaugeGroup.append('text').text(config.lineText).attr('class', 'textWarn').attr('text-anchor', 'middle').attr('font-size', config.lineTextSize + 'px').style('fill', config.lineTextColor).attr('transform', 'translate(' + radius + ',' + ((3 / 2 - checkfillPercent) * radius + 5) + ')') // 5 为误差值
  }

  // Text where the wave does overlap.
  var text2 = fillCircleGroup.append('text').text(textRounder(textStartValue) + percentText).attr('class', 'liquidFillGaugeText').attr('text-anchor', 'middle').attr('font-size', textPixels + 'px').style('fill', config.waveTextColor).attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')')

  // Make the value count up.
  if (config.valueCountUp) {
    var textTween = function textTween() {
      var i = d3.interpolate(this.textContent, textFinalValue)
      return function (t) {
        this.textContent = textRounder(i(t)) + percentText
      }
    }
    text1.transition().duration(config.waveRiseTime).tween('text', textTween)
    text2.transition().duration(config.waveRiseTime).tween('text', textTween)
  }

  // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
  var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth
  if (config.waveRise) {
    waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')').transition().duration(config.waveRiseTime).attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')').each('start', function () {
      wave.attr('transform', 'translate(1,0)')
    }) // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
  } else {
    waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
  }

  if (config.waveAnimate) animateWave()

  function animateWave() {
    wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)')
    wave.transition().duration(config.waveAnimateTime * (1 - wave.attr('T'))).ease('linear').attr('transform', 'translate(' + waveAnimateScale(1) + ',0)').attr('T', 1).each('end', function () {
      wave.attr('T', 0)
      animateWave(config.waveAnimateTime)
    })
  }

  function GaugeUpdater() {
    this.update = function (value) {
      var newFinalValue = parseFloat(value).toFixed(2)
      var textRounderUpdater = function textRounderUpdater(value) {
        return Math.round(value)
      }
      if (parseFloat(newFinalValue) !== parseFloat(textRounderUpdater(newFinalValue))) {
        textRounderUpdater = function textRounderUpdater(value) {
          return parseFloat(value).toFixed(1)
        }
      }
      if (parseFloat(newFinalValue) !== parseFloat(textRounderUpdater(newFinalValue))) {
        textRounderUpdater = function textRounderUpdater(value) {
          return parseFloat(value).toFixed(2)
        }
      }

      var textTween = function textTween() {
        var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2))
        return function (t) {
          this.textContent = textRounderUpdater(i(t)) + percentText
        }
      }

      text1.transition().duration(config.waveRiseTime).tween('text', textTween)
      text2.transition().duration(config.waveRiseTime).tween('text', textTween)

      var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue
      var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100)
      var waveRiseScale = d3.scale.linear()
      // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
      // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
      // circle at 100%.
      .range([fillCircleMargin + fillCircleRadius * 2 + waveHeight, fillCircleMargin - waveHeight]).domain([0, 1])
      var newHeight = waveRiseScale(fillPercent)
      var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1])
      var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1])
      var newClipArea
      if (config.waveHeightScaling) {
        newClipArea = d3.svg.area().x(function (d) {
          return waveScaleX(d.x)
        }).y0(function (d) {
          return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI))
        }).y1(function (d) {
          return fillCircleRadius * 2 + waveHeight
        })
      } else {
        newClipArea = clipArea
      }

      var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0
      wave.transition().duration(0).transition().duration(config.waveAnimate ? config.waveAnimateTime * (1 - wave.attr('T')) : config.waveRiseTime).ease('linear').attr('d', newClipArea).attr('transform', 'translate(' + newWavePosition + ',0)').attr('T', '1').each('end', function () {
        if (config.waveAnimate) {
          wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)')
          animateWave(config.waveAnimateTime)
        }
      })
      waveGroup.transition().duration(config.waveRiseTime).attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')')
    }
  }

  return new GaugeUpdater()
}
