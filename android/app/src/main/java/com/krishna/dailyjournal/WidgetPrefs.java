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
  public static final String KEY_STATS_ENTRIES = "stats_entries";
  public static final String KEY_STATS_STREAK = "stats_streak";
  public static final String KEY_STATS_WORDS = "stats_words";

  private static SharedPreferences prefs(Context context) {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
  }

  public static void setWidgetThemeColor(Context context, String hex) {
    // commit() so widgets read the latest value immediately after we trigger an update
    prefs(context).edit().putString(KEY_WIDGET_THEME_COLOR, hex).commit();
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
    // commit() so widgets read the latest values immediately after we trigger an update
    prefs(context).edit()
        .putInt(KEY_HABITS_COMPLETED, completed)
        .putInt(KEY_HABITS_TOTAL, total)
        .commit();
  }

  public static int getHabitsCompleted(Context context) {
    return prefs(context).getInt(KEY_HABITS_COMPLETED, 0);
  }

  public static int getHabitsTotal(Context context) {
    return prefs(context).getInt(KEY_HABITS_TOTAL, 0);
  }

  public static void setTodaySnippet(Context context, String dateKey, String snippet) {
    // commit() so widgets read the latest value immediately after we trigger an update
    prefs(context).edit()
        .putString(KEY_TODAY_DATE, dateKey)
        .putString(KEY_TODAY_SNIPPET, snippet)
        .commit();
  }

  public static String getTodaySnippet(Context context) {
    return prefs(context).getString(KEY_TODAY_SNIPPET, "");
  }

  public static void setStats(Context context, int entries, int streak, int words) {
    // commit() so widgets read the latest values immediately after we trigger an update
    prefs(context).edit()
        .putInt(KEY_STATS_ENTRIES, entries)
        .putInt(KEY_STATS_STREAK, streak)
        .putInt(KEY_STATS_WORDS, words)
        .commit();
  }

  public static int getStatsEntries(Context context) {
    return prefs(context).getInt(KEY_STATS_ENTRIES, 0);
  }

  public static int getStatsStreak(Context context) {
    return prefs(context).getInt(KEY_STATS_STREAK, 0);
  }

  public static int getStatsWords(Context context) {
    return prefs(context).getInt(KEY_STATS_WORDS, 0);
  }
}
