package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;

public class StatsWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "StatsWidget";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAll(context, appWidgetManager, appWidgetIds);
    }

    public static void updateAll(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            // Ensure midnight refresh is scheduled (daily reset + consistency).
            WidgetAlarmScheduler.scheduleNextMidnightRefresh(context);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stats);

            // Apply theme accent color from file-based bridge
            int accent = WidgetDataReader.getWidgetThemeColor(context, 0xFF7C3AED);
            try {
                views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
            } catch (Exception e) {
                Log.w(TAG, "Could not set accent color", e);
            }

            // Get stats from file-based bridge
            int entries = WidgetDataReader.getStatsEntries(context);
            int streak = WidgetDataReader.getStatsStreak(context);
            int words = WidgetDataReader.getStatsWords(context);

            Log.d(TAG, "Widget data: entries=" + entries + ", streak=" + streak + ", words=" + words);

            views.setTextViewText(R.id.stats_entries, String.valueOf(entries));
            views.setTextViewText(R.id.stats_streak, String.valueOf(streak));
            views.setTextViewText(R.id.stats_words, String.valueOf(words));
            views.setTextViewText(R.id.stats_message, "Tap to view your stats");

            // Keep accent strip in sync with the app theme color
            // (numbers remain as-is; only requested was RemoteViews sync reliability)

            // Create intent to open statistics page
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("openStatistics", true);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                2,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            views.setOnClickPendingIntent(R.id.widget_stats, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
        }
    }
}
