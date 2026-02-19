import { createWidget, widget, align, text_style } from '@zos/ui'
import { getDeviceInfo } from '@zos/device'

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

Page({
  build() {
    createWidget(widget.TEXT, {
      x: 0,
      y: 0,
      w: DEVICE_WIDTH,
      h: DEVICE_HEIGHT,
      color: 0xffffff,
      text_size: 36,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      text: 'Hello World'
    })
  }
})
