package com.krishna.dailyjournal;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/**
 * Schedules a once-per-day alarm shortly after local midnight to force a widget refresh.
 * This makes the daily reset visible even when the app process is not running.
 */
public final class WidgetAlarmScheduler {
  public static final String ACTION_DAILY_WIDGET_REFRESH = "com.krishna.dailyjournal.ACTION_DAILY_WIDGET_REFRESH";

  private WidgetAlarmScheduler() {}

  public static void scheduleNextMidnightRefresh(Context context) {
    Context app = context.getApplicationContext();

    Calendar cal = Calendar.getInstance();
    cal.set(Calendar.HOUR_OF_DAY, 0);
    cal.set(Calendar.MINUTE, 0);
    cal.set(Calendar.SECOND, 5);
    cal.set(Calendar.MILLISECOND, 0);
    cal.add(Calendar.DAY_OF_YEAR, 1);

    long triggerAtMillis = cal.getTimeInMillis();

    Intent i = new Intent(app, DailyWidgetRefreshReceiver.class);
    i.setAction(ACTION_DAILY_WIDGET_REFRESH);

    PendingIntent pi = PendingIntent.getBroadcast(
      app,
      901,
      i,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );

    AlarmManager am = (AlarmManager) app.getSystemService(Context.ALARM_SERVICE);
    if (am == null) return;

    // We prefer reliability over exactness; use exact when available.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
    } else {
      am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
    }
  }
}
