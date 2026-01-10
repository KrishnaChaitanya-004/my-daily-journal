package com.krishna.dailyjournal;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Reschedules the daily widget refresh alarm after device reboot.
 */
public class BootReceiver extends BroadcastReceiver {
  private static final String TAG = "BootReceiver";

  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null) return;
    if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

    try {
      WidgetAlarmScheduler.scheduleNextMidnightRefresh(context);
      WidgetsUpdater.updateAll(context);
      Log.d(TAG, "Rescheduled daily widget refresh after boot");
    } catch (Exception e) {
      Log.e(TAG, "Failed to reschedule after boot", e);
    }
  }
}
