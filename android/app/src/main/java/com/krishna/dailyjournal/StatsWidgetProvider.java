package com.krishna.dailyjournal;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class StatsWidgetProvider extends AppWidgetProvider {

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
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stats);

        // Apply theme accent color
        int accent = WidgetPrefs.getWidgetThemeColor(context, 0xFF7C3AED);
        try {
            views.setInt(R.id.widget_accent, "setBackgroundColor", accent);
        } catch (Exception ignored) {}

        // Default stats (updated by app when open)
        views.setTextViewText(R.id.stats_entries, "—");
        views.setTextViewText(R.id.stats_streak, "—");
        views.setTextViewText(R.id.stats_words, "—");
        views.setTextViewText(R.id.stats_message, "Tap to view your stats");

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
    }
}