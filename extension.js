import GLib from "gi://GLib";
import St from "gi://St";
import Clutter from "gi://Clutter";
import Pango from "gi://Pango";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as main from "resource:///org/gnome/shell/ui/main.js";

let originalClockDisplays = [];
let formatClockDisplays = [];
let settings;
let timeoutID = 0;

export default class PanelDateFormatExtension extends Extension {
  /**
   * Enable, called when extension is enabled or when screen is unlocked.
   */
  enable() {
    let allPanels = [];
    
    // Support multiple monitors with Dash To Panel
    if (!global.dashToPanel)
      allPanels = [main.panel];
    else {
      allPanels = global.dashToPanel.panels;
    }
    
    settings = this.getSettings();

    // FIXME: Set settings first time to make it visible in dconf Editor
    if (!settings.get_string("format")) {
      settings.set_string("format", "%Y.%m.%d %H:%M");
    }
    
    allPanels.forEach((currentPanel) => {
      let formatClockDisplay = new St.Label({ style_class: "clock" });
      formatClockDisplay.clutter_text.y_align = Clutter.ActorAlign.CENTER;
      formatClockDisplay.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

      let originalClockDisplay = currentPanel.statusArea.dateMenu._clockDisplay;

      originalClockDisplay.hide();
      originalClockDisplay
        .get_parent()
        .insert_child_below(formatClockDisplay, originalClockDisplay);
      
      originalClockDisplays.push(originalClockDisplay);
      formatClockDisplays.push(formatClockDisplay);
    });

    timeoutID = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, tick);
  }

  /**
   * Disable, called when extension is disabled or when screen is locked.
   */
  disable() {
    GLib.Source.remove(timeoutID);
    timeoutID = 0;
    originalClockDisplays.forEach((originalClockDisplay, i) => {
        originalClockDisplay.get_parent().remove_child(formatClockDisplays[i]);
        originalClockDisplay.show();
    });
    settings = null;
    formatClockDisplays = [];
    originalClockDisplays = [];
  }
}

/**
 * It runs every time we need to update clock.
 * @return {boolean} Always returns true to loop.
 */
function tick() {
  const format = settings.get_string("format");
  
  formatClockDisplays.forEach((formatClockDisplay) => {
    formatClockDisplay.set_text(new GLib.DateTime().format(format));
  });

  return true;
}
