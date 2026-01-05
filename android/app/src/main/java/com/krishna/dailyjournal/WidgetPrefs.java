package com.krishna.dailyjournal;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

/**
 * Shared preferences used by both the Capacitor WebView and App Widgets.
 */
public final class WidgetPrefs {
  private WidgetPrefs() {}

  private static final String PREFS_NAME = "dailyjournal_widget_prefs";

  public static final String KEY_WIDGET_THEME_COLOR = "widget_theme_color"; // hex: #RRGGBB
  public static final String KEY_HABITS_COMPLETED = "habits_completed";
  public static final String KEY_HABITS_TOTAL = "habits_total";
  public static final String KEY_TODAY_SNIPPET = "today_snippet";
  public static final String KEY_TODAY_DATE = "today_date"; // yyyy-MM-dd

  private static SharedPreferences prefs(Context context) {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
  }

  public static void setWidgetThemeColor(Context context, String hex) {
    prefs(context).edit().putString(KEY_WIDGET_THEME_COLOR, hex).apply();
  }

  public static int getWidgetThemeColor(Context context, int fallbackColor) {
    String hex = prefs(context).getString(KEY_WIDGET_THEME_COLOR, null);
    if (hex == null || hex.isEmpty()) return fallbackColor;
    try {
      return Color.parseColor(hex);
    } catch (Exception ignored) {
      return fallbackColor;
    }
  }

  public static void setHabitsProgress(Context context, int completed, int total) {
    prefs(context).edit()
        .putInt(KEY_HABITS_COMPLETED, completed)
        .putInt(KEY_HABITS_TOTAL, total)
        .apply();
  }

  public static int getHabitsCompleted(Context context) {
    return prefs(context).getInt(KEY_HABITS_COMPLETED, 0);
  }

  public static int getHabitsTotal(Context context) {
    return prefs(context).getInt(KEY_HABITS_TOTAL, 0);
  }

  public static void setTodaySnippet(Context context, String dateKey, String snippet) {
    prefs(context).edit()
        .putString(KEY_TODAY_DATE, dateKey)
        .putString(KEY_TODAY_SNIPPET, snippet)
        .apply();
  }

  public static String getTodaySnippet(Context context) {
    return prefs(context).getString(KEY_TODAY_SNIPPET, "");
  }
}
