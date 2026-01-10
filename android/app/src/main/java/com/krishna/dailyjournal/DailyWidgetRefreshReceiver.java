package com.krishna.dailyjournal;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Fired by AlarmManager shortly after midnight (local time).
 * Forces a widget refresh so the "completed today" count resets immediately.
 */
public class DailyWidgetRefreshReceiver extends BroadcastReceiver {
  private static final String TAG = "DailyWidgetRefresh";

  @Override
  public void onReceive(Context context, Intent intent) {
    try {
      WidgetsUpdater.updateAll(context);
      Log.d(TAG, "Widgets refreshed for daily reset");
    } catch (Exception e) {
      Log.e(TAG, "Failed to refresh widgets on daily alarm", e);
    }

    // Schedule the next day.
    try {
      WidgetAlarmScheduler.scheduleNextMidnightRefresh(context);
    } catch (Exception e) {
      Log.e(TAG, "Failed to reschedule daily widget refresh", e);
    }
  }
}
