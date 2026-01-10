package com.krishna.dailyjournal;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "MainActivity";

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Set the splash theme before super.onCreate
    setTheme(R.style.AppTheme_NoActionBar);
    super.onCreate(savedInstanceState);

    // Start native file observer so widgets refresh whenever widget-data.json changes.
    WidgetSyncManager.ensureStarted(this);

    // Ensure daily reset refresh is scheduled (works even if app is killed).
    try {
      WidgetAlarmScheduler.scheduleNextMidnightRefresh(this);
    } catch (Exception ignored) {
      // Best-effort; widget updatePeriodMillis still provides eventual refresh.
    }

    // Note: We no longer register WidgetsBridgePlugin because we use file-based bridge
  }

  @Override
  public void onResume() {
    super.onResume();

    // Refresh all widgets when app comes to foreground
    // This ensures widgets display the latest data from widget-data.json
    try {
      WidgetsUpdater.updateAll(this);
      WidgetAlarmScheduler.scheduleNextMidnightRefresh(this);
      Log.d(TAG, "Widgets refreshed on resume");
    } catch (Exception e) {
      Log.e(TAG, "Failed to refresh widgets on resume", e);
    }
  }
}
