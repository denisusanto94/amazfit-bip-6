import { px } from "@zos/utils";

export const BUTTON_STYLE = {
  w: px(200),
  h: px(50),
  color: 0xffffff,
  text_color: 0x000000,
  text_size: px(20),
  radius: px(12),
  align_h: 1, // ALIGN_CENTER
  align_v: 1, // ALIGN_CENTER
};

// Center calculation for 390px width: (390 - 200) / 2 = 95
export const BTN_LANG_ID_X = px(95);
export const BTN_LANG_ID_Y = px(120);

export const BTN_LANG_EN_X = px(95);
export const BTN_LANG_EN_Y = px(190);

export const BTN_SKIP_X = px(95);
export const BTN_SKIP_Y = px(250);

export const TEXT_STYLE = {
  x: px(0),
  y: px(0),
  w: px(390),
  h: px(40),
  color: 0xffffff,
  text_size: px(24),
  align_h: 1,
  align_v: 1,
};

export const HEADER_STYLE = {
  x: px(0),
  y: px(10),
  w: px(390),
  h: px(50),
  color: 0xffffff,
  text_size: px(20),
  align_h: 1,
  align_v: 1,
};

// Navigation Arrows at Bottom
export const NAV_BTN_STYLE = {
  w: px(50),
  h: px(50),
  color: 0xffffff,
  text_color: 0x000000,
  text_size: px(30),
  radius: px(25),
  align_h: 1,
  align_v: 1,
};

export const NAV_PREV_X = px(60);
export const NAV_PREV_Y = px(350);

export const NAV_SCAN_X = px(145); // Center: (390-100)/2
export const NAV_SCAN_Y = px(350); // Same row as arrows
export const NAV_SCAN_W = px(100);

export const NAV_NEXT_X = px(280);
export const NAV_NEXT_Y = px(350);

export const LIST_ITEM_STYLE = {
  w: px(390),
  h: px(35),
  color: 0xffffff,
  text_size: px(20),
  align_v: 1,
};

export const LIST_LABEL_X = px(45);
export const LIST_VALUE_X = px(240);

export const GPS_BTN_STYLE = {
  w: px(100),
  h: px(50),
  color: 0xffffff,
  text_color: 0x000000,
  text_size: px(16),
  radius: px(25),
  align_h: 1,
  align_v: 1,
};
