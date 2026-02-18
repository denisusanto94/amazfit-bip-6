import { px } from "@zos/utils";

export const BUTTON_STYLE = {
  w: px(160),
  h: px(50),
  color: 0xffffff,
  text_color: 0x000000,
  text_size: px(20),
  radius: px(12),
  align_h: 1,
  align_v: 1,
};

// Center calculation for 194px width: (194 - 160) / 2 = 17
export const BTN_LANG_ID_X = px(17);
export const BTN_LANG_ID_Y = px(120);

export const BTN_LANG_EN_X = px(17);
export const BTN_LANG_EN_Y = px(190);

export const BTN_SKIP_X = px(17);
export const BTN_SKIP_Y = px(250);

export const TEXT_STYLE = {
  x: px(0),
  y: px(0),
  w: px(194),
  h: px(40),
  color: 0xffffff,
  text_size: px(24),
  align_h: 1,
  align_v: 1,
};

export const HEADER_STYLE = {
  x: px(0),
  y: px(10),
  w: px(194),
  h: px(50),
  color: 0xffffff,
  text_size: px(18),
  align_h: 1,
  align_v: 1,
};

export const NAV_BTN_STYLE = {
  w: px(40),
  h: px(40),
  color: 0xffffff,
  text_color: 0x000000,
  text_size: px(24),
  radius: px(20),
  align_h: 1,
  align_v: 1,
};

export const NAV_PREV_X = px(10);
export const NAV_PREV_Y = px(300);

export const NAV_SCAN_X = px(62); // (194-70)/2
export const NAV_SCAN_Y = px(300);
export const NAV_SCAN_W = px(70);

export const NAV_NEXT_X = px(144);
export const NAV_NEXT_Y = px(300);

export const LIST_ITEM_STYLE = {
  w: px(194),
  h: px(35),
  color: 0xffffff,
  text_size: px(18),
  align_v: 1,
};

export const LIST_LABEL_X = px(10);
export const LIST_VALUE_X = px(100);

export const GPS_BTN_STYLE = {
  w: px(70),
  h: px(40),
  color: 0xffffff,
  text_color: 0x000000,
  text_size: px(14),
  radius: px(20),
  align_h: 1,
  align_v: 1,
};
