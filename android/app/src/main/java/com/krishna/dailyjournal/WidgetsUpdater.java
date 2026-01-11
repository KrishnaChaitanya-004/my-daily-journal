package com.krishna.dailyjournal;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;

/**
 * Central place to force-refresh all widgets immediately (no updatePeriodMillis reliance).
 */
public final class WidgetsUpdater {
  private WidgetsUpdater() {}

  public static void updateAll(Context context) {
    AppWidgetManager mgr = AppWidgetManager.getInstance(context);

    // Only update the remaining widgets (removed: TodayDiary, QuickAdd, Habits, QuickEntry)
    updateProvider(context, mgr, HabitsProgressWidgetProvider.class);
    updateProvider(context, mgr, StatsWidgetProvider.class);
  }

  private static void updateProvider(Context context, AppWidgetManager mgr, Class<?> providerClass) {
    ComponentName cn = new ComponentName(context, providerClass);
    int[] ids = mgr.getAppWidgetIds(cn);
    if (ids == null || ids.length == 0) return;

    if (providerClass == HabitsProgressWidgetProvider.class) {
      HabitsProgressWidgetProvider.updateAll(context, mgr, ids);
    } else if (providerClass == StatsWidgetProvider.class) {
      StatsWidgetProvider.updateAll(context, mgr, ids);
    }
  }
}
