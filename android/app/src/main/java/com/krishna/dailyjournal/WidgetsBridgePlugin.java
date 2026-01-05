package com.krishna.dailyjournal;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

/**
 * Capacitor bridge so the React app can push updates into Android widgets.
 */
@CapacitorPlugin(name = "WidgetsBridge")
public class WidgetsBridgePlugin extends Plugin {

  @PluginMethod
  public void setWidgetThemeColor(PluginCall call) {
    String hex = call.getString("hex", "#7C3AED");
    WidgetPrefs.setWidgetThemeColor(getContext(), hex);
    WidgetsUpdater.updateAll(getContext());
    call.resolve(new JSObject());
  }

  @PluginMethod
  public void setHabitsProgress(PluginCall call) {
    int completed = call.getInt("completed", 0);
    int total = call.getInt("total", 0);
    WidgetPrefs.setHabitsProgress(getContext(), completed, total);
    WidgetsUpdater.updateAll(getContext());
    call.resolve(new JSObject());
  }

  @PluginMethod
  public void setTodaySnippet(PluginCall call) {
    String dateKey = call.getString("dateKey", "");
    String snippet = call.getString("snippet", "");
    WidgetPrefs.setTodaySnippet(getContext(), dateKey, snippet);
    WidgetsUpdater.updateAll(getContext());
    call.resolve(new JSObject());
  }

  @PluginMethod
  public void refreshWidgets(PluginCall call) {
    WidgetsUpdater.updateAll(getContext());
    call.resolve(new JSObject());
  }
}
