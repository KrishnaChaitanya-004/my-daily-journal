package com.krishna.dailyjournal;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

/**
 * Reads widget data from JSON file written by the Capacitor/React app.
 * This replaces the custom Capacitor plugin approach with a file-based bridge.
 */
public final class WidgetDataReader {
    private WidgetDataReader() {}

    private static final String TAG = "WidgetDataReader";
    private static final String WIDGET_DATA_FILE = "widget-data.json";

    /**
     * Get the widget data file path in app's internal files directory.
     */
    private static File getWidgetDataFile(Context context) {
        return new File(context.getFilesDir(), WIDGET_DATA_FILE);
    }

    /**
     * Read and parse the widget data JSON file.
     * Returns null if file doesn't exist or can't be parsed.
     */
    public static JSONObject readWidgetData(Context context) {
        File file = getWidgetDataFile(context);
        if (!file.exists()) {
            Log.d(TAG, "Widget data file not found: " + file.getAbsolutePath());
            return null;
        }

        try {
            StringBuilder content = new StringBuilder();
            BufferedReader reader = new BufferedReader(new FileReader(file));
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line);
            }
            reader.close();

            return new JSONObject(content.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error reading widget data file", e);
            return null;
        }
    }

    // ========== Habits Progress ==========

    private static String getHabitsDate(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return "";
        return data.optString("habitsDate", "");
    }

    private static String getTodayKey() {
        // Local date key YYYY-MM-DD
        java.util.Calendar c = java.util.Calendar.getInstance();
        int y = c.get(java.util.Calendar.YEAR);
        int m = c.get(java.util.Calendar.MONTH) + 1;
        int d = c.get(java.util.Calendar.DAY_OF_MONTH);
        return String.format(java.util.Locale.US, "%04d-%02d-%02d", y, m, d);
    }

    public static int getHabitsCompleted(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return 0;

        int completed = data.optInt("habitsCompleted", 0);
        String date = getHabitsDate(context);
        if (date == null || date.isEmpty()) return completed;

        // Daily reset: if the stored progress is not for today, completed becomes 0.
        if (!getTodayKey().equals(date)) return 0;
        return completed;
    }

    public static int getHabitsTotal(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return 0;
        return data.optInt("habitsTotal", 0);
    }

    // ========== Today Snippet ==========

    public static String getTodaySnippet(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return "";
        return data.optString("todaySnippet", "");
    }

    public static String getTodayDate(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return "";
        return data.optString("todayDate", "");
    }

    // ========== Stats ==========

    public static int getStatsEntries(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return 0;
        return data.optInt("statsEntries", 0);
    }

    public static int getStatsStreak(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return 0;
        return data.optInt("statsStreak", 0);
    }

    public static int getStatsWords(Context context) {
        JSONObject data = readWidgetData(context);
        if (data == null) return 0;
        return data.optInt("statsWords", 0);
    }

    // ========== Theme Color ==========

    public static int getWidgetThemeColor(Context context, int fallback) {
        JSONObject data = readWidgetData(context);
        if (data == null) return fallback;
        
        String hex = data.optString("themeColor", null);
        if (hex == null || hex.isEmpty()) return fallback;
        
        try {
            return android.graphics.Color.parseColor(hex);
        } catch (Exception e) {
            return fallback;
        }
    }
}
